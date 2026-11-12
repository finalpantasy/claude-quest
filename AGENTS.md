# Claude Quest
An idle ARPG mod for Claude Code: a hero fights above the prompt, powered by the person's real work, and camps on life skills while they are away. Zero tokens.
Platform: Claude Code plugin (function hooks module), TypeScript, no engine, no DOM, no Node. Surfaces: desktop app (SVG scene) and terminal (one-line ticker). Input: none; the game plays itself.

## Files
- `hooks/data.ts`: every word table (acts, monsters, affixes, legendaries, sets, classes, races, life skill tables, bounties, achievements).
- `hooks/game.ts`: the pure engine (seeded RNG, stats and derive, par-hero monster scaling, items, fights, town, camp life skills, `step`, `applyCounts`). No `$`, no I/O.
- `hooks/art.ts`: pixel sprites and scenes as one SVG string; all motion is CSS; redraw only on task change.
- `hooks/register.tsx`: hooks (activity capture, lease and inbox multi-session, band above the prompt, `/quest` pane with 6 tabs).
- `types/index.d.ts`: the Hero save contract. A save field change needs a migration in `register.tsx` load.
- `hooks/quest.test.tsx`: tests run by `claude plugin test`.
- Runtime data (never in the repo): `~/.claude/claude-quest/` (hero.json, lease.json, inbox/<session>.json).

## Commands and evidence
- Check everything: `python tools/game_check.py run --root .` then `python tools/game_check.py verify --root .` (0 PASS, 1 FAIL, 3 NOT_RUN). Receipt: `evidence/last-check.json`.
- It runs `tools/plugin_checks.py`: `claude plugin validate .`, `claude plugin test .`, and strict `tsc` (typescript@5.6.3 from the npx cache) against the engine's API types, with a tsconfig kept outside the repo.
- API types: load the `plugin-authoring` skill before touching code; it writes the types file the typecheck uses and holds the mod rules.
- Balance: a tsx simulation that imports `hooks/game.ts`, feeds counts every 5 simulated minutes for 12 active hours a day, and prints level, kills, deaths, tier and life levels by day. Keep it in your scratchpad; do not commit it.
- Local install and push steps: see `~/.claude/claude-quest-dev.md` (outside the repo, never committed).
- Visual changes need a rendered SVG or a desktop screenshot as evidence; tests do not prove looks.

## Shared workflow
- Claude and Codex read these rules; the same task, state and evidence apply in either host.
- One lead (the coordinator chat, on Opus) owns integration, planning and the interview with the owner. Workers implement one card each.
- On entry or handoff read STATE.md: lead role, routing, worker limit and active worker IDs. Do not make the owner repeat setup.
- Cards live in `backlog/tasks/`. Only met dependencies make a card Ready. Verified is technical; Accepted adds the owner's decision.
- Each card records outcome, scope, dependencies, owned files, criteria, evidence and next action.
- Decisions go in `docs/DECISIONS.md`. Preserve unrelated work and rejected directions.
- Repeated failed hypotheses need a new diagnosis, not blind retries or weaker criteria.
- Context checkpoint: at about 400k-500k tokens, stop at a safe point, write a handoff (WIP commit, card notes, STATE), continue in a fresh chat.

## Project constraints
- Zero tokens: never call a model. Content comes from tables and the hero's seeded RNG.
- Fully hands-off: no player choices. The hero equips, crafts, gambles, pushes maps and picks camp skills itself.
- RuneScape XP formula, uncapped. Balance for 12 hours of Claude a day; combat runs in real time, so 24/7 users are capped.
- Character level plus six life skills; every life skill gives a small permanent combat perk; total level gives damage.
- Saves must stay backward compatible: load old saves, migrate, never wipe a hero.
- Cheap to run: CSS motion inside one SVG, redraw only on task change, small saves.
- Respect other mods above the prompt (status-band, savvy-progress): keep the band small.
- Non-goals for now: anything that spends tokens, player choices, network calls (leaderboards come later and are opt-in).
- Human gates: the owner approves pacing targets, screen layout and anything public (push, release, leaderboard). Technical PASS does not approve looks or feel.
- No automatic hooks, installs, external writes or git publication without the owner's yes. Ask before every public push or release.
- No em dashes in any file, comment, commit message or update; use a comma, colon or separate sentence.
- No absolute user paths or secrets in committed files. Never put the owner's real name, first name or personal email in anything that reaches GitHub (files, manifests, LICENSE, commit messages or author fields); use the handle `finalpantasy`. Grep before every push.
