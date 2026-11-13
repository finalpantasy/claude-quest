// Every word the game says: acts, monsters, loot, powers, skills. Tables only, no logic, no tokens.
import type { Slot, StatKey } from '../types'

export type Act = { name: string; zones: string[]; foes: string[]; boss: string; sky: string; ground: string }

export const ACTS: Act[] = [
  {
    name: 'Act I: The Fresh Clone', sky: '#1d2433', ground: '#3b3226',
    zones: ['The Repo Root', 'Cellar of node_modules', 'The Forgotten Branches', 'Cathedral of Config', 'The Lint Fields'],
    foes: ['Null Pointer', 'Off-By-One', 'Typo Imp', 'Unused Import', 'Stray Semicolon', 'Magic Number', 'Dead Code Zombie', 'TODO Wraith', 'Segfault Slime', 'Linter Imp', 'Hollow Skull', 'Null Bat'],
    boss: 'The Butcher of Builds',
  },
  {
    name: 'Act II: The Dependency Wars', sky: '#3a2a1a', ground: '#7a5a2e',
    zones: ['Desert of Deprecation', 'Lockfile Oasis', 'Tomb of Left-Pad', 'The Version Pyramids', 'Peer Dependency Palace'],
    foes: ['Breaking Change', 'Transitive Dep', 'Phantom Package', 'Semver Scarab', 'Postinstall Script', 'Polyfill Mummy', 'Diamond Dependency', 'CVE Jackal', 'Dependency Spider', 'Cache Scarab', 'Wrapper Mummy', 'Fuzz Jackal'],
    boss: 'Duriel, Lord of node_modules',
  },
  {
    name: 'Act III: Merge Hell', sky: '#102a1e', ground: '#24402c',
    zones: ['The Rebase Swamps', 'Conflict Marshes', 'Temple of the Detached HEAD', 'Cherry-Pick Jungle', 'The Force-Push Cliffs'],
    foes: ['Merge Conflict', 'Detached HEAD', 'Rebase Ghoul', 'Stash Hoarder', 'Squash Golem', 'Orphan Commit', 'Blame Specter', 'Hook Lurker', 'Rebase Knight', 'Bonehead Merge', 'Toad of Types', 'Callback Kraken'],
    boss: 'Mephisto the Monorepo',
  },
  {
    name: 'Act IV: Production', sky: '#2a0d0d', ground: '#4a1c14',
    zones: ['The Staging Gates', 'Plains of Hotfix', 'River of Logs', 'The Pager Spire', 'The 3AM Sanctum'],
    foes: ['Heisenbug', 'Race Condition', 'Memory Leak', 'Deadlock Demon', 'Cache Stampede', 'Timezone Fiend', 'Flaky Test', 'Cron Horror', 'Pager Demon', 'Zombie Process', 'Hornet of Hotfix', 'Spinlock Spider'],
    boss: 'Diablo, the Prod Incident',
  },
  {
    name: 'Act V: The Legacy Mountains', sky: '#1a2236', ground: '#5c6474',
    zones: ['The COBOL Peaks', 'Mainframe Halls', 'The Frozen Monolith', 'Worldstone Server Room', "The Ancients' Datacenter"],
    foes: ['Spaghetti Golem', 'God Object', 'Singleton Cultist', 'XML Yeti', 'SOAP Elemental', 'Y2K Revenant', 'Goto Gargoyle', 'Stored Procedure Shaman', 'Monolith Golem', 'Legacy Skeleton', 'Ice Cache Yeti', 'Mutex Golem'],
    boss: 'Baal, Lord of Technical Debt',
  },
]

/** The endgame: the Atlas of Repos, map tiers without end. */
export const ATLAS = { sky: '#1b0f2e', ground: '#2e1a4a', foes: ACTS.flatMap(a => a.foes) }
export const MAPS = ['Monorepo Map', 'Microservice Maze', 'Serverless Void', 'Kubernetes Cluster', 'Legacy Vault', 'Data Lake', 'Spaghetti Labyrinth', 'Sprint Graveyard', 'Hackathon Ruins', 'Staging Mirror', 'Incident Bridge', "The Shaper's Repo", 'Feature Flag Forest', 'Webhook Wastes', 'Regex Catacombs', 'Dotfile Barrens', 'The Changelog Archive', 'Cron Clocktower', 'Sandbox Dunes', 'Firewall Ramparts', 'Shard Abyss', 'The Retro Board', 'Release Train Yard', 'Rollback Rapids', 'Frozen Branch', 'Tech Debt Bog', 'Zombie Process Crypt', 'Memory Leak Caldera', 'Dependency Jungle', 'Cold Storage Tundra', 'Race Condition Raceway', 'Deadlock Glacier', 'Off-by-One Orchard', 'Null Pointer Swamp', 'Throttled Highlands', 'Hotfix Hellmouth']
export const MAP_BOSSES = ['The Infinite Loop', 'Kernel Panic Incarnate', 'The Undying Monolith', 'Scope Creep, the Ever-Growing', 'The Midnight Deploy', 'The Unreproducible', 'The Shaper of Specs', 'The Elder Codebase', 'The Eternal Standup', 'Bikeshed Colossus', 'The Ticket That Reopens', 'Queen of the Backlog', 'The Hundred-Line Diff', 'Warden of the Firewall', 'The Phantom Requirement', 'The Last Migration', 'The Flaky Test, Twice Removed', 'The Orphaned Branch', 'Lord of the Lockfile', 'The Silent Failure', 'The Wontfix Wyrm', 'The Pager at 3 AM']

export const ADJ = ['Feral', 'Rabid', 'Undocumented', 'Deprecated', 'Flaky', 'Legacy', 'Cursed', 'Recursive', 'Orphaned', 'Unhandled', 'Leaky', 'Zombie', 'Minified', 'Haunted', 'Untested', 'Mutable', 'Nullable', 'Async', 'Hardcoded', 'Global', 'Overengineered', 'Copy-Pasted', 'Unreviewed', 'Hot-Reloaded', 'Thread-Unsafe', 'Off-Spec', 'Circular', 'Bloated', 'Uncommented', 'Bikeshedded', 'Vendored', 'Shadowed', 'Memoized', 'Stale', 'Overfit', 'Yanked']

