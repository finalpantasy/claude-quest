---
id: task-28
title: Visible gear on H1 - phase B (weapon, off-hand, head, chest, back, auras, upgrade glows)
status: Accepted (owner 2026-10-28: "Looks good" on the live gear)
---
## Problem before solution
The live band now draws the D30 look with hero H1 (task-27, owner on 2026-10-20: "The live band looks good. Move on to the next phase."). H1 always wears the same sword, shield, tunic and cape, so loot never shows on the hero. D23 says which gear is visible: weapon, off-hand, head, chest and back pieces plus auras and upgrade glows. Hands, waist, legs, feet, neck and rings stay invisible, with no small marks. D23 was written for the crab; it now applies to H1.
## Hero rule (D29, verbatim, do not reinterpret)
The owner: "Brother... i said not a crab." The hero is not a crab: an original humanoid adventurer, facing the camera, not chibi, straight legs, not knock-kneed. Every loadout is still H1 from task-26 (same face, hair, build, palette and proportions); gear goes on him, it never changes who he is.
## Art rules (unchanged from task-25 and task-26)
Resurrect 64 only, one pixel scale (2 screen px per art px in the band, D31), no blur, no boxes, bitmap font. Every gear part meets the task-26 craft bar: light from the upper left, at least three tones per material plus a highlight on metal, selective outline, no stray pixels, no jaggies. Gear must read at 1x in the 120 px band.
## Outcome and scope
Step 1, gear sheet (return to the coordinator after this step, do not wire yet). The owner rejected five rounds of art before D30, so the look of the gear gets its own gate before any wiring.
- Parts in `hooks/sprites/pixel2/gear.ts` (new), drawn for H1's stand pose first:
  - Weapon: a small family of shapes (for example sword, axe, mace, staff, bow, dagger), chosen from the item name or base the way `data.ts` already names weapons. Grep `data.ts` and pick the mapping; say it in the Log.
  - Off-hand: shield shapes, an orb or tome for casters, empty when the slot is empty.
  - Head: none, cap, hood, half helm, full helm, crown or circlet. Hair must still show under open helms.
  - Chest: tunic, leather, mail, plate and robe silhouettes that keep H1's build.
  - Back: the cape (cut and color). No back slot exists; use the old task-11 plan (back look from a hash of the neck item name) unless you find a better existing source, and say which.
  - Rarity color: normal, magic, rare, unique and set each read at a glance on trim and metal, never by recoloring the hero's skin or hair.
  - Auras: unique powers, set bonuses, ancient and primal (tier 1 and 2) as a soft pixel aura behind and around H1, CSS motion only. Upgrade glow for +1 to +15 in a few visible steps.
