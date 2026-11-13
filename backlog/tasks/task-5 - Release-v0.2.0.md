---
id: task-5
title: Release v0.2.0
status: Planned
---
## Problem before solution
v0.2 changes (task-2 training, task-3 pacing, task-4 band) must reach the owner's install and the public repo safely.
## Outcome and scope
Integrate task-2, 3 and 4 on main; bump `.claude-plugin/plugin.json` to 0.2.0; update README (band modes, training from work kind, slower pacing note); add CHANGELOG.md; run the publish-mod lint and release checklist (no leaked keys or absolute user paths, install steps, credits and AI disclosure, versioning); update the local install. Push and tag only after the owner says yes.
History: origin/main was rewritten on 2026-10-12 to remove the owner's name (new root d7a01a9 replaces 73d1fe1). Fetch, then squash or rebase the v0.2 work onto origin/main so no pushed commit carries the old root or the name; run the private pre-push grep from the local notes before pushing.
Public release rules (owner's standing rule, 2026-10-12): a searchable product-style name with the platform keyword, a keyword-rich repo description, GitHub topics (claude-code, claude-code-plugin, claude-code-mod, idle-game, rpg, arpg), and a README with REAL images: render actual scenes from `hooks/art.ts` to PNG (fight, boss, fishing, town, death, plus the strip) or, better, a capture of the band in the app; never a mockup. Name: "Claude Quest" (D13, decided).
Save compatibility: load the owner's current hero.json (copy into a temp folder) through the new code and confirm it loads, keeps its level and gains XP.
## Dependencies and ownership
Depends on task-2, task-3, task-4, task-7, task-9 Verified and the art pass (task-11 approved by the owner, phase B wired, README images re-rendered with the crab; D18), and the owner's pacing table review (task-3 human gate). Owner: coordinator (local, Opus).
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Integrated main passes the whole check | `game_check.py run` and `verify` on main | last lines | NOT_RUN |
| AC2 | Lint clean | grep for keys, tokens, absolute user paths, em dashes in committed files | grep output | NOT_RUN |
| AC3 | Old save loads | copy of the live save through `applyCounts` and `step` in a scratch script | output | NOT_RUN |
| AC4 | Local install updated | `claude plugin marketplace update <local marketplace>`, `claude plugin update claude-quest@<local marketplace>`, version shows 0.2.0 | output | NOT_RUN |
| AC6 | README shows real rendered scenes and the topics and description are set | images in `docs/images/`, rendered from art.ts or captured; topics read back with `gh repo view` | files and output | NOT_RUN |
| AC5 | Public push and tag | only after the owner's yes; remote main and tag v0.2.0 match local | `git ls-remote` | NOT_RUN |
## Human gates
The owner approves the pacing table, then the push and tag.
## Recovery and return condition
Tag only after push is confirmed. If the old save fails to load, stop and fix before any release.