/** Elite affixes: what each does to the fight (more life, more damage, more monsters) and the line the log tells about it. */
export type EliteMod = { name: string; hp?: number; dmg?: number; count?: number; text: string }
export const ELITE: EliteMod[] = [
  { name: 'Fast', dmg: 0.3, text: 'strikes before you finish typing' }, { name: 'Extra Health', hp: 0.6, text: 'has far more lines than it should' },
  { name: 'Vampiric', hp: 0.3, text: 'drinks a little life with every bite' }, { name: 'Molten', dmg: 0.4, text: 'leaves burning pools behind' },
  { name: 'Frozen', dmg: 0.25, text: 'drops ice that locks you in place' }, { name: 'Arcane Enchanted', dmg: 0.45, text: 'spins a beam of pure syntax' },
  { name: 'Shielding', hp: 0.45, text: 'flickers behind a bubble' }, { name: 'Teleporter', hp: 0.2, text: 'is never where you swing' },
  { name: 'Plagued', dmg: 0.3, text: 'spreads a cloud of tiny bugs' }, { name: 'Jailer', dmg: 0.2, text: 'locks you in a cage of brackets' },
  { name: 'Horde', hp: 0.5, text: 'brought friends' }, { name: 'Mortar', dmg: 0.35, text: 'lobs exceptions from afar' },
  { name: 'Waller', hp: 0.25, text: 'builds walls of red tape' }, { name: 'Illusionist', hp: 0.4, text: 'splits into fake copies' },
  { name: 'Thunderstorm', dmg: 0.5, text: 'calls lightning down on your head' }, { name: 'Juggernaut', hp: 1, text: 'shrugs off nearly everything' },
  { name: 'Rate-Limited', hp: 0.45, text: 'answers only every third hit' }, { name: 'Auto-Scaling', hp: 0.5, text: 'grows a replica when hurt' },
  { name: 'Self-Healing', hp: 0.5, text: 'restarts itself mid-fight' }, { name: 'Retrying', dmg: 0.4, text: 'tries the same attack again, and again' },
  { name: 'Memoized', dmg: 0.35, text: 'remembers every dodge' }, { name: 'Load-Balanced', hp: 0.4, text: 'spreads the damage across the pack' },
  { name: 'Obfuscated', hp: 0.4, text: 'is hard to read and harder to hit' }, { name: 'Hot-Patched', dmg: 0.45, text: 'changes its moves at runtime' },
  { name: 'Overclocked', dmg: 0.45, text: 'hits hard and runs hot' }, { name: 'Containerized', hp: 0.45, text: 'hides behind three layers of isolation' },
  { name: 'Root Access', dmg: 0.5, text: 'ignores your permissions' }, { name: 'Garbage-Collected', hp: 0.3, text: 'vanishes and comes back tidied' },
  { name: 'Splitting', hp: 0.15, count: 1, text: 'forks into one more on the first hit' }, { name: 'Infinite Scroll', hp: 0.6, text: 'never seems to reach the end' },
]

/** Named monsters: one in two uniques in a place is one of these, with its own affixes, a line it says and a better drop. act -1 is the Atlas. */
export type NamedFoe = { act: number; name: string; base: string; mods: string[]; line: string }
export const NAMED: NamedFoe[] = [
  { act: 0, name: 'Old Greg the Gitignore', base: 'Unused Import', mods: ['Teleporter', 'Illusionist'], line: 'You cannot see me. I was never committed.' },
  { act: 0, name: 'Captain Semicolon', base: 'Stray Semicolon', mods: ['Fast', 'Retrying'], line: 'Every line ends with me!' },
  { act: 0, name: 'The Lint Baron', base: 'Linter Imp', mods: ['Jailer', 'Waller'], line: 'Trailing whitespace. Unforgivable.' },
  { act: 1, name: 'Lady Leftpad', base: 'Phantom Package', mods: ['Vampiric', 'Shielding'], line: 'Eleven lines, and the world falls with me.' },
  { act: 1, name: 'The Lockfile Pharaoh', base: 'Polyfill Mummy', mods: ['Extra Health', 'Containerized'], line: 'Pinned. Forever.' },
  { act: 1, name: 'Major Version Zero', base: 'Breaking Change', mods: ['Hot-Patched', 'Molten'], line: 'Nothing I promise is stable.' },
  { act: 2, name: 'Mother of Conflicts', base: 'Merge Conflict', mods: ['Splitting', 'Horde'], line: 'Come to mother. Both versions of you.' },
  { act: 2, name: 'Sir Force-Push', base: 'Rebase Knight', mods: ['Root Access', 'Fast'], line: 'History is what I say it is.' },
  { act: 2, name: 'The Stash Witch', base: 'Stash Hoarder', mods: ['Garbage-Collected', 'Plagued'], line: 'I keep everything you forgot.' },
  { act: 3, name: 'The 3AM Pager', base: 'Pager Demon', mods: ['Thunderstorm', 'Retrying'], line: 'Wake up. It is happening again.' },
  { act: 3, name: 'Count Heisen', base: 'Heisenbug', mods: ['Teleporter', 'Obfuscated'], line: 'Look at me and I am gone.' },
  { act: 3, name: 'Lord of Leaks', base: 'Memory Leak', mods: ['Auto-Scaling', 'Vampiric'], line: 'I only ever grow.' },
  { act: 4, name: 'The COBOL Elder', base: 'Y2K Revenant', mods: ['Juggernaut', 'Frozen'], line: 'I ran your bank before you were born.' },
  { act: 4, name: 'Grand Singleton', base: 'Singleton Cultist', mods: ['Shielding', 'Arcane Enchanted'], line: 'There can be only one instance.' },
  { act: 4, name: 'The Stored One', base: 'Stored Procedure Shaman', mods: ['Mortar', 'Self-Healing'], line: 'The logic lives in the database now.' },
  { act: -1, name: 'The Product Owner', base: 'God Object', mods: ['Infinite Scroll', 'Waller'], line: 'Just one more small change.' },
  { act: -1, name: 'Shadow IT', base: 'Phantom Package', mods: ['Obfuscated', 'Root Access'], line: 'Nobody approved me. Nobody can remove me.' },
  { act: -1, name: 'The Flaky One', base: 'Flaky Test', mods: ['Teleporter', 'Retrying'], line: 'Passed locally.' },
  { act: -1, name: 'The Debt Collector', base: 'Spaghetti Golem', mods: ['Juggernaut', 'Load-Balanced'], line: 'The interest is due.' },
  { act: -1, name: 'The Microservice Hydra', base: 'Merge Conflict', mods: ['Splitting', 'Auto-Scaling'], line: 'Cut one and two more deploy.' },
  { act: -1, name: 'The Unread Email', base: 'Dead Code Zombie', mods: ['Infinite Scroll', 'Frozen'], line: 'Per my last message.' },
]

export const VERBS = ['Executing', 'Debugging', 'Refactoring', 'Garbage-collecting', 'Profiling', 'Bisecting', 'Patching', 'Exorcising', 'Rubber-ducking', 'Deprecating', 'Sandboxing', 'Unit-testing']

export const SLOTS: Slot[] = ['weapon', 'offhand', 'head', 'chest', 'hands', 'waist', 'legs', 'feet', 'neck', 'ring', 'ring2']

export const BASES: Record<Slot, string[]> = {
  weapon: ['Mechanical Keyboard', 'Debugger Staff', 'Soldering Wand', 'Ethernet Flail', 'Stack Trace Spear', 'Rubber Mallet', 'Laser Pointer'],
  offhand: ['Rubber Duck Shield', 'Second Monitor', 'Orb of Coffee', 'Quiver of Tabs', 'Grimoire of Docs'],
  head: ['Noise-Cancelling Helm', 'Hoodie Hood', 'Thinking Cap', 'VR Visor', 'Headset of Standups'],
  chest: ['Hoodie of Holding', 'Flannel Plate', 'Kevlar Cardigan', 'Chainmail of Linting', 'Conference Tee'],
  hands: ['Wrist Brace Gauntlets', 'Fingerless Gloves', 'Carpal Wraps', 'Gaming Mitts', 'Anti-Static Gloves', 'Mouse-Hand Bracers', 'Knuckles of the Numpad'],
  waist: ['Lanyard Belt', 'Utility Belt of USB', 'Cable Sash', 'Belt of Dongles', 'Cable Tie Girdle', 'Fanny Pack of Snacks', 'Belt of Many Lanyards'],
  legs: ['Cargo Pants', 'Sweatpants of Comfort', 'Jorts', 'Standing-Desk Greaves', 'Pajama Bottoms of Remote', 'Hackathon Shorts', 'Ergonomic Chair Greaves'],
  feet: ['Crocs', 'Sandals of Standup', 'Slippers of Remote Work', 'Socks of Determinism', 'Boots of Long Commutes', 'Hoverboard Sabatons', 'Mismatched Socks'],
  neck: ['Lanyard Amulet', 'YubiKey Pendant', 'Badge of Access', 'Locket of Secrets', 'Visitor Lanyard', 'Talisman of the Monitor Arm', 'Charm of the Coffee Bean'],
  ring: ['Ring of Two-Factor', 'Band of Bandwidth', 'Loop of Recursion', 'Signet of Signing', 'Band of Bitwise', 'Ring of the Keychain', 'Ring of Least Privilege'],
  ring2: ['Ring of Two-Factor', 'Band of Bandwidth', 'Loop of Recursion', 'Signet of Signing', 'Band of Bitwise', 'Ring of the Keychain', 'Ring of Least Privilege'],
}

