---
id: task-6
title: Ladder seasons, public leaderboard and async PvP design (v0.3)
status: Planned
---
## Problem before solution
D6 and D10: public leaderboards come next (gist per player, GitHub Actions built Pages site, profile card SVG), plus ladder seasons. No design exists yet, and this is the mod's first network feature.
## Outcome and scope
A short design spec in `docs/LEADERBOARD.md` that settles, with the owner, before any code:
- Opt-in: off by default; how a player turns it on (a `/quest` command) and off, and what happens to their published data.
- What is published: hero name, class, race, level, total level, season tier, achievements count; never paths, project names, counts of raw work or tokens. Confirm the list with the owner.
- How a gist is written from a mod with no Node: which `$` noun (process running `gh`, or `$.fs` plus a user-run command), and how the GitHub token is never read or stored by the mod.
- How the Pages site finds gists (a registry file in this repo updated by pull request, or a gist search) and how cheating is handled (it is a fan game: signed counts are out of scope; say so).
- Ladder seasons: length, what resets (a seasonal hero beside the eternal one), rewards that carry over.
- Profile card SVG reusing `hooks/art.ts`.
- Async PvP (D22): your crab duels snapshots of other players' heroes pulled from their gists; no one has to be online. Fights are deterministic from a shared seed so both sides compute the same result; they play in the band like a boss fight; a seasonal rating (Elo-style) climbs a ladder. Plausibility check: snapshots whose stats exceed what their level and gear allow are skipped and flagged on the site.
- GitHub connection (decided, D24: as painless as possible): use the `gh` CLI automatically when it is installed and logged in (zero setup); otherwise fall back to GitHub's device flow (the player opens github.com/login/device once and types a short code; the token is scoped to gists only and stored locally). The device flow needs a GitHub OAuth app registered on the owner's account; registering it is a separate owner approval at implementation time. Setup goal: one command, `/quest online on`, under a minute.
Then split implementation into Sonnet-sized cards.
Non-goals: a server, accounts, anti-cheat.
## Dependencies and ownership
Depends on v0.2 released (task-5). Owner: coordinator with the owner (grill-me), Opus. Implementation cards follow the spec.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Every bullet above has a decision in DECISIONS.md | review | DECISIONS rows | NOT_RUN |
| AC2 | Implementation cards written, each Sonnet-sized with files, criteria and commands | review | cards | NOT_RUN |
## Human gates
The owner approves what gets published and the opt-in flow before any code.
