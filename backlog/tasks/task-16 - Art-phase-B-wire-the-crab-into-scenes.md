---
id: task-16
title: Art phase B - wire the crab, gear, auras, monsters and bosses into the real scenes
status: Verified
---
## Problem before solution
The owner approved the task-11 sample sheets (2026-10-13: "This is perfect. Go for it."). The parts library exists in `hooks/sprites.ts` and `hooks/sprites/` but the game still draws the old human hero and the 6 old monster shapes from `hooks/art.ts`. v0.2.0 ships with the crab (D18), so the scenes, the strip, the /quest pane and the README images must all show it.
## Outcome and scope
Follow the phase B plan in the task-11 card Log:
1. In `hooks/art.ts` replace `heroSprite` with `crabSprite` using `lookFor(slot, item.name)` and `itemColor`. Map rarity to a generated aura; relic sets, legendary powers (`POWERS` ids), ancient and primal tiers, and the upgrade level (`Item.plus` when task-10 lands; treat missing as 0) to aura ids. Visible slots only: weapon, off-hand, head, chest, back (D23). There is no back slot in the save yet: derive the back look from the neck item name hash, as the plan says.
2. Replace the old monster drawing with `foeSprite(name, { rank, shiny })` and `boss(name)`; stand sprites on the ground with `sprite.foot`.
3. Merge `SPRITE_CSS` into the scene CSS; keep the part classes (`l1 l2 cl cr wpn off aura`) driven by the existing walk, attack and swing animations, and keep every task-7 live effect (active aura, one-shots, damage numbers, crit) working on the crab.
4. Camp poses from the task kind: `sit` with rod for fishing, `dig`, `mine`; `dead` (ghost) on death; town uses stand.
5. Sizes: u = 3 for crab, monsters, bosses and pets, trimmed to the band height; the one-line strip stays readable.
6. Polish the known rough spots from the sheet review: weapons and wings large enough to read next to the crab at band size; make the jackal, wolf and boar bodies clearly different; give weapon materials a shape or edge difference, not only color.
7. Re-render the README images with the crab (`tools/render_scenes.ts`: fight, boss, atlas, fishing, mining, town, death, strip and fight.gif) and look at each one.
Non-goals: pets following the crab (a later pet card), new game rules, a real back item slot, environments (task-13).
## Dependencies and ownership
Depends on task-11 (merged f4441c6). task-3 is running and owns `hooks/game.ts` and `hooks/quest.test.tsx`: read them only. Owned files: `hooks/art.ts`, `hooks/sprites.ts`, `hooks/sprites/*`, `hooks/sprites.test.ts`, a new `hooks/art.test.ts` for scene tests, `tools/render_scenes.ts`, `tools/render_sprites.ts`, `docs/images/`, `docs/art/`. Touch `hooks/register.tsx` only if a render call signature must change, and say so in the log.
Execution: worker chat, Sonnet, high effort (taste-sensitive; it must look at its renders and iterate).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Scenes draw the crab with its equipped visible gear and auras | test: a hero with known gear renders the expected piece ids and aura ids in the SVG | test output | PASS: art.test.ts 'AC1' x2 (piece ids and aura ids in the SVG, aura priority) |
| AC2 | Monsters and bosses use the new library | test: scene SVG for a fight and a boss contains the species and boss sprite markers | test output | PASS: art.test.ts 'AC2' (pack and boss sprites byte-for-byte in the scene) |
| AC3 | Camp and death poses | test: fishing, digging, mining and dead heroes render the matching pose | test output | PASS: art.test.ts 'AC3' (sit, dig, mine, dead, stand, walk) |
| AC4 | Live effects still work | the task-7 tests still pass on the crab | test output | PASS: art.test.ts 'AC4' plus the 7 task-7 live tests in quest.test.tsx |
| AC5 | Budget holds | largest full scene SVG under 40 KB with 8 monsters and a fully geared crab | number | PASS: art.test.ts 'AC5', largest scene under 40 KB (about 20 KB measured) |
| AC6 | README images show the crab and look good | re-rendered PNGs and GIF in `docs/images/`, each viewed; notes on fixes | file list and notes | PASS technical: 9 images and the GIF re-rendered and viewed; owner look pending |
| AC7 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines | PASS: validate 1/1, tests 32/32, tsc 1/1; verify exit 0 |
## Human gates
The owner looks at the re-rendered images and the live band after install.
## Recovery and return condition
Own branch. Return when AC1-AC7 have evidence, or at the 400k-token checkpoint with a handoff. Never put the owner's name in fixtures or images (use a made-up hero name).

## Log
- Branch claude/task-16-art-phase-b (worktree `.claude/worktrees/task-16-art-b`), based on main 5f2c241. `hooks/register.tsx` untouched; `sceneSvg` and `stripSvg` keep their signatures. `hooks/game.ts` and `hooks/quest.test.tsx` only read.
- `hooks/art.ts`: `heroLook` (class trim, weapon, off-hand, head, chest from the item name via `lookFor`, back from a hash of the neck item name, one aura), `auraFor` (priority: primal, +15, legendary power id, +10, set with 2 or more pieces, ancient, +7, finished relic site, then a soft rarity glow whose element comes from the hero name; `Item.plus` is read if present, else 0), `speciesKey` (maps "Undocumented Transitive Dep", "A B, Null Pointer" and "Foo the Null Pointer" to the bestiary creature), `foeSprite` and `boss` on the ground by `sprite.foot`, `SPRITE_CSS` merged. Sprite scale is 3, trimmed so a hatted crab fits between the header text and the ground (about 2 at band height 88).
- Poses: fish `sit` with the rod, dig, mine, death `dead` (ghost floats beside a tombstone), town `stand`, travel `walk`, a fight `stand`, `attack` while Claude works, `active` while travelling and working. Camp tools replace weapon and shield in the claws. Followers are small crabs in their own trim colors; minions stay the old bones.
- The strip icon is the crab's face and gear cropped to 16 px.
- Polish: weapons are drawn 2x wide and (when short) 2x tall on a taller canvas (`TallCells`, so raised claws do not clip them); materials now change the blade shape (wide, serrated, tipped), not only color; pick and shovel 2x; wings half again as tall; jackal (lean, tall ears), wolf (ruff and fangs) and boar (squat, tusks) redrawn; the death halo sits just above the eyes. Wolf was trimmed to keep every monster under the 160 rect budget (max now 154).
- Rejected: a 2x vertical wing stretch (looked like antlers); orbit, rays and flame shapes for the plain rarity glow (buried the hat in stills). Legendary and set auras keep those shapes.
- Images re-rendered with `tools/render_scenes.ts` (fight, boss, atlas, fishing, mining, town, death, strip, fight.gif) and the sample sheets in `docs/art/samples/` with `tools/render_sprites.ts`. Hero in the images is the seeded demo hero "Brindle".
- Evidence: `python tools/game_check.py run --root .` last line `PASS: 1791854921868998500-5635ab97`; `verify` last line `PASS: receipt matches current inputs and recorded artifacts`.
- Risks: (1) the generated gear is dense, so the orange crab is mostly hidden under a robe and wings in stills (by design of the approved sheets, but the owner may want robes lower in `putChest`); (2) bosses are limited by the life bar height, so at band size they are about the crab's height, not much bigger; (3) `Item.plus` is read through a cast until task-10 adds it; (4) the back item is a hash of the neck item name until a back slot exists; (5) a shiny pack is a 1 in 64 hash of name, level and hp (no save field).
- Not done (non-goals): pets following the crab, real back slot, environments.