/** Each stat as an affix: how big a roll is at item level 1 and 70, and the words a magic item takes from it. */
export const AFFIX: Record<StatKey, { lo: number; hi: number; pre: string; suf: string; pct?: true; label: string }> = {
  str: { lo: 3, hi: 500, pre: 'Brutal', suf: 'of the Brute', label: 'Strength' },
  dex: { lo: 3, hi: 500, pre: 'Nimble', suf: 'of Reflexes', label: 'Dexterity' },
  int: { lo: 3, hi: 500, pre: 'Arcane', suf: 'of the Wizard', label: 'Intelligence' },
  vit: { lo: 3, hi: 500, pre: 'Stout', suf: 'of the Whale', label: 'Vitality' },
  crit: { lo: 1, hi: 6, pct: true, pre: 'Keen', suf: 'of Precision', label: 'Crit Chance' },
  critDmg: { lo: 5, hi: 50, pct: true, pre: 'Savage', suf: 'of Carnage', label: 'Crit Damage' },
  speed: { lo: 1, hi: 7, pct: true, pre: 'Swift', suf: 'of Haste', label: 'Attack Speed' },
  life: { lo: 2, hi: 15, pct: true, pre: 'Hale', suf: 'of Life', label: 'Life' },
  armor: { lo: 10, hi: 600, pre: 'Sturdy', suf: 'of Warding', label: 'Armor' },
  resist: { lo: 5, hi: 100, pre: 'Warded', suf: 'of the Elements', label: 'All Resist' },
  steal: { lo: 0.5, hi: 3, pct: true, pre: 'Vampiric', suf: 'of the Leech', label: 'Life Steal' },
  mf: { lo: 5, hi: 40, pct: true, pre: 'Lucky', suf: 'of Fortune', label: 'Magic Find' },
  gf: { lo: 5, hi: 50, pct: true, pre: 'Gilded', suf: 'of Greed', label: 'Gold Find' },
  xp: { lo: 3, hi: 25, pct: true, pre: 'Wise', suf: 'of Learning', label: 'Bonus XP' },
  dmg: { lo: 2, hi: 20, pct: true, pre: 'Deadly', suf: 'of Slaying', label: 'Damage' },
  elite: { lo: 2, hi: 15, pct: true, pre: 'Hunting', suf: 'of the Hunt', label: 'Elite Damage' },
  area: { lo: 3, hi: 24, pct: true, pre: 'Sweeping', suf: 'of the Storm', label: 'Area Damage' },
}

export const RARE_A = ['Doom', 'Grim', 'Hex', 'Storm', 'Blood', 'Dread', 'Rune', 'Void', 'Glyph', 'Bone', 'Ash', 'Kernel', 'Shadow', 'Null', 'Chaos', 'Iron']
export const RARE_B = ['Buffer', 'Pipeline', 'Mantle', 'Thread', 'Socket', 'Daemon', 'Coil', 'Shard', 'Branch', 'Fork', 'Handle', 'Vault', 'Patch', 'Commit', 'Grip', 'Ward']

/** A legendary power: a few numbers on the hero, a line of flavor. `g` is its Horadric Compiler group: weapon, armor or jewelry. */
export type Power = { id: string; item: string; slot: Slot; g: 'w' | 'a' | 'j'; text: string; fx: Partial<Record<StatKey | 'dr' | 'mult', number>> }

export const POWERS: Power[] = [
  { id: 'duck', item: 'The Rubber Duck', slot: 'offhand', g: 'a', text: 'Monsters explain themselves to it and die: +12% crit chance', fx: { crit: 12 } },
  { id: 'so', item: "Stack Overflow's Accepted Answer", slot: 'weapon', g: 'w', text: 'Copied without reading: x1.6 damage', fx: { mult: 0.6 } },
  { id: 'vim', item: 'Escape Key of Vim', slot: 'weapon', g: 'w', text: 'Nobody ever leaves: +40% elite damage', fx: { elite: 40 } },
  { id: 'regex', item: 'The Regex That Works', slot: 'neck', g: 'j', text: 'Nobody knows why: +60% crit damage', fx: { critDmg: 60 } },
  { id: 'coffee', item: 'Bottomless Mug', slot: 'offhand', g: 'a', text: 'Infinite refills: +18% attack speed', fx: { speed: 18 } },
  { id: 'prod', item: 'Friday Deploy', slot: 'weapon', g: 'w', text: 'Lives dangerously: x2 damage, +25% damage taken', fx: { mult: 1, dr: -25 } },
  { id: 'tests', item: 'Ward of 100% Coverage', slot: 'chest', g: 'a', text: 'Every branch tested: 30% less damage taken', fx: { dr: 30 } },
  { id: 'cache', item: 'Ring of Warm Cache', slot: 'ring', g: 'j', text: 'Hits instead of misses: +100% gold and magic find', fx: { mf: 100, gf: 100 } },
  { id: 'senior', item: "The Senior Dev's Hoodie", slot: 'chest', g: 'a', text: 'Has seen this before: +35% life, +20% resist', fx: { life: 35, resist: 20 } },
  { id: 'monad', item: 'Monad of Understanding', slot: 'head', g: 'a', text: 'Finally gets it: +50% bonus XP', fx: { xp: 50 } },
  { id: 'fork', item: 'Fork Bomb Gauntlets', slot: 'hands', g: 'a', text: 'Every hit spawns two more: +60% area damage', fx: { area: 60 } },
  { id: 'gc', item: 'Belt of Garbage Collection', slot: 'waist', g: 'a', text: 'Cleans up after every fight: +3% life steal', fx: { steal: 3 } },
  { id: 'nonblock', item: 'Non-Blocking Boots', slot: 'feet', g: 'a', text: 'Never waits on anything: +12% speed, +12% damage', fx: { speed: 12, dmg: 12 } },
  { id: 'root', item: 'Signet of Root', slot: 'ring2', g: 'j', text: 'sudo everything: x1.4 damage', fx: { mult: 0.4 } },
  { id: 'immut', item: 'Immutable Greaves', slot: 'legs', g: 'a', text: 'Nothing changes them: 20% less damage taken', fx: { dr: 20 } },
  { id: 'yubi', item: 'Key of Hardware Trust', slot: 'neck', g: 'j', text: 'Unphishable: +60% elite damage', fx: { elite: 60 } },
  { id: 'lambda', item: 'Lambda Staff of the Ancients', slot: 'weapon', g: 'w', text: 'Pure functions only: +8% crit, +40% crit damage', fx: { crit: 8, critDmg: 40 } },
  { id: 'kanban', item: 'Cloak of the Kanban', slot: 'head', g: 'a', text: 'Work in progress limited: +40% damage', fx: { dmg: 40 } },
  { id: 'precommit', item: 'Pre-Commit Hook', slot: 'hands', g: 'a', text: 'Nothing bad gets through: +25% resist', fx: { resist: 25 } },
  { id: 'pair', item: 'Pair Programmer Locket', slot: 'neck', g: 'j', text: 'Two heads, one keyboard: +30% damage, +10% speed', fx: { dmg: 30, speed: 10 } },
  { id: 'oncall', item: 'Pager of the On-Call', slot: 'waist', g: 'a', text: 'Always awake: +25% life, +2% life steal', fx: { life: 25, steal: 2 } },
  { id: 'bisect', item: 'Blade of Git Bisect', slot: 'weapon', g: 'w', text: 'Halves the search every swing: x1.5 damage', fx: { mult: 0.5 } },
  { id: 'darkmode', item: 'Visor of Dark Mode', slot: 'head', g: 'a', text: 'Easy on the eyes: +10% crit chance, +20% crit damage', fx: { crit: 10, critDmg: 20 } },
  { id: 'eventloop', item: 'Ring of the Event Loop', slot: 'ring', g: 'j', text: 'Never blocks: +20% attack speed', fx: { speed: 20 } },
  { id: 'standup', item: 'Treads of the Short Standup', slot: 'feet', g: 'a', text: 'In and out in five minutes: +15% speed, 10% less damage taken', fx: { speed: 15, dr: 10 } },
]

