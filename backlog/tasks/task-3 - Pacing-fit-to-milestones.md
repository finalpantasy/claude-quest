---
id: task-3
title: Pacing fit to the D9 milestones
status: Verified (owner pacing review pending)
---
## Problem before solution
Observed: at 12 hours of Claude a day v0.1 reaches character level 70 in about a month (the owner, 2026-10-12). The comment above `XP_PER_FOE` in `hooks/game.ts` (about line 77) claims "92 in a year, 99 in two", so the comment and reality disagree.
Facts: XP curve `xpAt` (about line 68) is RuneScape's, uncapped (D3, keep it). Fight XP: `gainXp(h, XP_PER_FOE * foe.count * k.xp * tierXp(place.tier) * (1 + d.xp / 100), ...)` (about line 665); web shrine XP about line 1122. Life XP: `lifeXp` with `LIFE_RATE` (about lines 847-957). Monsters scale to a par hero (`parOf`).
Hypothesis (unproven): par scaling keeps kill rate roughly level-independent, which makes the front-loaded curve too fast early, so a flat XP cut cannot hit every milestone; XP gain needs a level-dependent factor (for example a piecewise or smooth multiplier on fight and life XP by current level) fitted to the table.
## Outcome and scope
D9 targets at 12 active hours a day, both for character level and for each life skill:
| Day | 1 | 7 | 30 | 182 | 365 | 730 | 1460 |
|---|---|---|---|---|---|---|---|
| Level | 10 | 25 | 40 | 70 | 85 | 92 | 99 |
Keep the RuneScape table itself. Change XP gain rates only. Keep combat difficulty, loot and stat power otherwise unchanged. Fix the stale comments. Existing saves keep their level and XP (no wipe, no rescale).
Also measure (do not fix unless it breaks AC4): task-2 removed model tokens from training, so token-heavy days now have up to about 44% fewer attribute points than v0.1 (see task-2 log). Simulate with the merged `trainingOf` and report STR+DEX+INT+VIT at days 30 and 365.
Non-goals: new content, band changes, stat training formula (task-2, done).
## Dependencies and ownership
Depends on task-2 (Verified 2026-10-12, merged dfde72f), because training changes combat power and kill speed. Owned files: `hooks/game.ts` (XP constants, `gainXp`/`lifeXp` rate factors, comments), `hooks/quest.test.tsx`. Nothing else may edit `hooks/game.ts` while this runs.
Execution: worker chat, Sonnet, high effort (balance fitting with a long simulation; reasoning-heavy but bounded).
Assigned role: bounded worker. Return evidence; do not delegate, push or merge.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Character level within 15% of each milestone up to day 365 | scratchpad tsx simulation importing `hooks/game.ts`: counts every 5 simulated minutes, 12 active hours then 12 idle hours a day, typical mix (per hour about 35 edits, 50 reads, 25 bash, 3 agents, 15 turns, one commit every 2 hours), seed fixed | day-by-day table for days 1, 7, 30, 182, 365 | PASS (day 1 L10, 7 L23, 30 L38, 182 L75, 365 L85; worst -8%; one trajectory, seed spread in the Log) |
| AC2 | Days 730 and 1460 on target within 15% | simulate or extrapolate from the measured XP per day at each level band; state which and why | numbers and method | PASS by extrapolation (day 730 L91-93, day 1460 L96-101 over the tier-growth range; see Log) |
| AC3 | Each life skill within 20% of the same table | same simulation, idle hours drive camp | per-skill table | PASS (every skill within 10%, except cooking day 1 L8 = -20%, the edge; 730 and 1460 from the camp-only sim) |
| AC4 | No death spiral or stall | deaths per day and map tier stay in a sane band (state them) through day 365 | table columns | PASS (about 130-620 deaths a day, 1 death per 47 kills, tier 11 to 318, never stalls) |
| AC5 | A test pins the pacing | test asserting XP needed versus XP rate at L10 and L40 gives roughly day 1 and day 30 (loose bounds) | test output | PASS (2 tests in quest.test.tsx) |
| AC6 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines | PASS (validate, 34 tests, strict tsc; verify PASS) |
## Human gates
The owner sees the day-by-day table before release (pacing feel is his call); technical PASS does not approve it.
## Recovery and return condition
Own branch. Keep the simulation script in the scratchpad, never committed. Return when AC1-AC6 have evidence, or when the fit cannot reach 15% (return the best fit and the gap instead of loosening criteria).
## Approach and commands
Load `plugin-authoring` first. Measure v0.1 baseline with the simulation, then fit. Run the check.
## Log and handoff
Record the commit, the tables, the final constants and any risk.

