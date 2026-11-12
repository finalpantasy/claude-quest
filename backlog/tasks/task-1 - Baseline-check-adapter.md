---
id: task-1
title: Baseline check adapter
status: Verified
---
## Problem before solution
A fresh session had no single command proving the mod validates, passes its tests and type-checks.
## Outcome and scope
`python tools/game_check.py run --root .` runs validate, tests and strict tsc with structured reports and a receipt. Non-goals: CI, packaging.
## Dependencies and ownership
None. Owner: coordinator (local). Files: `tools/`, `.gitignore`, `evidence/.gitkeep`.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion or human question | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Clean repo passes all three checks | `game_check.py run` then `verify` on branch claude/nice-tharp-fe2503 | receipt counts | PASS 2026-10-12: validate 1/1, tests 7/7, typecheck 1/1; verify PASS |
| AC2 | A failing test or type error fails the check | isolated fixture copy with one inverted assertion and one bad assignment | runner and adapter exit codes | PASS 2026-10-12: runner exit 1 (tests), typecheck adapter exit 1 with TS2322 |
| AC3 | Missing tools report NOT_RUN, not PASS | adapter returns 3 when `claude`, the API types or cached typescript are missing | code review of `tools/plugin_checks.py` | PASS by inspection; not executed |
## Human gates
None.
## Recovery and return condition
New files only plus appended `.gitignore` lines; revert by deleting `tools/` and the appended lines.
## Log and handoff
Fixed a cp1252 console crash on the validator's check mark by reconfiguring stdout to UTF-8. Typecheck depends on typescript@5.6.3 in the npx cache and the API types written by the plugin-authoring skill.
