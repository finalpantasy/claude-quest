# Claude Quest

An idle ARPG that plays itself above your prompt in Claude Code. Your real work in Claude powers the fights; while you are away, your hero camps and fishes, mines and digs. It never calls a model, so it costs zero tokens.

> Early access: built on Claude Code mods (function hooks), which may change between releases. Expect frequent updates.

## Install

```
/plugin marketplace add finalpantasy/claude-quest
/plugin install claude-quest@claude-quest
```

Restart Claude Code. Your hero wakes up on its own. Type `/quest` to open the character sheet.

## How it plays

- **Hands-off.** You make no choices. The hero picks its own class from how you work (after 50 actions), equips its own loot, crafts, gambles and pushes its own maps.
- **Work is fuel.** Edits, commands, reads, agents and turns bank Focus. Focus is combat time. No Focus left, the hero walks back to camp.
- **Camp life skills.** Fishing, Mining and Archaeology gather; Cooking, Smithing and Alchemy turn the haul into meals, gear quality and elixirs. Every skill also gives a small permanent combat perk.
- **A long grind.** RuneScape's XP curve with no cap: 92 is half of 99, and past 99 it keeps doubling every seven levels.
- **ARPG loot.** Normal to unique, set pieces, ancient and primal rolls, gems, Path of Exile style currency orbs, a Horadric Compiler for legendary powers.
- **A campaign, then forever.** Five acts, then the Atlas of Repos: map tiers without end.
- **Your habits matter.** A commit summons a treasure goblin. Green tests can light a shrine. Compacting early earns Well Rested. A daily bounty board rewards real work.

## The screen

- Above the prompt: a little animated scene (desktop app) or a one-line ticker (terminal).
- `/quest`: tabs for Hero, Gear, Party, Life, Log and Codex (achievements and legendary powers).
- `/quest ticker` hides or shows the scene above the prompt. `/quest quiet` turns toasts off.

## Cheap to run

Every animation is CSS inside one SVG, run by the compositor. The mod redraws only when the hero starts a new task. A save is about 12 KB. One session at a time runs the game; the others watch.

## Where your data lives

Everything stays on your machine in `~/.claude/claude-quest/`: the hero save, a lease file, and a small counts file per session. Nothing is sent anywhere. Delete the folder to start over.

## Not affiliated

A fan-made mod. Not made, endorsed or supported by Anthropic.

## License

MIT
