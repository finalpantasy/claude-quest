---
id: task-20
title: 32-bit hero test - PlayStation-era look at band size, with size and speed costs
status: Verified
---
## Problem before solution
The owner (2026-10-15), after the task-19 adventurer sheet: "How about 32-bit?" Today every sprite is a coarse grid (the hero is about 28 cells tall) drawn as one SVG rect per cell. A 32-bit look (PlayStation and Saturn era: Final Fantasy Tactics or Symphony of the Night sprite sizes, used only as a size and fidelity reference, no copying) needs about 48 to 60 real pixels of height, 30+ colors and smooth shading. Drawn as rects, that would break the 40 KB scene budget.
Facts: band scene is 720 by 88 (full mode); strip mode is 18 px tall. Adventurer variants V1 (polished chibi) and V8 (scarf runner) and the 8 gear sets live in `hooks/sprites/hero-options.ts`; renders in `tools/render_hero_options.ts`; a pure-TS PNG writer already exists in `tools/` from task-11 (`tools/render_sprites.ts` writes PNGs without a browser). The mod runs with no DOM and no Node, so any runtime image must be built in pure TypeScript.
## Outcome and scope
A test, not a rebuild:
1. Draw V1 and V8 in a 32-bit style at about 48 to 60 px tall (1 screen pixel per cell at band size), 30+ colors, soft shading, a clean dark outline, readable face. Fit the same 8 gear sets (Knight, Wizard, King, Rogue, Samurai, Pirate, Dev, Cleric) at that resolution, hand-built or upscaled-and-refined from the current parts; whatever looks best.
2. Rendering method, measured both ways: (a) SVG rects with row-run merging; (b) a pure-TS PNG encoder (deflate allowed, no dependencies) producing a data URI inside an SVG `<image>`. For each: bytes per hero sprite, bytes for a full fight scene (hero plus 4 monsters, monsters can stay at today's style), and time to build one scene in the engine's runtime (bun or tsx timing is fine).
3. Sheets: `docs/art/samples/hero-32bit.png` (V1 and V8, bare plus 8 gear sets, attack and sit, at 1x and 3x) and `docs/art/samples/hero-32bit-scene.png` (band-size fight scene: today's V1 chibi above, 32-bit V1 and V8 below, same pack).
4. A short note in the card Log: the size and speed table, which method is viable, and an honest estimate of what it would take to bring the whole gear library (2,000+ weapons, 3,500 armor pieces, auras) to 32-bit with the parts approach.
Non-goals: wiring into the game, refitting the library, monster art.
## Dependencies and ownership
Depends on task-19 (merged 5373b1b). Owned files: `hooks/sprites/hero-32bit.ts` (new, not imported by the game), a new `hooks/png.ts` only if method (b) is tried (not imported by the game yet), `tools/render_hero_options.ts`, `docs/art/samples/hero-32bit*.png`, `docs/art/README.md`.
Execution: worker chat, Sonnet, high effort (taste work plus measurement; look at every render and iterate).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | V1 and V8 in 32-bit style with 8 gear sets, attack and sit, 1x and 3x | sheet | PNG | PASS: `docs/art/samples/hero-32bit.png` (36 sprites, 56 to 103 colors each); look is the owner's call |
| AC2 | Side-by-side band-size scene, today vs 32-bit | sheet | PNG | PASS: `docs/art/samples/hero-32bit-scene.png` |
| AC3 | Size and speed measured for both methods | table in the card Log | numbers | PASS: table in the Log |
| AC4 | Library cost estimate | note in the card Log | text | PASS: estimate in the Log |
| AC5 | Game untouched; whole check passes (if the PC is under heavy load and only the known CPU-bound 5 s timeouts fail, say so) | `git diff`, check last lines | output | PASS: only new files plus `tools/render_hero_options.ts` and `docs/art/README.md`; check last lines in the Log |
## Human gates
The owner judges the look and decides between today's resolution and 32-bit before the hero pick becomes a decision.
## Recovery and return condition
Own branch. Return with the two PNGs, the table and the estimate.
## Log
- 2026-10-15 worker (Opus 5.5, the session's model; the card planned Sonnet high). Branch `claude/cranky-bhabha-87dfdb`, reset to dd0d47c first.
- Built: `hooks/sprites/hero-32bit.ts` (not imported by the game): a raster of shaded shapes (ellipsoids, capsules, bevelled polygons) lit from the upper left into hue-shifted six-tone ramps (skin mixes toward rose and cream), a darker line where one part covers another material, a one-pixel selective outline. V1 and V8 at one cell per screen pixel (72 by 72 canvas, hero about 52 px tall, feet on row 68), 3/4 face looking right, spiky hair with locks and a shine band, V1 scarf knot, V8 coat and streaming scarf. Poses: attack (weapon raised, off-hand in front), sit (cross-legged with the camp rod). The 8 sets are hand-built at this size from shared helpers (blade, pole, dome helmet, cape, wings, shield shapes), not upscaled: 39 pieces. `hooks/png.ts` (not imported): indexed PNG, deflate with LZ77 and fixed Huffman codes, base64, an `<image>` helper. `tools/render_hero_options.ts --b32 [--sheet] [--scene] [--measure]`.
- Iterations from the renders: skin first went orange-red in shadow (HSL walk), now mixes toward rose; hair first read as a bowl helmet, now a cap with a temple hairline, swept locks and crown spikes; eyes looked sleepy and brows worried, now lash line with an outer flick and brows low at the inner ends; wings first rose up like black hair behind the head, now swept out and down from the shoulders; the sit pose read as standing short, now the shins cross in front of the body; the kabuto and white wings were softened.
- Look (worker view, the owner judges): at 1x it reads as a real 32-bit sprite next to today's 16-bit cells; faces, gear materials (steel, gold, cloth, lacquer) and silhouettes stay readable. Monsters at today's resolution now look coarse beside the hero.
- Size and speed. Hero sprites: the 18 per hero on the sheet (bare and 8 sets, attack and sit). Scene: the real `sceneSvg` 720 by 88 fight (4 monsters) with the crab element swapped for the 32-bit hero. Times: tsx on node v26 at BelowNormal priority, average of 60 builds after warmup (bun gave the same range, noisier).

| Method | Hero sprite bytes | 720x88 fight scene | Build one scene |
|---|---|---|---|
| Today: crab, SVG paths | 4.3 KB | 14.2 KB | 1.0 to 1.4 ms |
| (a) SVG paths (merged rects, one path per color) | V1 avg 10.7 KB, V8 avg 11.4 KB, max 13.5 KB | 21.2 / 22.4 KB | 2.6 / 3.0 ms (draw 1.7 to 2.1, encode 1.1) |
| (b) PNG data URI, one `<image>` | V1 avg 1.8 KB, V8 avg 1.9 KB, max 2.1 KB | 11.9 / 12.0 KB | 1.7 / 1.9 ms (draw 1.3 to 1.8, encode 0.2 to 0.3) |
| (b) PNG split into moving parts (one `<image>` per CSS class) | V1 avg 4.6 KB, V8 avg 4.8 KB, max 5.1 KB | 14.8 / 15.0 KB | 2.3 / 3.7 ms (draw 1.7 to 2.4, encode 1.3) |

- Worst-case budget scene (the AC5 budget test: pack of 8, 3 followers, minions, set gear): today 32.4 KB, of it the crab 6.4 KB. Swapping in (a) at its max gives about 39.5 KB, right at the 40 KB limit; (b) split gives about 31 KB.
- PNG detail: file avg 1,245 B (V1) and 1,347 B (V8), 56 to 103 colors. Our fixed-Huffman image data avg 911 and 1,006 B against zlib level 9 at 795 and 865 B (about 15% bigger, roughly 150 B a sprite); dynamic Huffman is not worth it yet.
- Checked in Chromium (the in-app browser): the real scene with the PNG hero draws pixel-identical to the SVG-paths hero (0 of 8,800 pixels differ at 1x) and stays crisp inline at 3x with `image-rendering:pixelated`. Not tried in the desktop band itself.
- Verdict: (b) split into moving parts is viable: a smaller scene than today, CSS motion kept, about 2 to 4 ms per build only on task change (cache by pose and gear to make redraws free). (a) works for one scene but costs 7 to 9 KB more per hero and sits at the 40 KB limit in the worst case.
- Library cost estimate (parts approach). The library is 302 base drawings: 72 head (48 hats, 24 masks), 60 chest, 63 back, 51 off-hand, 56 weapons. The 2,800 weapon and 3,500 armor variants and 2,640 auras come from materials, edges, trims, gems and colors applied to those drawings, so the work scales with drawings, not variants. This test built 39 pieces with about 10 shared helpers; with the helpers in place a piece is 3 to 15 lines plus a look at 3x and 1x. Estimate: about 8 worker cards for the 302 drawings (about 40 a card: head 2, chest 2, back 2, weapons 1 to 2, off-hands 1), 1 card to port the variant system (materials, edge styles, gems, trims, rims) onto ramps and part masks, 1 to 2 cards for the remaining body poses (walk, cast, dig, mine, dead, active) and the 10 hair styles and 8 face details at this size, 1 card for auras (they are CSS vector overlays and can stay vector, retuned to the finer hero), 1 card to wire, port the uniqueness, readability and budget tests and re-render the README images. About 12 to 14 Sonnet-high cards, one worker at a time, so roughly 2 to 3 weeks at the current pace. Not counted: monsters (61 bodies, 110 part variants, 680 species), 203 bosses and 512 pets stay coarse; a matching pass would be another 8 to 10 cards. Auto-upscaling today's parts was not tried: a 2x upscale keeps 2-pixel cells and reads as 16-bit, not 32-bit.
- Check: `python tools/game_check.py run --root .` last line `PASS: <run id>` (validate 1/1, tests 44/44, strict tsc 1/1, includes the two new hooks files); `verify` last line `PASS: receipt matches current inputs and recorded artifacts`. Rerun after the final docs edit, numbers in the report.
- Processes: one bun, tsx or python run at a time at BelowNormal, each under a minute; a short local http server for the Chromium check was stopped after use.
