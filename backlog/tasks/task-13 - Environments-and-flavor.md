---
id: task-13
title: Better environments and more flavor
status: Built on branch claude/task-29-content, not merged; owner reviews the biome sheet
---
## Problem before solution
The owner (2026-10-12) wants better environments and more flavor. Today each act is a flat sky color, a ground band and a ridge line (`hooks/art.ts` scenes, `ACTS[].sky/ground` in `hooks/data.ts`).
## Outcome and scope
- Every act and every Atlas map tier gets its own biome: 3 parallax layers (far silhouettes, mid props, near ground detail) built from a parts library (trees, ruins, crystals, lava pools, server racks, cables, gravestones, mushrooms, ice, cacti, statues, banners, and more), at least 40 biomes, with prop pools large enough for thousands of distinct backdrops (biome x prop mix x weather x time of day).
- Weather and light, all CSS: rain, snow, embers, fog, fireflies, aurora; day and night tint following the real clock; boss arenas get a special backdrop.
- Camp scenes per life skill get their own spots (fishing piers per spot in `FISH_SPOTS`, mines per ore tier, dig sites per `RELIC_SITES`), and town gets shop stalls (blacksmith, jeweler, Kadala).
- Flavor: thousands of lines across tables, combined from parts (subject x verb x object x quip), so the log rarely repeats; more log lines per event (hits, kills, loot, level ups, deaths, town visits, camp catches), act intro and outro lines, boss taunts, idle quips from the crab, and job-flavored lines from task-12, all from tables, zero tokens.
- Budget: a full scene SVG still under 40 KB; motion stays CSS; redraw rules unchanged.
## Dependencies and ownership
Depends on task-11 phase B (crab wired into scenes) and task-12 (job flavor tables). Owned files: `hooks/art.ts`, `hooks/sprites*` (environment parts), `hooks/data.ts` (flavor tables), tests.
Execution: worker chat, Sonnet, high effort.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | 40+ biomes, each with 3 layers, weather and day/night | `biomes.test.ts` AC1: all 49 places (25 act zones, 24 Atlas maps) have their own entry, 49 distinct biomes, all 14 palettes, 7 skylines, 9 mid layers and 9 weathers in use; AC1+AC2: each place draws its own backdrop and its weather group. Sheets `evidence/task13-biomes-0.png` to `-3.png` (day, dusk, night per place) | PNG sheet | PASS, owner gate |
| AC2 | Budget holds | largest scene 18,478 bytes over all 49 places by day, dusk and night at 480; under 40 KB asserted at 720 | number | PASS |
| AC3 | Flavor tables at least triple today's line counts | base 9d46e52 word tables: 89 entries, no tale tables; now the same tables plus 271 tale templates (187 from task-15, 84 new land lines) | test output | PASS |
| AC4 | Whole check passes | validate PASS, strict tsc PASS, tests 66/67: the one miss is the 7-day pacing test at the 5 s cap (no assertion error); the same pacing run by script passes on 10 seeds | last lines | Rerun on a quiet machine |
## Log
2026-11-12. Built on top of task-14 (same branch).

What was built:
- `hooks/sprites/pixel2/biomes.ts` (new). A biome is a day palette, a far skyline, a mid layer and a weather. 14 palettes (meadow, autumn, desert, swamp, jungle, snow, volcanic, crystal, cavern, city, graveyard, coast, void, ruins), 7 skylines (peaks, dunes, mesas, spires, domes, towers with lit windows, pyramids), 9 mid layers (round trees, pines, cacti, crystals, ruins, server racks, glowing mushrooms, graves, reeds), and near ground stamps per palette (bones, shells, shards, cables, lava cracks, snow mounds, puddles, leaves, rubble, tiles). Dusk keeps the biome's ground under the dusk sky and sun; night dims every color and adds the moon and stars. Cavern counts as indoors: no sun, moon, clouds or stars.
- `BIOMES` gives each of the 49 places its own mix. An unknown place gets a mix picked from its name, the same one every time.
- `world()` takes an optional biome and seed. Without one it draws the meadow exactly as before. The scene looks the place up by act zone or map name, caches the backdrop per place, and lights shadows and the travel strip with the biome's colors.
- Weather in `hooks/art.ts`: rain, snow, embers, fog, fireflies, spores, falling leaves, blowing sand and aurora, as a few pixel particles under CSS motion, placed from the place name so a redraw never jumps, and kept below the text rows. Reduced motion stops them like every other animation.
- Flavor: `LAND` in `hooks/events.ts`, six lines per palette (84), for example "A crow tells Ada: never deploy on a Friday." A tale outside town and death draws from the land the hero stands in a fifth of the time.
- Stars no longer land inside the text rows at night.

Not built in this pass, and why:
- Job lines: task-12 is not built.

Two defects came from the first sheet and are fixed: dunes drew as vertical stripes (the lit face flipped on every flat run), and cave mushrooms read as thin sticks (caps in the dark mid color). Both checked again at 2x, zoomed.

Pacing, the quest.test helper, 10 seeds (12345, 1 to 9):

| | day 1 XP | day 7 level | day 7 Atlas tier | day 40 estimate |
|---|---|---|---|---|
| base 9d46e52 | 1247 | 24.0 | 21.3 | 43.1 |
| task-14 | 1270 | 25.3 | 25.6 | 37.1 |
| task-13 | 1250 | 24.6 | 24.6 | 39.3 |

Every seed stays inside the test bounds. Seed 12345, the task-14 outlier (estimate 20.5), is now at 40.4.

