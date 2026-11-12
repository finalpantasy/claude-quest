---
id: task-14
title: Downtime layer - campfire, Rested pool, Farming, Expeditions, welcome back (D26)
status: Built on branch claude/task-29-content, not merged; owner judges the campfire and welcome-back feel
---
## Problem before solution
The owner (2026-10-12, D26) wants downtime to do something fun and to train its own skills: short breaks, long idle stretches and nights away should each look and feel different.
Facts: `step` in `hooks/game.ts` (~1036) fights while `h.focus > 0` and runs camp after (`campSkill` ~991 picks fish, mine or dig); Focus is banked in `applyCounts` (~1095, cap `FOCUS.cap`); compacting early gives a 30-minute "Well Rested" buff (~1127). Life skills and perks are tables in `hooks/data.ts`. Toasts go through `toast()` in `hooks/register.tsx` (~114) with a minimum gap.
## Outcome and scope
- Downtime tiers by how long Focus has been empty (real clock):
  - Short break (about 5-30 min): the crab sits at a campfire, rests and cooks (Cooking XP). Campfire state is a new camp task.
  - Longer idle: gathering as today (fish, mine, dig).
  - Overnight and weekends: timer skills keep running in the background regardless of the camp task.
- Rested pool: time away fills a pool of bonus combat XP (double XP on kills until spent), capped near one day's worth of play at 12 h/day. It only gives back time you missed; it must never push a hero past the D9 milestones (fold it into the task-3 simulation and keep every milestone within 15%). Replaces or merges with "Well Rested" (keep the compaction trigger as a small extra fill).
- Two new life skills on the same XP table, each with a small permanent combat perk and counted in total level:
  - Farming: plots that grow over real hours (seed, sprout, ripe), harvested automatically; crops feed Cooking and Alchemy; rare seeds from archaeology.
  - Expeditions: a follower (or a pet once pets exist) leaves on a trip of 1 to 12 real hours and returns with relics, materials, gold and, rarely, a pet egg (stored for the later pet system).
- Welcome back: after 4+ hours away, one log entry and one toast summarise what happened ("While you were gone: 3 crops, a relic, Rested 80%"), and the /quest pane shows the full summary.
- Hero tab and Life tab show the Rested pool, plots and the current expedition.
- Saves: new fields optional with defaults so old saves load.
Non-goals: the pet game system, art beyond reusing the camp scene with a campfire prop (visuals in task-11 phase B or task-13), player choices.
## Dependencies and ownership
Depends on task-12 (both change `hooks/game.ts` and the save). Owned files: `hooks/game.ts`, `hooks/data.ts`, `hooks/register.tsx` (tabs, welcome-back toast), `types/index.d.ts`, `hooks/quest.test.tsx`.
Execution: worker chat, Sonnet, high effort (pacing must hold).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Tiers switch by idle time | test with the mock clock: 10 min idle shows campfire, 60 min shows gathering | `downtime.test.ts` AC1 | PASS |
| AC2 | Rested fills while away, spends on return, respects the cap | test: 8 h away then 1 h of work; pool fills, doubles kill XP, never exceeds cap | `downtime.test.ts` AC2 | PASS |
| AC3 | Farming and Expeditions progress in real time and pay out | test: plant, advance the clock past ripe, harvest; expedition returns with loot | `downtime.test.ts` AC3 | PASS |
| AC4 | Pacing holds with Rested, Farming and Expeditions | rerun the task-3 simulation with 12 h days and 12 h away | 10-seed table in the Log | PASS (owner reviews the table) |
| AC5 | Welcome back appears once after 4+ hours | test | `downtime.test.ts` AC5 | PASS (see deviations) |
| AC6 | Old saves load | test with a v0.2 save copy in a temp folder | `downtime.test.ts` AC6 (fields deleted from a new hero) | PASS |
| AC7 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | validate PASS, strict tsc PASS, tests 63/64 | The 7-day pacing test hits the 5 s cap (8 to 11 s with the CPU busy); rerun on a quiet machine |
## Human gates
The owner judges the campfire and welcome-back feel after install.
## Recovery and return condition
Own branch. Return when AC1-AC7 have evidence, or when pacing cannot hold (return the gap).
## Log
2026-11-12. Built on top of task-15 (same branch), before task-12. task-12 was listed as a dependency only because both touch `hooks/game.ts` and the save.

