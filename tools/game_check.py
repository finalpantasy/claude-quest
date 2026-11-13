"""Project-local check runner. No dependencies, installs, network, or implicit hooks.

run: execute configured argv checks, collect fresh reports, fingerprint sources.
verify: check the receipt against current inputs, tools, logs and reports.
Exit 0 PASS, 1 FAIL, 3 NOT_RUN. Receipts are evidence, not a security boundary.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PureWindowsPath
import re
import shutil
import subprocess
import sys
import time
import uuid
import xml.etree.ElementTree as ET

# Caches are excluded at any depth; project folders only at the root, so a
# gameplay folder such as src/evidence/ or levels/Temp/ is still fingerprinted.
EXCLUDED_ANYWHERE = {'.git', '__pycache__', 'node_modules', '.venv'}
EXCLUDED_ROOT = {'.godot', 'Library', 'Temp', 'Logs', 'evidence'}

def excluded(parts):
    return bool(parts) and (parts[0] in EXCLUDED_ROOT or any(p in EXCLUDED_ANYWHERE for p in parts))

def portable_component(part):
    # Reject ambiguous Windows aliases even when preparing a project on Unix.
    device = part.split('.', 1)[0].upper()
    return (bool(part) and part not in ('.', '..') and part == part.rstrip(' .')
            and not any(ord(c) < 32 or c in ':<>"|?*' for c in part)
            and not re.fullmatch(r'CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³]|CONIN\$|CONOUT\$', device))

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def inside(root, value):
    p = root / value
    if not p.resolve().is_relative_to(root.resolve()):
        raise ValueError(f'Path escapes project: {value}')
    return p

def fingerprint(root, config):
    # Git handles ignored files and quoted/space-containing names without parsing display output.
    try:
        g = subprocess.run(['git', '-C', str(root), 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], capture_output=True)
    except FileNotFoundError:
        g = None  # Git is optional; other OS errors must remain visible.
    if g is not None and g.returncode == 0:
        names = set(os.fsdecode(x) for x in g.stdout.split(b'\0') if x)
    else:
        err = g.stderr.decode(errors='replace').strip() if g is not None else ''
        if g is not None and 'not a git repository' not in err.lower():
            # A broken repository (ownership, long paths) must not silently widen the scan.
            last = err.splitlines()[-1] if err else 'exit ' + str(g.returncode)
            print('WARNING: git ls-files failed, walking the whole tree including ignored files: ' + last, file=sys.stderr)
        names = set()
        for folder, dirs, files in os.walk(root):
            parent = Path(folder).relative_to(root).parts
            dirs[:] = sorted(d for d in dirs if not excluded(parent + (d,)))
            names.update((Path(folder)/f).relative_to(root).as_posix() for f in files)
    extras = set(config.get('extra_inputs', []))
    names.update(extras)
    excludes = config.get('exclude_inputs', ['docs', 'backlog', 'STATE.md'])
    hashes = {}
    for name in sorted(names):
        rel = Path(name)
        if excluded(rel.parts):
            if name in extras:
                raise ValueError(f'Explicit input uses a reserved cache/evidence path; use a project adapter: {name}')
            continue
        if name not in extras and any(name == e or name.startswith(e + '/') for e in excludes):
            continue
        p = inside(root, name)
        if p.is_symlink():
            raise ValueError(f'Symlink input requires a project adapter: {name}')
        if p.is_dir():
            raise ValueError(f'Directory/submodule input requires a project adapter: {name}')
        hashes[name] = digest(p) if p.exists() else 'DELETED'
    if not hashes:
        raise ValueError('No source inputs fingerprinted')
    return hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest()

def render(value, root, run_dir):
    return value.replace('{python}', sys.executable).replace('{root}', str(root)).replace('{run_dir}', str(run_dir))

def validate_config(config):
    if not isinstance(config, dict):
        raise ValueError('Configuration must be an object')
    for field, default in (('extra_inputs', []), ('exclude_inputs', ['docs', 'backlog', 'STATE.md'])):
        values = config.get(field, default)
        if not isinstance(values, list):
            raise ValueError(f'{field} must be an array of project-relative paths')
        normalized = []
        for value in values:
            if not isinstance(value, str) or not value or not value.strip():
                raise ValueError(f'{field} entries must be nonempty strings')
            name = value.replace('\\', '/').rstrip('/')
            if not name or name.startswith('/') or PureWindowsPath(name).drive or any(p in ('', '.', '..') for p in name.split('/')):
                raise ValueError(f'{field} requires project-relative paths without traversal: {value}')
            if field == 'extra_inputs' and excluded(tuple(name.split('/'))):
                raise ValueError(f'Explicit input uses a reserved cache/evidence path; use a project adapter: {name}')
            normalized.append(name)
        config[field] = normalized
    commands = config.get('commands')
    if not isinstance(commands, list) or not commands:
        raise ValueError('No checks configured')
    seen = set()
    reports = 0
    for step in commands:
        if not isinstance(step, dict):
            raise ValueError('Each command must be an object')
        name = step.get('id', '')
        if not isinstance(name, str) or not re.fullmatch(r'[a-zA-Z0-9_-]+', name) or name in seen:
            raise ValueError('Command IDs must be unique safe names')
        if not portable_component(name):
            raise ValueError('Command ID is a reserved Windows filename')
        seen.add(name)
        argv = step.get('argv')
        if not isinstance(argv, list) or not argv or not all(isinstance(x, str) and x for x in argv):
            raise ValueError('Commands require nonempty argv arrays')
        timeout = step.get('timeout_seconds', 120)
        if isinstance(timeout, bool) or not isinstance(timeout, (int, float)) or not 0 < timeout <= 3600:
            raise ValueError('Timeout must be between 0 and 3600 seconds')
        patterns = step.get('fail_patterns', [])
        if not isinstance(patterns, list) or not all(isinstance(p, str) and p for p in patterns):
            raise ValueError(f'{name}: fail_patterns must be an array of nonempty regex strings')
        for pattern in patterns:
            try:
                re.compile(pattern)
            except re.error as exc:
                raise ValueError(f'{name}: invalid fail pattern: {exc}') from exc
        if 'report' in step:
            if not isinstance(step['report'], str) or not step['report']:
                raise ValueError(f'{name}: report must be a nonempty string')
            reports += 1
            if step.get('format') not in ('json', 'junit', 'nunit'):
                raise ValueError('Unknown test report format')
            if not step['report'].startswith('{run_dir}/'):
                raise ValueError('Reports must be fresh outputs under {run_dir}/')
            if not all(portable_component(p) for p in step['report'][len('{run_dir}/'):].replace('\\', '/').split('/')):
                raise ValueError('Reports require portable path components without Windows aliases or streams')
    if not reports:
        raise ValueError('At least one structured test report is required')

def tools_identity(config, root, run_dir):
    identities = {}
    for step in config['commands']:
        argv0 = render(step['argv'][0], root, run_dir)
        p = Path(argv0)
        # Match subprocess executable resolution; explicit relative paths use project cwd.
        if not p.is_absolute() and (('/' in argv0) or ('\\' in argv0)):
            p = root / p
        elif not p.is_absolute():
            found = shutil.which(argv0)
            if not found:
                raise ValueError(f'Executable unavailable: {argv0}')
            p = Path(found)
        if not p.is_file():
            raise ValueError(f'Executable unavailable: {argv0}')
        identities[step['id']] = {'path': str(p.resolve()), 'sha256': digest(p)}
    return identities

def report_paths(config, root, run_dir):
    # Validate all destinations before any command can write to them.
    paths = {}
    seen = {os.path.normcase(str((run_dir/(step['id'] + '.log')).resolve())) for step in config['commands']}
    for step in config['commands']:
        if 'report' not in step:
            continue
        report = Path(render(step['report'], root, run_dir))
        resolved = report.resolve()
        if resolved == run_dir.resolve() or not resolved.is_relative_to(run_dir.resolve()):
            raise ValueError(f"{step['id']}: report path escapes its fresh run directory")
        identity = os.path.normcase(str(resolved))
        if identity in seen:
            raise ValueError(f"{step['id']}: report path is shared or conflicts with a command log")
        seen.add(identity)
        paths[step['id']] = report
    return paths

def parse_report(path, kind):
    raw = path.read_bytes()
    if len(raw) > 16 * 1024 * 1024:
        raise ValueError('Report exceeds 16 MiB')
    results = []
    if kind == 'json':
        data = json.loads(raw)
        tests = data.get('tests') if isinstance(data, dict) else None
        if not isinstance(tests, list):
            raise ValueError('JSON report needs a tests array')
        names = set()
        for test in tests:
            if not isinstance(test, dict) or not isinstance(test.get('name'), str) or not test['name'] or test['name'] in names:
                raise ValueError('Test names must be nonempty and unique')
            names.add(test['name'])
            status = test.get('status')
            if status not in ('passed', 'failed', 'skipped'):
                raise ValueError('Unknown test status')
            results.append(status)
    else:
        if b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
            raise ValueError('DTD/entity reports are unsupported')
        doc = ET.fromstring(raw)
        for node in doc.iter():
            tag = node.tag.rsplit('}', 1)[-1]
            if tag in ('testsuites', 'testsuite', 'test-run', 'test-suite'):
                if node.get('result', '').lower() in ('failed', 'error', 'cancelled'):
                    raise ValueError('Test suite reports failure')
                if any(int(node.get(k, '0')) > 0 for k in ('failures', 'errors', 'failed')):
                    raise ValueError('Test suite reports failures/errors')
            if kind == 'nunit' and tag == 'test-case':
                status = {'passed':'passed', 'failed':'failed', 'skipped':'skipped', 'inconclusive':'failed'}.get(node.get('result', '').lower())
                if status is None:
                    raise ValueError('Unknown NUnit result')
                results.append(status)
            elif kind == 'junit' and tag == 'testcase':
                tags = {child.tag.rsplit('}', 1)[-1] for child in node}
                results.append('failed' if tags & {'failure', 'error'} else 'skipped' if 'skipped' in tags else 'passed')
    if not results or all(x == 'skipped' for x in results):
        raise ValueError('Zero executed tests')
    counts = {s: results.count(s) for s in ('passed', 'failed', 'skipped')}
    if counts['failed']:
        raise ValueError(f'{counts["failed"]} tests failed')
    return counts

def write_receipt(root, data):
    evidence = inside(root, 'evidence')
    evidence.mkdir(exist_ok=True)
    path = evidence/'last-check.json'
    tmp = evidence/('receipt-' + uuid.uuid4().hex + '.tmp')
    tmp.write_text(json.dumps(data, indent=2), encoding='utf-8')
    os.replace(tmp, path)
    (evidence/'last-check.txt').write_text(data['status'] + ': ' + data.get('reason', data.get('run_id', '')) + '\n', encoding='utf-8')

def run(root, config_path):
    run_id = str(time.time_ns()) + '-' + uuid.uuid4().hex[:8]
    receipt = {'schema': 1, 'status': 'NOT_RUN', 'run_id': run_id, 'reason': 'Check started', 'project': str(root), 'checks': []}
    write_receipt(root, receipt)  # Invalidate the old PASS before even reading configuration.
    phase = 'setup'
    try:
        config = json.loads(config_path.read_text(encoding='utf-8-sig'))
        validate_config(config)
        run_dir = inside(root, 'evidence/runs/' + run_id)
        run_dir.mkdir(parents=True)
        reports = report_paths(config, root, run_dir)
        before = fingerprint(root, config)
        config_hash = digest(config_path)
        tool_ids = tools_identity(config, root, run_dir)
        phase = 'execute'
        for step in config['commands']:
            if step['id'] in reports and reports[step['id']].exists():
                raise ValueError(f"{step['id']}: report already exists before this command")
            argv = [render(x, root, run_dir) for x in step['argv']]
            argv[0] = tool_ids[step['id']]['path']
            log = run_dir / (step['id'] + '.log')
            flags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            with log.open('wb') as out:
                process = subprocess.Popen(argv, cwd=root, stdout=out, stderr=subprocess.STDOUT, creationflags=flags, start_new_session=os.name != 'nt')
                try:
                    code = process.wait(timeout=step.get('timeout_seconds', 120))
                except subprocess.TimeoutExpired:
                    if os.name == 'nt':
                        subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        import signal
                        os.killpg(process.pid, signal.SIGKILL)
                    process.kill()
                    process.wait()
                    raise ValueError(f'{step["id"]}: timeout')
            entry = {'id': step['id'], 'argv': argv, 'exit_code': code, 'log': str(log.relative_to(root)), 'log_sha256': digest(log)}
            receipt['checks'].append(entry)
            if code != 0:
                raise ValueError(f'{step["id"]}: process exit {code}')
            for pattern in step.get('fail_patterns', []):
                if re.search(pattern, log.read_text(encoding='utf-8', errors='replace')):
                    raise ValueError(f'{step["id"]}: error pattern in log')
            if step.get('report'):
                report = reports[step['id']]
                if not report.resolve().is_relative_to(run_dir.resolve()) or not report.is_file():
                    raise ValueError(f'{step["id"]}: missing or invalid fresh report')
                entry.update(report=str(report.relative_to(root)), report_sha256=digest(report), counts=parse_report(report, step['format']))
        if fingerprint(root, config) != before or digest(config_path) != config_hash or tools_identity(config, root, run_dir) != tool_ids:
            raise ValueError('Inputs or runtime tools changed while checking')
        receipt.update(status='PASS', reason='Configured checks passed; acceptance scope remains per task', source_sha256=before, config=str(config_path.relative_to(root)), config_sha256=config_hash, tools=tool_ids)
        write_receipt(root, receipt)
        print('PASS: ' + run_id)
        return 0
    except (OSError, ValueError, KeyError, TypeError, ET.ParseError) as exc:
        receipt.update(status='NOT_RUN' if phase == 'setup' else 'FAIL', reason=str(exc))
        write_receipt(root, receipt)
        print(receipt['status'] + ': ' + str(exc))
        return 3 if phase == 'setup' else 1

def verify(root):
    try:
        receipt = json.loads(inside(root, 'evidence/last-check.json').read_text(encoding='utf-8'))
        if receipt.get('schema') != 1 or receipt.get('status') != 'PASS' or receipt.get('project') != str(root):
            raise ValueError('No passing receipt for this project')
        config_path = inside(root, receipt['config'])
        config = json.loads(config_path.read_text(encoding='utf-8-sig'))
        validate_config(config)
        if digest(config_path) != receipt['config_sha256'] or fingerprint(root, config) != receipt['source_sha256']:
            raise ValueError('Source/configuration changed after check')
        run_dir = inside(root, 'evidence/runs/' + receipt['run_id'])
        if tools_identity(config, root, run_dir) != receipt['tools']:
            raise ValueError('Runtime tools changed after check')
        if [c['id'] for c in receipt['checks']] != [s['id'] for s in config['commands']]:
            raise ValueError('Receipt does not cover configured checks')
        for check, step in zip(receipt['checks'], config['commands']):
            if check['exit_code'] != 0 or digest(inside(root, check['log'])) != check['log_sha256']:
                raise ValueError('Check log missing or changed')
            if step.get('report'):
                report = inside(root, check['report'])
                if digest(report) != check['report_sha256'] or parse_report(report, step['format']) != check['counts']:
                    raise ValueError('Test report missing or changed')
        print('PASS: receipt matches current inputs and recorded artifacts')
        return 0
    except (OSError, ValueError, KeyError, TypeError, ET.ParseError) as exc:
        print('NOT_RUN: ' + str(exc))
        return 3

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['run', 'verify'])
    parser.add_argument('--root', type=Path, default=Path.cwd())
    parser.add_argument('--config', default='tools/check-config.json')
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        parser.error('Root must be an existing project directory')
    return verify(root) if args.action == 'verify' else run(root, inside(root, args.config))

if __name__ == '__main__':
    raise SystemExit(main())