- Sheet `docs/art/styles/gear-sheet.png`: H1 in about 12 seeded loadouts from fresh start (normal gear) to late game (primal set, +15), each in the real R1 day frame at 1x and at 3x for reading, plus one row per slot showing every part alone. Also `gear-night.png` with 4 loadouts at night.
- One paragraph in the Log on the mapping (item to part) and the byte cost per loadout.
Step 2, wiring (only after the coordinator's go):
- `sceneSvg` and the strip portrait draw H1 with the hero's equipped items in every pose task-27 added (stand, swing, cast, sit, rod, pick, shovel, dead). Gear moves with the pose (the weapon follows the swing; a rod, pick or shovel replaces the weapon while gathering, the off-hand stays or is put away as the pose needs).
- Followers keep their task-27 look.
- Budget: 40 KB per scene SVG, redraw only on task change, CSS motion only, no DOM, no Node.
- Old saves: items without a known base or with missing fields fall back to H1's task-27 default kit, never a crash or a blank.
Non-goals: hands, waist, legs, feet, neck and ring visuals (D23), monster and boss library (phase C), act backdrops (task-13), pets library, any change to `hooks/game.ts`, `types/` or saves.
## Dependencies and ownership
task-27 merged (35f1d1e). Owned files: `hooks/sprites/pixel2/` (new `gear.ts`, edits to `hero.ts` and `index.ts`), `hooks/art.ts`, `hooks/quest.test.tsx` and `hooks/art.test.ts` (gear tests), `tools/render_pixel2.ts`, `docs/art/styles/gear-*.png`, `docs/images/` (README images re-rendered at the end), this card. `hooks/game.ts`, `hooks/data.ts`, `types/` and saves: untouched (read `data.ts`, do not edit it).
Execution: worker chat, Sonnet 5.5, high effort. Load the `plugin-authoring` skill before touching `hooks/` (AGENTS.md).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Gear sheet: every D23 slot, every rarity, auras and upgrade glows on H1 | gear-sheet.png, gear-night.png | files | Rendered 2026-10-20, awaiting coordinator and owner look (see Log) |
| AC2 | Owner gate on the gear look passed | coordinator message | quote | PASS. Owner, relayed by the coordinator: "The gear sheet looks good. Wire it into the band." |
| AC3 | Craft bar holds for every part; H1 stays H1 (D29) | one Log line per slot | Log | Self-check done on every PNG, one line per slot in the Log, coordinator to confirm |
| AC4 | Band and strip draw equipped gear in every pose and task kind | render of each task kind for 3 loadouts (fresh, mid, late) at 720 by 120 | PNG sheet | Rendered: `docs/art/styles/gear-band-{fresh,mid,late}-{day,night}.png` (12 task rows each), `gear-poses-{day,night}.png` (9 poses x 7 loadouts), README images in `docs/images/`. Fresh renders are byte-identical to task-27's `tasks-day.png` and `tasks-night.png`. Strip portrait test in `hooks/art.test.ts`. |
| AC5 | No crab anywhere; invisible slots stay invisible | grep of `art.ts` imports, test that hands/waist/legs/feet/neck/rings change no pixels, plus the coordinator opens every PNG | output, PNGs | PASS. Test `gear: hands, waist, legs, feet and rings change no pixel...` (12 loadouts x 3 rarities x 9 poses); the neck only picks the cape. Every PNG opened by the worker. |
| AC6 | Budget: scene SVG bytes and build time per task kind, late-game loadout | table | numbers | PASS, table in the Log (max 18.3 KB of 40 KB). Raw output in `docs/art/styles/task-28-budget.txt`. |
| AC7 | Old saves load and draw with the default kit fallback | fixture test | test | PASS. Test `gear: old saves and odd items fall back...` (undefined and `{}` gear, null and number and string items, bogus rarity, NaN plus, tier 9, a hero with no `gear` field), every task kind, strip too; unknown items give pixels identical to `heroSprite(pose)`. |
| AC8 | Whole check PASS (known CPU-bound timeouts under load: say so, rerun when quiet) | check last lines | output | PASS: `game_check.py run` then `verify` (validate 1, tests 47, typecheck 1). The pacing test timed out at about 5.6 s in two runs while the PC was busy (engine untouched) and passed in the quiet run. |
## Human gates
The gear look (step 1) and the final look in the live band need the owner. The coordinator opens every PNG before the owner sees it. Install, push and release are separate and need the owner's yes.
## Recovery and return condition
Own branch cut from the coordinator branch. Return after step 1 with the sheets, then after step 2 with the evidence. Commit; do not merge into main and do not push.

## Log

### Step 1, gear sheet (worker), round 2 after coordinator review
Files: `hooks/sprites/pixel2/gear.ts` (new), `hero.ts` (a `Kit` hook type and `heroWith`, default output of all 9 poses bit-identical by sha1), `tools/render_gear.ts` (new, renders the sheets), `docs/art/styles/gear-sheet.png` (2504x4727: 12 loadouts at 1x frame and 3x reading, then one row per slot) and `gear-night.png` (1628x976, loadouts 4, 7, 10, 12). Nothing is wired into `sceneSvg`.

**Mapping (item to part).** Word tables over the item text, the way `data.ts` names things. Unique and set pieces have a fixed name and a random base, so their name speaks first; every other item speaks through its base. Weapon: staff or scepter is a staff, wand or soldering a wand, laser, pointer, dagger or knife a dagger, flail, mace or club a mace, spear, lance or pike a spear, mallet or hammer a hammer, axe, hatchet or deploy an axe, keyboard, key, sword, blade or answer a sword. `data.ts` has 7 weapon bases and no bow, so there is no bow shape. Off-hand: quiver, tome (grimoire, docs), orb (coffee, mug), kite shield (monitor), round shield (duck, shield, buckler); an empty off-hand with anything else equipped is a bare hand, and a fully empty hero keeps H1's task-27 shield. Head: headset, crown, circlet (monad, tiara), hood, visor (VR), cap, and "helm" is a half helm for normal and magic, a full helm for rare and up. Chest: robe (hoodie), mail (hauberk, chain), plate (ward, armor), leather (cardigan, kevlar), tunic (tee). Back: there is no back slot and no better source exists, so the cape cut (5 cuts) and color (6) come from an FNV-1a hash of the neck item base and name, as in the old task-11 plan; no neck item keeps H1's red cape. Rarity colors only trim and metal (normal bronze, magic purple, rare gold, unique orange, set green); skin and hair are never recolored. Auras come from every slot: unique rarity, a set bonus (2 or 4 pieces of one set), ancient (tier 1), primal (tier 2). Upgrade glow is five steps (+1 to +3, +4 to +6, +7 to +9, +10 to +12, +13 to +15). Unknown bases, missing fields and old saves leave the field out and H1 keeps his task-27 part.

**Round 2 changes (coordinator review).**
1. Auras are light from behind H1, not paint or an outline. `auraLayers` returns three separate pieces: a tall oval of three solid tones (lightest inside, no dither) that the scene draws at `AURA_ALPHA` = 45% opacity so the sky and grass show through, its edge 3 to 4 art px past his body and cape (not his sword and shield); a ring of light on the ground at his feet at full strength; and a list of motes (`Mote`: position, color, delay, rise time) at full strength for CSS to lift slowly. The sheets blend the oval at 45% over the real meadow (the reading tiles and the aura row sit on a crop of the real day or night meadow). Tiers: unique orange; set green (set of 4 brighter mint, bigger ring); ancient warm gold; primal the strongest (hot coral to white inside, red-white motes, bright white inner ground ring, no white outline); a set bonus on another tier adds a green rim and a second green ground ring.
2. Upgrade glow has no traced ring or dithered line anywhere now (sword, shield, helm, chest). Six steps: +1 to +3 the blade's lit edge goes warm; +4 to +6 white edge, plus a small white glint on the shield, helm and breastplate metal; +7 to +9 one sparkle and a faint glow behind the blade only; +10 to +12 the same with a two tone glow; +13 to +14 a three tone glow; +15 adds a second sparkle.
3. Quiver is worn on the back: arrow feathers and shafts rise past the screen-left shoulder and the pouch hangs behind the arm; the off-hand is a bare hand and the quiver never glows.
4. Hood: a dark brim and a dark inner edge band where the cloth meets the face (loadouts 4 and 12 and the head row).

**Craft bar, one line per slot** (checked at 3x and 6x in the PNGs, light from the upper left).
- Weapon: eight shapes, steel and haft at 3+ tones, metal highlight, 1 px outline in the rarity's deep tone, trim on the guard; no stray pixels.
- Off-hand: round, kite, orb and tome have 3+ tones and a highlight; the quiver is a back piece (brown pouch, white feathers, dark shafts); bare hand shows the arm only.
- Head: cap, hood (with a dark brim band), half helm, full helm, visor, headset, crown, circlet; hair shows under the open ones, the face stays visible under the full helm.
- Chest: tunic, leather, mail, plate, robe keep H1's shoulders, belt and buckle; the robe only lengthens over the legs, legs stay straight.
- Back: five cuts, six dyes with 3 tones each, cut behind H1 so he still faces the camera.
- Rarity: normal, magic, rare, unique, set read on trim and metal at 1x.
- Auras: 3 tone oval at 45% opacity behind him, ground ring, a few motes; each tier has its own color; ring and motes stay bright at night.
- Glow: six steps, metal highlight, then sparkles, then light behind the blade; no ring.
- D29: all 12 loadouts and all slot rows are the same humanoid swordsman facing the camera, straight legs, no crab.

**Bytes per loadout** (PNG data URI characters: hero sprite + glow oval + ground ring, then the mote count; motes are a short list, not pixels): 1 fresh 886, 2 normal 850, 3 first magic 974, 4 caster 906, 5 ranger 858, 6 knight 950, 7 first uniques 982+410+250 (4 motes), 8 Vim set 954+410+250 (4), 9 Emacs set 930+430+250 (6), 10 ancient 982+430+250 (6), 11 primal uniques 1022+430+258 (9), 12 primal set 1066+430+258 (11). Worst case about 1.8 KB per loadout, well inside the 40 KB scene budget. Step 2 draws the oval as an image with `opacity="0.45"`.

**Check.** `python tools/plugin_checks.py typecheck` PASS (strict tsc over hooks). Tests 42 of 42 PASS on the final run (the pacing test timed out on three earlier runs while the PC was busy, then passed when quiet).

**Open issues.** (1) An empty off-hand with other gear shows a bare hand (kept). (2) No bow in `data.ts`, quiver only. (3) Axe only by unique or set name (kept). (4) The oval's opacity is one value for the whole image, so the outer tone is faint only through its color; the sheets show the 45% blend. (5) +13 and +14 look the same (one step).

### Step 2, wired into the band and strip (worker)
Files: `hooks/art.ts` (look and aura wiring, CSS), `hooks/sprites/pixel2/gear.ts` (swing weapon, tool poses, aura clip, safer `lookOf`), `hero.ts` (a `swing` hook on `Kit`, default output unchanged), `index.ts` (exports, `faceOf`), `hooks/art.test.ts` (5 new tests), `tools/gear_loadouts.ts` (new, the 12 loadouts shared by the tools and tests), `tools/render_gear.ts`, `tools/render_pixel2.ts` (`gear` and `budget` modes). Nothing in `hooks/game.ts`, `hooks/data.ts`, `types/` or saves changed.

**Design choices.**
1. Every pose wears the kit: stand, swing, sit, rod, pick, pickDown, shovel, shovelDown, dead. The swing rotates the stand weapon onto the swing diagonal (one body row repeated for length), so each weapon shape follows the swing. Its upgrade glow follows the blade through a distance field, not a bounding box.
2. Pick, shovel, rod and sit: the weapon is not drawn and the tool head stays steel; the weapon glow is dropped. The off-hand and the rest of the kit stay in every pose (nothing is put away).
3. The aura is one 45% oval (`<image opacity="0.45">`, CSS pulse), a full-strength ground ring and CSS-rising motes. It comes from the standing figure for all standing poses, so it does not jump between swing frames; sit and rod use their own bounds; the dead ghost has none. The oval is clipped at the ground line so the ring is its bottom edge (test: in every column the glow ends above the ring's lowest pixel). The aura is not relit for dusk or night.
4. Followers and minions keep their task-27 look. A fresh hero (no gear) draws exactly as in task-27 and has no aura.
5. Old saves: `lookOfHero` and `wornOf` wrap `lookOf` and `gearHero` in try/catch and fall back to `heroSprite(pose)`. Items with an unknown base, missing fields, a bogus rarity or tier, or a NaN plus fall back to H1's own part. Only a recognized weapon, head or chest turns the empty off-hand into a bare hand; a ring or an unknown item no longer does.
6. Strip portrait: `faceOf(look)` keeps the 13 by 9 face window and shows the helm or hood (window started 2 rows higher), cached by head shape, rarity and hue.
7. The neck item only picks the cape (as in step 1). Hands, waist, legs, feet and rings draw nothing (D23).

**Bytes per scene SVG, late loadout (primal set +15), 720 by 120, day 14h** (18h and 22h within 0.2 KB): fight 16.9 KB, magic 16.3, rare 15.5, boss 16.5, bat 15.2, goblin 15.3, fish 18.2, mine 13.2, dig 13.1, town 12.7, dead 8.1, travel 11.2. Max about 18.3 KB of the 40 KB budget. Build time: first (cold) build of a fight scene 63 to 75 ms (it includes the backdrop and the gear build), other kinds 1 to 7 ms cold, 0 to 3 ms warm. Redraw is still only on task change. Raw output: `docs/art/styles/task-28-budget.txt`.

**Evidence.** `docs/art/styles/gear-band-{fresh,mid,late}-{day,night}.png` (12 task rows each, fresh = loadout 1, mid = loadout 7 first uniques +7, late = loadout 12 primal set +15), `gear-poses-day.png` and `gear-poses-night.png` (9 poses for 7 loadouts, one row each), refreshed `gear-sheet.png` and `gear-night.png`, README images `docs/images/{atlas,boss,death,fight,fishing,mining,strip,town}.png` and `fight.gif` from the real engine hero. Every PNG was opened and looked at.

**Check.** `python tools/game_check.py run --root .` then `verify`: PASS (validate 1, tests 47, typecheck 1). Pacing test: timed out at about 5.6 s in two runs while the PC was busy, passed in the quiet run; the engine is untouched.

**Open issues.** (1) +13 and +14 still look the same (one step). (2) A fishing hero (sit/rod) uses its own oval, not the standing one. (3) The off-hand is never put away while mining or digging; say if you want it hidden there.
