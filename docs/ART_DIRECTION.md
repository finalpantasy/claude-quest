# Art direction
Status and approved scope: v0.1 look shipped and in use by the owner; no formal lock. Layout of the band above the prompt is OPEN (D-OPEN-2).
The intended look and feeling: small pixel-art ARPG vignettes, Diablo palette (rarity colors: normal grey, magic blue, rare yellow, unique orange, set green, ancient amber, primal red), dark skies per act, readable at band height.
Current visual decision: code-drawn sprites and scenes in `hooks/art.ts`, one SVG string per redraw. Lookbook: `docs/lookbook/README.md`.

## Preserve and avoid
Accepted examples and features: the v0.1 desktop scene (hero, foes, act sky and ground, task label), the terminal one-line ticker, the `/quest` pane tabs (Hero, Gear, Party, Life, Log, Codex), rarity colors.
Rejected directions and why: an 88 px band by default (too tall beside other mods; the owner, 2026-10-12).

## Relevant production rules
- Pixel scale: sprites are integer-pixel rects inside the SVG; keep crisp edges (`shape-rendering: crispEdges`).
- Motion: CSS animation inside the SVG only, run by the compositor; no per-frame redraws; redraw only on task change.
- Height budget: keep the default band small; full scenes belong in `/quest` or short event pops (pending D-OPEN-2).
- Text: plain words, no em dashes; names come from `hooks/data.ts` tables.
- Source/license: all art is original code in this repo, MIT. No generated or downloaded images.

Concept/style, motion and in-game approval have separate scopes. Technical PASS does not approve appearance or feel.
