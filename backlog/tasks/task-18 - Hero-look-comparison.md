---
id: task-18
title: Hero look comparison - crab options and non-crab heroes
status: Verified
---
## Problem before solution
The owner (2026-10-15) on the task-17 sheet: some crabs look like a little bar is centered between the legs ("like you're centering his little penis"), "that's not fun", and asked whether to move away from the crab. Cause: task-17 chest pieces include an apron and lower plate drawn as a small vertical strip at the bottom center of the shell, between the legs. Deeper issue: a flat front-on crab (30 by 28 cells) has no torso or head, so armor has nowhere natural to sit.
## Outcome and scope
A comparison sheet, not a rewrite. Render the same 8 gear sets (pick strong silhouettes: horned helm plus greatsword, wizard hat plus staff plus cape, crown plus shield, hood plus daggers, and 4 random) on every hero body below at band size (1x) and 3x, plus each in attack and sit poses:
- A. Flat crab, fixed: today's crab with no bottom-center chest shapes. Chest becomes horizontal only: shoulder pauldrons, collar, full-width belt, or a shell pattern or paint job across the whole shell.
- B. Upright crab knight: the crab stands on its back legs; the shell becomes a torso, eye stalks and a small face become the head, claws are hands. Helmets sit on the head, chest armor on the torso, capes from the shoulders. Still orange, still clearly a crab.
- C. Hermit crab: a small orange crab whose borrowed shell is the "armor"; the chest slot swaps the shell (spiral shell, pot, teapot, helmet, skull, treasure chest), hats sit on top of the shell.
The owner (2026-10-15): "it doesn't have to be a crab, try everything". Add non-crab heroes, all original designs (no existing mascots or characters), each with a clear head, torso and hands so the 5 visible slots sit naturally, and a strong signature color:
- D. Chibi adventurer: a tiny big-headed humanoid knight (classic 16-bit RPG proportions).
- E. Slime hero: a round blob that wears hats and holds weapons in little pseudopods; armor as a tinted band.
- F. Frog knight: an upright frog with a wide head for helmets.
- G. Cat adventurer: an upright cat, ears poking through helmets.
- H. Little robot: a boxy code bot (screen face), fits the coding theme; armor as plates.
- I. Mushroom or sprout folk: a walking mushroom whose cap is the hat slot.
- J. One wildcard of the worker's choice that reads especially well at band size.
Every option gets the same 8 gear sets, the same poses and its own scene, so the owner compares like for like. A non-crab pick also solves the D-OPEN-3 Steam mascot question.
Also render one fight scene per option at the real band size so the owner sees it in context. Output: `docs/art/samples/hero-options.png` (one row per option A to J, labelled) and `docs/art/samples/hero-options-scene.png`. Do not wire anything into the game; build the bodies in a scratch module or `hooks/sprites/hero-options.ts` that the game does not import.
Non-goals: changing the live crab, regenerating the gear library, game rules.
## Dependencies and ownership
Depends on task-17 (merged). Owned files: `hooks/sprites/hero-options.ts` (new, not imported by the game), `tools/render_sprites.ts`, `docs/art/samples/hero-options*.png`, `docs/art/README.md`.
Execution: worker chat, Sonnet, high effort (taste work; look at every render and iterate).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Ten options A to J, same 8 gear sets, 1x and 3x, attack and sit poses | sheet | PNG | PASS: `docs/art/samples/hero-options.png` (2774 by 1406): 10 rows, 8 sets, attack and sit at 3x, then true size |
| AC2 | No shape sits at the bottom center between the legs in any option | worker views every cell; notes | notes | PASS: viewed at 6x for every option; `tools/check_hero_options.ts`: 240 sprites (10 options x 8 sets x 3 poses), 0 gear cells in the leg gap (A compared with the bare crab). A leak found and fixed: Pirate Coattails showed as a strip between the legs and below the feet |
| AC3 | One fight scene per option at band size | PNG | PNG | PASS: `docs/art/samples/hero-options-scene.png`, 720 by 88 scenes at 2x, Knight set, attack pose, same pack |
| AC4 | Game untouched | `git diff` shows no change in files the game imports; whole check passes | last lines | PASS: only new files plus a 2 line rounding fix in `tools/sheet.ts` (not imported by the game); `game_check run` PASS, `verify` PASS (44 of 44 tests, strict tsc, validate) |
## Human gates
The owner picks one option (or a mix). The pick becomes a decision and a follow-up card to apply it to the whole gear library.
## Recovery and return condition
Own branch. Return with the two PNGs and notes.

## Log
- 2026-10-15 worker (Sonnet, high). A hook blocked writes to a second worktree, so the work is on this session's own branch `claude/admiring-tereshkova-68ba6a`, reset to 5f66252 first.
- Built `hooks/sprites/hero-options.ts` (ten bodies, one gear assembler, the 8 gear sets Knight, Wizard, King, Rogue (dual daggers), Samurai, Pirate, Dev, Cleric), `tools/render_hero_options.ts`, `tools/check_hero_options.ts`. Nothing imports the new module; `tools/sheet.ts` now rounds fill coordinates to whole pixels.
- Honest best effort on every option: bodies were redrawn until each read at band size (first pass chest pieces looked like blobs on the torso, so every torso is now fully covered in item-colored cloth with the drawing over it; slime band samples the lower rows so fur collars do not look like teeth).
- Design notes: eyes show through hats on the crab family (B, C, F) as today; the cat's ears and the frog's eyes poke over the hat; the mushroom wears hats on its cap; the robot antenna shows above low hats; capes are mostly hidden on C.
- Verdicts. A: smallest change, but still a flat shell with a band for armor and hats hiding the eyes. B: the best "still a crab", real head and torso so armor reads, legs and claws get busy at 1x. C: the most fun chest slot (a swapped shell) and very ownable, but helmets and skull shells bury the crab and capes vanish. D: best slot fit and the clearest face, but a generic RPG kid. E: strongest silhouette and color, weakest slot fit (no legs, armor is a band). F: strong green against the brown ground, bulging eyes give a face at 1x, a wide head takes every hat. G: charming, ears through helmets, but orange again and the tail clutters. H: fits the coding theme, boxy and readable, armor plates look natural, antenna pokes above hats. I: the cap-as-head keeps a signature color under any hat, cute, a tall head. J: wings are a natural back slot and violet pops, but the face reads like a goblin or cat at 1x.
- Worker pick: F frog knight (strong color, readable face at 1x, wide head for hats, every slot sits naturally, original and a good Steam mascot). If the owner wants to stay a crab, B. Owner chooses; the pick becomes a decision and a follow-up card to apply it to the whole gear library.
