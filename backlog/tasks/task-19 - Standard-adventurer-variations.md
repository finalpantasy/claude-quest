---
id: task-19
title: Standard adventurer hero - body and style variations
status: Ready
---
## Problem before solution
The owner (2026-10-15), after the task-18 sheet: "About a more standard adventurer. Give me some different generations of that." Option D (chibi adventurer) had the best gear fit and clearest face but read as a generic RPG kid. The owner wants to see several takes on a classic adventurer before picking the hero.
Facts: the task-18 bodies, gear assembler and 8 gear sets (Knight, Wizard, King, Rogue, Samurai, Pirate, Dev, Cleric) are in `hooks/sprites/hero-options.ts`; renders come from `tools/render_hero_options.ts`; the leg-gap check is `tools/check_hero_options.ts`. Band height limits the hero to about 26-30 cells tall.
## Outcome and scope
A second comparison sheet with 8 adventurer variants, all original (no existing characters), each a fair best effort:
- V1. Chibi 2-heads-tall (today's D, polished: stronger face, less "kid").
- V2. 3-heads-tall classic 16-bit JRPG adventurer.
- V3. 4-heads-tall action ARPG adventurer (taller, more heroic, smaller head).
- V4. Hooded wanderer: face mostly shadow with bright eyes, mysterious, gear reads on a cloak.
- V5. Stocky dwarf-like adventurer: wide body, big beard or scarf, short legs.
- V6. Lanky elf-like adventurer: tall thin silhouette, long ears through helmets.
- V7. Bold-outline cartoon adventurer: thick dark outline, flat bright colors, big expressive eyes.
- V8. Worker's wildcard that reads best at band size.
Also show randomness, since identity is random (D25): for the 2 strongest variants, a row of 12 random looks (skin tone, hair style and color, eye color, face detail) with no gear, then the same 12 with random gear, so the owner sees how different two players' heroes would look.
Render like task-18: the same 8 gear sets in attack and sit at 3x and true size, plus one band-size fight scene per variant. Output: `docs/art/samples/adventurer-options.png`, `docs/art/samples/adventurer-options-scene.png`, `docs/art/samples/adventurer-random.png`. Extend `hooks/sprites/hero-options.ts` (still not imported by the game).
Non-goals: wiring into the game, refitting the full gear library.
## Dependencies and ownership
Depends on task-18 (merged c2cb14e). Owned files: `hooks/sprites/hero-options.ts`, `tools/render_hero_options.ts`, `tools/check_hero_options.ts`, `docs/art/samples/adventurer-*.png`, `docs/art/README.md`.
Execution: worker chat, Sonnet, high effort (taste work; look at every render and iterate).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Eight variants, same 8 gear sets, attack and sit, 3x and true size | sheet | PNG | PASS: `docs/art/samples/adventurer-options.png` (V1 to V8, bare stand plus 8 sets in attack and sit, 3x and 1x) |
| AC2 | Random looks for the 2 strongest variants, bare and geared | sheet | PNG | PASS: `docs/art/samples/adventurer-random.png` (V1 and V7, 12 seeded looks bare, then the same 12 in 12 random sets, 4x and 1x) |
| AC3 | Band-size fight scene per variant | PNG | PNG | PASS: `docs/art/samples/adventurer-options-scene.png` |
| AC4 | No gear cells between the legs; game untouched; whole check passes | `tools/check_hero_options.ts`, `git diff`, check last lines | output | PARTIAL: leg gap PASS (576 sprites, 0 cells); game untouched (no diff in hooks/game.ts, art.ts, register.tsx, data.ts, sprites.ts or tests; nothing imports hero-options); whole check FAIL on two CPU-bound 5 s test timeouts under 100% machine load, see Log |
## Human gates
The owner picks the hero (a variant here or a task-18 option). The pick becomes a decision and a card to refit the gear library.
## Recovery and return condition
Own branch. Return with the three PNGs, a one-line verdict per variant and the worker's top pick.
## Log
- 2026-10-15 worker (Opus 5.5, the session's model; the card planned Sonnet high). Work on this session's branch `claude/blissful-jackson-5dbbd1`, reset to 0794fa5 first.
- Built on task-18: `hooks/sprites/hero-options.ts` gains `ADVENTURERS` (V1 to V8), a `HeroLook` (skin, hair color, 10 hair styles, iris, 8 face details, accent), seeded `randomLook` and `randomGear`, shared head, hair, eye, ear, arm and leg helpers, hats resampled to narrower heads (`hatW`, `hatS`) and a double outline (`bold`). `heroSprite` takes an optional look. Task-18 options render as before (the camp rod canvas is 10 cells wider so it is not clipped on wide bodies). `tools/render_hero_options.ts --adv [--random 17]` writes the three sheets; `tools/check_hero_options.ts` also checks all eight with the 8 sets and 12 random looks in random sets.
- Iterations from the renders: V8 scarf first read as a spear, now a two-tailed waving ribbon above the shield; V5 beard merged with a red tunic and looked like a waffle, now a blue tunic and stranded beard; V4 hood lost its top nub and moved to slate blue to stand off the brown ground; V6 hair moved to gold so the face does not merge with platinum hair; V2 got bigger eyes and ears; hair styles were widened (side ponytail at the back of the head, bigger curls and buns, braid, long hair over the shoulders) because the first random row looked alike; the dwarf's rod was clipped at the canvas edge.
- Verdicts. V1: best all-round; face reads at band size, every set fits, brows and jaw make it braver than D. V2: honest classic JRPG look, gear fits well, the face gets small at band size. V3: most heroic silhouette, but the face is lost at band size and hats must shrink to 10 wide. V4: strongest mood, glowing eyes read at 1x, but the hood hides hair so random identity is mostly cloak and eye color. V5: reads instantly at band size thanks to the beard, but the beard covers most chest pieces. V6: ears through every helmet is a nice touch, but the thin body makes face and gear tiny at 1x. V7: loudest and friendliest at band size, big eyes; flat colors sit a little oddly next to the shaded gear. V8 (wildcard): V1 proportions, bold outline and a flowing accent scarf that doubles as the player's identity color; the scarf can tangle with big shields.
- Worker pick: V1 chibi polished (clearest face at band size, safest gear fit, random looks show the most variety); runner-up V8 if the owner wants a signature silhouette. Owner chooses.
- Check: leg gap 576 sprites, 0 cells. Whole check ran twice: validate PASS, tests 43/44 then 42/44, both failures `timed out after 5000 ms` in CPU-heavy tests that do not touch this work (pacing simulation 5.3 s then 9.6 s; task-17 AC1 6.9 s) while machine CPU was at 100% from other processes. A third run after the commit: 43/44, only the pacing test (6.8 s). `verify` prints `NOT_RUN: No passing receipt for this project`. Rerun when the PC is quiet.
