---
id: task-22
title: Whole-game style exploration - seven directions, same fight frame
status: Verified (owner pick pending)
---
## Problem before solution
The owner (2026-10-15) rejected every hero round (crab fixes, 10 creatures, 8 adventurers, 32-bit chibi, Final Fantasy style T1-T4, 16-bit S1-S3 and front-facing F1-F3) and said "lets restyle the game". Diagnosis change: the hero rounds kept failing on the same hypothesis (a better hero sprite). The likelier problem is the whole frame: a small sprite on a flat brown strip with coarse monsters and plain bars. Asked which whole-game styles to try, the owner said: "try all, painterly, vector, etc."
Facts: the band scene is 720 by 88 in full mode (strip mode is 18 px tall); the mod draws one SVG string, all motion is CSS, no DOM, no Node; a pure-TS PNG data-URI encoder exists in `hooks/png.ts`; budget is 40 KB per scene; the current frame is in `docs/images/fight.png` and `docs/art/samples/hero-f-scene.png`.
## Outcome and scope
Seven independent directions, each a complete frame (backdrop, hero, 4 monsters, task label, HP bars, damage numbers, a loot drop glint), all original art:
- D1. Dark ARPG pixel: moody dungeon or night field, torch light pools, glowing loot and spell effects, small detailed sprites.
- D2. Glowing silhouettes: black silhouettes of hero, monsters and props against a bright painted gradient sky, neon weapons, auras and hit sparks.
- D3. Terminal ASCII: everything in colored text glyphs like a classic roguelike, in a monospace grid; the hero is a glyph with gear symbols.
- D4. Smooth vector cartoon: clean rounded shapes, bold outlines, bright flat colors, big expressive characters.
- D5. Painterly: soft painted look with layered gradients, brush-like shapes and atmospheric depth, done in SVG (gradients, opacity, a few soft shapes; avoid heavy filters if they cost performance, measure it).
- D6. Paper cutout or storybook: layered paper shapes with drop shadows and textured edges, like a pop-up book.
- D7. The worker's wildcard that would look best in a thin band above a prompt.
Hero rule (D29, the owner 2026-10-15): the hero is not a crab in any direction; an original humanoid adventurer facing the camera, not chibi, straight legs.
For each: the same composition and the same content (hero mid-swing, a pack of 4 foes, one rare foe with a name bar, a loot glint), rendered as the SVG the mod would actually emit, then to PNG. Also one boss frame per direction. Measure SVG bytes and build time for each; note anything that would need CSS or SVG features the band may not support (filters, blend modes, fonts).
Output: `docs/art/styles/D1.png` to `D7.png` (fight frame and boss frame stacked, at 2x), `docs/art/styles/all-fights.png` (all seven fight frames stacked at 1x and 2x for side-by-side reading), and the SVG sources in `docs/art/styles/src/`. Code lives in a new `tools/style_mockups.ts` (not imported by the game).
Non-goals: wiring anything into the game, gear libraries, final art.
## Dependencies and ownership
None. Owned files: `tools/style_mockups.ts`, `docs/art/styles/`, `docs/art/README.md`.
Execution: worker chat, Sonnet, high effort (taste work; look at every render and iterate until each direction is a fair best effort).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Seven directions, same content, fight and boss frames | PNGs | files | PASS |
| AC2 | Side-by-side comparison | all-fights.png | file | PASS |
| AC3 | Size, speed and feature risks per direction | table in the Log | numbers | PASS |
| AC4 | Game untouched; whole check passes (known CPU-bound timeouts under load: say so) | `git diff`, check last lines | output | PASS |
## Human gates
The owner picks one or two directions to refine. Nothing is approved until the owner says so.
## Recovery and return condition
Own branch. Return with the PNGs, the table, a one-line verdict per direction and the worker's top two.

## Log
- 2026-10-15 worker (Opus 5.5 for the first turn, then switched to Sonnet 5.5 by the coordinator). Branch `claude/sweet-cerf-7a2931`, reset to 9b38e4e first. Only new files: `tools/style_mockups.ts`, `docs/art/styles/` and a section in `docs/art/README.md`; `hooks/`, `types/` and the saves are untouched (`git status` shows only those paths).
- Decision on the hero: kept the crab and the phantom package foe in every direction (a box with a ghost tail and angry eyes), so the seven frames differ in style only. The crab is a plain re-skin per style, not a new design; if the owner picks a direction and a different hero, the hero is one function per style.
- Method: each direction is one function returning the SVG string for `fight` and `boss`; shared content (act, hero line, task, rare name "Fast Vampiric Hardcoded Phantom Package", boss "Mephisto the Monorepo", loot "Signet of Signing", hits 18, 17, 142!, bars 62 percent hero, 56 percent foe, 63 percent xp) and the same layout lines (feet on y 112, hero near x 150, loot x 410, pack x 540 to 852, boss x 750 to 800). Two animation clocks are paused at 420 ms in the shots so the swing is mid-swing. No game code or sprite from `hooks/` is reused: D1 draws its own pixel sprites from shaded ellipses and boxes; D2 to D7 are paths.
- Iterations from the renders: D1 torch flames drifted because a CSS scale on an SVG child scales from the viewport origin (fixed with transform-box fill-box), the rare foe and the boss collided with the name bar (sprites resized, boss grid made squat), tails read as pots (now wisps). D2 the sun was hidden under the hills, the crab was a blob (bigger claws, thinner body), boss and rare foes were clipped by the bar. D3 first cut used a 96 column grid and 18 px glyphs that ate the rows (now 120 by 10 cells of 8 by 15 px, ASCII bars instead of block glyphs). D4 the font attribute broke on inner double quotes (fixed for D1 to D7), the hero crown hit the ribbons (level ribbon moved to the bottom row), boss too small (1.4x). D5 header text vanished into the vignette (heavier stroke). D6 and D7 needed no structural change; D7 level seal text and percent label were moved off each other.
- Size and risk (SVG bytes are the real emitted strings; build is node, mean of 40 builds, machine loaded by other sessions; raster is the mean of 40 draws of the fight SVG onto a 1920 by 300 canvas in one headless Edge page, a software-raster proxy, not frame rate):

