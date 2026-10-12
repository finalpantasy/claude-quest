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
}

export type Counts = {
  edit: number; bash: number; read: number; agent: number; web: number; fail: number; commit: number; test: number; compact: number; rested: number; handoff: number; turns: number
  /** Thousands of tokens by the model that spent them, and thousands read from the cache. */
  tokOpus: number; tokSonnet: number; tokHaiku: number; tokOther: number; tokCache: number
}

export type FoeRank = 'normal' | 'magic' | 'rare' | 'unique' | 'boss' | 'goblin'
export type Foe = { name: string; rank: FoeRank; level: number; hp: number; dmg: number; count: number; mods: string[]; sprite: number }

export type TaskKind = 'fight' | 'town' | 'dead' | 'fish' | 'mine' | 'dig' | 'travel'
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
export type LifeSkill = 'fishing' | 'mining' | 'archaeology' | 'cooking' | 'smithing' | 'alchemy'

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
  stats: { maxHit: number; legendaries: number; goldEarned: number; maxTier: number; rested: number }
}

export type View = { hero: Hero | null; isLeader: boolean; at: number }

declare module 'claude-code' {
  interface PluginState {
    'claude-quest': {
      /** The hero as last simulated or read, the time it was drawn at, and whether this session runs the game. */
      view: View
      /** The /quest panel's tab. */
      tab: string
      /** Whether the ticker row shows above the prompt. */
      ticker: boolean
    }
  }
}
