# Coordinator handoff
Packet version: 1 | Prepared: 2026-10-13 | Project/task: Claude Quest v0.2 coordination
Delivery: shared workspace (same PC, same repo; new Claude account) | Recipient role: lead (coordinator)

## Paste-ready brief
Objective/player outcome: Claude Quest is an idle ARPG mod for Claude Code. A little orange pixel crab fights above the prompt, powered by the owner's real work, zero tokens. v0.2.0 ships the long multi-year grind, the smaller band, live work animation and the crab art.
Current state and exact next step: see STATE.md. Art is done and merged (task-11 library, task-16 wiring and re-rendered README images). The only blocker for v0.2.0 is task-3 pacing: WIP commit e8c5c60 on branch claude/youthful-liskov-6d8d90 has the curve mechanism but no fit. Next step: spawn a fresh task-3 worker chip (Sonnet high) with the method in the task-3 card Log, then task-10 gear upgrades, then task-5 release.
Authorized scope/non-goals: coordinator plans, interviews the owner, writes cards, runs workers, merges worker branches into claude/nice-tharp-fe2503, runs the check and fast-forwards local main. No pushes, releases, GitHub settings, OAuth apps or installs without the owner's yes. Do no large implementation yourself.
Approved decisions and rejected directions: docs/DECISIONS.md D1 to D27. Newest (2026-10-12/13): D25 random identity "the wandering arsenal" (one permanent crab, loot decides style and title, random stat growth, powerless birth labels, work is fuel only; supersedes D7, D19, D20, D21: no class or race picker, no reroll, no work-kind stat training), D26 downtime layer (campfire and Rested pool, Farming, Expeditions, welcome back), D27 random events and humor (Godville and Progress Quest style). Rejected: work-based builds, daily scheduled job rolls, "Bone Ranger", renaming the game, showing every gear slot.
Open choices and outstanding human gates: D-OPEN-2 band mode (owner tries strip, pop, full after install); D-OPEN-3 paid Steam spin-off idea (after v0.3; needs its own name and mascot); pacing day table review (task-3); look of the re-rendered images and live band (task-16 risks: crab mostly hidden under robe and wings in stills, bosses only crab height); every push and release. The owner may paste back a ChatGPT answer about progression and jobs (prompt was given 2026-10-13): fold what fits into D25 to D27 and cards, check it against D9 pacing.
Technical verification: whole check PASS on 45cc02c (validate, 32 tests per the task-16 worker, strict tsc). Not rerun after this handoff commit (docs only; the check excludes docs, STATE and backlog).
Ownership: no worker is running. Old account's worker chats (task-3 local_cc2c23c8, task-11, task-16) are finished or stopped; ignore them.
Coordination: coordinator on Opus; workers Sonnet (medium or high per card), at most 3 at once, fewer while the PC lags. Chips open on Opus: stop, set_session_model claude-sonnet-5-5, set_session_effort, send "continue", confirm with get_session.
Expected return: progress through task-3, task-10, task-5 with evidence in each card; the owner's approvals recorded in DECISIONS and cards.

## Files and evidence
Source/build identity: coordinator worktree `.claude/worktrees/nice-tharp-fe2503`, branch claude/nice-tharp-fe2503; local main fast-forwarded to the same commit. Nothing pushed since v0.1.0; origin/main is the privacy-rewritten root.
Required inputs: AGENTS.md, STATE.md, docs/DECISIONS.md, docs/ROADMAP.md, backlog/tasks/ (task-3, 5, 6, 10, 12 to 16 are the live ones), ~/.claude/claude-quest-dev.md (local-only paths, install and push recipe).
Commands actually run and environment: Windows 11, `python tools/game_check.py run --root .` then `verify`, at BelowNormal priority, one process at a time.
Evidence: docs/art/samples (approved sheets), docs/images (re-rendered with the crab), card Result columns.
Failed hypotheses and risks: task-3 parallel 400-day simulations (12 at once, 35 min per round) lagged the PC and lost outputs; use short sampled runs plus analytic milestone math. Chips sometimes open in the main checkout: tell workers to use their own worktree. The Claude Code test kit cannot set another plugin's state (claude-mod-hider live check stays manual).
Missing capabilities/attachments: none; same machine.

## Standing rules (the owner's, carry into every worker prompt)
- No em dashes anywhere (files, comments, commits, chat).
- Never put the owner's real name, personal email or user paths in anything that reaches GitHub; use the handle finalpantasy; grep before every push.
- One headless game, test, render or simulation process at a time, BelowNormal priority, under 10 minutes, kill leftovers.
- No Codex bridge agents (astra, sol, luna) without the owner's yes; second opinions go through a ChatGPT web prompt.
- Ask before every push or release. Public releases need real screenshots, keyword description and topics (see the task-5 card).
- The owner's global output rules: answer first, short, numbered steps, an Asks block with recommendations at the end.

## Resume instruction
Read this packet, AGENTS.md and STATE.md. Briefly confirm the current task, accessible tools and files, and the next action. Preserve scope, accepted and rejected decisions, human gates. Do not rerun the interview or imply inherited tests were rerun. Return actual changes, tests and results, unresolved issues and the exact next step. Do not send, publish, spend, switch accounts or change access without the owner's authorization.
