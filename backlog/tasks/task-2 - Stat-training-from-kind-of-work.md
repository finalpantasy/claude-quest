---
id: task-2
title: Stat training from the kind of work
status: Verified
---
## Problem before solution
Observed: `trainingOf` in `hooks/game.ts` (about line 180) trains STR from Opus tokens, DEX from Sonnet tokens and INT from Haiku tokens. The owner mostly uses Opus and almost never Haiku, so his DEX and INT starve and Harmony never triggers.
Facts: counts come from `hooks/register.tsx` lines 157-161 and 216-255 (`EDITS`, `READS` includes Grep and Glob, `AGENTS`, `isWeb`, Bash, turns, compactions, `tokCache`). The race already comes from the model (`RACES` in `hooks/data.ts`, `register.tsx` line 56).
## Outcome and scope
Decision D7 (docs/DECISIONS.md): attributes train from the kind of work, not the model.
- STR: edits. DEX: reads, greps, globs. INT: shell, agents, web. VIT: turns and compactions (keep Well Rested). Luck: cache reads (unchanged).
- 25% of all training (STR+DEX+INT+VIT) flows to whichever of the four is lowest.
- Token counts by model no longer train attributes. Models only set the race. Keep the `tok*` count fields in the save (backward compatible) even if unused for training.
- Overall stat magnitude for a typical day stays roughly where v0.1 was (pacing is retuned separately in a later card).
- Update the `/quest` Hero tab lines that describe training sources (`register.tsx` around lines 364-382) so they name the work kinds.
Non-goals: XP pacing, band layout, new stats, save schema changes.
## Dependencies and ownership
Depends on task-1 (done). Owned files: `hooks/game.ts` (only `trainingOf` and its comment), `hooks/register.tsx` (only the Hero tab text), `hooks/quest.test.tsx`. No other card touches these at the same time.
Execution: worker chat, Sonnet, medium effort (bounded logic change with tests).
Assigned role: bounded worker. Return evidence; do not delegate, push or merge.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Opus-only tokens no longer change STR/DEX/INT/VIT | test: `trainingOf({...emptyCounts(), tokOpus: 4000})` gives 0 for all four | test output | PASS: test "model tokens no longer train attributes" (tokOpus 4000, tokSonnet 900, tokHaiku 50, tokOther 70 give 0/0/0/0) |
| AC2 | Each work kind trains its stat | tests: edits raise STR most, reads/greps DEX, bash/agent/web INT, turns/compactions VIT | test output | PASS: test "each kind of work trains its own attribute" (edit STR; read DEX; bash, agent, web INT; turns, compact VIT) |
| AC3 | 25% of training flows to the lowest stat | test: edits only, the lowest stat receives a quarter of the total raw training | test output | PASS: test "a quarter of all training flows to the weakest attribute" (fill rule, see log) |
| AC4 | Balanced work still earns Harmony above 0.9 | existing harmony test updated to the new sources | test output | PASS: even work (200/200/200/100 turns) harmony > 0.9 (1.0) |
| AC5 | Typical-day magnitude near v0.1 | print total STR+DEX+INT+VIT for one simulated 12-hour day (about 400 edits, 600 reads, 300 bash, 30 agents, 200 turns, 2 compactions) under old and new formulas; new within 25% of old | numbers in the card log | PASS: old 1055, new 1060 (+0.5%) for the card day; see log for token sensitivity |
| AC6 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines of both | PASS: run `PASS: 1791837697103837000-d2339587`; verify `PASS: receipt matches current inputs and recorded artifacts`; validate 1/1, tests 9/9, typecheck 1/1 |
## Human gates
None (decision already made).
## Recovery and return condition
Work on your own branch. Return when AC1-AC6 have evidence, or when blocked. Do not touch `~/.claude/claude-quest/`.
## Approach and commands
Load the `plugin-authoring` skill first (it writes the API types the typecheck needs). Rewrite `trainingOf`, update the existing test, add new ones, run the check.
## Log and handoff
Record the commit, check results, AC5 numbers and any risk.

2026-10-12, worker (branch claude/stoic-matsumoto-467bfa):
- `trainingOf` now trains from work only: STR edits; DEX reads (Read, Grep, Glob, LS); INT bash + 3 x agents + web; VIT 2 x turns + 25 x rested + 5 x compactions. Luck still from cache reads. `tok*` fields stay in the save and no longer train.
- Interpretation of "25% flows to the lowest": a fill. Each stat keeps 75%; the pooled quarter lifts the lowest until it meets the next, then both, and so on. Reason: the literal rule (whole quarter to one lowest) failed AC4, perfectly even work gave Harmony 0.43 because the tie-broken lowest overshot and became the highest. With the fill, a stat far behind still takes the whole quarter (test: edit=read=bash=400, VIT gets exactly 300), ties share it, nothing overshoots.
- AC5, card day (400 edits, 600 reads, 300 bash, 30 agents, 200 turns, 2 compactions), sum STR+DEX+INT+VIT: old 1055 (246/317/242/250), new 1060 (265 each, Harmony 1.00), +0.5%.
- Token sensitivity (old formula counted Opus tokens, in thousands, into STR): tokOpus 2000 old 1216 (new -12.8%); 4000 old 1344 (-21.1%); 16000 old 1898 (-44.2%). The owner's live save shows about 80k tokens per main turn (16 turns, 1266k Opus+Sonnet), which suggests a real 200-turn day near the high end, so token-heavy users lose stat magnitude versus v0.1. Pacing is a separate card.
- Risk: the fill equalizes the card's typical day completely (all four at 265, Harmony 1.0), so builds look flat for mixed work and the Harmony achievement (0.8) becomes easy. A smaller share (for example 10-15%) would keep some lean. Coordinator or the owner decides.
- Also updated the stale comment above token counting in `register.tsx` turn.complete (comment only).
- Check: `python tools/game_check.py run --root .` PASS 1791837697103837000-d2339587; `verify` PASS, receipt matches. AC5 script kept in the worker scratchpad, not committed.

2026-10-12, coordinator review: diff matches D7; the quarter-share fill is the faithful reading (the literal rule broke Harmony). Class awakening uses raw counts, so flat stats on mixed days do not affect class. Merged as dfde72f; whole check PASS (validate 1/1, tests 9/9, typecheck 1/1, verify PASS). Route note: the chip started on the app default (Opus, high) and finished before the coordinator could switch it; observed route Opus high, not the intended Sonnet medium. Token-heavy stat loss is handed to task-3.
