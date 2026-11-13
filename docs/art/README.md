# Art samples (phase A of the art pass)

Every picture here is drawn by code in `hooks/sprites.ts` and `hooks/sprites/*.ts`, then written as a 4x nearest-neighbour PNG by `tools/render_sprites.ts`. Nothing is a stock or generated image.

Rerun: `npx --no-install tsx tools/render_sprites.ts` (all sheets) or name a group (`crab gear catalogs monsters parts bosses pets auras scene`), `--out <dir>` to write elsewhere.

| File | What it shows |
|---|---|
| `crab-poses.png` | the hero in all 9 poses (stand, walk, attack, cast, sit, dig, mine, dead, active), bare and geared |
| `crab-poses-2x.png`, `crab-poses-1x.png` | the same at band size (2x) and at true size (1x) |
| `crab-gear.png` | 40 geared combos: hat or mask, robe, cape or wings, weapon, shield, trim colors |
| `hats.png`, `masks.png` | 48 hats and 24 masks (72 head pieces) |
| `robes.png` | 60 chest pieces: sashes, belts, aprons, plates, pauldrons and collars |
| `capes-wings.png` | 63 capes, wings and back items |
| `offhands.png`, `weapons.png` | 51 shields and off-hands, 56 claw-held weapons |
| `monster-bodies.png` | the 61 body templates |
| `monster-parts.png` | the 30 part families, 110 variants, on one plain body |
| `monster-elements.png` | 8 elements with 4 palettes each |
| `monsters.png` | 60 of the 680 named species, across bodies, elements and ranks (the colored ring is the rank) |
| `bosses.png`, `bosses-all.png` | 20 bosses large, then all 203 |
| `pets.png`, `pets-all.png` | 40 pets in evolution lines, then all 512 (192 lines, 12 elements) |
| `auras.png` | the 34 named auras (rarity, relic sites, legendary powers, ancient, primal, upgrades) on the crab |
| `auras-generated.png` | a spread slice of the 2,640 generated auras (11 shapes x 12 elements x 5 rarities x 4 motions); still frames, in the mod they move with CSS |
| `weapon-variants.png` | a spread slice of the 2,800 weapon variants (56 drawings x 10 materials x 5 edge styles) |
| `armor-variants.png` | a spread slice of the armor variants: hats and masks, robes, capes and wings, shields with plumes, gems, trims and rims |
| `scene.png` | a full band-size scene: geared crab with an aura, a pet, eight monsters |
| `readability-before-after.png` | task-17: the same 24 random full-gear combos before the crab-first rules (top) and after (bottom), at 3x and 1x on the fight scene's colors; `tools/render_readability.ts --before <old hooks>` |
| `hero-options.png` | task-18: ten hero bodies (A to J), one row each, the same 8 gear sets in attack and sit at 3x and at true size |
| `hero-options-scene.png` | task-18: one band-size fight scene (720 by 88, shown at 2x) per hero body, Knight set, same pack |
| `adventurer-options.png` | task-19: eight standard adventurer variants (V1 to V8), bare, then the same 8 gear sets in attack and sit at 3x and at true size |
| `adventurer-options-scene.png` | task-19: one band-size fight scene per variant, Knight set, same pack |
| `adventurer-random.png` | task-19: V1 and V7 with 12 seeded random looks, bare, then the same 12 with random gear, at 4x and true size |
| `hero-32bit.png` | task-20: V1 and V8 redrawn in a 32-bit style (one cell is one screen pixel at band size, about 52 px tall, 56 to 103 colors), bare and the 8 gear sets hand-built at that size, attack and sit, at 3x and true size |
| `hero-32bit-scene.png` | task-20: the band-size fight scene (720 by 88 at 2x), today's V1 above the 32-bit V1 and V8, Knight set, same pack |
| `hero-ff.png` | task-21: four original Final Fantasy era proportion studies at 32-bit (T1 tactics 4 heads 3/4 view, T2 battle sprite 3 heads side view, T3 heroic 5 heads with cloak and mane, T4 stride with wind and ponytail), bare and the 8 gear sets, attack and sit at 3x, a random-look row of 8, and true size |
| `hero-ff-scene.png` | task-21: the band-size fight scene (720 by 88 at 2x): today's live crab, the task-20 32-bit V1, then T1 to T4, Knight set, same pack |

## Crab first (task-17)