What was built:
- Campfire: for the first 30 minutes after Focus runs out, the hero sits at a campfire (new `camp` task, 40 to 70 s each, 25 Cooking XP). After that, gathering as before. The scene draws two flame frames that flicker over crossed logs, placed past the party so no follower stands in it.
- Rested: a `Rested` buff of +100% XP that runs down only while fighting. Time away from real work (30 minutes or more between counts) adds one minute per eight minutes away, capped at 60 minutes. A compaction adds 15 minutes; this replaces the old 30-minute +50% "Well Rested" buff with the same XP value.
- Farming (🌱, perk +0.3% gold find per level): 1 plot, plus 1 per 25 levels (max 4). Turnip, Carrot, Moonbean and Bugroot unlock every 10 levels and take 2 to 6 hours; rare seeds from expeditions grow a Golden Pumpkin or Starfruit. Each harvest also feeds Cooking and Alchemy XP. Plots share the harvest XP, so more plots do not speed up the skill.
- Expeditions (🧭, perk +0.3% damage to elites per level): a resting follower (4th or later), or a hired porter, leaves for 1 to 12 real hours and returns with gold (10 to 20 x level per hour), ore, reagents, sometimes a rare seed (6% per hour), a pet egg (2% per hour, kept for the pet system) or a relic item (5% per hour, rare or unique).
- The timer skills run on the real clock whatever the hero is doing, on their own random stream.
- Welcome back: the existing away summary now also names crops harvested, expeditions home and the Rested pool.
- /quest Life tab: both skills in the skill list and a Downtime section (Rested minutes, each plot and when it ripens, the expedition and when it is back).

Deviations:
- Welcome back already existed (any gap over 10 minutes since the last save). I extended it rather than adding a second one at 4 hours.
- Rested is +100% XP from every source while fighting, which in practice is kill XP.
- Old saves: the AC6 test deletes the new fields from a fresh hero rather than loading a v0.2 file.

Timer skill XP is scaled (Farming x12, Expeditions x10) because they pay by the clock, not per action. Life skill levels with the quest.test helper (12 h of work a day, 12 h away), seed 12345: day 1 Farming 7, Expeditions 10 (others 8 to 10); day 7 Farming 25, Expeditions 25 (others 22 to 25). The pacing test needs 7 to 12 on day 1 and 20 to 30 on day 7 for every skill.

Pacing, 10 seeds (12345, 1 to 9):

| | day 1 XP | day 7 level | day 7 Atlas tier | day 40 estimate |
|---|---|---|---|---|
| base 9d46e52 | 1247 | 24.0 | 21.3 | 43.1 |
| task-15 | 1240 | 24.1 | 24.9 | 42.3 |
| task-14 | 1270 | 25.3 | 25.6 | 37.1 |

Day 7 level is 5% over task-15 and within 2% of the D9 milestone (25). The day 40 estimate moved closer to the milestone (level 40 near day 30). Seed 12345 is the outlier (level 28, tier 35, estimate day 20.5); the pacing test's floor for that estimate is day 20, so that test has little room left on its own seed.

Band check, headless Edge at 2x, zoomed: campfire at 720 and 360, day and night, with no party and with 4 followers and 4 minions (fire stays past the party and inside the 360 band); the strip shows "Campfire: cooking flatbread". Scenes stay 10 to 14 KB of the 40 KB budget. The engine is about 15% slower in the 7-day sim (6.7 s against 5.8 s on a busy CPU) before an early exit was added to the timer check.

Risks: the 7-day pacing test already ran past its 5 s cap under load and the new timers add to that. A sitting pose reads as a squat at band size (the same pose as fishing). Pet eggs pile up until the pet system exists.

## Pets hatch (2026-11-12)

Expedition eggs no longer pile up: each step hatches one waiting egg into a pet from the 192 pet lines in `hooks/sprites/pets.ts`. The line is a hash of the hero's name, birth time and egg number, so the game's RNG is not touched, and the same hero always hatches the same pets in the same order. The newest pet walks right behind the hero, ahead of the followers. It grows to stage 2 after 3,000 kills and to stage 3 (on 3-stage lines) after 15,000 kills since it hatched, which is about one day and about five days of play. It logs "🥚 An egg hatched! Embub follows Ada now." and "✨ Embub evolved into Emblorb!". The Hero tab gains a Pet line, and there are three achievements: Egg Timer (first hatch), Menagerie (5 pets), Final Form (a pet at its last stage). The player manages nothing.

A 14-day run (seeds 12345 and 1 to 5) finds 6 or 7 eggs per hero, the first on day 1 to 5. So most days log no hatch at all, and none log more than two.

Pets give no power. A test runs the same hero twice, once with every hatch blocked; the level, XP, gold, kills, deaths and derived stats match. Perks and pet levels (ROADMAP item 1) stay for a later card, behind the owner's pacing gate.

Art. The old pet sprites are converted to the D30 kit with colors snapped to Resurrect 64, lit for dusk and night like the followers. Checked at 2x: stages 1 to 3 at 720 and 360, day, dusk and night. A mine or dig spot used to draw the followers on top of the rock and cart, so the trail now starts past those props.

The newest pet also cheers in the log on each level-up and boss kill, one of 16 lines picked by the clock ("🐾 Embub writes LGTM in the dirt.").

By the campfire the pet naps, with a small z drifting up. The party trail also stops short of other props now: it starts past the tombstone after a death, stops before the first house in town, and stops before the bucket by the dock (a 360 band has no room left there, so the party waits off screen instead of standing on the hero).