/** Sets: four pieces each, a bonus at two and at four worn. */
export type GearSet = { id: string; name: string; pieces: { slot: Slot; name: string }[]; two: Partial<Record<StatKey | 'dr' | 'mult', number>>; four: Partial<Record<StatKey | 'dr' | 'mult', number>>; twoText: string; fourText: string }

export const SETS: GearSet[] = [
  {
    id: 'vim', name: "Vim Master's Regalia",
    pieces: [{ slot: 'head', name: 'Modal Crown' }, { slot: 'chest', name: 'Hjkl Hauberk' }, { slot: 'hands', name: 'Gauntlets of :wq' }, { slot: 'feet', name: 'Treads of the Leader Key' }],
    two: { speed: 20 }, four: { mult: 2 }, twoText: '+20% attack speed', fourText: 'x3 damage',
  },
  {
    id: 'emacs', name: "Emacs Pilgrim's Vestments",
    pieces: [{ slot: 'chest', name: 'Robe of Elisp' }, { slot: 'legs', name: 'Pinky-Strain Leggings' }, { slot: 'waist', name: 'Cord of Many Buffers' }, { slot: 'neck', name: 'Org-Mode Phylactery' }],
    two: { life: 40 }, four: { mult: 1.5, dr: 25 }, twoText: '+40% life', fourText: 'x2.5 damage, 25% less damage taken',
  },
  {
    id: 'tenx', name: "The Ten-X Engineer's Kit",
    pieces: [{ slot: 'weapon', name: 'Keyboard of Ten Fingers' }, { slot: 'offhand', name: 'Third Monitor' }, { slot: 'ring', name: 'Band of Ninety-Hour Weeks' }, { slot: 'ring2', name: 'Loop of Burnout' }],
    two: { crit: 10 }, four: { mult: 2.5, dr: -20 }, twoText: '+10% crit chance', fourText: 'x3.5 damage, 20% more damage taken',
  },
  {
    id: 'oncall', name: 'The On-Call Rotation',
    pieces: [{ slot: 'head', name: 'Headset of 3AM' }, { slot: 'hands', name: 'Gloves of the Runbook' }, { slot: 'legs', name: 'Pajama Greaves' }, { slot: 'waist', name: 'Belt of Escalation' }],
    two: { resist: 20 }, four: { mult: 2, life: 30 }, twoText: '+20% resist', fourText: 'x3 damage, +30% life',
  },
]

export type ClassDef = { id: string; name: string; main: 'str' | 'dex' | 'int'; color: string; trim: string; weaponGlyph: 'sword' | 'staff' | 'bow' | 'scythe' | 'dagger'; skills: { name: string; k: StatKey | 'dr' | 'mult'; per: number }[] }

/** The five classes; a hero awakens as the one its person plays most like. */
export const CLASSES: Record<string, ClassDef> = {
  sorcerer: {
    id: 'sorcerer', name: 'Shell Sorcerer', main: 'int', color: '#5b6ee1', trim: '#c8d0ff', weaponGlyph: 'staff',
    skills: [{ name: 'Pipe Bolt', k: 'dmg', per: 5 }, { name: 'Grep Nova', k: 'area', per: 6 }, { name: 'Sudo Armor', k: 'dr', per: 2 }, { name: 'Fork Bomb', k: 'mult', per: 0.06 }, { name: 'Cron Familiar', k: 'speed', per: 2 }, { name: 'Kill -9', k: 'crit', per: 1 }],
  },
  paladin: {
    id: 'paladin', name: 'Refactor Paladin', main: 'str', color: '#d9a441', trim: '#fff1c4', weaponGlyph: 'sword',
    skills: [{ name: 'Smite Duplication', k: 'dmg', per: 5 }, { name: 'Aura of Clean Code', k: 'dr', per: 2.5 }, { name: 'Blessed Rename', k: 'life', per: 4 }, { name: 'Holy Extract Method', k: 'mult', per: 0.06 }, { name: 'Zeal of DRY', k: 'speed', per: 2 }, { name: 'Judgment of Types', k: 'critDmg', per: 5 }],
  },
  ranger: {
    id: 'ranger', name: 'Grep Ranger', main: 'dex', color: '#3fae6a', trim: '#c8f5d8', weaponGlyph: 'bow',
    skills: [{ name: 'Multishot Glob', k: 'area', per: 7 }, { name: 'Eagle Eye Read', k: 'crit', per: 1.2 }, { name: 'Trap of Breakpoints', k: 'elite', per: 5 }, { name: 'Rain of Regex', k: 'mult', per: 0.06 }, { name: 'Evasive Tail', k: 'dr', per: 2 }, { name: 'Hunter of Lines', k: 'dmg', per: 4 }],
  },
  necromancer: {
    id: 'necromancer', name: 'Swarm Necromancer', main: 'int', color: '#8d5bd6', trim: '#e4d2ff', weaponGlyph: 'scythe',
    skills: [{ name: 'Raise Subagent', k: 'mult', per: 0.07 }, { name: 'Bone Spear of Context', k: 'dmg', per: 5 }, { name: 'Corpse Explosion', k: 'area', per: 7 }, { name: 'Decrepify', k: 'dr', per: 2 }, { name: 'Blood Golem', k: 'steal', per: 0.4 }, { name: 'Command Skeletons', k: 'elite', per: 4 }],
  },
  rogue: {
    id: 'rogue', name: 'Web Rogue', main: 'dex', color: '#d4534f', trim: '#ffd0ce', weaponGlyph: 'dagger',
    skills: [{ name: 'Fetch Strike', k: 'dmg', per: 5 }, { name: 'Crawl Step', k: 'speed', per: 2.5 }, { name: 'Smoke Screen', k: 'dr', per: 2 }, { name: 'Death From Above', k: 'critDmg', per: 6 }, { name: 'Poisoned Cookie', k: 'mult', per: 0.06 }, { name: 'Pickpocket', k: 'gf', per: 8 }],
  },
}

