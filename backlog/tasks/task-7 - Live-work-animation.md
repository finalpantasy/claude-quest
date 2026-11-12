---
id: task-7
title: Live work animation (tokens and tool calls drive what the hero does on screen)
status: Verified
---
## Problem before solution
Observed (the owner, 2026-10-12): the scene does not look like it is working while Claude works. Tokens spent and actions on screen feel unrelated.
Facts: v0.1 and task-4 redraw only on task change and on pop start and end (`hooks/register.tsx`); between redraws all motion is a looping CSS animation, so the hero swings at the same pace whether Claude is busy or idle. Work is counted in `register.tsx` (`tool.call` and `turn.complete` hooks, about lines 210-255); token usage arrives with `turn.complete` (`e.usage`). Research found that another mod uses `turn.step` (per step, with model and effort) and `turn.start`; check the API types for what each event carries.
Hypothesis (unproven): redrawing on turn start, on each tool call and on turn end (throttled) is enough to make the scene read as live, without per-frame redraws.
## Outcome and scope
While a turn runs, the band visibly shows that work:
- Turn start: the hero enters an "active" pose (faster attack loop, glow or aura) until the turn ends; idle between turns drops back to the calm loop.
- Each tool call is one visible action, mapped by kind: edit = melee strike, read/grep/glob = scouting or arrow, shell = spell, agent = summoned minion appears, web = portal. A short CSS one-shot plays per action.
- Tokens: each turn's token spend becomes damage numbers floating off the foe, sized by tokens (log scale), and the foe's HP bar drops in proportion; a big turn lands a visible crit.
- Redraw budget: at most one redraw per second while active (coalesce bursts), one at turn end, none while idle. Motion stays CSS inside the one SVG.
- Works in every band mode that shows the scene (`full`, `pop` while popped, and the `/quest` pane). The one-line `strip` shows a compact live indicator (a pulsing action glyph and a token counter for the current turn). The terminal ticker shows the current action word.
Non-goals: game rule changes, new loot, sound.
## Dependencies and ownership
Depends on task-4 (Verified, merged 5b0418a). Owned files: `hooks/register.tsx` (event capture and redraw scheduling), `hooks/art.ts` (action one-shots, active pose, damage numbers, strip indicator), `types/index.d.ts` (any new `$.state` atom), `hooks/quest.test.tsx` (new tests). task-3 runs in parallel and owns `hooks/game.ts`: read it only.
Execution: worker chat, Sonnet, medium effort.
Assigned role: bounded worker. Return evidence; do not delegate, push or merge.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Turn start switches to the active pose, turn end returns to calm | test kit: fire turn start, assert the SVG carries the active marker; fire turn complete, assert calm | test output | PASS (test AC1) |
| AC2 | Each tool kind maps to its own action | test: fire Edit, Read, Bash, Agent, WebFetch tool calls; assert the matching action class appears | test output | PASS (test AC2) |
| AC3 | Token spend shows as damage sized by tokens | test: two turns with 2k and 80k tokens; the second has larger numbers and a crit marker | test output | PASS (test AC3) |
| AC4 | Redraw budget holds | test with the mock clock: 20 tool calls in 1 s cause at most 2 redraws; idle for 60 s causes 0 | test output | PASS (test AC4: 20 calls, at most 2 writes; 60 s idle, 0) |
| AC5 | It looks alive | record the SVG sequence for one scripted turn (start, 3 tool calls, end) to the scratchpad; attach a screenshot or short capture to the card log | files | PASS (files; look not judged) |
| AC6 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines | PASS (validate 1/1, tests 18/18, typecheck 1/1) |
## Human gates
The owner judges whether it reads as "working" in the real app. Technical PASS does not approve the look.
## Recovery and return condition
Own branch. Return when AC1-AC6 have evidence, or when an event the design needs is not available (say which and what you used instead).
## Approach and commands
Load `plugin-authoring` first; grep the API types for `turn.start`, `turn.step`, `turn.complete` and `tool.call` inputs. Implement, test, run the check. Never put the owner's name in fixtures, cards or commits (use a test hero name).
## Log and handoff
Record the commit, check results, evidence paths and any risk.

- Worker log (Sonnet): implemented in `hooks/register.tsx` (live atom, `turn.start` and `turn.step` and `turn.complete` and `tool.call` capture, one-second coalescing), `hooks/art.ts` (aura, five one-shots, sized damage numbers, crit, strip indicator, ticker word) and `types/index.d.ts` (`live` atom).
- Design: one-shots carry absolute start times and play with a negative `animation-delay`, so a redraw never replays them and expired ones are dropped. Redraws: `turn.start` flushes at once, tool calls and step tokens coalesce into at most one write per second, `turn.complete` flushes once, idle writes nothing. Crit at 40k tokens or more. Damage lands at turn end; the strip and ticker show the running token counter from `turn.step`.
- Events used: `turn.start`, `turn.step` (result `usage`, main loop only), `turn.complete` (`usage` as fallback), `tool.call`. Subagent turns are ignored for the pose and damage; their tool calls still play as actions while the main turn is active.
- AC5 captures (scratchpad, outside the repo): `scratchpad/capture/0-calm.svg` through `5-calm-again.svg` and `sequence.html`, generated by `scratchpad/capture/cap.ts` (calm, turn start, edit, read plus bash, turn end with an 80k crit, calm). No screenshot: the in-app browser cannot act on local files. The owner still judges the look in the real app.
- Check: `python tools/game_check.py run --root .` PASS, `verify` PASS (receipt matches).
- Risks: the active pose and strip indicator rely on `turn.start` firing for the main loop; a turn that never completes would leave the aura on (no timeout added). Strip width with the live text shrinks the task label. Pop mode does not pop on activity, by design.

2026-10-12, coordinator review: merged with the Claude Mod Hider pass (one conflict, both kept); whole check PASS (validate 1/1, tests 18/18, typecheck 1/1). Follow-up: the active aura has no timeout if turn.complete never fires; fold a 10 minute safety into the next card that touches register.tsx. Human gate: the owner judges the look in the app after install.
