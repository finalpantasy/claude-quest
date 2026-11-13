---
id: task-24
title: Pixel art whole frame - HD-2D, cozy pixel and a blend
status: Ready
---
## Problem before solution
Six look rounds are rejected. task-23 (D3 to D7 with a human hero) got "eww" for all five styles (owner, 2026-10-20). Diagnosis change: the rounds were the coordinator guessing at styles. Asked to point at real looks, the owner picked two references: hi-res pixel like Octopath Traveler or Sea of Stars, and cozy pixel like Stardew Valley or Eastward. So the medium is pixel art. Earlier pixel rounds failed on the hero (too chibi, knees, side view) and on the frame (D1: small coarse sprites on a flat dark strip), not on pixels as such.
## Hero rule (D29, verbatim, do not reinterpret)
The owner: "Brother... i said not a crab." The hero is not a crab: an original humanoid adventurer, facing the camera, not chibi, straight legs, not knock-kneed.
- Front view: face straight on, both eyes visible.
- Not chibi: the head is at most one fifth of the hero's full height.
- Straight legs: two plain straight legs, feet planted slightly apart and turned a little out; no bend, no zigzag knee, no squat.
- Original: no copied character from any reference game. One character design shared by all three directions.
- Mid-swing: weapon arm raised or swinging, weapon under the header bar.
- Zero crab shapes anywhere in any frame (no pincers, claws, eye stalks, round shell bodies, crab seals or loot).
## The references (study the feel, copy nothing)
Look at real screenshots of these games before drawing (web search is fine, study only, do not save or commit them):
- HD-2D (Octopath Traveler, Sea of Stars, Triangle Strategy): crisp pixel sprites in a world with depth: layered parallax backdrops, soft light shafts and glow, bloom on magic and loot, the far layers softened or hazed, warm and cool light contrast, small particle motes.
- Cozy pixel (Stardew Valley, Eastward): warm saturated palette, soft dark outlines (not pure black), chunky readable tiles (grass tufts, flowers, fences, trees), friendly expressive monsters, a sunny outdoor feel.
## Outcome and scope
Three directions, each a complete frame in the same composition and content as task-22 and task-23 (same text, numbers, positions: act line, hero HP bar, task label, pack of 4 foes, one rare foe with a name bar, loot glint "Signet of Signing", hits 18, 17, 142!, xp 63 percent; plus one boss frame "Mephisto the Monorepo"):
- P1. HD-2D: pixel sprites at true pixel scale over a layered, lit, hazy backdrop.
- P2. Cozy pixel: Stardew or Eastward warmth, outlined chunky pixel world and creatures.
- P3. Blend: the cozy palette and creatures with the HD-2D light and depth (the owner picked both).
Pixel rules: every pixel sprite and tile is drawn on a pixel grid and shown with crisp edges (no smoothing, no sub-pixel scaling; one art pixel equals a whole number of screen pixels at the band's 1x). Text and bars may stay vector for legibility. Monsters may be redesigned as pixel creatures (keep the "Phantom Package" idea: a box with a ghost tail) so they match the world. Use the task-20 method where it helps: `hooks/png.ts` (pure-TS PNG to data URI) for sprites and backdrop layers inside the SVG; measure bytes against the 40 KB per scene budget and say what it would take if a direction goes over.
Output: `docs/art/styles/P1.png` to `P3.png` (fight above boss, 2x), `docs/art/styles/pixel-fights.png` (three fight frames stacked at 1x and 2x), `docs/art/styles/pixel-hero-closeups.png` (the hero alone per direction at 4x, labeled), SVG sources in `docs/art/styles/src/`. Code in `tools/style_mockups.ts` (new P functions, D1 to D7 untouched) or a new `tools/pixel_mockups.ts`; not imported by the game.
Non-goals: wiring into the game, gear libraries, final art.
## Dependencies and ownership
task-23 merged (bd95e1e). Owned files: `tools/style_mockups.ts` or `tools/pixel_mockups.ts`, `docs/art/styles/`, `docs/art/README.md`, this card.
Execution: worker chat, Sonnet 5.5, high effort. Taste work: open every render, compare it side by side with the reference screenshots, and iterate until each direction is a fair best effort. Put the comparison notes in the Log.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Three pixel directions, same content, fight and boss | P1.png to P3.png | files | Pass (technical): P1 to P3.png, fight and boss |
| AC2 | Hero meets D29 in every direction | pixel-hero-closeups.png plus head and body pixel heights in the Log | file, numbers | Pass (technical): head 15/82, 8/41, 8/41 |
| AC3 | Zero crab shapes; crisp pixels (no blurred sprite edges) | worker opened every PNG and lists what it checked; zoom crop of one sprite edge per direction | Log, crops | Pass (technical): no crab found; 10x edge crops are hard-edged |
| AC4 | Side by side for the owner | pixel-fights.png | file | Pass (technical): pixel-fights.png at 2x and 1x |
| AC5 | Size, build and raster time per direction, budget fit | table in the Log | numbers | Pass: table in Log; P1 fight 44.6 KB over, P2 and P3 fit |
| AC6 | Game untouched; whole check (known CPU-bound timeouts under load: say so) | `git diff --stat` of hooks and types, check last lines | output | Hooks and types diff empty; check FAIL on 6 CPU-bound 5 s timeouts only |
## Human gates
The coordinator opens every PNG and rejects any crab or rule break before the owner sees anything. The owner picks. Nothing is approved until the owner says so.
## Recovery and return condition
Own branch cut from the coordinator branch. Commit on it; do not merge into main and do not push. Return with the PNG paths, the table, a one-line verdict per direction against its reference, and the worker's pick.

## Log

### Worker log (task-24-pixel, Sonnet 5.5)
Outputs: `docs/art/styles/P1.png` to `P3.png`, `pixel-fights.png`, `pixel-hero-closeups.png`, `pixel-edge-crops.png`, SVGs in `docs/art/styles/src/`. Code: `tools/pixel_kit.ts`, `pixel_hero.ts`, `pixel_foes.ts`, `pixel_world.ts`, `pixel_mockups.ts` (not imported by the game; hooks and types untouched). Rerun: `npx --no-install tsx tools/pixel_mockups.ts`.

**How it is built.** Every shape is a mask in design units sampled at pixel centers, so one drawing rasterizes at 1 screen px per art px (P1, hero 82 px) or at half resolution drawn at 2 px per art px (P2 and P3, hero 41 art px). Shading is a ray march toward the light inside each part, mapped to a 6-tone ramp, then a selective outline pass (neighbor color pulled toward a dark green or blue ink, never black) and a rim-light pass. The world is five layers (far, mid, ground, props, near), each an indexed PNG via `hooks/png.ts` shown with `image-rendering: pixelated`. The HD-2D effects are vector overlays only: gaussian blur on far, mid and near layers (depth of field), sun glow, light shafts, warm grade, vignette, motes, bloom. Sprites are never blurred or filtered.

**Reference comparison notes** (screenshots studied on the web, nothing saved).
- Octopath Traveler and Sea of Stars: what carries the look is contrast between a crisp small sprite and a soft, warm, hazy world with a clear sun side and a cool shadow side, plus glow on bright things. P1 and P3 copy that mechanism: sharp sprites, blurred far trees and foreground grass, shafts and glow from the upper right, warm rim on the trees. Where P1 falls short of the reference: the sky and ground stay fairly flat compared with the saturated, layered color of Octopath, and the near-grass blur at the bottom reads as smudges rather than shapes.
- Stardew Valley and Eastward: warm saturated greens, a soft dark outline, chunky readable tiles (round trees, fence, bush with flowers, dirt path with pebbles), friendly monsters. P2 matches the palette, outline and tile vocabulary best. Where it falls short: the scene is evenly lit and a little busy at the tree line, and the path is plain next to the reference's paving and dirt variation.
- Phantom Package as a pixel creature (cardboard box, pointed ears, eyes, jagged mouth, ghost tail) reads at 1x in all three. The rare one gets a crown and red eyes, the boss is a larger box with horns.

**D29 hero numbers (counted from painted part pixels, outline excluded).**

| Direction | Head px | Body px | Head / body | Screen px per art px | Canvas | Colors | Hero PNG |
|---|---|---|---|---|---|---|---|
| P1 HD-2D | 15 | 82 | 0.183 | 1 | 120x99 | 148 | 1.90 KB |
| P2 Cozy | 8 | 41 | 0.195 | 2 | 60x50 | 94 | 0.94 KB |
| P3 Blend | 8 | 41 | 0.195 | 2 | 60x50 | 135 | 1.08 KB |

All under the one fifth limit. The hero faces front, both eyes are visible, two plain straight legs with boots slightly apart and turned out, sword arm raised mid-swing with a stepped arc trail, round shield on the near arm, short hair, blue tunic, red cape. One design for all three; P3 adds only a rim tint.

**Crab check.** Opened and inspected: P1.png, P2.png, P3.png (fight and boss rows), pixel-fights.png (2x and 1x), pixel-hero-closeups.png (4x), pixel-edge-crops.png (10x), and the loot, burst, signet and foe sprites in the preview sheets while building. Looked for pincers, claws, eye stalks, round shell bodies, crab-shaped seals or loot, sideways crab stances. Found none: the hero is a standing human, the foes are boxes with ears and a ragged ghost tail, the loot is a gold signet ring with a blue stone, the hit bursts are 8-point stars, the rare foe's crown is a plain three-point crown. The boss horns curve up and out from a box, not from a shell.

**Crisp pixels.** `pixel-edge-crops.png` shows the sword and fist edge at 10x in each direction: hard square pixel steps, no anti-aliasing on sprites. In P1 and P3 the backdrop behind the sprite is intentionally soft (blurred layers), the sprite edge itself stays hard.

**Size, build and raster time** (SVG bytes are the string the mod would emit; budget is 40 KB per scene).

| Direction | Fight SVG | Boss SVG | Cold build (world, sprites, svg) | Boss frame with caches | Raster per 1920x300 draw | Layer colors (far, mid, ground, props, near) | Fits 40 KB |
|---|---|---|---|---|---|---|---|
| P1 HD-2D | 44.6 KB | 38.3 KB | 1280 ms | 19 ms | 23.3 ms fight, 21.4 ms boss | 124, 38, 66, 37, 10 | boss yes, fight no |
| P2 Cozy | 31.2 KB | 26.8 KB | 1112 ms | 5 ms | 1.8 ms fight, 1.4 ms boss | 84, 164, 28, 95 | yes |
| P3 Blend | 37.5 KB | 33.1 KB | 880 ms | 7 ms | 25.0 ms fight, 23.1 ms boss | 108, 213, 80, 127, 10 | yes |

P1 fight is 4.6 KB over budget (the fight frame carries four foes, so more sprite PNG than the boss frame). What it would take: the PNG share is 24.7 KB with the fixed-Huffman encoder in `hooks/png.ts` and 20.1 KB with a dynamic-Huffman deflate (measured with node zlib level 9), which brings the P1 fight SVG to 38.4 KB, P2 to 28.1 KB, P3 to 34.5 KB. So the fix is a better deflate in the PNG encoder (not changed here), or cutting P1's far layer palette (124 colors) and one near layer. Raster cost is dominated by the SVG blur filters: P1 and P3 cost about 23 to 25 ms per redraw, P2 (no filters) 1.8 ms. Redraw only happens on task change, so that is acceptable, but P2 is the cheapest by 13x. Build time is one-off per scene and cached.

**Verdict per direction against its reference.**
- P1 HD-2D vs Octopath and Sea of Stars: closest on mechanism (crisp sprites, depth of field, light shafts, glow). Strong depth, but color is a bit muted and the ground is flat; fight frame is over budget until the encoder improves.
- P2 Cozy vs Stardew and Eastward: closest on warmth and tile vocabulary; cleanest, cheapest, fits budget; evenly lit so it has the least depth.
- P3 Blend vs both: cozy world and creatures with HD-2D light; the most polished overall mix, warm sun side, blurred near grass, fits budget at 37.5 KB; costs raster time like P1.

**Worker's pick: P3 (Blend).** It keeps the cozy readability the owner liked in Stardew and Eastward and adds the light and depth that make HD-2D feel special, and its fight frame fits the 40 KB budget. Runner-up P2 if raster cost or simplicity matters more than depth. Nothing is approved until the owner says so.

**Check (AC6).** `python tools/game_check.py run --root .` ran at BelowNormal and returned FAIL: validate PASS (1 of 1); tests 38 pass, 6 fail, and all 6 failures are the 5000 ms per-test timeout (pacing simulation, aura timeout, 2,000 weapons hash, sprite and scene budgets, crab shell coverage, crab eye pixel), the known CPU-bound timeouts under load, none an assertion failure. `verify` therefore returns 3 NOT_RUN (no passing receipt). This card touched no game code: `git diff --stat -- hooks types` is empty.