export const APPRENTICE: ClassDef = { id: 'apprentice', name: 'Apprentice', main: 'str', color: '#9a8f80', trim: '#e8e0d0', weaponGlyph: 'sword', skills: [] }

/** Races: whichever model drives the session, live. */
export const RACES: { match: RegExp; name: string; fx: Partial<Record<StatKey | 'dr' | 'mult', number>>; text: string }[] = [
  { match: /opus/i, name: 'Opus Giant', fx: { mult: 0.2, speed: -8 }, text: 'x1.2 damage, slower swings' },
  { match: /sonnet/i, name: 'Sonnet Elf', fx: { speed: 15, crit: 3 }, text: '+15% attack speed, +3% crit' },
  { match: /haiku/i, name: 'Haiku Halfling', fx: { mf: 40, gf: 40 }, text: '+40% magic and gold find' },
  { match: /fable/i, name: 'Fable Dragonkin', fx: { mult: 0.1, dr: 10, xp: 10 }, text: 'a little of everything' },
]
export const NO_RACE = { name: 'Wandering Construct', fx: {}, text: 'no bonus' }

export const FOLLOWERS = ['Templar of Tests', 'Scoundrel of Scripts', 'Enchantress of Docs', 'Squire of Stand-ups', 'Bard of Release Notes']
export const MINIONS = ['Skeletal Subagent', 'Ghoul of Grep', 'Spectral Linter', 'Bone Formatter']

export const SHRINES: { name: string; k: StatKey | 'mult' | 'dr'; v: number }[] = [
  { name: 'Frenzied Shrine', k: 'speed', v: 25 }, { name: 'Fortune Shrine', k: 'mf', v: 100 }, { name: 'Enlightened Shrine', k: 'xp', v: 50 },
  { name: 'Empowered Shrine', k: 'mult', v: 0.5 }, { name: 'Blessed Shrine', k: 'dr', v: 40 },
]

export const GEMS = ['Ruby', 'Emerald', 'Topaz', 'Amethyst', 'Diamond'] as const
export const GEM_TIERS = ['Chipped', 'Flawed', '', 'Flawless', 'Perfect', 'Royal', 'Imperial', 'Marquise']
/** What a gem gives per tier, by the slot type it sits in. */
export const GEM_FX: Record<(typeof GEMS)[number], { k: StatKey; per: number }> = {
  Ruby: { k: 'dmg', per: 2 }, Emerald: { k: 'critDmg', per: 8 }, Topaz: { k: 'mf', per: 6 }, Amethyst: { k: 'life', per: 3 }, Diamond: { k: 'resist', per: 12 },
}

/** Currency orbs, Path of Exile style: auto-spent in town on the hero's own gear. */
export const CURRENCY = [
  { id: 'refactor', name: 'Orb of Refactoring', chance: 0.03, text: 'rerolls a magic item' },
  { id: 'chaos', name: 'Chaos Commit', chance: 0.01, text: 'rerolls a rare item' },
  { id: 'divine', name: 'Divine Rebase', chance: 0.001, text: 'rerolls the numbers' },
  { id: 'exalt', name: 'Exalted Merge', chance: 0.0005, text: 'adds an affix' },
  { id: 'jeweler', name: "Jeweller's Patch", chance: 0.006, text: 'adds a socket' },
  { id: 'mirror', name: 'Mirror of Prod', chance: 0.000005, text: 'x2 damage, forever' },
] as const

/** Passive tree keystones, taken at these hero levels. */
export const KEYSTONES: { at: number; name: string; text: string; fx: Partial<Record<StatKey | 'dr' | 'mult', number>> }[] = [
  { at: 20, name: 'Resolute Technique', text: 'x1.3 damage', fx: { mult: 0.3 } },
  { at: 40, name: 'Iron Will', text: '+40% life', fx: { life: 40 } },
  { at: 60, name: 'Elemental Overload', text: '+60% crit damage', fx: { critDmg: 60 } },
  { at: 75, name: 'Mind Over Matter', text: '20% less damage taken', fx: { dr: 20 } },
  { at: 85, name: 'Avatar of the Storm', text: '+80% area damage', fx: { area: 80 } },
  { at: 92, name: 'Acrobatics', text: '+15% speed, 10% less damage taken', fx: { speed: 15, dr: 10 } },
  { at: 99, name: 'Ancestral Bond', text: 'x1.5 damage', fx: { mult: 0.5 } },
  { at: 120, name: 'Eternal Youth', text: '+100% life, +50% XP', fx: { life: 100, xp: 50 } },
]
/** The small passives the tree hands out, one per level, round and round. */
export const PASSIVE_SMALL: { k: StatKey | 'dr'; v: number }[] = [
  { k: 'dmg', v: 2 }, { k: 'life', v: 2 }, { k: 'critDmg', v: 3 }, { k: 'speed', v: 0.6 }, { k: 'armor', v: 25 }, { k: 'resist', v: 4 }, { k: 'crit', v: 0.2 }, { k: 'mf', v: 2 },
]