2026-10-13, coordinator handoff: the first worker stopped at the account spend limit. Its work is saved as WIP commit e8c5c60 on branch claude/youthful-liskov-6d8d90 (based on 16b9427, so rebase or merge onto current main first): `FIGHT_XP_CURVE` and `LIFE_XP_CURVE` (per-level XP multipliers blended in log space between anchors) and `curveAt`, wired into fight XP and life skill XP, plus new tests in quest.test.tsx. The curves are still flat ([1,1],[99,1]): no fit was finished.
Failed approach, do not repeat: fitting by running 12 full 400-day simulations in parallel (about 35 minutes per round). It lagged the owner's PC badly and lost outputs. New rule: one simulation process at a time, BelowNormal priority, under 10 minutes.
Hypothesis for the next worker: measure XP per active hour at a handful of levels with short sampled runs (a few simulated days per sample), compute time to each milestone analytically from the RuneScape XP table, set the curve anchors from that, then confirm with ONE end-to-end run under 10 minutes (sample days, not every 5-minute tick, if needed).


2026-10-13, worker result (Sonnet, high). Commit: 3b21d5e on branch claude/dreamy-mendel-ec172f (merged e8c5c60 into 4c71972 first, no conflicts; merge commit fcf3dfc).

Method (the fast one). A tsx-style balance sim in the scratchpad (run with bun, already installed; never committed) imports hooks/game.ts: counts every 5 simulated minutes, 12 active hours then 12 idle, mix 35 edits, 50 reads, 25 bash, 3 agents, 15 turns, a commit every 2 hours, seed 12345, start 2026-10-12 12:00Z (the same hero as the test). One process at a time at BelowNormal, every run under 10 minutes.
1. Flat baseline (curves 1): day 1 L24, 7 L52, 30 L68, 60 L86, 120 L98. Fight XP per day is about 48k x tierXp(tier) x curve factor, where tierXp = 1 + 0.02 x tier. The map tier climbs all game (11 on day 1, 318 on day 365), so the raw rate rises with time, not only level.
2. Fitted the fight curve by band: time spent per band against the target time, scaled each anchor by that ratio, three passes. Anchors past 85 come from a small model (dXP/dt = K x tierXp(t) x f(level), K 48k, tier log growth), checked against a measured stretch (days 366 to 445 with the same L85+ anchors: model 4.48M XP, sim 4.46M).
3. Fitted the life curve with a camp-only sim (no fights, 13.3 camp hours a day; matches the full run to within one level at every checked day, 0.3 s per 182 days, so 1460 days is measured not extrapolated). A coordinate-descent optimizer in the scratchpad tuned the shared curve plus an alchemy trim. Alchemy needed its own trim because its XP per brew rises with its level.
4. Final end-to-end: the full sim chained in three snapshot segments (days 1-180, 181-290, 291-365), each under 10 minutes (516, 414, 315 s). A straight 365-day run would take about 20 minutes because loot work grows with the map tier (the CPU profile shows derive() at 94%), which is why it is chained. Same code and constants throughout.

Final constants (hooks/game.ts):
FIGHT_XP_CURVE = [[1,0.15],[10,0.11],[25,0.08],[40,0.08],[55,0.09],[70,0.054],[85,0.04],[92,0.0125],[99,0.0125]]
LIFE_XP_CURVE = [[1,0.105],[15,0.086],[30,0.09],[45,0.128],[60,0.4],[75,0.74],[90,1],[99,0.2]]
LIFE_TRIM.alchemy = [[1,1.5],[20,1.22],[40,0.45],[60,0.3],[80,0.3],[99,0.2]]
(new export LIFE_TRIM; lifeXp multiplies LIFE_RATE x shared curve x trim). XP_PER_FOE, LIFE_RATE, the XP table, combat, loot and stats are untouched. Saves keep level and XP.

