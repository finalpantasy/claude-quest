---
id: task-11
title: Procedural art parts library and sample sheet (phase A of the art pass)
status: Review
---
## Problem before solution
The owner (2026-10-12) wants far more visual variety: hundreds of distinct monsters and hundreds of visible gear looks on the hero (weapons, hats, helms, robes, capes, shields), plus auras, including relic auras, with "more, more, more" variation and depth, but without bloating the mod.
Facts: `hooks/art.ts` (27 KB) draws the hero as a 12 by 16 pixel sprite with gear tinted by rarity, 5 weapon glyphs by class, and 6 monster shapes on a 10 by 10 grid colored by name. Every motion is CSS; the mod redraws only on task or live-work changes. Item bases per slot are in `BASES` (`hooks/data.ts`); relic sites in `RELIC_SITES`; sets in `SETS`; legendary powers in `POWERS`; monster names in `ACTS[].foes`, `ADJ`, `ELITE`, `MAP_BOSSES`.
## Outcome and scope
Phase A builds a NEW module `hooks/sprites.ts` (parts library, pure functions returning SVG rect strings) and a render script that produces a sample sheet. It does not wire anything into the scenes yet (phase B, after the owner approves the sheet). Updated 2026-10-12 with the owner's larger targets (D15, D16, D17).
- THE HERO IS A LITTLE ORANGE CRAB (D16): a small pixel crab in the warm orange of Claude's brand, our own pixel drawing (do not copy official artwork pixel for pixel), with claws that hold weapons and shields, eye stalks that take hats and masks, a shell that takes robes and capes. Poses: stand, walk, attack, cast, sit (fishing), dig, mine, dead (ghost), active aura. Class shows through color trims and the weapon type. No human body.
- Visible hero gear, each piece fitted to the crab (gloves, boots, belts and rings stay invisible except as tints; full armor-set looks are not needed):
  - 50+ hats and masks (hoods, helms, crowns, wizard and witch hats, circlets, horns, halos, skull masks, plague mask, kabuto, tricorn, antlers, crowns of thorns, and more);
  - 50+ robes and shell coverings (robes, tabards, plate, chainmail, leather, bone armor, mantles with pauldrons, scale, cloth wraps, and more);
  - 50+ capes and wings (capes, tattered capes, mantles, angel, demon, bone, bat, butterfly, crystal and flame wings, banners, quivers, and more);
  - 50+ shields and off-hands (round, kite, tower, buckler, spiked, skull, rune, crystal shields, orbs, tomes, lanterns, totems, and more);
  - 50+ weapons held in a claw (swords, axes, maces, hammers, spears, staves, wands, bows, crossbows, scythes, daggers, katanas, flails, whips, tridents, and more);
  - every `BASES` entry for those slots maps to one of these shapes; rarity colors; ancient shimmer, primal flame, and upgrade glow tiers at +7, +10, +15 (task-10 calls them).
- Auras, all cheap CSS: rarity aura, relic auras (one per relic site in `RELIC_SITES`), legendary power auras, ancient, primal, upgrade tiers. Per-set auras are optional (the owner was unsure; skip if they cost budget).
- Monsters, built deterministically from the monster's name:
  - 50+ body templates and 25+ add-on part families with several variants each;
  - many palettes: per act, elemental variants (fire, frost, poison, void, lightning, holy, shadow, nature), rare color swaps (shiny), and rank visuals (magic, rare, unique, goblin) as eye glow, outline and aura;
  - 50+ distinct BOSSES, larger sprites with unique silhouettes (act bosses in `ACTS[].boss`, `MAP_BOSSES`, plus new ones), each with its own aura;
  - a naming table that yields 500+ named species (species base x variant), stable looks.