// Life skills: what the hero does at camp while nobody is working.
export type FishSpot = { name: string; fish: string[]; legends: string[] }
export const FISH_SPOTS: FishSpot[] = [
  { name: 'Repo Root Pond', fish: ['Bugfish', 'Sardine Script', 'Byte Bass', 'Null Perch', 'Semicolon Smelt', 'Tabby Trout'], legends: ['Old Gil, the Senior Carp', 'The Linus Pike'] },
  { name: 'Lockfile Oasis', fish: ['Dependency Eel', 'Semver Sole', 'npm Minnow', 'Mirage Mackerel', 'Scarab Shrimp', 'Patch Pufferfish'], legends: ['Leviathan of Left-Pad', 'The Golden Lockfile Koi'] },
  { name: 'The Rebase Swamp', fish: ['Merge Mudskipper', 'Conflict Catfish', 'HEAD Hagfish', 'Stash Sturgeon', 'Cherry Barb', 'Squash Squid'], legends: ['The Great Rebase Gator', 'The Force-Push Pike'] },
  { name: 'River of Logs', fish: ['Log Lamprey', 'Stacktrace Stingray', 'Pager Piranha', 'Hotfix Halibut', 'Deadlock Dory', 'Cron Crab'], legends: ['Kraken of Kubernetes', 'The 3AM Anglerfish'] },
  { name: 'Frozen Monolith Lake', fish: ['COBOL Cod', 'Mainframe Marlin', 'Yeti Yellowtail', 'SOAP Sunfish', 'Goto Grouper', 'Mutex Muskellunge'], legends: ['The Y2K Coelacanth', 'Ancient One of Fortran'] },
  { name: 'Lake of Infinite Scroll', fish: ['Recursion Roach', 'Rift Ray', 'Void Salmon', 'Glitch Guppy', 'Fractal Flounder', 'Echo Eel'], legends: ['The Infinite Scroll Serpent', 'Mirror Carp of Prod'] },
]
export const JUNK = ['Soggy USB Stick', 'Lost AirPod', 'Tangled Ethernet Cable', 'Expired SSL Certificate', 'Old Floppy Disk', 'Drowned Rubber Duck', "Someone's YubiKey", 'Left Sock', 'Unread Pull Request']
export const RODS = [
  { at: 1, name: 'Twig Rod' }, { at: 10, name: 'Bamboo Rod' }, { at: 25, name: 'Carbon Rod' }, { at: 50, name: 'Mithril Rod' },
  { at: 75, name: 'Quantum Rod' }, { at: 99, name: 'Rod of Infinite Patience' }, { at: 120, name: 'The Rod That Fishes Back' },
]
export const ORES = [
  { at: 1, name: 'Copper Commit Ore' }, { at: 15, name: 'Iron Interface Ore' }, { at: 40, name: 'Mithril Module Ore' },
  { at: 70, name: 'Adamant Async Ore' }, { at: 85, name: 'Void Vector Ore' }, { at: 99, name: 'Singularity Ore' },
]
export const SHOVELS = [{ at: 1, name: 'Plastic Trowel' }, { at: 20, name: 'Brush and Trowel' }, { at: 60, name: 'Ground-Penetrating Radar' }, { at: 99, name: 'Temporal Excavator' }]
/** Relics archaeology digs up, a collection per site; a finished site is a permanent +2% damage. */
export const RELIC_SITES: { name: string; relics: string[] }[] = [
  { name: 'The First Commit Barrow', relics: ['Initial Commit Tablet', 'README of the Ancients', 'Fossilized Hello World', 'Primordial Makefile', 'Stone Tab Character'] },
  { name: 'Ruins of Left-Pad', relics: ['Shattered Lockfile', 'Eleven Lines of Code', 'Amulet of Semver', 'Dusty Tarball', 'Bones of a Polyfill'] },
  { name: 'Merge Graveyard', relics: ['Petrified Conflict Marker', 'HEAD Reliquary', 'Cherry-Pick Idol', 'Squashed History Scroll', 'Orphaned Branch Totem'] },
  { name: 'The Incident Crater', relics: ['Melted Pager', 'Postmortem Codex', 'Charred Runbook', 'Rollback Talisman', 'Coffee-Stained Dashboard'] },
  { name: 'Mainframe Necropolis', relics: ['Punch Card Sarcophagus', 'COBOL Rosetta Stone', 'Tape Reel of Kings', 'Y2K Prophecy', 'Vacuum Tube Crown'] },
  { name: 'The Atlas Strata', relics: ['Fragment of the Shaper', 'Elder Stack Trace', 'Infinite Scroll Shard', 'Recursive Fossil', 'Mirror Shard of Prod'] },
]
/** Elixirs alchemy brews from reagents: a long buff for combat. */
export const ELIXIRS: { tier: number; name: string; k: StatKey | 'mult'; v: number }[] = [
  { tier: 0, name: 'Elixir of Haste', k: 'speed', v: 12 },
  { tier: 1, name: 'Elixir of Precision', k: 'crit', v: 6 },
  { tier: 2, name: 'Elixir of Wisdom', k: 'xp', v: 30 },
  { tier: 3, name: 'Elixir of the Ancients', k: 'mult', v: 0.35 },
]
export const PICKS = [{ at: 1, name: 'Rusty Pickaxe' }, { at: 20, name: 'Steel Pickaxe' }, { at: 60, name: 'Diamond Drill' }, { at: 99, name: 'Quantum Excavator' }]
/** Meals the camp cooks from the catch: a buff for the next stretch of combat. */
export const MEALS: { tier: number; name: string; k: StatKey | 'mult'; v: number }[] = [
  { tier: 0, name: 'Bugfish Tacos', k: 'xp', v: 10 },
  { tier: 1, name: 'Spicy Byte Bass Curry', k: 'dmg', v: 15 },
  { tier: 2, name: 'Null Perch Sushi Platter', k: 'mf', v: 30 },
  { tier: 3, name: 'Feast of the Deep', k: 'mult', v: 0.3 },
]

export type BountyDef = { id: string; text: string; k: 'edit' | 'bash' | 'read' | 'agent' | 'web' | 'commit' | 'test' | 'rested' | 'handoff' | 'turns'; need: number }
/** The daily bounty board: real work, good habits. */
export const BOUNTIES: BountyDef[] = [
  { id: 'commit2', text: 'Land 2 commits', k: 'commit', need: 2 },
  { id: 'test3', text: 'Run tests green 3 times', k: 'test', need: 3 },
  { id: 'rested', text: 'Compact before the storm (under 75%)', k: 'rested', need: 1 },
  { id: 'edit30', text: 'Forge 30 edits', k: 'edit', need: 30 },
  { id: 'read40', text: 'Scout 40 files', k: 'read', need: 40 },
  { id: 'agent3', text: 'Summon 3 subagents', k: 'agent', need: 3 },
  { id: 'handoff', text: 'Hand off a chat cleanly', k: 'handoff', need: 1 },
  { id: 'turns15', text: 'Finish 15 turns', k: 'turns', need: 15 },
  { id: 'web5', text: 'Raid the web 5 times', k: 'web', need: 5 },
  { id: 'bash25', text: 'Cast 25 shell spells', k: 'bash', need: 25 },
]

