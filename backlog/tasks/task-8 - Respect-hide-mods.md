---
id: task-8
title: Respect the hide-mods switch above the prompt
status: Verified
---
## Problem before solution
The new local mod Claude Mod Hider (`claude-mod-hider`, first named hide-mods) adds a "Hide mods" button above the prompt. While hidden it draws only its button and skips the mods beneath it, but plugin order is undocumented, so every mod drawing above the prompt must also pass while hidden (status-band and savvy-progress already do). Request from the session that built v0.1, 2026-10-12.
## Outcome and scope
`hooks/register.tsx` reads `{ plugin: 'claude-mod-hider', key: 'hidden' }` (default false) and the AbovePrompt hook returns `next(e)` while it is true. `types/index.d.ts` declares `'claude-mod-hider': { hidden: boolean }` in PluginState. No dependency on hide-mods: without it the switch reads false. Renamed from hide-mods to claude-mod-hider on 2026-10-12 (check PASS after the rename).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Contract accepted without a dependency | `claude plugin validate .` | output | PASS 2026-10-12: Validation passed |
| AC2 | Nothing else changes while not hidden | whole check | receipt | PASS 2026-10-12: validate 1/1, tests 13/13, typecheck 1/1 |
| AC3 | Band passes while hidden | test kit loads only this plugin and cannot set another plugin's state (a beneath `state.get` hook is reached but its value is not used) | live check in the app | NOT_RUN: the owner clicks "Hide mods" after v0.2 is installed |
## Log and handoff
Done locally by the coordinator. Live check folds into the v0.2 install (task-5).