Day table, character level (target day: level):
| Day | Target | Measured | Dev |
|---|---|---|---|
| 1 | 10 | 10 | 0% |
| 7 | 25 | 23 | -8% |
| 30 | 40 | 38 | -5% |
| 182 | 70 | 75 | +7% |
| 365 | 85 | 85 | 0% |
| 730 | 92 | 91 to 93 (extrapolated) | within 1% |
| 1460 | 99 | 96 to 101, central 98 (extrapolated) | -3% to +2% |
Days 730 and 1460 are extrapolated from the measured day-365 state (3.47M XP, tier 318, about 13.6k XP/day at L85) with the model in step 2; the range is over tier growth b 100..600 and K 45k..52k. The sim is chaotic (item luck changes the path): other seeds on days 1 and 7 give L9-12 (day 1: 10,10,9,10,10,9,10,12) and L23-27 (day 7: 23,24,23,27,25,24,25,24); earlier runs with slightly different constants gave L72 to L76 on day 182. Treat each milestone as plus or minus 2 to 3 levels early and plus or minus 5 late. The one outlier is seed 7 on day 1 (L12, +20%).

Per-skill levels (full sim; 730 and 1460 from the camp-only sim) fishing/cooking/mining/smithing/archaeology/alchemy:
| Day | Target | Levels |
|---|---|---|
| 1 | 10 | 11/8/11/9/10/10 |
| 7 | 25 | 26/23/25/23/25/24 |
| 30 | 40 | 41/37/41/38/41/40 |
| 182 | 70 | 73/66/73/69/72/69 |
| 365 | 85 | 86/80/85/82/85/84 |
| 730 | 92 | 95/91/94/93/94/93 |
| 1460 | 99 | 99/97/99/98/98/97 |
Worst cell: cooking day 1 L8 (-20%, at the limit); everything else within 10%.

Deaths and map tier (AC4), per period: days 1: 134 deaths/day, 2-7: 199, 8-30: 177, 31-90: 497, 91-182: 616, 183-365: 532 (max 730 on one day). Kills per death stay at 47 (76 on day 1). Tier at day 1, 7, 30, 90, 182, 365: 11, 16, 28, 79, 158, 318. The tier never falls more than 4 in a week, so there is no death spiral and no stall. Combat difficulty is unchanged (the v0.1 flat baseline had the same 1 per 47).
Attribute sums STR+DEX+INT+VIT (training from counts, merged task-2 formula): day 30 8693, day 365 40929 (day 7 3525, day 182 26585). Measure only.

Tests (quest.test.tsx): `pacing curves` (positive, at most 0.15, exact at anchors, geometric blend) and `pacing: twelve active hours a day ...` (day 1 L8-12, life 7-12; day 7 L21-29, life 20-30; level 40 projected from the day-7 XP rate lands between day 20 and 50; day 1 XP between xpAt(9) and xpAt(12)). The `pop` test started failing because level 2 now takes longer than its 20 edits, so it now starts the hero one XP short of level 2.

Check: `python tools/game_check.py run --root .` PASS 395b850e (validate 1/1, tests 34/34, typecheck 1/1); `verify` PASS: receipt matches current inputs and recorded artifacts.

Risks and owner judgments: (1) Pacing feel is the owner's call: early game now levels at about 1k XP a day (L10 on day 1, then L23 on day 7), compared with v0.1's L52 on day 7. (2) The pace after day 30 depends on the map tier, which rises on its own as the hero's gear drifts; a lucky or unlucky gear run moves L70 by about plus or minus 5 levels. (3) The web-lore shrine (xpToNext x 1% per web call) is not on the curve, so web-heavy work levels a little faster than the table; the typical mix has no web calls. (4) Beyond day 365 the sim is chained and extrapolated (measured to day 445 with the same anchors). (5) The 99 anchors are flat at 0.0125 on purpose; if the tier grows faster than log, day 1460 ends nearer L100 than L98.