export type AchDef = { id: string; name: string; text: string }
export const ACHIEVEMENTS: AchDef[] = [
  { id: 'first_blood', name: 'First Blood', text: 'Slay your first monster' },
  { id: 'k100', name: 'Exterminator', text: '100 kills' },
  { id: 'k1000', name: 'Pest Control', text: '1,000 kills' },
  { id: 'k10000', name: 'Bug Apocalypse', text: '10,000 kills' },
  { id: 'k100000', name: 'Zero Bugs', text: '100,000 kills (a lie)' },
  { id: 'lvl10', name: 'Junior', text: 'Reach level 10' },
  { id: 'lvl30', name: 'Mid-Level', text: 'Reach level 30' },
  { id: 'lvl50', name: 'Senior', text: 'Reach level 50' },
  { id: 'lvl70', name: 'Staff Engineer', text: 'Reach level 70' },
  { id: 'lvl92', name: 'Halfway There', text: 'Reach level 92 (half of 99)' },
  { id: 'lvl99', name: 'Principal', text: 'Reach level 99' },
  { id: 'para100', name: 'Distinguished', text: 'Reach level 120' },
  { id: 'skill99', name: 'Skillcape', text: 'Reach 99 in a life skill' },
  { id: 'awaken', name: 'Awakened', text: 'Discover your class' },
  { id: 'legend', name: 'Orange Beam', text: 'Find a legendary' },
  { id: 'set', name: 'Green Glow', text: 'Find a set piece' },
  { id: 'set4', name: 'Full Set', text: 'Wear a full 4-piece set' },
  { id: 'ancient', name: 'Ancient History', text: 'Find an ancient legendary' },
  { id: 'primal', name: 'Primal Scream', text: 'Find a primal ancient' },
  { id: 'cube5', name: 'Compiler Collector', text: 'Extract 5 powers into the Horadric Compiler' },
  { id: 'royal', name: 'Jeweler', text: 'Craft a Royal gem' },
  { id: 'death', name: 'Segfaulted', text: 'Die for the first time' },
  { id: 'death50', name: 'Core Dumped', text: 'Die 50 times' },
  { id: 'goblin', name: 'Goblin Slayer', text: 'Kill a treasure goblin (land a commit)' },
  { id: 'act1', name: 'Builds Unbutchered', text: 'Defeat the Butcher of Builds' },
  { id: 'act4', name: 'Incident Resolved', text: 'Defeat Diablo, the Prod Incident' },
  { id: 'act5', name: 'Debt Paid', text: 'Defeat Baal, Lord of Technical Debt' },
  { id: 'atlas', name: 'Atlas Unlocked', text: 'Finish the campaign and open the Atlas of Repos' },
  { id: 'map10', name: 'Mapper', text: 'Clear a tier 10 map' },
  { id: 'map50', name: 'Atlas Explorer', text: 'Clear a tier 50 map' },
  { id: 'map100', name: 'Leaderboard Material', text: 'Clear a tier 100 map' },
  { id: 'map500', name: 'Beyond the Atlas', text: 'Clear a tier 500 map' },
  { id: 'fish1', name: "Gone Fishin'", text: 'Catch your first fish' },
  { id: 'fish1000', name: 'Master Angler', text: 'Catch 1,000 fish' },
  { id: 'fishlegend', name: "The One That Didn't Get Away", text: 'Catch a legendary fish' },
  { id: 'journal', name: 'Ichthyologist', text: 'Fill a whole fishing spot in the journal' },
  { id: 'chest', name: 'Sunken Treasure', text: 'Fish up a treasure chest' },
  { id: 'cook50', name: 'Camp Chef', text: 'Reach cooking level 50' },
  { id: 'mirror', name: 'Mirror, Mirror', text: 'Find a Mirror of Prod' },
  { id: 'keystone', name: 'Keystone', text: 'Take your first keystone passive' },
  { id: 'relic', name: 'Indiana Jonesing', text: 'Dig up your first relic' },
  { id: 'site', name: 'Curator', text: 'Complete a relic site' },
  { id: 'elixir', name: 'Alchemist', text: 'Brew an Elixir of the Ancients' },
  { id: 'smith50', name: 'Master Smith', text: 'Reach smithing level 50' },
  { id: 'harmony', name: 'Harmony', text: 'Train all four attributes to within 80% of each other' },
  { id: 'bounty7', name: 'Bounty Hunter', text: 'Finish a full bounty board 7 times' },
  { id: 'rested10', name: 'Well Rested', text: 'Compact early 10 times' },
  { id: 'night', name: 'Night Owl', text: 'Work between 2am and 5am' },
  { id: 'million', name: 'Millionaire', text: 'Hold 1,000,000 gold' },
  { id: 'party', name: 'Full Party', text: 'Have 3 followers' },
  { id: 'named1', name: 'Named and Shamed', text: 'Slay a named monster' },
  { id: 'named10', name: 'Most Wanted', text: 'Slay 10 different named monsters' },
  { id: 'best25', name: 'Field Notes', text: 'Slay 25 different kinds of monster' },
  { id: 'best60', name: 'Naturalist', text: 'Slay 60 different kinds of monster' },
  { id: 'mods3', name: 'Triple Threat', text: 'Slay an elite with three or more affixes' },
  { id: 'tales25', name: 'Storyteller', text: 'Live through 25 random tales' },
  { id: 'tales1000', name: 'Legend of the Log', text: 'Live through 1,000 random tales' },
  { id: 'crops25', name: 'Green Claws', text: 'Harvest 25 crops' },
  { id: 'crops250', name: 'Crop Rotation', text: 'Harvest 250 crops' },
  { id: 'trips10', name: 'Postcards Home', text: 'Welcome back 10 expeditions' },
  { id: 'trips100', name: 'Expedition Office', text: 'Welcome back 100 expeditions' },
  { id: 'titles5', name: 'Wandering Arsenal', text: 'Hold 5 different titles' },
  { id: 'titles20', name: 'Jack of All Trades', text: 'Hold 20 different titles' },
  { id: 'lands7', name: 'Tourist', text: 'Visit 7 kinds of land' },
  { id: 'lands14', name: 'Seen It All', text: 'Visit all 14 kinds of land' },
  { id: 'revenge', name: 'Served Cold', text: 'Defeat a nemesis' },
  { id: 'revenge10', name: 'Grudge Keeper', text: 'Defeat 10 nemeses' },
  { id: 'streak250', name: 'Hot Streak', text: 'Win 250 fights in a row' },
  { id: 'streak1000', name: 'Five Nines', text: 'Win 1,000 fights in a row' },
  { id: 'pets1', name: 'Egg Timer', text: 'Hatch a pet from an expedition egg' },
  { id: 'pets5', name: 'Menagerie', text: 'Hatch 5 pets' },
  { id: 'petFinal', name: 'Final Form', text: 'Raise a pet to its last stage' },
]

/** task-13 flavor. Picked by the clock, never by the game's RNG, so they change nothing else. */
export const BOSS_TAUNTS = ['Your tests cannot save you.', 'I was here before your first commit.', 'I have seen your git history.', 'Merge me if you dare.', 'Roll back? There is no back.', 'Your pull request will never be approved.', 'I run in production. You run in staging.', 'For every fix you make, I make two bugs.', 'I am the reason it works on my machine.', 'Your coverage is showing.', 'I deprecate heroes like you.', 'Bring your linter. I will wait.', 'I have no tests and no fear.', 'You cannot hotfix destiny.', 'I live in every branch.', 'Your stack trace ends with me.', 'Who approved this hero?', 'I was written on a Friday.', 'Your cache is stale, and so are you.', 'I am undocumented, and unbeatable.', 'Ten thousand lines, zero comments. Fear me.', 'Not even a revert can undo me.', 'I am the TODO you never did.', 'Let us settle this in code review.']
export const ACT_INTRO: string[][] = [
  ['The repo is fresh. The hero is fresher.', 'A clean clone. It will not stay clean for long.', 'Somewhere below, a build is already failing.'],
  ['The lockfile trembles. Versions march to war.', 'Every package wants a different version of everything.', 'Sand, ruins and very old dependencies ahead.'],
  ['The branches have diverged. Badly.', 'Conflict markers glow in the swamp mist.', 'Nobody has rebased here in years.'],
  ['This is production. Everything here is on fire.', 'The pager is already buzzing.', 'No staging, no safety net, no sleep.'],
  ['The code in these mountains is older than the hero.', 'COBOL echoes off the frozen peaks.', 'The ancients wrote it. Nobody dares change it.'],
]
export const ACT_OUTRO: string[][] = [
  ['The first build passes. A small cheer goes up.', 'The cellar is quiet. The node_modules settle.', 'Act I ships. Nobody reads the release notes.'],
  ['The dependency wars end in an uneasy lockfile.', 'Peace at last, until the next major version.', 'The pyramids stop arguing about semver.'],
  ['The merge goes through. The swamp sighs.', 'HEAD is attached again. Mostly.', 'The marshes drain. The conflicts rest, for now.'],
  ['The incident is closed. The postmortem begins.', 'Production is calm. Nobody touch anything.', 'The pager falls silent. The hero sleeps, for once.'],
  ['The debt is paid. Some of it. A little.', 'The mountains go quiet. The mainframe hums on.', 'The legacy holds. The hero walks on into the Atlas.'],
]

