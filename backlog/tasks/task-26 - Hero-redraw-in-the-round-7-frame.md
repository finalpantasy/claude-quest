---
id: task-26
title: Hero redraw in the round 7 frame - pro pixel craft
status: Verified (coordinator PNG review and owner pick pending)
---
## Problem before solution
Round 7 (task-25) is the first frame where the owner did not reject the whole look. Asked what is ugly, the owner (2026-10-20) picked only "The hero", and as the cause "Looks cheap or amateur" (not too small, not wrong vibe, not too plain). So the monsters, boss, background, palette and HUD of round 7 stay as they are; only the hero's drawing quality must rise.
What reads as cheap in the task-25 hero (coordinator, from a 12x zoom): flat single-tone blocks for the torso and legs, gray slab legs with no form, a stick sword arm with no hand shape, a long neck gap, a small flat face, hair as one cap shape, a cape that is a straight strip, almost no light and shadow.
## Hero rule (D29, verbatim, do not reinterpret)
The owner: "Brother... i said not a crab." The hero is not a crab: an original humanoid adventurer, facing the camera, not chibi, straight legs, not knock-kneed.
- Front view, both eyes visible. Head at most one fifth of full height. Two straight legs, feet planted slightly apart. Mid-swing pose, weapon under the top edge. Original design.
## Craft bar (each must hold; the Log shows how it was checked)
1. Light from the upper left on every material: at least three tones per material (shadow, base, light) plus a highlight on metal and hair, hue shifted, from the Resurrect 64 palette only.
2. Form, not slabs: shoulders, chest and waist read as a torso; arms have upper arm, forearm and a hand gripping the hilt; legs have thigh and shin shading, knees marked by shading only (still straight), boots with a sole, a cuff and a toe.
3. Face: a readable face at 1x (eyes, brows or lash line, nose shadow, mouth), skin with a shadow side, hair as several clusters with a highlight, not a flat cap.
4. Cloth: tunic with a belt, a hem and at least one fold; the cape with folds and a darker lining showing; the shield with a rim, a boss or emblem and a highlight.
5. Clean outline: selective outline (darker colored outline, lighter where light hits), no stray pixels, no jaggies on the sword or limbs (hand anti-aliasing on diagonals).
6. Size: same pixel scale as round 7. You may make the hero taller (up to about 48 rows) if detail needs it, as long as the frame layout still works at 1x.
## Outcome and scope
Four hero candidates (H1 to H4), each a different take on an original adventurer (for example a swordsman in a tunic and cape, a light knight with a half helm, a ranger with a hood down and a scarf, a spellblade with a long coat), all meeting D29 and the craft bar, each placed in the round 7 R1 warm afternoon fight frame (the rest of the frame unchanged, the digit glyph fix included).
Output: `docs/art/styles/hero-H1.png` to `H4.png` (R1 fight frame with that hero, 2x), `docs/art/styles/heroes-r8.png` (the four heroes alone at 6x side by side, labeled, plus each in the frame at 1x), and the task-25 hero kept in `heroes-r8.png` as "before" for comparison.
Self-review loop (required): put each hero next to front-facing character sprites from Sea of Stars, Eastward and Octopath Traveler at the same pixel scale (study only, save nothing); write the three biggest quality gaps; fix; at least three rounds per hero. Log them.
Non-goals: gear variants, poses beyond the one fight pose, wiring into the game.
## Dependencies and ownership
task-25 merged (a632f1a, plus the glyph fix if committed). Owned files: `tools/pixel2_mockups.ts`, `docs/art/styles/`, this card.
Execution: the task-25 worker chat on Opus 5.5, high effort (it built the frame; reason for Opus: drawing quality is the whole task).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Four heroes in the round 7 frame | hero-H1.png to H4.png | files | PASS: four 1920x300 Edge renders, each 100.000% equal to the composite, no color outside Resurrect 64 |
| AC2 | D29 for each; zero crab shapes | heroes-r8.png, head and body rows | file, numbers | PASS: each hero head 9 of 46 rows with outline (0.196), 8 of 44 without (0.182); front view, two eyes, straight legs apart, sword tip under the act line; no crab shape |
| AC3 | Craft bar 1 to 6 for each | one Log line per rule per hero (tone counts per material from the pixels, etc.) | Log | PASS with listed exceptions (small trims and the H1 shield rim under 3 tones), see Log |
| AC4 | Three self-review rounds per hero | Log | text | PASS: H1 six rounds, H2 to H4 three each |
| AC5 | Game untouched | `git diff --stat` of hooks and types | output | PASS: empty |
## Human gates
The coordinator opens every PNG and rejects any crab, rule break or visible defect before the owner sees anything. The owner picks a hero or says none.
## Recovery and return condition
Same branch as task-25 or a new one cut from the coordinator branch. Commit; do not merge into main and do not push. Return with PNG paths, the craft checks and an honest verdict per hero.

