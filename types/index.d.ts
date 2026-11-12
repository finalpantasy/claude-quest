// Claude Quest's type contract: the hero save and the values the drawings read.

export type Slot = 'weapon' | 'offhand' | 'head' | 'chest' | 'hands' | 'waist' | 'legs' | 'feet' | 'neck' | 'ring' | 'ring2'
export type StatKey = 'str' | 'dex' | 'int' | 'vit' | 'crit' | 'critDmg' | 'speed' | 'life' | 'armor' | 'resist' | 'steal' | 'mf' | 'gf' | 'xp' | 'dmg' | 'elite' | 'area'
/** A bundle of bonuses: stat points, percentages, `dr` (damage reduction %) and `mult` (extra damage multiplier, 0.5 = x1.5). */
export type Fx = Partial<Record<StatKey | 'dr' | 'mult', number>>
export type Rarity = 'normal' | 'magic' | 'rare' | 'unique' | 'set'

export type Item = {
  slot: Slot
  base: string
  name: string
  rarity: Rarity
  ilvl: number
  /** Weapon damage or armor, before affixes. */
  power: number
  affixes: { k: StatKey; v: number }[]
  sockets: number
  /** Socketed gems: type index * 100 + tier. */
  gems: number[]
  /** A unique's power id, or a set piece's set id. */
  uid?: string
  /** 1 ancient, 2 primal. */
  tier?: number
  quality: number
  /** Forge upgrade level, +1 to +15; absent means +0. Never transfers to another item. */
  plus?: number
  /** Failed forge tries in a row; each adds to the next try's odds. */
  pity?: number
}

export type Counts = {
  edit: number; bash: number; read: number; agent: number; web: number; fail: number; commit: number; test: number; compact: number; rested: number; handoff: number; turns: number
  /** Thousands of tokens by the model that spent them, and thousands read from the cache. */
  tokOpus: number; tokSonnet: number; tokHaiku: number; tokOther: number; tokCache: number
}

export type FoeRank = 'normal' | 'magic' | 'rare' | 'unique' | 'boss' | 'goblin'
export type Foe = { name: string; rank: FoeRank; level: number; hp: number; dmg: number; count: number; mods: string[]; sprite: number; /** the kind of monster (bestiary key), and whether it is a named one (task-29); missing on old saves */ base?: string; named?: boolean }

export type TaskKind = 'fight' | 'town' | 'dead' | 'fish' | 'mine' | 'dig' | 'travel' | 'camp'
export type Task = {
  kind: TaskKind
  label: string
  /** How long it takes, and how much of that has run, in milliseconds. */
  ms: number
  done: number
  foe?: Foe
  /** For a fight: whether the hero wins it, settled when it starts; the hit the numbers float. */
  win?: boolean
  hit?: number
  crit?: boolean
}

export type Bounty = { id: string; text: string; k: keyof Counts; need: number; have: number }
export type Buff = { name: string; k: StatKey | 'dr' | 'mult'; v: number; /** combat milliseconds left */ left: number }
export type Skill = { lvl: number; xp: number }
export type LogLine = { t: number; s: string; c?: string }
export type LifeSkill = 'fishing' | 'mining' | 'archaeology' | 'cooking' | 'smithing' | 'alchemy' | 'farming' | 'expeditions'