Every generated piece follows these rules, so any gear combination still reads as the orange crab at band size:
- Orange wins: a chest piece is one small region of the shell (sash, belt, apron, lower plate, pauldrons or collar, by base) plus a dark tint of the item on the shell's outline. At least 60% of the shell stays bare orange with full gear (lowest over 3,000 combos: 65.3%).
- Eyes always show: hats and masks are painted behind the eyes and the shell; no head piece changes an eye pixel. The eyes have three white cells and a pupil.
- Backs frame: capes, wings and packs stay within the shell plus 2 cells a side (x 5..24) and are tamed darker and greyer than the orange.
- One dark outline runs around the whole geared crab; legs and weapon carry their own part of it so it moves with them. The 18 px strip icon leaves it out.
- Only the hero is a crab: followers walk behind as small pet critters in their own colors.

## Hero look options (task-18)

A comparison, not a rewrite: nothing here is wired into the game. `hooks/sprites/hero-options.ts` (not imported by the game) draws ten bodies and fits the existing gear library to each. Rerun: `npx --no-install tsx tools/render_hero_options.ts [--only ABC] [--zoom 3] [--sheet|--scene] [--out dir]`; `npx --no-install tsx tools/check_hero_options.ts` measures that no gear shape lands between the legs.

| Id | Body | Notes |
|---|---|---|
| A | Flat crab, fixed | today's crab; chest pieces are a full-width collar, shoulder pauldrons or a belt across the shell, never in the bottom rows |
| B | Upright crab knight | stands on two back legs, the shell is the torso, eye stalks and a small face are the head, claws are the hands |
| C | Hermit crab | small crab; the chest slot swaps the borrowed shell (spiral, pot, teapot, helmet, skull, treasure chest, picked by the piece), hats sit on the shell |
| D | Chibi adventurer | big-headed 16-bit humanoid, crimson hair and scarf |
| E | Slime hero | blue blob, pseudopod hands, armor is a band across the body |
| F | Frog knight | upright frog, wide head, bulging eyes over the hat |
| G | Cat adventurer | orange tabby, ears poke through hats, tail |
| H | Code bot | amber robot, screen face, armor is plates |
| I | Mushroom folk | red spotted cap is the head, hats sit on the cap |
| J | Dragon whelp (wildcard) | violet baby dragon, wings are the back slot |