## Log

### 2026-10-20, task-25 worker (Opus 5.5)
Built in `tools/pixel2_mockups.ts`: a small hero kit. `Fig` holds one part letter per pixel (lowercase forces a crease into shadow). `shadeFig` lights every part from the upper left with its own 4-step ramp: a lit band on the left and on top, shade on the right and where a nearer part casts down, a highlight on lit corners for metal and hair, contact lines where an arm crosses the body, and a selective outline (ink below and right, the part's own deepest color above and left). All four heroes share one 44-row skeleton (face, neck, legs, boots, sword arm), so D29 holds by construction. `--heroes` writes the deliverables and prints the numbers below; `--hero-preview` is the working view. The default build still uses the task-25 hero, so R1, R2, round7 and the closeups are unchanged.

Outputs: `docs/art/styles/hero-H1.png` to `hero-H4.png` (V1 fight frame, Edge at 2x, 1920x300), `docs/art/styles/heroes-r8.png` (before plus H1 to H4 at 6x, labeled, then each in the frame at 1x).

Numbers from `--heroes` (pixels, not intent):
- Edge vs composite: H1 to H4 each 100.000% equal; colors outside Resurrect 64: none.
- D29: every hero 32x59 sprite, head 9 of 46 rows with outline (0.196), 8 of 44 without (0.182). Before (R7): 7 of 37 and 6 of 35.
- Sprite colors: H1 24, H2 23, H3 27, H4 33.
- Tones per part (distinct colors each part shows in the final sprite, marks included):
  - H1: blade 4, hair 4, skin 6 (+ neck 1), glove 4, tunic 4, sleeves 3 and 4, cape 4, lining 2, collar trim 1, shield rim 2, shield face 3, boss 3, belt 3, buckle 2, legs 3 and 3, boots 4 and 4, cuffs 1, soles 1.
  - H2: blade 4, helm 4, breastplate 7, pauldrons 6 and 4, tunic 4, sleeve 5, shield rim 3, shield face 3, cross 1, belt 2, legs 3, boots 4.
  - H3: blade 4, hair 4, hood 5, tunic 5, scarf 3, sleeves 4, strap 4, bracer 3, free hand 3, pouch 4, belt 3, legs 3, boots 4.
  - H4: blade 4, hair 4, coat 4, sleeves 5, lining 3, shirt 4, collar 2, free hand 3, belt 3, legs 3, boots 4.
- `git diff --stat HEAD -- hooks types`: empty.

Craft bar per hero (1 light, 2 form, 3 face, 4 cloth, 5 outline, 6 size):
- H1 swordsman (blue tunic, red cape, round wooden shield):
  1. PASS for every material of 3+ px width (counts above); hue shifted ramps (cape grape, blood, red, scarlet; skin rust, tan, apricot, skin). Exceptions: shield rim 2 tones (a 1 px ring), lining 2, collar trim 1.
  2. PASS: wide shoulders tapering to a belted waist, lit left chest; sword arm is upper arm, forearm, gloved fist with knuckles; legs lit left column and a knee crease; boots with cuff, toe and sole.
  3. PASS: two eyes each with a dark lash pixel, nose shadow, mouth (no separate brow); skin shadow side on the right; hair a fringe with a parting, side locks and a tuft with a highlight.
  4. PASS: tunic belt, hem, two folds; cape folds with the dark lining between the legs; shield planks, rim, gold boss.
  5. PASS: selective outline; no stray pixels at 6x; sword is vertical so no jaggies; the forearm diagonal is a clean 1-step stair.
  6. PASS: 46 rows with outline, frame works at 1x (sword tip under the act line, bar above the head).
- H2 light knight (steel half helm with a gold band, breastplate, pauldrons, teal tunic, red kite shield):
  1. PASS: steel 4 to 7 tones with a white highlight, gold 3, cloth 4. Exceptions: shield cross 1 tone, belt 2 (the shield covers its lit end).
  2. PASS: breastplate with a lit center ridge, pauldrons with gold rims, teal skirt below; sword arm and fist as H1; legs and boots as H1.
  3. PASS: face as H1 under the helm; helm brim casts shadow on the brow; side hair under the helm.
  4. PASS: skirt hem and folds, belt; no cape (a knight take); kite shield with gold rim, cross emblem and lit upper left.
  5. PASS.
  6. PASS.
- H3 ranger (blond, green hood down, red scarf, leather strap and pouch, short sword):
  1. PASS: hood 5, tunic 5, leather 3 to 4, hair 4 with a white corner highlight, scarf 3.
  2. PASS: hood bulk rounds the shoulders, diagonal strap across the chest, free arm hangs with a bracer and an open hand.
  3. PASS: face as H1; blond hair in clusters with a lit fringe.
  4. PASS: tunic hem, belt, folds, scarf with a hanging tail; no cape or shield (a ranger take).
  5. PASS.
  6. PASS.
- H4 spellblade (blue-black hair, long violet coat with a high collar and crimson lining, glowing mint blade, a spark in the open hand):
  1. PASS: coat 4, lining 3, shirt 4, hair 4 with a sky sheen, blade 4 with a white glint. Exception: collar 2.
  2. PASS: coat open over the shirt, sleeves, open hand; coat tails to the knees with folds; legs and boots below.
  3. PASS: face as H1 with violet eyes; hair falls past the jaw in strands.
  4. PASS: coat folds both sides, crimson lining showing down the front edge, belt with buckle, shirt buttons.
  5. PASS.
  6. PASS.

Crab check: all four are upright humanoids with two arms, two straight legs and a round head; no claws, no wide flat body, no side legs.

Self-review rounds. Reference study: front-facing character sprites from Sea of Stars, Eastward and Octopath Traveler were studied in a browser at the start (image search; the Spriters Resource page showed a bot check, which was not bypassed; nothing saved). Later rounds compared the 6x crop against those notes, not a side-by-side composite.
- H1: R1 hair same orange as skin so the head was a blob; cape stripes between the legs read as a cage; sword tip touched the act text. R2 V-neck read as a goatee; square head with a flat hair cap; 11-row boots under stubby legs. R3 neck read as a beard; wide parts lit only 1 px; boss a glowing square. R4 lit band lost behind the shield arm; hair a flat bowl; fist a plain block. R5 hair still a ginger cap; boss too bright; cape lit edge reads as a stripe. R6 fixed: one fringe row with a tuft pixel, the cape drawn behind its lining, the cape lit band cut to 1 px. Left: shield rim only 2 tones, boss still the brightest spot, face is the shared simple face.
- H2: R1 breastplate a flat pale slab; pauldrons blank blobs; helm top a white blob. R2 fixed with a darker steel ramp, a lit ridge and a gold neck trim; gaps: pauldrons without rims float, belt one flat tone, legs are slabs with only a knee crease. R3 fixed: gold pauldron rims, belt lit and shaded at its ends. Left: legs simple, the shield hand is hidden, skirt folds are regular.
- H3: R1 scarf under the chin read as a red beard; a hair tuft read as a flame; free arm a slab with a block hand. R2 fixed: neck shows, scarf sits lower with a tail, hood bulk on the shoulders, tuft removed; gaps: scarf triangle too wide, hair lost its highlight, belt flat. R3 fixed: narrower scarf, corner highlight back, belt ends. Left: the free hand is a mitten, the raised sword is shorter so the silhouette is lower, leg color sits close to the boots.
- H4: R1 hair a dark smear at the face edge; lining a hard magenta line; collar invisible. R2 fixed: blue-black hair with a sky sheen, wine lining, lilac collar; gaps: shirt a flat gray strip, coat right panel a flat slab, belt flat. R3 fixed: gold buttons, belt ends. Left: coat right panel still flat, plum boots close to the legs, the spark is small at 1x.

Honest verdict (harshest critic, next to Sea of Stars at the same scale):
- All four are a clear step up from the before hero: real light, form, faces and gear instead of flat blocks. None is at Sea of Stars level yet. Sea of Stars characters have organic silhouettes, hand-placed anti-aliasing and expressive faces; these share one stiff symmetric skeleton (same legs, boots, fist and face on all four), and the face is two eye dots with a nose pixel.
- H2 light knight: the strongest read at 1x (red shield and steel pop on the green field). Best candidate.
- H1 swordsman: the most complete classic hero (cape, shield, tunic); a little busy at 1x.
- H3 ranger: the most character (hood, scarf, strap); the free hand is the weakest part.
- H4 spellblade: the most distinct silhouette (coat); the colors are loud next to the bat and phantom, the lower half is weaker.
- If the owner still finds them amateur, the next step is per-hero legs and stance (weight on one leg, a slight contrapposto), a hand-drawn face per hero and hand anti-aliasing on the silhouette, not more tones.