export type Hero = {
  v: 1
  name: string
  cls: string
  /** False while the class waits to awaken from how the person works. */
  chosen: boolean
  seed: number
  createdAt: number
  lastTick: number
  level: number
  xp: number
  gold: number
  kills: number
  deaths: number
  /** The campaign while it lasts; null once the Atlas is open. */
  stage: { act: number; zone: number; packs: number } | null
  map: { tier: number; packs: number; deaths: number; best: number; name: string }
  gear: Partial<Record<Slot, Item>>
  bag: { n: number; value: number }
  mats: { scrap: number; crystal: number; soul: number; ore: number; reagent: number }
  currency: Record<string, number>
  /** Loose gems: 5 types x 8 tiers, type * 8 + tier. */
  gems: number[]
  /** Unique powers extracted into the Horadric Compiler. */
  codex: string[]
  skills: number[]
  /** Combat time banked from real work, in milliseconds. */
  focus: number
  buffs: Buff[]
  followers: string[]
  minions: { name: string; left: number }[]
  goblins: number
  mirrors: number
  counts: Counts
  /** What each session's inbox counted when last applied, so a count is used once. */
  applied: Record<string, Counts>
  bounties: { day: string; list: Bounty[]; boards: number; claimed: string[] }
  ach: Record<string, number>
  life: Record<LifeSkill, Skill>
  fish: { journal: Record<string, number>; best: Record<string, number>; total: number; meals: number[] }
  /** What camp gathers: always the hero's own call, the lowest skill first. */
  idle: 'auto'
  /** Relics dug up, by name; elixirs brewed, by tier. */
  relics: Record<string, number>
  elixirs: number[]
  task: Task
  log: LogLine[]
  /** The last drop worth a beam of light. */
  beam?: { name: string; color: string; at: number }
  /** the last level-up or boss kill, for a few seconds of celebration in the scene; looks only */
  ding?: { kind: 'level' | 'boss'; text: string; at: number }
  /** kills by kind of monster and by named monster (task-29); missing on old saves */
  bestiary?: Record<string, number>
  /** random events (task-15): when the next comes, how many so far, running gags by step, hashes of the last 200 lines, the last 50 lines; missing on old saves */
  tales?: { next: number; n: number; chain: Record<string, number>; ring: number[]; recent: { t: number; s: string }[]; done?: string[]; gold?: number; tpl?: number[] }
  stats: { maxHit: number; legendaries: number; goldEarned: number; maxTier: number; rested: number }
  /** downtime (task-14), all missing on old saves: when Focus last ran out (the campfire comes first), when real work last arrived (time away fills Rested) */
  campT?: number
  workT?: number
  /** Farming plots: crop index, when planted, when ripe; rare seeds from digging; crops harvested so far */
  farm?: { plots: { crop: number; at: number; ripe: number }[]; rare: number; crops: number }
  /** the expedition out now: who went, when they left and come back; how many came home; pet eggs kept for the pet system */
  trip?: { who: string; at: number; back: number; n: number; eggs: number }
  /** task-12 slice, missing on old saves: birth labels rolled once from the seed (ancestry, profession, personality), and the last title the gear gave. Words only, no power. */
  birth?: { kin: string; job: string; mood: string }
  title?: string
  /** Every title held and every kind of land visited (biome palettes), for achievements; missing on old saves. */
  titles?: string[]
  lands?: string[]
  /** The foe kind that last beat the hero, until the hero beats one again (words only), and how many it has beaten; missing on old saves. */
  nemesis?: { base: string; name: string; at: number; wins: number; beaten?: number }
  revenge?: number
  /** fights won in a row, and the best run; missing on old saves */
  streak?: number
  bestStreak?: number
  /** pets hatched from expedition eggs, newest last (the one that follows the hero): line, stage, hatch time, kills at hatch; words and looks only */
  pets?: { line: number; stage: number; at: number; k0: number }[]
  /** the counters at the start of the local day, for the day's tally line; words only */
  today?: { day: string; kills: number; deaths: number; level: number; legendaries: number; gold: number }
  /** the local day of the last full-moon line */
  fullMoon?: string
}

/** How a tool call plays on screen: edit melee, read arrow, shell spell, agent summon, web portal, anything else a strike. */
export type ActKind = 'melee' | 'arrow' | 'spell' | 'summon' | 'portal' | 'strike'
/** One tool call's one-shot, and when (ms epoch) it starts to play. */
export type LiveAct = { kind: ActKind; at: number }
/** Tokens spent floating off the foe as damage: how many, when it lands (ms epoch), and whether it was big enough to crit. */
export type LiveHit = { tokens: number; at: number; crit: boolean }
/** What this session's Claude is doing right now, drawn over the scene. Never saved. */
export type Live = {
  /** True from a turn's start to its end. */
  active: boolean
  acts: LiveAct[]
  hits: LiveHit[]
  /** Tokens spent so far this turn (the whole turn once it ends). */
  turnTokens: number
  /** The last action as one word, for the strip and the terminal ticker. */
  word: string
  kind: ActKind | null
}

export type View = { hero: Hero | null; isLeader: boolean; at: number }

declare module 'claude-code' {
  interface PluginState {
    'claude-quest': {
      /** The hero as last simulated or read, the time it was drawn at, and whether this session runs the game. */
      view: View
      /** The /quest panel's tab. */
      tab: string
      /** How much of the scene shows above the prompt: a one-line strip, a strip that pops to the scene on big moments, the full scene, or nothing. */
      band: 'strip' | 'pop' | 'full' | 'off'
      /** Until when (ms epoch) a pop shows the full scene; 0 when none. */
      popUntil: number
      /** What this session's Claude is doing right now; written at most once a second while a turn runs. */
      live: Live
    }
    /** Read only: the Claude Mod Hider switch; Claude Quest passes above the prompt while it is on. */
    'claude-mod-hider': { hidden: boolean }
  }
}