/** task-12 slice: a title from the gear, weapon base (rows, BASES.weapon order) by off-hand base (BASES.offhand order, then none). Words only. */
export const TITLES: string[][] = [
  ['Vanguard', 'Pair Programmer', 'Keymancer', 'Hotkey Ranger', 'Prompt Engineer', 'Berserker'],
  ['Rubber Duck Debugger', 'Stack Sage', 'Voidcaster', 'Breakpoint Hunter', 'Lightmender', 'Staff Engineer'],
  ['Cogslinger', 'Hardware Hacker', 'Embermage', 'Sparkshot', 'Firmware Druid', 'Tinkerer'],
  ['Crimson Duelist', 'Network Warden', 'Packet Witch', 'Twinfang', 'Pactbinder', 'Harvester'],
  ['Skylancer', 'Incident Commander', 'Trace Oracle', 'Shadowstep', 'Merge Conflict Monk', 'Ronin'],
  ['Paladin of Prod', 'Refactor Knight', 'Vibe Coder', 'Whack-a-Mole Ranger', 'YAML Shaman', 'Smashwright'],
  ['Slide Deck Templar', 'Scrum Master', 'Laser Mystic', 'Ranger', 'Necromancer of Slides', 'Pointer Savant'],
]
/** Birth labels, rolled once from the hero's seed and never changed. Words only, no power. */
export const ANCESTRY = ['Hermit', 'Coconut', 'King', 'Fiddler', 'Snow', 'Spider', 'Ghost', 'Horseshoe', 'Soft-shell', 'Imitation', 'Rustacean', 'Yeti', 'Decorator', 'Robber', 'Boxer', 'Pea', 'Blue', 'Mud', 'Pom-pom', 'Sponge', 'Arrow', 'Porcelain', 'Velvet', 'Pebble']
export const PROFESSIONS = ['Grave Accountant', 'Tide Notary', 'Barnacle Dentist', 'Kelp Sommelier', 'Sandcastle Inspector', 'Driftwood Appraiser', 'Pearl Auditor', 'Seagull Negotiator', 'Moonlight Lifeguard', 'Puddle Surveyor', 'Shell Realtor', 'Bubble Archivist', 'Lighthouse Intern', 'Plankton Shepherd', 'Coral Landlord', 'Wave Forecaster', 'Tidepool Mayor', 'Anchor Polisher', 'Bottle Mail Courier', 'Buoy Philosopher', 'Bait Shop Poet', 'Reef Librarian', 'Fog Collector', 'Shipwreck Tour Guide', 'Salt Critic', 'Barnacle Barber', 'Clam Therapist', 'Starfish Tailor', 'Treasure Map Proofreader', 'Jetty Night Watch', 'Seashell Cartographer', 'Squid Ink Calligrapher', 'Pier Fortune Teller', 'Low Tide Lawyer', 'Sea Foam Chemist', 'Ferry Mime', 'Urchin Babysitter', 'Dock Choir Tenor', 'Rockpool Plumber', 'Lagoon Swim Coach']
export const PERSONALITIES = ['Unreasonably Brave', 'Suspicious of Seagulls', 'Chronically Early', 'Quietly Smug', 'Easily Delighted', 'Afraid of Semicolons', 'Overly Polite', 'Dramatic About Sand', 'Relentlessly Optimistic', 'Mildly Cursed', 'Secretly Sentimental', 'Allergic to Meetings', 'Proud of Nothing', 'Loud at Dawn', 'Fond of Puns', 'Always Snacking', 'Never Lost, Allegedly', 'Deeply Unbothered', 'Competitive About Naps', 'Collects Bottle Caps', 'Nervous Around Tides', 'Too Honest', 'A Sideways Thinker', 'Hums While Fighting', 'Holds Grudges Briefly', 'Afraid of Crabs', 'Loves Paperwork', 'Bad at Goodbyes', 'Stubbornly Cheerful', 'Sleeps Through Alarms', 'Talks to Rocks', 'Trusts Every Map', 'Always Overpacks', 'Never Reads the Manual', 'Polite to Bosses', 'Writes Everything Down', 'Hoards Spoons', 'Counts Everything', 'Believes in Ghosts', 'Waves at Strangers']
/** The crab's idle quips (task-13): one on reaching the campfire, one on heading out to gather. Picked by the clock. */
export const CAMP_QUIPS = ['Fire first. Then feelings.', 'My claws are tired. My spirit is also tired.', 'Nobody tell the bugs where I camp.', 'I fought for hours. Now I toast things.', 'Sideways is still forward if you believe.', 'This fire has better uptime than prod.', 'Snacks now. Heroics later.', 'I could go on. I will not.', 'One more fight? No. Marshmallows.', 'The shell is cozy. The fire is cozier.', 'Somewhere a test is failing. Not my problem tonight.', 'I deserve this rest. The logs agree.', 'A crab never stops. Except right now.', 'The stars look like stack traces from here.', 'I wonder if fish think about me too.', 'Shh. The fire is compiling.', 'Rest is a feature, not a bug.', 'Taking five. Possibly six.', 'If anyone needs me, I am a pile of shell.', 'Ten minutes. Then I check my bag again.']
export const GATHER_QUIPS = ['Enough sitting. Time to poke rocks.', 'The fish will not catch themselves.', 'Let us see what the dirt is hiding.', 'Idle claws are a bug factory.', 'Back to work. The relaxing kind.', 'I hear ore calling. It sounds shiny.', 'Hobbies are just side quests with snacks.', 'A little gathering never hurt anyone.', 'Somewhere out there is a better rod.', 'Shell on, boots on, let us go.', 'Off to find treasure. Or mud. Probably mud.', 'Rested enough. Mostly.']
/** Nemesis (a foe that beat the crab comes back): its epithet, what it says on return, and the crab's line on revenge. Picked by the clock. */
export const NEMESIS_EPITHETS = ['the Smug', 'Who Laughed', 'the Unforgiven', 'of the Cheap Shot', 'the Gloater', 'Who Saw It Coming', 'the Lucky', 'the Unbothered', 'the Petty', 'Who Took Your Lunch', 'the Merciless', 'of Many Grudges', 'the Insufferable', 'Who Never Logs Off', 'the Overconfident', 'the Rude', 'of the Last Laugh', 'the Snickering', 'Who Read Your Diff', 'the Blamer', 'the Unpatched', 'of the Hot Take', 'the Spiteful', 'Who Counted Your Retries']
export const NEMESIS_BACK = ['Remember me?', 'Back for seconds.', 'I kept your gold warm.', 'Round two. Same result.', 'I told everyone about last time.', 'Still walking sideways, I see.', 'Did you patch yourself?', 'I have been practicing.', 'Long time no crit.', 'This time I brought snacks.', 'You again. Good.', 'I never forget a shell.']
/** A pet's reaction to a level-up or a boss kill; $ is the pet's name. Picked by the clock. */
export const PET_CHEERS = ['$ does a little victory hop.', '$ chirps the build-passed song.', '$ chews on the loot table.', '$ files a bug against the boss. Status: fixed.', '$ is very proud of you. Mostly of itself.', '$ celebrates by knocking a mug off the desk.',
  '$ takes full credit.', '$ spins three times and lies down.', '$ approves this merge.', '$ tries to high-five a claw.', '$ sniffs the loot. Smells rare.', '$ squeaks in a major key.', '$ writes LGTM in the dirt.', '$ does zoomies around the camp.',
  '$ looks at the boss, then at you, then at the boss.', '$ wants a treat. It has earned a treat.']
export const REVENGE_LINES = ['That one was personal.', 'Grudge closed. Ticket resolved.', 'Who is laughing now? Me. Sideways.', 'Score settled. Shell polished.', 'Merged. Conflict resolved.', 'Nobody beats me twice. Well, once.', 'And stay deprecated.', 'I am writing this one in my diary.', 'Finally. My claws remember.', 'That felt better than a green build.', 'Payback, with interest.', 'Revenge, served at room temperature.']
/** Win streak callouts: fights won in a row without a death. */
export const STREAKS: [number, string][] = [[100, 'On a Roll'], [250, 'Hot Streak'], [500, 'No Bugs Survive'], [1000, 'Five Nines'], [2500, 'Zero Downtime']]