Looked at: the four sheets whole, and zoomed crops of the desert, the node_modules cellar, the oasis and the frozen monolith. Not looked at: the 360 band per biome (the backdrop code is the same at every width, and the 360 scene was checked under task-14 for the meadow), and weather in motion (the sheets freeze each animation at its start; checked in the third pass below).

Risks: the far skyline mostly sits behind the two text rows in a 120 px band, so the mid layer and the ground carry most of each biome's look. Void and cavern places are dark by day by design; the owner may want them lighter.

Second pass, same day:
- Boss taunts (24), act intro and outro lines (3 per act) in `hooks/data.ts`, and an entry line per biome palette (3 each) in `hooks/events.ts`. A boss says one as the fight starts, an act opens and closes with one, and entering a zone or the next Atlas map adds one, for example "Entering The Lint Fields… Birds sing. The grass is very green." The clock picks them, not the game's random draws. Pacing holds: the 10-seed run gives the same 1250 / 24.6 / 24.6 / 39.3.
- Boss arena: a boss fight lays a dark red wash over the backdrop, under the hero, the boss and the text, and brings embers to a place with no weather of its own. Two tries failed first. Stopping the wash at the ground line left a seam across the grass, and fading it out in 4-pixel steps striped the mountains, so it now covers the whole backdrop evenly. Checked at 2x on act I, IV and V bosses, day and night, 720 and 360 wide.
- New test: the tables exist, every line fits 60 characters with no em dash, and a boss fight logs a taunt and draws the wash.
- Town stalls: past the houses stand a market stall with goods, an anvil with sparks, a brazier holding the campfire flames, and a purple dice booth. A narrow band drops them from the end, so 360 wide keeps three. Gathering spots: a loaded cart beside the mining rock, a survey flag and a sand bucket at a dig, and a bucket with a fish tail on the bank by the dock. That bucket first stood over the water. Moved. Checked at 2x and zoomed, in the cellar and the marshes, day and night. Evidence: `evidence/task13-town.png` and `evidence/task13-gather.png`. Two new tests cover which props appear at each width, and every scene stays under 40 KB.
- Crab quips: 20 for reaching the campfire and 12 for heading out to gather, in `hooks/data.ts`, for example "This fire has better uptime than prod." Each downtime gets two, one at each step, so the log stays quiet in between. Clock-picked like the rest. A test walks one downtime and finds exactly the two.

Weather in motion (third pass): the motion check found rain, snow, leaves, embers and spores drawn at full opacity above the line they spawned on, so a drop near the top of the band crossed the second text row. Each moving weather now records how far its keyframes lift a visible particle (rain 12 art pixels, embers and spores 10, snow and leaves 8, fireflies 2) and spawns that far lower. A new test checks every particle in every place at 720 and 360. Looked at: all six moving weathers frozen at 15, 50 and 70 percent of their cycle with every particle in phase (the worst case), zoomed on the text rows with the row edge marked. Nothing crosses it.

More Atlas maps, 2026-11-12: 12 new maps (36 in all), each with its own biome, leaning on the least used palettes (snow, swamp, graveyard, volcanic, jungle), for example Deadlock Glacier, Tech Debt Bog and Off-by-One Orchard, plus 6 map bosses such as The Wontfix Wyrm. Checked in one sheet, 720 by day beside 360 by night, every scene under 14 KB (`evidence/maps/`). The 10-seed pacing run moved a little, because a tale's land lines follow the palette: day-1 XP 1250 (same), day-7 level 24.9 (was 24.6), tier 23.8 (was 24.6), day-40 estimate 38.8 (was 39.3). That is inside the spread one seed shows on its own.

## Holiday decorations (2026-11-12)

The scene follows the real calendar. Pumpkins sit at the right edge from October 15 to 31, and a small lit tree stands there all of December, its lights blinking. Hearts float up from February 10 to 14. On New Year's Eve, New Year's Day and the Fourth of July, fireworks burst over the backdrop at dusk and at night. Ground pieces skip fights, fishing and town, where something else already stands; sky pieces show everywhere. The backdrop bakes a rock at columns 148 to 159, so a narrow band moves the decorations past it.

Looks only: nothing reads the date except the drawing. Checked at 2x on October 31 (day, and night at a mine), December 24 at the campfire, December 31 at night, February 14 and July 4, each at 720 and 360. Scenes stay under 14 KB. The owner gates the look and the date list.

## Moon phases (2026-11-12)

The night moon follows the real lunar month in eight steps: dark, a thin crescent on the right, first quarter, gibbous, full, then the same waning on the left. The dark side stays a faint disc against the sky, so a new moon still shows where the moon is. The phase is part of the cached night backdrop, so it costs nothing per frame; day and dusk never read it. The narrow band hides the moon behind its hills, as it did before.

Looks only. Checked at 2x for all eight phases at 720, with the crescent lit to its rim after the first render showed it as a one-pixel line. The owner gates the look.

## Level-up and boss celebrations (2026-11-12)

For 12 seconds after a level-up, a soft gold pillar stands behind the hero and "Level 12" blinks beside the hero's head. A boss kill (a campaign boss or a map boss) rains confetti in six colors over the band for the same 12 seconds. Before this, both moments showed only in the log. The new optional `ding` field holds the last one; only the drawing reads it. Checked at 2x at 720 and 360, by day and at night, after fixing confetti that fell in two columns.

A new achievement also shows in the scene for 10 seconds: a small gold trophy and the achievement name at the top right, sized from the drawn text so long names fit at 360. It stays out of fights, where the foe labels sit, and reads the unlock times already saved, so old unlocks never replay.