- Pets (D17), Pokemon-style but original (no Pokemon names, designs or likenesses): 200+ cute creatures in evolution lines (for example about 70 lines of 2 to 3 stages), each with an element type, a small sprite that follows the crab, and a stable name. Art only in this card; the pet game system is a later card.
- Sample sheet: `tools/render_sprites.*` renders to PNG with headless Edge or ffmpeg (no installs), 4x nearest-neighbour: the crab in every pose plus 40 gear combos, 60 monsters across bodies, elements and ranks, 20 bosses, 40 pets across lines and stages, every aura type. Output in `docs/art/samples/` with a short `docs/art/README.md` index.
Budget (still lean): `hooks/sprites.ts` under 200 KB (split into `hooks/sprites/*.ts` modules if that reads better); any normal sprite under 160 rects, a boss under 320; a full scene SVG with 8 monsters, a pet and a fully geared crab under 40 KB; no image files shipped in `hooks/`.
Non-goals: wiring into scenes (phase B), the pet game system, game rules, sound.
Raised targets (the owner, 2026-10-12, second round), met through combinations of parts (base shape x variant parts x materials x palettes), each combination visibly distinct at band size:
- 1,000+ distinct weapons (about 60 base weapon families, each with blade or head, guard, grip and pommel variants and materials);
- 1,000+ distinct pieces across hats and masks, robes and shell coverings, capes and wings, shields;
- 1,000+ distinct auras (base aura shapes x element x rarity x motion pattern), including relic and legendary auras;
- 700+ named monster species (the earlier 500 plus 200 more unique ones) and 100+ unique bosses.
Third round (the owner: thousands and thousands at every layer), stretch targets reached by richer part pools, same budgets: 2,000+ weapons, 2,000+ armor pieces, 2,000+ auras, 2,000+ monster species, 200+ unique bosses, 500+ pets. If a budget would break, stop at the largest count that fits and report it.
The sample sheet shows a random slice of each so the owner can judge variety; tests count distinct rect-list hashes per category.
## Dependencies and ownership
Depends on nothing. Owned files: `hooks/sprites.ts` (new), `tools/render_sprites.*`, `docs/art/`, new tests in `hooks/sprites.test.ts`. Read `hooks/art.ts` and `hooks/data.ts` only (task-10 and task-9 own them now). Uses types from `types/index.d.ts` read only; if a new type is needed, declare it inside `sprites.ts`.
Execution: worker chat, Sonnet, high effort (large, taste-sensitive generation; it must look at its own renders and iterate).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | 700+ distinct named monsters, 100+ bosses, 200+ pets, 1,000+ weapons, 1,000+ armor pieces, 1,000+ auras | test: generate every species, boss and pet; assert unique names and unique rect-list hashes | test output | PASS (third round): 2,130 species, 203 bosses (unique looks and silhouettes), 512 pets in 192 lines; 2,330 weapons, 3,619 armor pieces, 2,640 generated auras, all by rect-list hash (`hooks/sprites.test.ts`) |
| AC2 | Part counts meet the minimums above | test enumerates templates and part families | test output | PASS: 61 bodies, 30 part families (110 variants), 72 head pieces, 60 robes, 63 capes and wings, 51 off-hands, 56 weapon drawings with 50 variants each, 34 named auras plus 1,980 generated, 9 poses |
| AC3 | Every BASES entry for weapon, offhand, head and chest maps to a visible shape on the crab; 50+ shapes per visible slot | test over all bases | test output | PASS: every BASES entry for weapon, offhand, head and chest resolves to its own drawing (test over all bases); all registries well formed |
| AC4 | Budgets hold | test: largest sprite rect count, full scene SVG size; file size of sprites.ts | numbers | PASS: largest monster 154 rects with rank ring (limit 160), boss 296 (320), pet 115; geared crab at most 342 rects over 3,000 random combinations; full scene SVG at most 22.7 KB (40 KB); sprite code about 120 KB (200 KB); no images in hooks/ |
| AC5 | Sample sheet exists and looks good | PNGs in `docs/art/samples/`; the worker views each one and fixes clipping, mud, unreadable silhouettes before returning | file list and notes | Sheets in `docs/art/samples/` (23 PNGs, index in `docs/art/README.md`), including slices of the combinations; each viewed and fixed. Awaits the owner's look |
| AC6 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines | PASS: `run` PASS and `verify` PASS (validate 1/1, tests 24/24, typecheck clean) |
## Human gates
The owner reviews the sample sheet (the crab, gear, monsters, bosses, pets) before phase B wires anything into the scenes.
## Recovery and return condition
Own branch. Return with the sheet when AC1-AC6 have evidence, or at the 400k-token checkpoint with a handoff.

## Log
- Built `hooks/sprites.ts` (barrel) and `hooks/sprites/` (core, shape language, crab, gear, variants, bodies, parts, species, bosses, pets, auras), `tools/sheet.ts` and `tools/render_sprites.ts` (own PNG writer, no browser), `hooks/sprites.test.ts`, `docs/art/`.
- Creatures use a small drawing language (ellipses, rects, lines, triangles mirrored on a grid, then auto outline and shading); pieces and auras are made by combining: a drawing x a variant (material, edge style, plume, gem, trim, rim) x a colorway. Rarity color is a separate tint and is not counted as variety.
- Raised targets (second round) merged from main and met: 2,330 weapons, 3,619 armor pieces, 1,980 auras, 710 species, 103 bosses.
- Third round met inside the same budgets: species 15 variants per base (plain, 8 elements, 6 mutations) = 2,130; bosses 103 named plus 100 from title x domain = 203; pets 192 lines = 512; auras 4 motions = 2,640. Only weapon, off-hand, head, chest and back are drawn (D23); the crab's own claws and legs are its body.
- Design choices to review: the crab is drawn front on, 30 by 28 pixels; hats sit above the eyes, masks cover them, robes cover only the middle of the shell so the hero stays orange; weapons are thin at 1x, readable at 2x and up. Jobs need no per-job art (a trim color and a favourite weapon family are enough).
- Known rough spots for a polish pass if the owner wants: some weapons and wings are small against the crab; the jackal, wolf and boar bodies look alike; auras look sparse in a still frame (they animate in the mod); pet kinds (cat, dog, rodent) are close at 10 to 14 pixels; weapon material variants differ mostly in color at 1x.
- Phase B wiring plan: (1) in `art.ts` replace `heroSprite` with `crabSprite` using `lookFor(slot, item.name)` (id and v) and `itemColor`; map relic sets, legendary powers (`POWERS` ids), ancient and primal (tier) and upgrade level to aura ids, with a generated aura for the rarity glow; back slot from the neck item name hash until a back slot exists; (2) replace `foeSprite` with `foeSprite(name, { rank, shiny })` and `boss(name)`; stand sprites on the ground with `sprite.foot`; (3) merge `SPRITE_CSS` into the scene CSS and keep the part classes (`l1 l2 cl cr wpn off aura`) driven by the existing walk, attack and swing animations; (4) add camp poses (`sit` with rod, `dig`, `mine`) and `dead` from the task kind; (5) sizes: u = 3 for crab, monsters, bosses and pets, trimmed to the band height; (6) pets follow the crab later via `petSprite` (a pet card owns the game system); (7) re-render the README images with the crab before the push (D18).