How the gear fits: each piece is drawn on the library's own canvas and then moved onto the body's anchors. Hats go on the head row, shields and weapons on the hands, capes and wings narrow to the body and stop at the ground line with the leg gap cut, chest drawings are resampled to the torso and clipped to it. The sit pose holds the camp rod (the library's fishing rod, with the line drawn to the ground). Capes are mostly hidden on C (behind the shell and claws).

## Standard adventurer variants (task-19)

Also not wired into the game: the same file draws eight takes on a classic adventurer with the same gear pipeline, plus a random identity (D25). Rerun: `npx --no-install tsx tools/render_hero_options.ts --adv [--only 1357] [--sheet|--scene|--random 17]`; the leg-gap check covers all eight with the 8 sets and 12 random looks in 12 random sets.

| Id | Variant | Notes |
|---|---|---|
| V1 | Chibi polished | today's D, two heads tall, with brows, ears, a nose and a narrower jaw; scarf in the accent color |
| V2 | Classic 16-bit | three heads tall, tunic in the accent color, belt and satchel strap; hats narrowed to 14 |
| V3 | Action ARPG | four heads tall, small head, pauldrons, V torso, long legs; hats resampled to 10 wide and 0.8 tall |
| V4 | Hooded wanderer | the hood keeps the face in shadow with two glowing eyes; the cloak parts at the hem so the legs show; chest pieces sit on the cloak front |
| V5 | Stocky dwarf | wide barrel body, short legs, big nose; the hair style picks the beard (full, forked, braided, short, long), drawn over the chest piece |
| V6 | Lanky elf | tall and thin; long ears are drawn in front of any helmet |
| V7 | Bold cartoon | flat colors, huge eyes, a double dark outline |
| V8 | Scarf runner (wildcard) | V1-like proportions with a bold outline and a two-tailed scarf streaming behind in the accent color |

A look is `{ skin, hair, style, eyes, detail, accent }`: 8 skin tones, 14 hair colors, 10 hair styles (spiky, swept, bob, ponytail, long, buzz, curly, topknot, mohawk, braid), 8 iris colors, 8 face details (none, freckles, scar, eyepatch, stubble, bandage, blush, warpaint) and 10 accents. `randomLook(seed)` and `randomGear(seed)` are seeded, as the hero's identity would be.

## How the numbers come out (measured by `hooks/sprites.test.ts`)

- 2,130 named species (142 base creatures x 15: plain, 8 elements, 6 mutations), 203 bosses, 512 pets in 192 evolution lines. Every name and every look is unique, and boss silhouettes are unique too.
- 2,330 distinct weapons (56 drawings x 50 variants: 10 materials x plain, runed, gilded, gemmed or flaming), counted by rect-list hash.
- 3,503 distinct armor pieces: hats and masks 1,218, robes 657 (773 before the crab-first cut), capes and wings 812, shields and off-hands 816 (each drawing plain, or with one of 4 to 6 decors in 3 colorways). Rarity color is separate and not counted.
- 2,640 distinct generated auras (shape x element x rarity x motion) plus the 34 named ones.
- Only weapon, off-hand, head, chest and back pieces are drawn on the crab (no rings, necklaces, gloves, belts, legs or boots).
- Largest monster 154 rects with its rank ring (budget 160), largest boss 296 (320), largest pet 115. The worst geared crab over 3,000 random combinations is 324 rects with its outline; a full scene SVG (crab with aura, 8 monsters, a pet) is at most 22.7 KB (budget 40 KB).
- Sprite code is about 114 KB (budget 200 KB). No image files are shipped in `hooks/`.

## Public API (all pure, no game state)

- `crabSprite({ pose, trim, head, chest, back, weapon, offhand, tool, aura })`: `head`, `chest`, `back`, `weapon`, `offhand` are `{ id, color, v }` (`v` is the variant, 0 is plain; counts in `VARIANTS` and `BACK_VARIANTS`); `aura` is a named id or `a0` to `a1979`; `tool` is `rod`, `pick` or `shovel` for camp poses.
- `lookFor(slot, itemName)`: `{ id, v, exact }` for an item name. Every base in `BASES` for weapon, offhand, head and chest has its own plain drawing; unique, set and rare names are hashed to a drawing and a variant, so two rares rarely look alike. `pieceSprite(slot, look)` draws one piece alone.
- `foeSprite(name, { rank, shiny })`, `speciesOf(name)`, `boss(name)`, `petSprite(pet)`, `PETS`, `AURAS`, `aura(spec)`.
- `draw(sprite, x, y, scale, flip)` returns SVG markup; `SPRITE_CSS` holds the motion classes the auras and pets use. Moving parts have CSS classes: `l1` `l2` (legs), `cl` `cr` (claws), `wpn`, `off`, `aura`, `orbit`, `rise`.

## 32-bit test (task-20)

A test, not wired into the game: `hooks/sprites/hero-32bit.ts` draws V1 and V8 and the 8 test sets at one cell per screen pixel; `hooks/png.ts` is a pure-TS indexed PNG encoder (deflate with fixed Huffman codes, base64) for drawing a sprite as one data URI `<image>`. Rerun: `npx --no-install tsx tools/render_hero_options.ts --b32 [--sheet] [--scene] [--measure] [--out dir]`; `--measure` prints bytes and build times for SVG paths against PNG data URIs.

How it is drawn: shapes (ellipsoids, capsules, bevelled polygons) are shaded per pixel from one light at the upper left into six-tone ramps that lean cool in the shadows and warm in the lights (skin mixes toward rose and cream instead); a darker line marks where one part covers another material; a one-pixel selective outline (the material's own darkest tone, near black on the shade side) closes the silhouette. Each pixel keeps its part, so the moving classes (`l1` `l2` `cl` `cr` `wpn` `off` and the rest) survive.

## Final Fantasy era proportions at 32-bit (task-21)
A comparison test, not wired into the game: `hooks/sprites/hero-ff.ts` builds four original heroes on the task-20 raster (`hero-32bit.ts` now exports its helpers). The body is a jointed figure: two-bone legs and arms are solved from foot and hand targets, so every pose keeps its proportions. T1 about 58 px (4 heads, 3/4 view), T2 about 50 px (3 heads, side view), T3 about 60 px (5 heads, cloak and mane), T4 about 56 px (stride, wind, ponytail). Every design is original: no character, job outfit or sprite from any game; the wizard has no hat and no shadowed face, the cleric has no red triangles. Rerun: `npx --no-install tsx tools/render_hero_options.ts --ff [--only T1T3] [--sheet] [--scene] [--measure] [--out dir]`.

## Whole-game styles (task-22)

Seven complete frames, not heroes: backdrop, hero mid-swing, a pack of 3 plus one rare foe with a name bar, a loot glint, task label, HP bars, damage numbers, and a boss frame. Same content and the same 960 by 150 pane frame as `docs/images/fight.png` in every style, so only the look changes. All art is drawn by `tools/style_mockups.ts` (not imported by the game); every direction is the SVG string the mod would emit, shot to PNG with headless Edge. The foes are phantom packages (boxes with a ghost tail) so styles compare cleanly. D1 and D2 were rejected by the owner and keep the old crab hero as history; D3 to D7 (task-23) carry one original human adventurer (short hair, no hood, blue tunic, red cape, round shield, raised sword) drawn in each style, never a crab (D29).

| File | What it shows |
|---|---|
| `styles/all-fights.png`, `styles/all-fights-1x.png` | the five open fight frames (D3 to D7) stacked, at 2x and at true size |
| `styles/hero-closeups.png` | the human hero alone from each of D3 to D7 at 4x, labeled |
| `styles/D1.png` to `styles/D7.png` | one direction each, fight frame above boss frame, at 2x |
| `styles/src/D#-fight.svg`, `D#-boss.svg` | the SVG sources |
| `styles/src/D5-filter-fight.*` | D5 again with a turbulence displacement filter over the whole scene (a measurement, not a candidate) |

D1 dark ARPG pixel, D2 glowing silhouettes, D3 terminal ASCII, D4 smooth vector cartoon, D5 painterly, D6 paper cutout storybook, D7 woodblock print (the wildcard). Rerun: `node tools/style_mockups.ts` (D3 to D7, plus the two stacked sheets and the hero closeups), `node tools/style_mockups.ts D1 D2` (the rejected two, only on purpose), `node tools/style_mockups.ts --measure` (hero head and body height), `node tools/style_mockups.ts D2 D7` (some), `node tools/style_mockups.ts --perf` (rasterize cost). Needs Edge; node 22 or newer runs the TypeScript directly.

## Pixel whole frame (task-24)

Three complete pixel-art frames in the same composition and content as task-22 and task-23, after the owner pointed at real references: hi-res pixel (Octopath Traveler, Sea of Stars) and cozy pixel (Stardew Valley, Eastward). One original human adventurer (D29: front view, both eyes, head under one fifth of height, two plain straight legs, mid-swing, no crab) is painted once from shape tables and shown in all three. Every sprite and tile is a pixel grid, embedded as an indexed PNG data URI (`hooks/png.ts`) and drawn with `image-rendering: pixelated` at a whole-number scale; only text, bars and the HD-2D light stay vector. Phantom Packages are now pixel creatures (a cardboard box with eyes, ears and a ghost tail).

| File | What it shows |
|---|---|
| `styles/P1.png` to `styles/P3.png` | one direction each, fight frame above boss frame, at 2x |
| `styles/pixel-fights.png` | the three fight frames stacked at 2x, then again at 1x |
| `styles/pixel-hero-closeups.png` | the hero alone from each direction at 4x, with head and body pixel heights |
| `styles/pixel-edge-crops.png` | one sprite edge per direction at 10x, to show crisp pixels |
| `styles/src/P#-fight.svg`, `P#-boss.svg` | the SVG sources |

P1 HD-2D (1 screen px per art px, hero 82 px tall): crisp sprites over layered, blurred, hazed backdrops with warm light shafts, sun glow, bloom, motes and a vignette. P2 cozy (2 screen px per art px, hero 41 art px): bright palette, soft dark green outlines, chunky trees, fence, bushes and flowers, parchment HUD. P3 blend: the P2 world and creatures with the P1 light and depth (blurred far and near layers, shafts, rim light).

Code is `tools/pixel_kit.ts` (painter), `pixel_hero.ts`, `pixel_foes.ts`, `pixel_world.ts` and `pixel_mockups.ts`; none is imported by the game. Rerun: `npx --no-install tsx tools/pixel_mockups.ts` (all PNGs and SVGs), `... P2` (one direction), `... --measure` (hero head and body heights), `... --perf` (rasterize ms). Needs Edge.

## Pixel frame to art rules (task-25, round 7)

The cozy pixel direction rebuilt from scratch to six art rules: one palette (Resurrect 64), one pixel scale (every art pixel is 2 by 2 band pixels, no blur, no gradients, no vector text), selective outlines, a calm bitmap-font HUD without boxes, four new monsters plus a new boss, and a three-layer backdrop with open space around the loot. The hero is an original human adventurer (D29: front view, head 7 of 37 rows, two straight legs).

| File | What it shows |
|---|---|
| `styles/R1.png`, `styles/R2.png` | V1 warm afternoon and V2 golden dusk, fight frame above boss frame, at 2x |
| `styles/round7.png` | both fight frames at 2x, then at 1x (the band size) |
| `styles/round7-closeups.png` | the hero, slime, mushroom, bat and crowned phantom at 4x, then the boss |
| `styles/src/R1-fight.svg`, `R1-boss.svg`, `R2-*.svg` | the SVG sources (7.9 to 9.5 KB each) |

Code is `tools/pixel2_mockups.ts`; the game does not import it. Rerun: `npx --no-install tsx tools/pixel2_mockups.ts` (all PNGs and SVGs, plus the Edge pixel and palette check), `... --preview` (composites only), `... --perf` (rasterize ms). Needs Edge.

## What is not here yet

Phase B wires these into `hooks/art.ts` after the owner approves the sheets: scenes, the strip, the `/quest` pane, and the mapping from the hero's items, foes and relics to looks. The pet game system is a later card.
