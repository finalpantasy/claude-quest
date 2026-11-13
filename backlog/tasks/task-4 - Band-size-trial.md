---
id: task-4
title: Band size trial (strip, pop, full, off)
status: Verified
---
## Problem before solution
Observed: the desktop scene above the prompt is 88 px tall (`hooks/register.tsx` about line 291) and crowds the owner's other mods (status-band rows, savvy-progress agents yard). The owner is not sure which layout he wants (D-OPEN-2), so he will try each for a day.
Facts: the band is drawn by the `ui.render` hook on `AbovePrompt` (about line 278); `/quest ticker` toggles it with the `ticker` atom and `$.store` key `ticker` (lines 22, 186-188, 260-266). Terminal draws a one-line ticker from `tickerText` (`hooks/art.ts` line 226). The game emits notes from `step` and `applyCounts` that name level ups, legendaries and bosses.
## Outcome and scope
Add `/quest band <mode>` with four modes, saved in `$.store` key `band`, default `pop`:
- `strip`: one line on desktop: class color icon, hero name and level, current task label, thin progress bar (XP to next level). Height at most 20 px.
- `pop`: strip, but on a level up, a legendary or set drop, or a boss kill the full 88 px scene shows for about 10 seconds, then collapses back. Pops do not stack: a new event during a pop restarts the timer.
- `full`: the v0.1 scene, unchanged.
- `off`: nothing above the prompt (same as today's hidden ticker).
`/quest ticker` keeps working as a toggle between `off` and the last non-off mode. An old saved `ticker: false` maps to `off`. `/quest` with no argument still opens the pane with the full scene. Terminal keeps its one-line ticker in every mode except `off`.
Redraw rule stays: redraw on task change and on pop start and end only; no per-frame redraws.
Non-goals: a status-band row integration (later option), new art, game rule changes.
## Dependencies and ownership
Depends on task-1 only. Owned files: `hooks/register.tsx` (band hook, command, store keys), `hooks/art.ts` (new strip renderer), `hooks/quest.test.tsx` (new tests). task-2 runs in parallel and edits only the Hero tab training lines in `register.tsx` (about lines 364-382) and `trainingOf` in `game.ts`: do not touch those lines; read `game.ts` only.
Execution: worker chat, Sonnet, medium effort.
Assigned role: bounded worker. Return evidence; do not delegate, push or merge.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Each mode renders as specified on desktop | tests mount `AbovePrompt` on `desktop` per mode via the test kit; strip height at most 20, full 88, off draws nothing | test output | PASS: test "each band mode draws as specified" (strip height 18, full 88, off no Svg) |
| AC2 | Pop shows the full scene on an event and collapses after about 10 s | test with the mock clock: trigger a level up, assert full scene, advance 11 s, assert strip | test output | PASS: test "pop shows the full scene" (clock-driven level up gives 88, then 18 after 11 s) |
| AC3 | Mode persists and old ticker setting migrates | test: `band` saved in store; stored `ticker: false` with no `band` loads as `off` | test output | PASS: test "persists across a restart" (ticker false loads as off, ticker toggle restores last mode) |
| AC4 | Terminal unchanged | test mounts on `terminal` in strip and pop: one-line ticker text | test output | PASS: test "terminal keeps its one line" (no Svg, Lv text in strip, pop, full; none in off) |
| AC5 | The strip looks right | write the strip and the full scene SVG for one hero to the scratchpad and attach a screenshot or the SVG files to the card log | files | FILES: strip.svg and full.svg in the worker scratchpad (see log); the owner must judge the look |
| AC6 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines | PASS: game_check run then verify: "PASS: receipt matches current inputs and recorded artifacts" (validate 1/1, tests 11/11, typecheck 1/1) |
## Human gates
The owner tries each mode and picks the default (closes D-OPEN-2). The strip's look needs his eye; technical PASS does not approve it.
## Recovery and return condition
Own branch. Return when AC1-AC6 have evidence, or when the test kit cannot drive a case (say which, and how you verified it instead).
## Approach and commands
Load `plugin-authoring` first (read its `band.tsx` example and the `AbovePrompt` and test kit sections of the API types). Implement, test, run the check.
## Log and handoff
Record the commit, check results, evidence paths and any risk.

Log (worker, Sonnet): branch `claude/task-4-band-size` (own worktree, cut from main ed05895; main checkout untouched). Changes: `band` and `popUntil` atoms replace `ticker`; store keys `band` and `bandLast` (the old `ticker` key is only read for migration); `isBigMoment` compares level, legendary count and new log lines (boss kill, map clear) so followers pop too; pop timer via `$.clock.after`, a new moment restarts it; `stripSvg` in art.ts (720 x 18, no motion, XP bar). SVGs for a test hero (level 5, fighting): scratchpad `strip.svg` and `full.svg` under the session scratchpad (`render.ts` beside them regenerates). I could not screenshot them (the pane does not act on local files), so the look is unchecked by eye.
Risks: the persistence test restarts the session but atoms survive a restart in the test kit, so only the saved-ticker migration is strictly proven from the store; the strip text width is estimated at 6.8 px per character and may clip a long task label slightly differently on the real font; pop also triggers on any boss or map clear log line starting with the crown or "Cleared" emoji text. Next: the owner tries each mode (D-OPEN-2), then coordinator merges and bumps for task-5.

2026-10-12, coordinator review: diff matches the card; merged as 5b0418a; whole check PASS (validate 1/1, tests 13/13, typecheck 1/1, verify PASS). Human gate open: the owner tries the modes and picks one (D-OPEN-2).
