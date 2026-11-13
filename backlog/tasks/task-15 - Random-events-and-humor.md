---
id: task-15
title: Random events and humor, Godville and Progress Quest style (D27)
status: Built on branch claude/task-29-content, not merged; owner reads the 50 lines and watches the band
---
## Problem before solution
The owner (2026-10-12, D27) wants the hero to be funny to watch: quirky random events like Godville and Progress Quest, popping up as a little text line in the band above the prompt and in the /quest pane, not only numbers going up.
Facts: the log and toasts exist (`say()` in `hooks/game.ts`, `toast()` in `hooks/register.tsx` ~117 with an 8 s gap and the quiet setting); the band has strip, pop and full modes (task-4) and a live action word (task-7).
## Outcome and scope
- `hooks/events.ts` (new, pure: no `$`, no I/O, no import from game.ts). `rollEvent(hero, rng, now, place)` returns a tale or nothing; `nextGapMs` draws the wait to the next one (6 minutes plus an exponential with a 12 minute mean, capped at 45); `noteTale` keeps the small save state.
- 140 templates (57 for anywhere, 24 for fights, 14 for camp work, 13 for town, 8 for travel, 6 for death) with slots for the hero's name, the current monster, the place and nine filler tables. They make thousands of different lines (AC2).
- Four running gags that come back later: Sir Grumbleton the rival (finale: a rare item), Shellby the moneylender (lends gold, later wants it back), the wise duck (finale: +5% XP for 30 minutes) and the bard who will not leave. A finished gag can start over once two others have finished.
- Rewards are small: gold of 3 to 20 times the hero's level (gag steps 20 to 80 times; Shellby takes back 24 to 33 times), buffs of +10% damage, speed or life or +5% XP for 10 to 30 minutes, and now and then a magic or rare item. Some lines cost 2 to 6 times the level in gold.
- No repeats: a line waits 200 tales before it can come back, and a template waits 30.
- Display: the scene shows the tale in gold in place of the task label for 8 seconds; a line too long for one row takes the header row too, and on a narrow band the sky row under it (in a narrow fight the foe's name steps aside for those 8 seconds). The strip shows it in place of the task label. Every tale goes to the log; the /quest Log tab has a Tales section (count, gold from tales, the last 8; the save keeps the last 50). Only gag finales and the rarest lines go to the toast, through the existing gap and quiet setting.
- Zero tokens. Save state is one optional `Hero.tales` object (next time, count, gag steps, a 200-entry hash ring, a 30-entry template ring, the last 50 lines, gold from tales). Old saves start it on their next finished task.

Deviations from the plan, and why:
- A speech line in the label row, not a speech bubble over a crab: the hero is the H1 human since D30, and the label row is where the eye already reads.
- 140 templates, not 300+: AC2 (2,000+ distinct lines, no repeat within 200) passes with room to spare, and the template ring was added after the first 50-line sample showed the same frame three times. More templates are cheap to add once the owner has judged the tone.
- Tables live in `hooks/events.ts`, not `hooks/data.ts`, so the module stays self-contained and pure.
- Birth labels and gear titles (task-12) are not used yet; task-12 is not built.
Non-goals: player choices, sound, new art.
## Acceptance and evidence
| ID | Criterion | Evidence | Result |
|---|---|---|---|
| AC1 | Random, not scheduled, not spammy | `events.test.ts` AC1 (2,000 draws: mean 10 to 30 minutes, 6 to 45, 25+ distinct gaps; a 12 h played day has 21 to 71 tales with gaps varying 3x or more); 18 seeds by 7 days: 80.4 and 81.2 tales a day over 24 hours, a mean gap of 18 minutes | PASS |
| AC2 | Variety | `events.test.ts` AC2: 10,000 rolls, over 9,000 tales, 2,000+ distinct lines, no line within 200, no template within 30, every line 60 characters or fewer, all four gags told to the end | PASS |
| AC3 | Rewards are small | `events.test.ts` AC3 caps; 7-day sims below: tale gold 0.06% of all gold, XP buff up 4.6% of the time (+0.23% XP) | PASS |
| AC4 | Band, log, pane, rare toasts only | `events.test.ts` AC4: strip and scene show the tale for 8 s then the label; the 360 scene keeps it; in a played day toasts are under a fifth of tales; the log has the lines | PASS |
| AC5 | It is funny | 50 lines below | Owner gate |
| AC6 | Whole check | validate PASS, strict tsc PASS; tests: all five task-15 tests PASS, no assertion errors in any run; 6 or 7 other tests hit the 5 s cap with the CPU at 100% from other chats | Rerun on a quiet machine |
## Log
2026-11-12. Built on top of task-29 (same branch). Base for the tables: task-29 at 57e9349 and base 9d46e52.

Pacing, the quest.test helper (12 active hours a day), 10 seeds (12345, 1 to 9):

| | day 1 XP | day 7 level | day 7 Atlas tier | day 40 estimate |
|---|---|---|---|---|
| base 9d46e52 | 1247 | 24.0 | 21.3 | 43.1 |
| task-29 | 1254 | 23.9 | 23.9 | 46.4 |
| task-15 | 1240 | 24.1 | 24.9 | 42.3 |

Level and XP hold. The day 7 tier is 4% over task-29 and 17% over base; one seed (7) reached tier 33, and the median is 24.5. The tier is the noisiest number in this table.

Tales on against tales off, same seeds, 7 days: XP +3.5% mean over 18 seeds, median +1.4%, but single pairs range from -20% to +62% because a tale changes the random path from then on, so this A/B cannot resolve 3%. The direct measure, 3 seeds by 7 days, minutes with a tale buff up out of 10,080:

| buff | seed 1 | seed 2 | seed 3 | mean share of time |
|---|---|---|---|---|
| +5% XP | 380 | 65 | 940 | 4.6% |
| +10% speed | 1030 | 1105 | 25 | 7.1% |
| +10% damage | 0 | 120 | 1090 | 4.0% |
| +10% life | 665 | 1620 | 2005 | 14.2% |

So tales add about 0.23% XP directly, under 1% damage and speed, and 0.06% of gold (6 seeds: 47,051 tale gold against 75.7 million earned).

Band check, rendered with headless Edge at 2x and zoomed: 720 scene with a 60-character tale in a fight with a rare pack (fits one row, clear of the foe name and the hero's weapon); 360 scene with the same tale (three rows, nothing cut); 360 fight with a 59-character tale (three rows, foe name hidden, HP bars clear, name back after 8 s); strip at 720 (gold line in place of the label). At 360, 25% of 12,000 rolled lines lost their end on one row plus the header row; with the third row and the foe-name rule, none do (0 of 12,000, three hero names). Two fixes came from the render: a lower-case word after a full stop ("sneezes. a raccoon"), and the cut punch lines at 360.

50 lines, the first 50 a played hero met over three days (seed 20261012, nothing picked or cut):
1. Brindle names a cursed sock Gerald. It suits it.
2. Brindle walks into a cart. Pretends it was on purpose.
3. Brindle finds a rubber duck. It looks wise.
4. Brindle turns a teacup off and on again. It works.
5. The duck listens to Brindle explain a flaky test.
6. Brindle wins 96 gold betting on a skeleton on break.
7. Brindle sneezes. A duck says bless you.
8. Brindle asks a pigeon in a hat for directions. Bad idea.
9. The Timezone Fiend tries to unionize the other monsters.
10. The Polyfill Mummy calls Brindle heroic. Rude, but accurate.
11. Brindle wonders if a cursed sock is a mimic. It is not.
12. Brindle loses a staring contest to a lantern.
13. Brindle yells: For green tests!
14. Brindle apologizes to a lantern, just in case.
15. Brindle gives an owl a pep talk. It cries.
16. The Merge Conflict rolls a natural 1 and looks away.
17. The duck finds the bug. Brindle takes the credit.
18. The Typo Imp screams: works on my machine!
19. Brindle forgets why this quest started.
20. Brindle counts to ten. Gets to nine. Good enough.
21. Brindle waves at a bard. It waves back. Odd.
22. Brindle remembers a merge conflict and shudders.
23. Brindle tries to tame a raccoon. It tames Brindle.
24. A lost sheep steals some cheese from Brindle. Fair.
25. Brindle eats a biscuit. Feels strong. +10% damage.
26. Brindle checks for traps. Finds an apple.
27. Brindle drops 41 gold into a candle. Gone.
28. Brindle takes a shortcut. It is longer.
29. Brindle hits the Callback Kraken with a lantern. Effective.
30. Brindle hears a cowbell from somewhere.
31. A tiny dragon challenges Brindle to chess. Brindle loses.
32. The duck leaves to help another hero. +5% XP.
33. Brindle dodges. The Mutex Golem dodges. Awkward.
34. Brindle wonders if a lantern is a mimic. It is.
35. The Segfault Slime asks if this is in the sprint.
36. The Callback Kraken is suspicious about all of this.
37. Brindle finds a note: fix later. It is later.
38. Brindle hits a signpost with a pick. It says ow.
39. Brindle reels in an old boot. Then another.
40. Brindle recites the alphabet backwards. Gets lost.
41. Brindle mines a rock shaped like a bard.
42. Brindle fishes up a null pointer. Throws it back.
43. Brindle whistles. A squirrel whistles back.
44. Brindle writes a haiku about an off-by-one error.
45. Brindle roasts a dumpling on a stick. Perfect.
46. A toad pays Brindle 144 gold to go away.
47. Brindle practices a victory pose on a teacup.
48. Brindle files a bug report against an imp.
49. Brindle naps at camp. +10% life for a while.
50. Brindle finds a fossil rubber duck and labels it priceless.

Lines 3, 5, 17 and 32 are the wise duck gag from start to finale. The filler "lantern" shows up four times in 50; widening the thing table is the next tuning step if the owner wants it.

Risks: tales also fire while the owner is away (about 80 a day over 24 hours), so the log fills with them overnight. A tale line needs 60 characters or fewer for the strip; a new template that runs longer is skipped by the roll, and a running-gag step that runs longer would stall that gag (all current steps fit, and AC2 checks every gag finishes).

Nemesis, 2026-11-12 (words only): when a magic, rare or unique pack beats the crab, that kind of foe becomes the crab's nemesis under a clock-picked epithet, for example "Spinlock Spider Who Read Your Diff". The next fight against that kind opens with its line ("Remember me?") and is labeled "Settling the score with ...". Winning it logs a revenge line from the crab and unlocks Served Cold, then Grudge Keeper at ten. Losing again only counts quietly. A new nemesis waits four hours after a revenge, so a hero sees about two a day: 24 epithets, 12 return lines and 12 revenge lines in `hooks/data.ts`, the state in an optional `nemesis` field, a Nemesis line on the Hero tab. Over 14 days, five seeds settled 30 to 37 grudges, and Grudge Keeper came on day 4. A new test runs the same hero with every nemesis blocked and gets the same level, XP, gold, kills and deaths, and the 10-seed pacing run is unchanged at 1250 / 24.6 / 24.6 / 39.3.

Win streaks, 2026-11-12 (counters only): fights won in a row without a death. Callouts land at 100, 250, 500, 1,000 and 2,500 ("🔥 Hot Streak! 250 wins in a row."), the Record section shows the current and best run, and two achievements come at 250 (Hot Streak) and 1,000 (Five Nines). Early fights never lose, so day one brings the first four callouts by about hour ten. After that a death roughly every 30 fights keeps a 100 run rare: 0 to 2 callouts a day over 14 days on five seeds. A test checks the callouts, the best run and the reset on a death.

Daily tally, 2026-11-12 (words only): the first step after local midnight logs a review of the day before, for example "📜 Nov 12 in review: 3,657 foes, 7 legendaries, level 1 to 7, 63,799 gold, 10 deaths." Parts with nothing to report drop out, and a day with no kills logs nothing. The counters at the start of the day sit in an optional `today` field, so an old save starts its first tally at the next midnight. A test runs three days and gets one line per midnight, and the same hero with every tally blocked ends with the same level, XP, gold, kills and deaths. The Record section on the Hero tab shows the running count as a Today line.

Full moon, 2026-11-12 (words only): on the evening of a real full moon, after 8 p.m. local time, the log gets one line from a set of six, for example "🌕 The moon is full, and so is the backlog." It pairs with the moon phase now drawn in the night sky (task-13). The day it last fired sits in an optional `fullMoon` field. A test runs the November 24 full moon and a plain night: one line on the first, none on the second, and blocking the line leaves the run unchanged.
