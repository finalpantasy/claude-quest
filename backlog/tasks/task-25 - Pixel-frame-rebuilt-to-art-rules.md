---
id: task-25
title: Pixel frame rebuilt to art rules - fix what made rounds 1 to 6 ugly
status: Verified (coordinator PNG review and owner judgment pending; whole check hit CPU-bound timeouts only)
---
## Problem before solution
Seven look rounds are rejected. task-24 (P1 HD-2D, P2 cozy pixel, P3 blend, built from the owner's own references Octopath Traveler and Stardew Valley) got "no can you make it not ugly af" (owner, 2026-10-20). Offered a concept-first route or an artist asset pack, the owner chose: "code drawn".
Diagnosis (coordinator, from the task-22 to task-24 renders):
1. Things that never changed across rounds: the cardboard-box ghost monsters (four near-identical clones), big boxed text labels in every corner, a huge damage number, a long rare-foe name in a large font. They were held fixed so styles could be compared, so no round ever fixed them.
2. Amateur pixel craft: mixed pixel scales in one frame (hero at 2x, backdrop at 1x), blur over pixel layers (muddy "mixels"), vector text and gradients on top of pixel art, noisy grass and tree clusters, no curated palette.
3. Clutter: every element competes; no negative space; the eye has nowhere to land.
## Hero rule (D29, verbatim, do not reinterpret)
The owner: "Brother... i said not a crab." The hero is not a crab: an original humanoid adventurer, facing the camera, not chibi, straight legs, not knock-kneed.
- Front view, both eyes visible. Head at most one fifth of full height. Two straight legs, feet planted slightly apart. Mid-swing, weapon under the top edge. Original design.
- Zero crab shapes anywhere in any frame.
## Art rules (all must hold; the Log shows how each was checked)
1. One curated palette for the whole frame: pick one public, free-to-use pixel palette (for example Resurrect 64, Endesga 32 or Sweetie 16, name it in the Log) and use only its colors for all art and UI. Hue-shifted ramps (shadows cooler, lights warmer), no pure black, no pure white except sparkles.
2. One pixel scale: every art pixel is the same whole number of screen pixels everywhere in the frame (hero, foes, backdrop, UI frames, text). No sub-pixel scaling, no smoothing, no blur, no gradients over pixel art; depth comes from palette (cooler, lighter, less contrast in the distance), not from blur.
3. Pixel craft: clean clusters (no single stray pixels, no noise textures), selective outlines (dark colored outline outside, lighter inside where light hits), hand anti-aliasing on curves only, no pillow shading, dithering only in the sky if at all.
4. Calm HUD: a small pixel font drawn from a bitmap glyph table in the code (no system fonts), no boxed labels. Act line small at top left; task label small at bottom left; thin hero HP bar over the hero; thin foe bars; the rare foe gets one short name line; damage numbers small (about the height of a foe's eye row); XP as a thin strip along the bottom edge. Text must stay readable at the band's 1x.
5. New monsters: replace the box ghosts with four distinct original fantasy creatures that read at a glance (for example a slime, a bat, a mushroom, a goblin; your call, none crab-like), each with its own silhouette and palette ramp; the rare elite is one of them with a crown or glow and a name like "Fast Vampiric Phantom". The boss is a large original creature, not a box.
6. Composition with negative space: one clear ground line, a simple backdrop with three depth layers at most, a few well-made props instead of many noisy ones, the hero and the pack as the focal points, the loot glint clearly visible between them.
## Outcome and scope
One direction (cozy pixel with warm HD-2D light, the worker's pick from task-24), built twice from scratch in a new `tools/pixel2_mockups.ts` (reuse `hooks/png.ts`; do not reuse the task-24 drawings): V1 warm afternoon and V2 golden dusk, each as fight and boss frames with the task-22 content (texts and numbers may shrink and move per rule 4).
Output: `docs/art/styles/R1.png` and `R2.png` (fight above boss, at 2x), `docs/art/styles/round7.png` (both fights at 2x and at 1x), `docs/art/styles/round7-closeups.png` (hero and the four foes alone at 4x), sources in `docs/art/styles/src/`.
Self-review loop (required): after each render, put it next to a real screenshot of Stardew Valley and of Octopath Traveler at the same pixel scale (study only, save nothing) and write down the three biggest differences in quality; fix them; repeat at least three times. Log each round's three differences.
Non-goals: wiring into the game, gear libraries.
## Dependencies and ownership
task-24 merged. Owned files: `tools/pixel2_mockups.ts` (new), `docs/art/styles/`, `docs/art/README.md`, this card.
Execution: worker chat on Opus 5.5, high effort. Reason for Opus: art direction is the whole task and seven Sonnet rounds were rejected on quality.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | V1 and V2, fight and boss frames | R1.png, R2.png | files | PASS: `docs/art/styles/R1.png`, `R2.png` (1920x600, fight above boss), sources in `styles/src/R1-*.svg`, `R2-*.svg` |
| AC2 | Hero meets D29; zero crab shapes | round7-closeups.png, head and body pixel heights | file, numbers | PASS: head 7 of 37 rows with outline (0.189), 6 of 35 without (0.171); front view, two eyes, two straight 4 px legs 1 px apart; no crab shapes in any sprite (Log) |
| AC3 | Art rules 1 to 6 each hold | one Log line per rule with how it was checked (palette name and a color count from the PNG, scale check, font, HUD sizes) | Log | PASS: Log "Rule checks" |
| AC4 | Three self-review rounds against the references | Log | text | PASS: six rounds logged |
| AC5 | Size and speed against the 40 KB scene budget | table | numbers | PASS: 7.9 to 9.5 KB per frame, 0.6 to 0.8 ms raster (Log table) |
| AC6 | Game untouched; whole check (known CPU-bound timeouts under load: say so) | `git diff --stat` of hooks and types, check last lines | output | PASS for "game untouched", check FAIL on 2 known timeouts: see Log "Whole check" |
## Human gates
The coordinator opens every PNG and rejects any crab, rule break or visible defect before the owner sees anything. The owner judges.
## Recovery and return condition
Own branch cut from the coordinator branch. Commit on it; do not merge into main and do not push. Return with PNG paths, the table, the rule checks and an honest one-line verdict.

## Log
### 2026-10-20, worker (task-25)
Built `tools/pixel2_mockups.ts` from scratch (reuses only `hooks/png.ts` for indexed PNG and `tools/sheet.ts` for the RGBA sheet writer; no task-24 drawing code). Frame: 480 by 75 art pixels, every art pixel 2 by 2 screen pixels (the 960 by 150 band). Sprites are hand-authored ASCII maps with a selective auto-outline; motion is two-state CSS with `step-end`, so nothing ever sits between pixels. Rerun: `npx --no-install tsx tools/pixel2_mockups.ts` (all deliverables and checks), `--preview` (composites to a temp dir), `--perf` (raster ms). Needs Edge.

Outputs: `docs/art/styles/R1.png` (V1 warm afternoon), `R2.png` (V2 golden dusk), fight above boss at 2x; `round7.png` (both fights at 2x, then at 1x); `round7-closeups.png` (hero, slime, mushroom, bat, crowned phantom, then the boss, at 4x); sources `styles/src/R1-fight.svg`, `R1-boss.svg`, `R2-fight.svg`, `R2-boss.svg`.

Rule checks (AC3):
1. Palette: Resurrect 64 (Kerrie Lake, free, lospec.com/palette-list/resurrect-64). The script checks every named color against the 64 at load, and reads back the Edge renders: R1 and R2 each use 50 colors (frames 46/45 and 46/43), outside Resurrect 64: none. Shadows go cooler (navy, grape, pine), lights warmer (straw, cream, skin). No pure black (darkest is #2e222f); #ffffff only in the loot glint and hit spark centers (the V1 cloud tops were white until the last round, now peach).
2. One pixel scale: Edge (device scale 2) rendered each SVG pair and every one of 1,152,000 image pixels per file equals the node composite drawn 4 by 4 (100.000% for R1 and R2). So every art pixel is exactly 2 by 2 band pixels, no smoothing, no blur, no gradient, no vector text. The only dither is one checker row at each sky band seam.
3. Pixel craft: outlines are ink below and right, the part's own dark ramp color above and left (selective); a despeckle pass removes lone pixels before outlining; hand-placed tufts, pebbles and blade marks instead of noise; curves anti-aliased by hand on the boss horns and the shield only.
4. HUD: bitmap font from the `GLYPHS` table, 5 rows tall with a 1 px drop shadow, no boxes. Act line at top left, task at bottom left, "LV 14 REFACTOR PALADIN 63%" at bottom right. Bars 3 rows tall: hero 14 px, pack foes 12 px, rare 24 px, boss bar under one name line. The rare gets one name line ("FAST VAMPIRIC PHANTOM"). Damage numbers are the 5-row font (a foe's eye row is 2 to 3 rows, so a little taller than asked, kept for 1x legibility). XP is a 1 px gold strip on the bottom row. Readable at 1x in `round7.png`; the thin "1" in "17" is the weakest glyph at 1x.
5. Monsters: slime (green dome), red-capped mushroom walker, purple bat with spread wings, crowned teal phantom (the rare, red eyes, wisp tail); four silhouettes and four ramps. Boss "Mephisto the Monorepo": a 50 by 58 horned demon sorcerer in a robe with staff, raised flame and gold trim. No box, no crab, no claws or side legs anywhere.
6. Composition: three depth layers (mountains, tree line, ground) under a flat sky; props are one framing tree on the left, one rock and a few tufts and flowers. Hero left third, pack right third, the loot ring and glint alone on the path between them; the middle third of the frame is open.

D29 (AC2): front view, both eyes visible, head 7 of 37 rows with outline (0.189), 6 of 35 without (0.171), so under one fifth. Two straight 4 px legs with a 1 px gap, boots planted, sword raised mid-swing with the tip inside the top edge, round shield, red cape. Original design. Crab check of every sprite in `round7-closeups.png`: none.

Self-review rounds (AC4), each render put beside Stardew Valley and Octopath Traveler screenshots at the same pixel scale (study only, nothing saved):
- Round 1: (a) flat depth, hills and trees one value, the tree line identical bumps (Octopath separates layers by value and temperature, Stardew uses clustered 4-tone masses); (b) the boss amateur, heart-shaped horns, blank red head, flat triangle robe; (c) a full-width orange path was the loudest thing in the frame, and the hero had thin legs and a short torso. Fixed: lit-face cool mountains, darker tree line, muted sand path, boss redraw, 4 px legs.
- Round 2: (a) monsters 12 to 14 px against Stardew's 16 px and up; (b) foliage read as ring-lit bubbles, pale pines read as tents; (c) the ground was three flat stripes with ruler edges, the dusk sun hidden. Fixed: foes redrawn at 15 to 22 px, scalloped clumps, pines removed, bladed edges, tree shadow pool, sun raised.
- Round 3: (a) the boss still plain (stick arm, cone robe, small head); (b) the dusk rim light read as a yellow sticker outline; (c) no ground texture against Stardew's hand-made blade marks. Fixed: boss rebuilt with staff, bell sleeve, pauldrons, bigger head; subtle apricot rim on the sun side only; sparse blade-mark stamps; slime eyes.
- Round 4: (a) the dusk ground muddy olive-grey; (b) the hero HP bar crossed the sword arm, floating foes cast boxy shadows; (c) mountains read as paper triangles. Fixed: warm path and near grass, bar moved, rounded shadows, peak tips; damage numbers moved off the bars, a cloud moved off the rare name, the boss HUD moved left of the boss.
- Round 5: (a) the tree line still a flat wall; (b) a ruler-straight lit meadow stripe; (c) the V glyph read as U ("UAMPIRIC", "LU 14"). Fixed: crown size variance and gaps, bladed meadow edge, a 5-wide V.
- Round 6 (final read): (a) pure white cloud tops broke rule 1; fixed with peach. (b) The thin "1" makes "17" look like "?7" at 1x; left as is. (c) Still behind both references: no animation frames beyond two states, and the backdrop is generated shapes, not hand-placed tiles, so it is cleaner but plainer than Stardew.

Size and speed (AC5), budget 40 KB per scene:

| Frame | SVG | Colors | Raster in Edge (1920 by 300 canvas, mean of 40) |
|---|---|---|---|
| R1 fight (V1) | 9.3 KB | 46 | 0.81 ms |
| R1 boss (V1) | 7.9 KB | 45 | 0.68 ms |
| R2 fight (V2) | 9.5 KB | 46 | 0.69 ms |
| R2 boss (V2) | 8.1 KB | 43 | 0.61 ms |

Fight layers as PNG: world 2.7 to 2.9 KB, HUD 1.4 KB, sprites 0.1 to 0.45 KB each. Build: all four frames 198 ms cold, one frame 1.0 ms with the sprite and world caches warm.

Verdict: a clean, consistent cozy pixel frame that meets all six rules and D29; the boss and foes now read as creatures. It is plainer than Stardew (generated backdrop, few props) and is the owner's call on looks.

Whole check (AC6): `git diff --stat HEAD -- hooks types` is empty. `python tools/game_check.py run --root .` at BelowNormal: validate PASS; tests 42 pass, 2 fail, both "timed out after 5000 ms" (pacing at 11.9 s, task-17 AC1 at 6.2 s), the known CPU-bound timeouts, in game code this card does not touch. `verify` then returns 3 NOT_RUN (no passing receipt). Typecheck did not run because tests stopped the run first.

### 2026-10-20, worker, coordinator fix (digits)
The coordinator asked for numbers that read at 1x ("17" read as "?7"). Changes:
- The 1 is now a 3 wide stem with a flag and a foot, and the 3 has a flat top and bottom.
- The floating damage numbers ("18", "17", "142!") get a full 1 px ink outline and a 2 px digit gap. The cause was contrast as well as shape: in V2 the skin-colored "17" sat on the apricot sky band and its top half vanished.
- Fixed HUD lines keep the down-only drop shadow.

Checked with a new `--glyphs` mode, which draws 0 to 9, "!", "%" and the damage numbers over the sky and mountains of both variants at 1x and 2x, then re-rendered R1, R2, round7 and the closeups.

Results: Edge still equals the composite on every pixel (100.000%, 50 colors, none outside Resurrect 64). The fight SVGs are now 9.4 and 9.6 KB, the boss SVGs 8.0 and 8.2 KB.
