---
id: task-12
title: The wandering arsenal - random identity, loot-driven style, birth labels (D25)
status: Planned
---
## Problem before solution
The owner (2026-10-12, D25) wants identity fully random, Progress Quest style. Classes must not limit gear or stats; the kind of work must not steer the build (it would force workflow changes); nothing scheduled or deterministic; everyone levels everything to 99+.
Facts today: the class decides a lot (`hooks/game.ts`): `classOf(h).main` gives +3 of one stat per level (line ~228), every drop rolls the class main stat (`makeItem(..., classOf(h).main)` at ~895, ~986), each class has its own 6 skills (`CLASSES[].skills` in `hooks/data.ts` ~143), Necromancer gets double minion damage (~272), monsters scale per class (`parOf(cls, lvl)` ~319), awakening after 50 actions picks the class from work counts (~1096). D7 stat training from the kind of work (task-2) is in `applyCounts`. Race comes from the model (`RACES`).
This card replaces the old "class pick and reroll" plan (D19, D20, D21 superseded): no picker, no reroll.
## Outcome and scope
- One permanent crab. Name, levels, gear, collections and history stay forever. No job or race picker, no `/quest reroll`, no hero slots.
- Work is fuel only: the amount of work still banks Focus exactly as today; the kind of work, the model and the tools no longer change stats, race or class. Remove class awakening and the D7 work-kind stat training; keep the counts that feed Focus and the live animation.
- Random growth: each level grants attribute points split at random by the hero's RNG (STR, DEX, INT, VIT, Luck), with a gentle catch-up so no stat falls far behind over months. Damage counts every attribute equally (no main stat), so no roll makes a dead build. Every stat and skill keeps climbing past 99 on the existing curves.
- One shared skill pool: merge the five class skill lists into one pool (about 30 skills, keep their names); the hero spends ranks at random, weighted toward skills that fit the weapon it currently holds. Remove class-only bonuses (Necromancer minion double): minions use one rate for everyone.
- Loot decides the style: drops roll any attribute; the hero equips by total power. Equip rule: among loadouts within 5% of the best total power, pick at random, and keep the current style for a random stretch (sometimes a few fights, sometimes weeks) before reconsidering, so styles change at random moments and never drop more than 5% power. Never swap away an upgraded (+N) item for a weaker raw one (task-10 rule).
- Title from gear: a table maps weapon family plus off-hand plus chest family to a job title, reusing the D20 list (Vanguard, Berserker, Skylancer, Shadowstep, Ronin, Voidcaster, Lightmender, Crimson Duelist, Pactbinder, Harvester, Cogslinger, Twinfang, Ranger, Necromancer and the rest, no Bone Ranger) and the meme jobs (Prompt Engineer, Vibe Coder, Rubber Duck Debugger, Merge Conflict Monk, YAML Bard, 10x Intern, Scrum Lord, Tab Hoarder) for odd combos. A title change gets a log line ("Picked up a storm staff. Now a Voidcaster."). Trim color follows the title.
- Birth labels, rolled once at hatching and never changed, zero power: ancestry (the D21 crab list: Hermit, Coconut, King, Fiddler, Snow, Spider, Ghost, Horseshoe, Soft-shell, Imitation, Rustacean, Yeti, Decorator, Robber, Boxer, Pea, plus more), a silly profession (40+, for example Grave Accountant, Tide Notary, Barnacle Dentist) and a personality (40+, for example Unreasonably Brave, Suspicious of Seagulls). Shown on the Hero tab and used in log lines.
- Monster scaling: `parOf` stops depending on class; one par template per level.
- Old saves: keep level, XP, gear, gold and everything collected. The old class becomes the starting title; class skill ranks move into the shared pool with the same total ranks; birth labels are rolled from the save's seed; the model-based race and its bonuses are dropped. Power of a migrated hero within 10% of before.
- Docs: README "Hands-off" line, docs/PROJECT.md if it mentions classes.
Non-goals: player choices in the game, pickers, rerolls, slots, art (titles may set trim color only; looks come from task-11 phase B), downtime (task-14), events (task-15).
## Dependencies and ownership
Depends on task-3 (pacing) and task-10 (gear upgrades): all three change combat power in `hooks/game.ts`. Owned files: `hooks/game.ts`, `hooks/data.ts`, `hooks/register.tsx` (Hero tab text), `types/index.d.ts`, `hooks/quest.test.tsx`, `README.md`, `docs/PROJECT.md`.
Execution: worker chat, Sonnet, high effort (save migration and balance).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Kind of work changes nothing but Focus | test: two heroes with the same seed, one fed only edits and one only shell calls with equal totals, end with identical stats and title | test output | NOT_RUN |
| AC2 | No dead builds | test: 200 seeds at level 60 with par gear, derive DPS spread (max/min) under 1.3 | test output | NOT_RUN |
| AC3 | Styles change at random, never costing more than 5% power | simulation: 365 days, count title changes per hero (more than 5, not daily on a schedule), and every swap's power loss at most 5% | table | NOT_RUN |
| AC4 | Birth labels fixed and powerless | test: labels never change across a long run; heroes differing only in labels derive identical stats | test output | PASS (slice, `hooks/identity.test.ts`) |
| AC5 | Old saves migrate safely | test with v0.1 and v0.2 save copies in a temp folder: loads, keeps level, gear and gold, power within 10%, labels set | test output | NOT_RUN |
| AC6 | Pacing still meets D9 within 15% | rerun the task-3 simulation | day table | NOT_RUN |
| AC7 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines | NOT_RUN |
## Human gates
The owner watches the crab change styles after install and judges whether it is fun.
## Recovery and return condition
Own branch. Never touch the owner's live save; use temp folders. Return when AC1-AC7 have evidence, or when pacing cannot hold within 15% (return the gap).
## Log
2026-11-12, zero-power slice on `claude/task-29-content`, not merged or pushed. It adds words only. Classes, skills, stat growth and every saved field the old code reads stay exactly as they were, and nothing new draws from the game's RNG.
- Birth labels: `ANCESTRY` (24), `PROFESSIONS` (40) and `PERSONALITIES` (40) in `hooks/data.ts`. `rollBirth` keys them on the name and hatch time. Not `seed`: that is the live RNG state, and every draw moves it. The first `step` stores them in an optional `birth` field, so an old save gets the labels it would have had at hatching. The Hero tab shows them, for example "Born: Snow Crab, Tide Notary, Afraid of Crabs".
- Title from gear: `TITLES` is a 7 by 6 table, weapon base by off-hand base or none, 42 titles from the D20 list and the meme jobs, with no Bone Ranger. `titleOf` reads it; a weapon with no known base is a Wanderer. When the gear changes the title, the log says so ("Ada is now a Skylancer."). A save without a title takes one quietly. The Hero tab shows it next to the class. That stays.
- AC4 test: two heroes, same seed, different labels, 30 hours: same level, XP, gold, kills and derived stats, and the labels never change. A second test covers the title table and the quiet first title, including an old save stepped once with both fields deleted, which must log nothing about its new title.
- Title changes over 14 days, five seeds: 11 to 15 on day one while gear churns, then 0 to 2 a day. The full card wants random style stretches (AC3); that needs the equip rule rewrite.
- Pacing: unchanged, 1250 / 24.6 / 24.6 / 39.3 over the 10 seeds.

Still open on this card: AC1 to AC3 and AC5 to AC7 (class removal, random growth, shared skill pool, loot-driven equip stretches, save migration). They change combat power and need the worker pass the card asks for.
