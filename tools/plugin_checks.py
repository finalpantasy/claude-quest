"""Claude Quest check adapter for tools/game_check.py.

Each mode runs one real check and writes a fresh JSON report:
  python tools/plugin_checks.py validate  <report>   claude plugin validate .
  python tools/plugin_checks.py tests     <report>   claude plugin test . (one entry per test)
  python tools/plugin_checks.py typecheck <report>   tsc over hooks and types against the API types
Exit code is the check's own: 0 pass, 1 fail, 3 when a tool or the API types are missing.
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
TSC = ['npx', '--no-install', '-p', 'typescript@5.6.3', 'tsc']


def write(report, tests):
    Path(report).write_text(json.dumps({'tests': tests}, indent=2), encoding='utf-8')


def run(argv, cwd=ROOT):
    exe = shutil.which(argv[0])
    if not exe:
        print(f'NOT_RUN: {argv[0]} unavailable')
        sys.exit(3)
    p = subprocess.run([exe, *argv[1:]], cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    out = p.stdout + p.stderr
    print(out)
    return p.returncode, out


def validate(report):
    code, out = run(['claude', 'plugin', 'validate', '.'])
    ok = code == 0 and 'Validation passed' in out
    write(report, [{'name': 'claude plugin validate', 'status': 'passed' if ok else 'failed'}])
    return 0 if ok else 1


def tests(report):
    code, out = run(['claude', 'plugin', 'test', '.'])
    found = [{'name': m.group(2).strip(), 'status': 'passed' if m.group(1) == 'pass' else 'failed'}
             for m in re.finditer(r'^\((pass|fail)\) (.+?)(?: \[[\d.]+m?s\])?$', out, re.M)]
    if not found:
        found = [{'name': 'claude plugin test produced no test lines', 'status': 'failed'}]
    write(report, found)
    return 0 if code == 0 and all(t['status'] == 'passed' for t in found) else 1


def api_types():
    # The engine writes the API types beside a loaded mod, or into the plugin-authoring
    # skill folder when that skill loads. Prefer the mod's own copy, else the newest skill copy.
    laid = ROOT / '.claude-plugin' / 'types' / 'claude-code' / 'index.d.ts'
    if laid.is_file():
        return laid
    base = os.environ.get('TEMP') or tempfile.gettempdir()
    hits = glob.glob(os.path.join(base, 'claude', 'bundled-skills', '*', '*', 'plugin-authoring', 'types', 'claude-code.d.ts'))
    return Path(max(hits, key=os.path.getmtime)) if hits else None


def typecheck(report):
    types = api_types()
    if not types:
        print('NOT_RUN: Claude Code API types not found; load the plugin-authoring skill once to write them')
        return 3
    with tempfile.TemporaryDirectory(prefix='cq-tsc-') as tmp:
        cfg = {
            'compilerOptions': {
                'target': 'es2023', 'lib': ['es2023'], 'types': [],
                'module': 'esnext', 'moduleResolution': 'bundler',
                'strict': True, 'noUncheckedIndexedAccess': True,
                'noEmit': True, 'skipLibCheck': True,
                'jsx': 'react', 'jsxFactory': 'h', 'jsxFragmentFactory': 'Fragment',
            },
            'include': [types.as_posix(), (ROOT / 'hooks').as_posix(), (ROOT / 'types').as_posix()],
        }
        (Path(tmp) / 'tsconfig.json').write_text(json.dumps(cfg), encoding='utf-8')
        code, out = run([*TSC, '-p', tmp])
    if 'npx canceled' in out or 'could not determine executable' in out:
        print('NOT_RUN: typescript@5.6.3 is not in the npx cache')
        return 3
    errors = re.findall(r'error TS\d+', out)
    write(report, [{'name': f'tsc strict over hooks and types ({types.name})', 'status': 'passed' if code == 0 and not errors else 'failed'}])
    return 0 if code == 0 and not errors else 1


if __name__ == '__main__':
    modes = {'validate': validate, 'tests': tests, 'typecheck': typecheck}
    if len(sys.argv) != 3 or sys.argv[1] not in modes:
        print(__doc__)
        sys.exit(2)
    sys.exit(modes[sys.argv[1]](sys.argv[2]))
