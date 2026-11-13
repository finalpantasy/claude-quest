---
id: task-10
title: Gear upgrades (+1, +2, ...) the hero chooses itself, with ARPG random rolls
status: Ready
---
## Problem before solution
The owner (2026-10-12) wants +1, +2 style item upgrades. The hero decides on its own when and what to upgrade (D2: no player choices), and upgrades must keep the ARPG feel: random, exciting rolls, not flat number bumps.
Facts: town logic in `hooks/game.ts` already runs a blacksmith (ore into `quality` on weapon and chest, about line 807), a jeweler (sockets, gems), and Kadala gambling; `Item` lives in `types/index.d.ts`; affix values come from `AFFIX` in `hooks/data.ts` via `affixValue`; Smithing and Mining are life skills.
## Outcome and scope
A new upgrade track on every equipped item, separate from quality:
- `Item.plus` (optional number, default 0, so old saves load unchanged). Name shows as "+6 Doom Mantle"; the gear tab and tooltips show it; it never transfers to a new item.
- Each +1 raises the item's base power and every affix value by 6% of their unupgraded value.
- Random rolls on every successful upgrade: 10% chance of a "critical forge" (+2 instead of +1); 15% chance to bless the lowest affix (reroll it, keep the better result).
- Milestones: +5 adds a socket if there is room, otherwise a bonus affix roll; +10 adds a random new affix (from that slot's pool, never a duplicate); +15 rerolls every affix keeping each better result ("Masterwork"), and the item gets a gold border.
- Cost: gold plus ore (from Mining), rising with the + level and the item level. Success chance: 100% up to +3, then falling (about 90% at +4 down to about 15% at +15); each failure adds +10 percentage points to the next try on that item (pity) and costs only the materials. Nothing ever breaks or loses levels. Smithing level adds a small success bonus. Cap +15 for now.
- The hero's choice: on each town visit it ranks equipped items by expected stat gain per gold (using `derive` before and after) and upgrades the best ones while it can afford them, keeping a gold reserve for gambling. When a new drop competes with an upgraded item, it compares total power including the plus, so a +9 item is not swapped for a slightly better raw drop.
- Feedback: log lines for each try ("Forge: Doom Mantle +6, success at 62%"), a toast and a pop of the full scene on +10 and +15, and a sprite glow on the hero that grows at +7, +10 and +15 on the weapon (art.ts).
- Pacing: upgrades add power, so rerun the task-3 simulation with upgrades on and keep every D9 milestone within 15% (retune upgrade costs, not the XP curve).
- Also fix the task-7 follow-up: clear the active aura if no `turn.complete` arrives within 10 minutes.
Non-goals: player choices, item destruction, transferring pluses, new currencies.
## Dependencies and ownership
Depends on task-3 (pacing fit merged, because this changes power) and task-7 (merged). Owned files: `hooks/game.ts`, `hooks/data.ts`, `types/index.d.ts`, `hooks/art.ts` (glow only), `hooks/register.tsx` (gear tab text, aura timeout), `hooks/quest.test.tsx`. Runs alone on these files.
Execution: worker chat, Sonnet, high effort (economy and balance work).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Old saves load with plus 0 | test: a v0.1-shaped item without `plus` derives the same stats as before | test output | PASS: test `task-10 AC1`: derive on the new engine equals values measured on main 7d395ef (dps 264.279, life 1808.044, armor 180); no `plus` and `plus: 0` derive the same |
| AC2 | +N scales power and affixes by 6% per level | test on a fixed item at +0, +5, +10 | test output | PASS: test `task-10 AC2`: plusMult 1, 1.3, 1.6 at +0/+5/+10; armor and a life affix scale 1.3x and 1.6x (within 2%); weapon dps 1.6x at +10 |
| AC3 | Random rolls and milestones happen at the stated odds | seeded test over 10,000 upgrade attempts: crit forge about 10%, bless about 15%, +5/+10/+15 milestone effects applied once | test output | PASS: test `task-10 AC3`: 10,000 seeded upgrades give crit 9.22%, bless 15.29%; 200 items walked +0 to +15 fire milestones [5, 10, 15] exactly once, +5 socket on a weapon or bonus affix on a ring, +10 one new affix, no duplicate affixes, +15 never lowers an affix |
| AC4 | Failures never break or downgrade, pity raises the next chance | test | test output | PASS: test `task-10 AC4`: 8 failed tries on a +14 item keep +14 and the item, cost only gold and 8x the ore, pity 8; each pity step adds exactly 10 points; +3 is 100%, +4 90%, +15 15%; a success then reaches +15 and clears pity |
| AC5 | The hero upgrades on its own and keeps upgraded gear sensibly | simulation: count upgrades per day, average plus on equipped gear at days 30 and 365, swaps that lowered total power (must be 0) | table | PASS: year sim seed 12345: average plus 3.55 on day 30, 13.64 on day 365; forge tries per day 2.7 (days 1-7), 2.2 (8-30), 1.1 (31-90), 0.6 (91-182), 0.4 (183-365); swaps that lowered total power 0 of 150 |
| AC6 | Pacing still meets D9 within 15% | rerun the task-3 simulation with upgrades | day table | PASS within 15%: day 1 L10 (0%), 7 L24 (-4%), 30 L42 (+5%), 182 L77 (+10%), 365 L88 (+3.5%); six seeds on day 30 average L39.5 (no forge: L41.0). Table in the Log |
| AC7 | Aura clears after 10 minutes without turn.complete | test with the mock clock | test output | PASS: test `task-10 AC7`: still active at 9 minutes, cleared at 10 minutes 1 second without turn.complete; a finished turn leaves the next one active |
| AC8 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines | PASS: `run` PASS 1792033505952913800-f6100b1f (validate 1/1, tests 44/44, strict tsc 1/1); `verify` PASS: receipt matches current inputs and recorded artifacts |
## Human gates
Failure rule confirmed by the owner 2026-10-12: materials only, never break or downgrade. The owner judges the feel after install.
## Recovery and return condition
Own branch. Return when AC1-AC8 have evidence, or when pacing cannot hold within 15% (return the gap instead of loosening it).

## Log
2026-10-14, worker result (Opus, high). Branch: commits on `claude/intelligent-meitner-ebf5fb`, which starts at the tip of `claude/task-10-gear-plus` (3e9af2f, the WIP 30573dd plus a merge of main 7d395ef), so `claude/task-10-gear-plus` fast-forwards to it. Why not the task-10 worktree itself: this session's hook refuses writes to another worktree's files, so the work sits in the session's own worktree.

Review of the WIP 30573dd: kept the engine (plusMult, forgeChance, upgraded with crit, bless and milestones, forgeVisit ranking by gain x chance per gold, itemTitle "+6 Doom Mantle", optional `plus` and `pity` on Item, so old saves load unchanged). Its run showed the flaw: on days 121-182 the forge never fired (average +6.1, max +7). Diagnosis: deaths take 5% gold each and Kadala spends anything above 4 gambles, so the purse sits near 3 gambles' worth at every level; a quadratic gold price passes that by +8 and the forge stalls for good.

What changed:
1. Cost: ore paces the forge, `100 x next^1.5 x (1 + ilvl/40)` ore per try; gold is a small fee, `0.06 x next` gambles at max(item level, hero level); the hero keeps 1 gamble back (was 3). With ore^2 the forge reached only +9 by day 182 and never fired +10 or +15 (ore income is about 3k a day near L70 and a +10 try on an ilvl 77 item cost 29k), so the exponent went to 1.5.
2. Exported `forgeVisit` for the AC4 test; Kadala uses the shared `gambleCost`.
3. art.ts: the upgrade glow (up7, up10, up15 in the existing aura mapping) now reads the weapon's real `Item.plus`, as the card says, instead of the highest plus through a cast.
4. register.tsx: the gear tab shows affix values with the forge levels included and draws a round gold border around a +15 item; a "+10:" or "+15:" forge line pops the full scene (and the engine already sends a toast note); the active aura clears itself 10 minutes after turn.start if turn.complete never arrives.
5. Tests: five new ones in quest.test.tsx (AC1-AC4, AC7).

Method for AC5/AC6 (the fast one from task-3): the task-3 sim (5-minute counts, 12 active hours, seed 12345) with forge counters, chained from snapshots in five segments of 361, 215, 501, 252 and 194 seconds, one bun process at a time at BelowNormal. Plus one bun process running six seeds to day 30 (with and without the forge) to measure the spread.

Day table, seed 12345 (target day: level):
| Day | Target | No forge (task-3) | With forge | Dev | Tier | Avg plus | Max plus |
|---|---|---|---|---|---|---|---|
| 1 | 10 | 10 | 10 | 0% | 11 | 0 | 0 |
| 7 | 25 | 23 | 24 | -4% | 18 | 1.36 | 4 |
| 30 | 40 | 38 | 42 | +5% | 36 | 3.55 | 8 |
| 182 | 70 | 75 | 77 | +10% | 193 | 9.73 | 14 |
| 365 | 85 | 85 | 88 | +3.5% | 326 | 13.64 | 15 |
Days 730 and 1460 are not simulated. By day 365 most gear is +13 to +15, so the forge stops adding power soon after; its lasting gain (about 1.9x item stats, worth about 5 map tiers because monster life grows 1.13x per tier) moves XP per day by about 2% at tier 300+, so the task-3 extrapolation (92 and 96-101) should hold within a level.
Seed spread on day 30 (seeds 12345, 7, 99, 2024, 31337, 4242): no forge L38, 37, 40, 49, 43, 39 (mean 41.0); forge (final costs) L42, 37, 38, 39, 40, 41 (mean 39.5). One no-forge seed runs away to tier 55, so single seeds move by up to 9 levels on day 30; the forge does not widen that.
Life skills on day 365: 86/80/86/83/85/84 (task-3: 86/80/85/82/85/84).
Forge activity: tries per day 2.71 (days 1-7), 2.17 (8-30), 1.10 (31-90), 0.63 (91-182), 0.41 (183-365); failures 0/19, 0/50, 4/66, 13/58, 38/75; +10 milestones 11 and +15 milestones 2 in the year; swaps 150, of which lowered total power 0.

Risks and owner judgments:
1. Gear freezes once it is upgraded: no swaps after day 182, and on day 365 the L88 hero still wears ilvl 38-58 items (+12 to +15) while Kadala gambles about 700 times a day for nothing. Without the forge, day-180 gear sat at ilvl 54-74. This follows the card (compare total power including the plus, never transfer pluses) but means no new item looks late in the game. A follow-up could let a salvaged upgraded item refund part of its ore, or tie the gain to item level; that is the owner's call.
2. Pacing is chaotic: seed 12345 lands +10% on day 182 (task-3 had +7% on the same seed without the forge). Treat milestones as plus or minus 2-3 levels early and 5 late, as task-3 said.
3. Visual: the glow uses task-16's existing up7/up10/up15 auras (rendered by task-16); the +15 gold border and the gear-tab numbers are not screenshotted. The owner judges the feel after install.
4. The forge writes one log line per try; at most 8 tries a visit, and the log keeps its 60-line cap.