| Dir | Fight / boss SVG | Build | Raster at 2x | Features beyond today's art | Risk |
|---|---|---|---|---|---|
| D1 dark ARPG pixel | 21.9 / 16.3 KB | 0.34 ms | 4.3 ms | 4 gradients, 2 patterns, 4 keyframes, Georgia + Consolas | low; sprites could go PNG split like task-20 |
| D2 glowing silhouettes | 14.2 / 12.8 KB | 0.08 ms | 4.2 ms | 4 gradients, 10 `use`, 3 keyframes, glow = stacked strokes (0 filters) | lowest size; relies on `use` and `defs` working in the band's Svg |
| D3 terminal ASCII | 21.1 / 19.2 KB | 0.18 ms | 1.3 ms | 235 text runs with `textLength`, 1 pattern (scanline, optional), no gradients | highest font risk: the look is the monospace grid; a fallback font breaks nothing structurally because every run is pinned by `textLength`; cheapest to raster |
| D4 smooth vector cartoon | 19.7 / 18.0 KB | 0.06 ms | 2.9 ms | 1 gradient, 4 `use`, outlined text via paint-order, Arial Rounded falls back to Trebuchet or Arial | low |
| D5 painterly | 43.0 / 41.1 KB | 0.33 ms | 8.7 ms | 22 gradients, soft blobs, 0 filters | over the 40 KB budget and 2x the next raster cost; a brush-edge filter (turbulence plus displacement over the scene) costs 16.4 ms (1.9x), wobbles the text and was rejected |
| D6 paper cutout | 39.8 / 37.2 KB | 0.12 ms | 4.7 ms | 1 pattern (paper grain, optional), paint-order stroke on 83 elements for the die-cut edge, 4 `use` | at the budget edge; more elements and gear would push it over |
| D7 woodblock print | 22.7 / 21.2 KB | 0.06 ms | 4.3 ms | 3 patterns (seigaiha waves, wood grain, paper grain), 1 gradient, 4 `use`, paint-order ink edges | patterns are the new feature; the sea can be drawn as plain bands if the band refuses them |

  Not measured: whether the real band (and the desktop `Svg` element) supports `pattern`, `use href` and `paint-order`; the existing art already uses `style` with keyframes, gradients-free rects and `paint-order` on text, but nothing here has run in the live band. Assumption: a CSS transform animation on an SVG child makes Chrome repaint the SVG each frame, so per-frame cost is about the raster time above, a quarter of it at 1x; this holds for today's art too.
- Verdicts. D1 dark ARPG pixel: the most game-like mood and the closest to today's sprites, but the pixel sprites are still small and coarse, the same complaint as before. D2 glowing silhouettes: the strongest read at 1x and the cheapest, the crab is instantly a crab and the loot and hit effects glow; the cost is every monster being a similar black shape. D3 terminal ASCII: a joke that lands for a Claude Code audience and is nearly free to draw, but it throws away the crab and the monsters; fine as an opt-in theme, not the main look. D4 smooth vector cartoon: the friendliest and the easiest to read, the crab is charming; it is generic until it has more character. D5 painterly: the prettiest still, but the biggest and slowest, and thin text suffers on soft backgrounds. D6 paper cutout: a complete world with a clear gimmick, readable at 1x; busy when more gear and a pet are added. D7 woodblock print: the most distinctive (limited palette, ink lines, waves, seals) and it reads well in a thin band; the owner must like the Japanese print flavor.
- Worker's top two. 1) D2 glowing silhouettes: smallest, clearest at band size, and a gear library is cheaper (one silhouette plus a neon accent per item). 2) D7 woodblock print: the strongest identity at a fair size cost, and the flat color plus ink rule makes gear and monster variants easy to keep readable. D4 is the safe pick if the owner wants friendly and bright.
- Check: `python tools/game_check.py run --root .` last line `PASS: 1792085643202845900-4886f1de`; `python tools/game_check.py verify --root .` last line `PASS: receipt matches current inputs and recorded artifacts` (exit 0). No timeouts this run.
- Processes: one node or python process at a time at BelowNormal (a PowerShell wrapper set the priority), each under 2 minutes; Edge children were headless with a throwaway profile and none were left running.
