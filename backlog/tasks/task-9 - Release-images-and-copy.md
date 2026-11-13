---
id: task-9
title: Release images and copy for v0.2.0
status: Verified
---
## Problem before solution
The owner's standing public release rule (2026-10-12): every README shows real screenshots or a GIF of the mod working, never a mockup, plus a keyword-rich description and GitHub topics. The v0.1 README has no images. Name is decided: Claude Quest (D13).
## Outcome and scope
- `tools/render_scenes.ts` (or .py): renders REAL scenes from `hooks/art.ts` (`sceneSvg`, `stripSvg`) for a made-up hero (never the owner's name) in states: fight (Act I), boss fight, fishing at camp, town, death, a map tier in the Atlas, and the one-line strip. Write SVGs, then convert to PNG with headless Edge (`msedge --headless --disable-gpu --screenshot=<png> --window-size=<w>,<h> <svg file url>`) or another tool already on the machine; no installs. Output to `docs/images/` (PNG, small: under 300 KB each).
- Optional animated GIF of the scene loop if an encoder is already installed (ffmpeg is on PATH): capture a few headless frames over time. Skip if it needs an install.
- README.md: add a hero image at the top and a short gallery; document `/quest band strip|pop|full|off`, stats trained by the kind of work, the slower long-term pacing (see D9), and that it costs zero tokens. Keep the install steps and the not-affiliated line. Plain words, no em dashes.
- CHANGELOG.md: v0.1.0 and v0.2.0 entries (v0.2.0: stat training from work kind, band modes, slower pacing, live work animation, Claude Mod Hider support).
- `docs/RELEASE_COPY.md`: the repo description (under 350 characters, contains "Claude Code", "idle", "ARPG", "mod") and the topic list (claude-code, claude-code-plugin, claude-code-mod, idle-game, rpg, arpg, plus up to 4 more that fit), for the coordinator to apply at release.
Non-goals: game logic, `hooks/register.tsx`, `hooks/game.ts`, pushing, setting topics on GitHub.
## Dependencies and ownership
Depends on task-4 (merged). Owned files: `tools/render_scenes.*`, `docs/images/`, `README.md`, `CHANGELOG.md`, `docs/RELEASE_COPY.md`. task-3 owns `hooks/game.ts` and task-7 owns `hooks/register.tsx` and `hooks/art.ts` at the same time: read only. Pacing numbers in the README must not promise exact days until task-3 returns; say "a multi-year climb to 99" instead.
Execution: worker chat, Sonnet, medium effort.
## Acceptance and evidence
| ID | Criterion | Scenario/assertion | Required evidence | Result |
|---|---|---|---|---|
| AC1 | Images are real renders of the current art | the render script imports `hooks/art.ts`; rerunning it reproduces the PNGs | script path and command | PASS: `tools/render_scenes.ts` imports `hooks/art.ts` and `hooks/game.ts`, plays a seeded hero (Brindle) for two simulated days with the real engine, renders with `sceneSvg`/`stripSvg`, converts via headless Edge. Rerun: `npx --no-install tsx tools/render_scenes.ts` |
| AC2 | At least 6 PNGs covering fight, boss, camp skill, town, death, strip | files in `docs/images/` | file list with sizes | PASS: 8 PNG + 1 GIF in `docs/images/`: fight, boss, atlas, fishing, mining, town, death, strip (12-75 KB each), fight.gif (57 KB, 24 frames) |
| AC3 | README shows them and documents v0.2 features | README diff | diff | PASS: README hero GIF, gallery, stats from work kind, band modes, multi-year pacing wording, zero tokens, Mod Hider |
| AC4 | No owner name, personal email or user path anywhere in the diff or images' text | grep the diff and the SVG sources | grep output | PASS: no em/en dashes in new files; grep for name, email, user paths finds only fake `C:/Users/me` paths in existing tests; images are pixel renders of scene text with a made-up hero |
| AC5 | Whole check passes | `python tools/game_check.py run --root .` then `verify` | last lines | PASS: check run PASS, verify: receipt matches current inputs and recorded artifacts |
## Human gates
The owner looks at the images before the push.
## Recovery and return condition
Own branch. Return when AC1-AC5 have evidence, or if no headless renderer is available without an install (say so).


## Log
- Worker built render script, images, README gallery, CHANGELOG, RELEASE_COPY. Images looked at one by one; boss name needed a 960 px width, strike frames retimed to show the swing. Branch had an unrelated root, reset to main first. Next: the owner looks at the images; coordinator merges, applies description and topics at release.

2026-10-12, coordinator review: merged; re-render after task-7 produced identical PNGs (live effects only show during a turn). Viewed fight.png: real render, readable. The owner still looks at the images before the push. Images will be redone after the art pass (D16 crab hero) in v0.2.2.
