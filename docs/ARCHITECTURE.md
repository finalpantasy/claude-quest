# Architecture

## Systems and owners
| System | Owns | Must not know about |
|---|---|---|
| `hooks/data.ts` | Word tables and static content | `$`, the save, rendering |
| `hooks/game.ts` | Pure rules: RNG, derive, scaling, loot, fights, town, camp, `step`, `applyCounts`, XP curve | `$`, files, clocks (time is passed in) |
| `hooks/art.ts` | SVG scene and ticker strings from a Hero | `$`, mutation of the Hero |
| `hooks/register.tsx` | Hooks, activity capture, lease, inbox, save load and migration, band and `/quest` pane | Game rules beyond calling `step` and `applyCounts` |
| `types/index.d.ts` | The Hero save contract and `$.state` values | Behaviour |

## Contracts
- Activity capture: each session counts its own work (`Counts`) and writes cumulative totals to `~/.claude/claude-quest/inbox/<session>.json`.
- Lease: one session holds `lease.json` for 10 s at a time and runs the game; it applies each inbox's difference once (`applyCounts`), runs `step`, saves `hero.json`.
- Drawing: the band redraws only when the hero's task changes; motion between redraws is CSS inside the SVG.
- Save: `Hero.v` is the schema version. Any field change adds a default on load so old saves keep working.

## File ownership
- One writer per file at a time. `hooks/game.ts` and `types/index.d.ts` are the hot spots: cards that touch them do not run in parallel.
- `~/.claude/claude-quest/` is the owner's live save: workers never write it; use a temp folder or the test kit's mock store.

## Testing
- Logic and render tests: `hooks/*.test.tsx` under `claude plugin test`, run by `python tools/game_check.py run --root .`.
- Balance: scratchpad simulation (see AGENTS.md); report its table as card evidence.
- Visuals: rendered SVG files or a desktop screenshot attached to the card.
