# Lookbook: Claude Quest

Status: picked 2026-10-20 (D30): round 7 pixel frame plus hero H1; not yet tried in the live band. Failed hypothesis: a better hero sprite alone fixes the look.
Mood in three words: cozy, crunchy, loot-bright
The look in one paragraph (write after lock): pending.

## Comparison setup (fixed within a comparison unless it is the variable under review)
The desktop band at its default height, hero mid-fight with one rare foe in Act I, task label visible, status-band and savvy-progress rows drawn above it. Compare against the same frame in the `/quest` pane.

## References
| Name | Page | Take | Serves pillar |
|---|---|---|---|
| Diablo II / III | | Rarity colors, act skies, compact readable sprites | Loot feels bright |
| RuneScape | | Skill icons and level-up moments | Long grind feels earned |
| Octopath Traveler, Sea of Stars (HD-2D) | | Owner pick 2026-10-20: crisp pixel sprites, layered lit hazy depth, bloom on loot and magic | Loot feels bright |
| Stardew Valley, Eastward | | Owner pick 2026-10-20: warm cozy pixel palette, soft outlines, friendly creatures | Cozy |

## Rounds
| Round | Variable changed | Pick | Verdict |
|---|---|---|---|
| 01 | band height and layout (D-OPEN-2) | | pending |
| 02 | hero body (task-18: crab variants and 7 creatures) | none | owner: "doesn't have to be a crab" |
| 03 | adventurer variants (task-19), 32-bit (task-20), Final Fantasy proportions (task-21 T1-T4, S1-S3, F1-F3) | none | owner: too chibi, knees, face the camera, then "none, let's restyle the game" (2026-10-15) |
| 04 | whole-game style (task-22: D1 dark ARPG, D2 silhouettes, D3 ASCII, D4 vector cartoon, D5 painterly, D6 paper cutout, D7 wildcard) | | exploring | D1 dark ARPG and D2 silhouettes: owner "nope" (2026-10-15).

## Approved in-game examples
- v0.1 scene and ticker, as shipped in `hooks/art.ts` (in use, not formally locked).
| 05 | human hero in D3 to D7 (task-23, one original adventurer per style; D1, D2 dropped) | none | owner: "eww" to all five styles, not only the hero (2026-10-20); next: references from the owner before any new round |
| 06 | pixel whole frame from owner references (task-24: P1 HD-2D, P2 cozy pixel, P3 blend) | none | owner: "make it not ugly af" (2026-10-20). Diagnosis: code-drawn art has hit its ceiling; the box monsters and the busy label layout stayed the same in every rejected round; no concept image was ever approved before building |
| 07 | pixel frame rebuilt to art rules (task-25: Resurrect 64 palette, one scale, bitmap HUD, slime, mushroom, bat, phantom, sorcerer boss; R1 afternoon, R2 dusk) | | none | owner: "Still ugly" (2026-10-20); asked what: only the hero, "looks cheap or amateur"; monsters, boss, background, palette and HUD not named as ugly |
| 08 | hero redraw in the round 7 frame (task-26: H1 swordsman, H2 light knight, H3 ranger, H4 spellblade) | H1 | owner picked H1 (2026-10-20), D30 |
