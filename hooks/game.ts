// The game itself: pure functions over a Hero, no `$`, no tokens. The hooks feed it real work as counts
// and the time; it fights, loots, crafts, maps and fishes. Every random roll comes from the hero's own
// seed, so a save replays the same way.
import type { Bounty, Counts, Foe, FoeRank, Fx, Hero, Item, LifeSkill, LogLine, Rarity, Slot, StatKey, Task } from '../types'
import {
  ACHIEVEMENTS, ACTS, ADJ, AFFIX, APPRENTICE, ATLAS, BASES, BOUNTIES, CLASSES, CURRENCY, ELITE, FISH_SPOTS, FOLLOWERS, GEMS, GEM_FX, GEM_TIERS,
  ELIXIRS, JUNK, KEYSTONES, MAPS, MAP_BOSSES, MEALS, MINIONS, ORES, PASSIVE_SMALL, PICKS, POWERS, RARE_A, RARE_B, RELIC_SITES, RODS, SETS, SHOVELS, SHRINES, SLOTS, VERBS,
} from './data'
import type { ClassDef } from './data'

export const RARITY_COLOR: Record<Rarity, string> = { normal: '#c8c8c8', magic: '#8080ff', rare: '#f2e05a', unique: '#ff8a1f', set: '#2fd05a' }
export const ANCIENT_COLOR = '#ffb347'
export const PRIMAL_COLOR = '#ff4a4a'
export const RANK_COLOR: Record<FoeRank, string> = { normal: '#d8d0c0', magic: '#6f8cff', rare: '#f2e05a', unique: '#ff8a1f', boss: '#ff4a4a', goblin: '#ffd23f' }

const MIN = 60_000
const HOUR = 3_600_000
/** Combat time one action of real work buys. */
export const FOCUS = { action: 25_000, turn: 20_000, commit: 180_000, test: 60_000, cap: 2 * HOUR }
const PACKS_PER_ZONE = 40
const PACKS_PER_MAP = 20
const BAG_CAP = 30
const LOG_CAP = 60
const CATCH_UP_CAP = 12 * HOUR

// ---------------------------------------------------------------- numbers

type R = () => number

/** The hero's own random stream (mulberry32): every call moves its seed on. */
export const rngOf = (h: Hero): R => () => {
  let t = (h.seed = (h.seed + 0x6d2b79f5) | 0)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = <T>(r: R, a: readonly T[]): T => a[Math.floor(r() * a.length)]!
const between = (r: R, lo: number, hi: number) => lo + r() * (hi - lo)
const int = (r: R, lo: number, hi: number) => Math.floor(between(r, lo, hi + 1))
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
/** `842`, `12.3K`, `4.56M`, then `1.2e36` once the names run out. */
export const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return '∞'
  const a = Math.abs(n)
  if (a < 1000) return `${Math.round(n)}`
  const e = Math.floor(Math.log10(a) / 3)
  if (e >= UNITS.length) return n.toExponential(1).replace('+', '')
  const v = n / 1000 ** e
  return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)}${UNITS[e]}`
}
export const roman = (n: number) => {
  const t: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let s = ''
  for (const [v, l] of t) while (n >= v) { s += l; n -= v }
  return s || '0'
}

// RuneScape's own curve, with no cap: level 92 is half of 99, and past 99 it keeps doubling every seven
// levels, so 120 is eight times 99 and from about 122 each level takes as long as 1 to 99 did.
const XP_TABLE: number[] = [0, 0]
/** Total XP to reach a level. */
export const xpAt = (lvl: number) => {
  while (XP_TABLE.length <= lvl) {
    const l = XP_TABLE.length - 1
    XP_TABLE.push(XP_TABLE[l]! + Math.floor(l + 300 * 2 ** (l / 7)) / 4)
  }
  return Math.floor(XP_TABLE[lvl]!)
}
export const xpToNext = (lvl: number) => xpAt(lvl + 1) - xpAt(lvl)
export const lifeXpToNext = xpToNext
/** XP a single monster gives before rank, tier and bonuses: tuned so twelve hours of Claude a day is 92 in a year, 99 in two. */
const XP_PER_FOE = 0.4
/** Scales every life skill's XP: tuned so each reaches 99 in about three years of idle camp. */
const LIFE_RATE = 1.2

/** The local calendar day, `2026-10-12`. */
export const dayKey = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const emptyCounts = (): Counts => ({ edit: 0, bash: 0, read: 0, agent: 0, web: 0, fail: 0, commit: 0, test: 0, compact: 0, rested: 0, handoff: 0, turns: 0, tokOpus: 0, tokSonnet: 0, tokHaiku: 0, tokOther: 0, tokCache: 0 })

// ---------------------------------------------------------------- the hero

export const classOf = (h: Hero): ClassDef => CLASSES[h.cls] ?? APPRENTICE

export const newHero = (name: string, cls: string | null, seed: number, now: number): Hero => ({
  v: 1, name, cls: cls ?? 'apprentice', chosen: cls !== null, seed, createdAt: now, lastTick: now,
  level: 1, xp: 0, gold: 0, kills: 0, deaths: 0,
  stage: { act: 0, zone: 0, packs: 0 },
  map: { tier: 1, packs: 0, deaths: 0, best: 0, name: MAPS[0]! },
  gear: {}, bag: { n: 0, value: 0 }, mats: { scrap: 0, crystal: 0, soul: 0, ore: 0, reagent: 0 },
  currency: {}, gems: Array.from({ length: 40 }, () => 0), codex: [], skills: [0, 0, 0, 0, 0, 0],
  focus: 2 * MIN, buffs: [], followers: [], minions: [], goblins: 0, mirrors: 0,
  counts: emptyCounts(), applied: {},
  bounties: { day: '', list: [], boards: 0, claimed: [] },
  ach: {},
  life: { fishing: { lvl: 1, xp: 0 }, mining: { lvl: 1, xp: 0 }, archaeology: { lvl: 1, xp: 0 }, cooking: { lvl: 1, xp: 0 }, smithing: { lvl: 1, xp: 0 }, alchemy: { lvl: 1, xp: 0 } },
  fish: { journal: {}, best: {}, total: 0, meals: [0, 0, 0, 0] },
  idle: 'auto', relics: {}, elixirs: [0, 0, 0, 0],
  task: { kind: 'travel', label: 'Cloning the repository…', ms: 4000, done: 0 },
  log: [{ t: now, s: `${name} wakes up in ${ACTS[0]!.zones[0]}.`, c: '#e8e0d0' }],
  stats: { maxHit: 0, legendaries: 0, goldEarned: 0, maxTier: 0, rested: 0 },
})

const say = (h: Hero, t: number, s: string, c?: string) => {
  h.log.push(c ? { t, s, c } : { t, s })
  if (h.log.length > LOG_CAP) h.log.splice(0, h.log.length - LOG_CAP)
}

/** Notes worth a toast, gathered while the game runs. */
export type Notes = string[]

const unlock = (h: Hero, id: string, t: number, notes: Notes) => {
  if (h.ach[id]) return
  const a = ACHIEVEMENTS.find(x => x.id === id)
  if (!a) return
  h.ach[id] = t
  say(h, t, `🏆 Achievement: ${a.name} (${a.text})`, '#ffd23f')
  notes.push(`🏆 ${a.name}: ${a.text}`)
}

// ---------------------------------------------------------------- stats

export type Derived = {
  dps: number; hit: number; life: number; armor: number; resist: number; dr: number; crit: number; critDmg: number
  speed: number; steal: number; mf: number; gf: number; xp: number; elite: number; area: number; main: number
}

const addFx = (into: Record<string, number>, fx: Fx, times = 1) => {
  for (const [k, v] of Object.entries(fx)) into[k] = (into[k] ?? 0) + (v ?? 0) * times
}

/** How much a power is worth, roughly, for picking what the Horadric Compiler runs. */
const powerValue = (fx: Fx) =>
  (fx.mult ?? 0) * 100 + (fx.dmg ?? 0) + (fx.crit ?? 0) * 4 + (fx.critDmg ?? 0) * 0.7 + (fx.elite ?? 0) * 0.5 + (fx.area ?? 0) * 0.4 +
  (fx.speed ?? 0) * 2 + (fx.dr ?? 0) * 2 + (fx.life ?? 0) * 0.6 + (fx.resist ?? 0) * 0.3 + (fx.steal ?? 0) * 5 + (fx.xp ?? 0) * 0.3 + (fx.mf ?? 0) * 0.1

/** The powers the Horadric Compiler runs: the best known in each of its three groups, worn ones aside. */
export const cubePowers = (h: Hero) => {
  const worn = new Set(Object.values(h.gear).map(i => i?.uid))
  const best: Partial<Record<'w' | 'a' | 'j', (typeof POWERS)[number]>> = {}
  for (const id of h.codex) {
    const p = POWERS.find(x => x.id === id)
    if (!p || worn.has(p.id)) continue
    const was = best[p.g]
    if (!was || powerValue(p.fx) > powerValue(was.fx)) best[p.g] = p
  }
  return Object.values(best)
}

/** Which skill gets each level's point: the class's two signature skills twice as often. */
const SKILL_ORDER = [0, 3, 1, 0, 3, 4, 2, 5]
export const skillRanks = (lvl: number) => {
  const ranks = [0, 0, 0, 0, 0, 0]
  const n = lvl - 1
  for (let i = 0; i < SKILL_ORDER.length; i++) ranks[SKILL_ORDER[i]!]! += Math.floor(n / SKILL_ORDER.length) + (i < n % SKILL_ORDER.length ? 1 : 0)
  return ranks
}

export const keystonesAt = (lvl: number) => KEYSTONES.filter(k => k.at <= lvl)
/** Past level 120 every five levels is an ascendancy: x1.25 damage each. */
export const ascendancies = (lvl: number) => Math.max(0, Math.floor((lvl - 120) / 5))

const FOLLOWER_FX: Fx[] = [{ dr: 8 }, { gf: 25 }, { speed: 8 }, { life: 15 }, { xp: 10 }]

// ---------------------------------------------------------------- training
// How the person works trains the four attributes and luck: each with diminishing returns, and a Harmony
// bonus for keeping them even, so one favourite model leans a build without breaking it.

export type Training = { str: number; dex: number; int: number; vit: number; luck: number; harmony: number }

export const trainingOf = (c: Counts): Training => {
  const raw = {
    str: c.edit + c.tokOpus / 4 + c.tokOther / 12,
    dex: c.read + c.tokSonnet / 4 + c.tokOther / 12,
    int: c.bash + c.agent * 3 + c.web + c.tokHaiku / 2 + c.tokOther / 12,
    vit: c.turns * 2 + c.rested * 25 + c.compact * 5 + c.tokOther / 12,
  }
  const vals = Object.values(raw)
  const top = Math.max(...vals)
  const harmony = top > 50 ? Math.min(...vals) / top : 0
  const grow = (v: number) => Math.round(6 * Math.max(0, v) ** 0.62)
  return { str: grow(raw.str), dex: grow(raw.dex), int: grow(raw.int), vit: grow(raw.vit), luck: Math.round(3 * Math.max(0, c.tokCache / 100) ** 0.5), harmony }
}

/** Every life skill also makes the fighter better, a little per level, forever. */
export const SKILL_PERKS: Record<LifeSkill, { k: StatKey | 'dr'; per: number; text: string }> = {
  fishing: { k: 'life', per: 0.3, text: '% life' },
  mining: { k: 'dr', per: 0.2, text: '% less damage taken' },
  archaeology: { k: 'mf', per: 0.5, text: '% magic find' },
  cooking: { k: 'speed', per: 0.1, text: '% attack speed' },
  smithing: { k: 'dmg', per: 0.2, text: '% damage' },
  alchemy: { k: 'xp', per: 0.3, text: '% bonus XP' },
}
/** RuneScape's total level: every life skill's level added up. Each 25 is +1% damage. */
export const totalLevel = (h: Hero) => Object.values(h.life).reduce((a, s) => a + s.lvl, 0)

/** Finished relic sites: +2% damage each, forever. */
export const sitesDone = (h: Hero) => RELIC_SITES.filter(s => s.relics.every(r => h.relics[r])).length

const totalsOf = (h: Hero, race: Fx, gear: Partial<Record<Slot, Item>>, lvl: number, cls: ClassDef, withExtras: boolean) => {
  const t: Record<string, number> = {}
  t.str = 8 + 2 * lvl
  t.dex = 8 + 2 * lvl
  t.int = 8 + 2 * lvl
  t.vit = 8 + 2 * lvl
  t[cls.main] = (t[cls.main] ?? 0) + 3 * lvl
  let armorPower = 0
  const setCount: Record<string, number> = {}
  for (const item of Object.values(gear)) {
    if (!item) continue
    if (item.slot !== 'weapon') armorPower += item.power * (1 + item.quality / 100)
    for (const a of item.affixes) t[a.k] = (t[a.k] ?? 0) + a.v
    for (const g of item.gems) {
      const gem = GEMS[Math.floor(g / 100)]
      if (gem) t[GEM_FX[gem].k] = (t[GEM_FX[gem].k] ?? 0) + GEM_FX[gem].per * ((g % 100) + 1)
    }
    if (item.rarity === 'unique' && item.uid) {
      const p = POWERS.find(x => x.id === item.uid)
      if (p) addFx(t, p.fx)
    }
    if (item.rarity === 'set' && item.uid) setCount[item.uid] = (setCount[item.uid] ?? 0) + 1
  }
  for (const s of SETS) {
    const n = setCount[s.id] ?? 0
    if (n >= 2) addFx(t, s.two)
    if (n >= 4) addFx(t, s.four)
  }
  const ranks = skillRanks(lvl)
  cls.skills.forEach((s, i) => { t[s.k] = (t[s.k] ?? 0) + s.per * (ranks[i] ?? 0) })
  const n = lvl - 1
  PASSIVE_SMALL.forEach((p, i) => { t[p.k] = (t[p.k] ?? 0) + p.v * (Math.floor(n / PASSIVE_SMALL.length) + (i < n % PASSIVE_SMALL.length ? 1 : 0)) })
  t.dmg = (t.dmg ?? 0) + Math.floor(lvl / 10) * 6
  for (const k of keystonesAt(lvl)) addFx(t, k.fx)
  if (withExtras) {
    const tr = trainingOf(h.counts)
    t.str = (t.str ?? 0) + tr.str
    t.dex = (t.dex ?? 0) + tr.dex
    t.int = (t.int ?? 0) + tr.int
    t.vit = (t.vit ?? 0) + tr.vit
    t.mf = (t.mf ?? 0) + tr.luck
    t.gf = (t.gf ?? 0) + tr.luck
    t.dmg = (t.dmg ?? 0) + 25 * tr.harmony + 2 * sitesDone(h) + Math.floor(totalLevel(h) / 25)
    for (const [skill, perk] of Object.entries(SKILL_PERKS)) t[perk.k] = (t[perk.k] ?? 0) + perk.per * h.life[skill as LifeSkill].lvl
    t.life = (t.life ?? 0) + 15 * tr.harmony
    for (const p of cubePowers(h)) addFx(t, p.fx)
    h.followers.slice(0, 3).forEach(f => {
      t.dmg = (t.dmg ?? 0) + 8
      addFx(t, FOLLOWER_FX[FOLLOWERS.indexOf(f)] ?? {})
    })
    t.mult = (t.mult ?? 0) + h.minions.length * (cls.id === 'necromancer' ? 0.1 : 0.05)
    for (const b of h.buffs) t[b.k] = (t[b.k] ?? 0) + b.v
    addFx(t, race)
  }
  return { t, armorPower }
}

/** The hero's numbers: what it hits for, how long it lasts, and the rest. */
export const derive = (h: Hero, race: Fx, gear: Partial<Record<Slot, Item>> = h.gear, lvl = h.level, withExtras = true): Derived => {
  const cls = classOf(h)
  const { t, armorPower } = totalsOf(h, race, gear, lvl, cls, withExtras)
  const g = (k: string) => t[k] ?? 0
  const main = g(cls.main)
  const w = gear.weapon
  const weapon = w ? w.power * (1 + w.quality / 100) : 2 + lvl
  const speed = Math.max(0.3, 1 + g('speed') / 100)
  const crit = Math.min(75, 5 + g('crit')) / 100
  const critDmg = (50 + g('critDmg')) / 100
  const hit = weapon * (1 + main / 100) * (1 + g('dmg') / 100) * (1 + g('mult')) * 2 ** (withExtras ? h.mirrors : 0) * 1.25 ** ascendancies(lvl)
  return {
    dps: hit * speed * (1 + crit * critDmg), hit, main,
    life: (40 + 10 * lvl + g('vit') * 6) * (1 + g('life') / 100),
    armor: g('armor') + armorPower, resist: g('resist'), dr: Math.max(-50, Math.min(85, g('dr'))),
    crit, critDmg, speed, steal: Math.min(10, g('steal')), mf: g('mf'), gf: g('gf'), xp: g('xp'), elite: g('elite'), area: g('area'),
  }
}

/** The share of a hit that lands on the hero from a monster of this level. */
export const takenShare = (d: Derived, ml: number) => {
  const a = d.armor / (d.armor + 50 * ml)
  const r = d.resist / (d.resist + 8 * ml)
  return (1 - a) * (1 - r) * (1 - d.dr / 100)
}

/** How good the hero is with this gear: damage times staying power. */
const scoreOf = (h: Hero, race: Fx, gear: Partial<Record<Slot, Item>>) => {
  const d = derive(h, race, gear)
  return d.dps * Math.sqrt(d.life / Math.max(0.01, takenShare(d, h.level))) * (1 + d.mf / 1000 + d.xp / 500)
}

// ---------------------------------------------------------------- the par hero
// Monsters scale against what a decently geared hero of the same level and class would have, so the
// game balances itself at any level; tiers and ranks multiply from there.

const parCache = new Map<string, Derived>()
const PAR_AFFIX: Record<'w' | 'a' | 'j', StatKey[]> = { w: ['dmg', 'speed', 'critDmg'], a: ['vit', 'life', 'armor', 'resist'], j: ['crit', 'critDmg', 'speed', 'dmg'] }

export const parOf = (cls: string, lvl: number): Derived => {
  const key = `${cls}:${lvl}`
  const hit = parCache.get(key)
  if (hit) return hit
  if (parCache.size > 400) parCache.clear()
  const def = CLASSES[cls] ?? APPRENTICE
  const gear: Partial<Record<Slot, Item>> = {}
  // A new hero has a slot or two and magic junk; by level 20 a full set of rares.
  const filled = Math.min(SLOTS.length, 2 + Math.floor(lvl / 2))
  const n = lvl < 8 ? 1 : lvl < 20 ? 2 : 3
  const rarity: Rarity = lvl < 8 ? 'magic' : 'rare'
  for (const slot of SLOTS.slice(0, filled)) {
    const g = slot === 'weapon' ? 'w' : slot === 'neck' || slot === 'ring' || slot === 'ring2' ? 'j' : 'a'
    const affixes = [def.main as StatKey, ...PAR_AFFIX[g].slice(0, n)].map(k => ({ k, v: affixValue(k, lvl, 0.75) }))
    gear[slot] = { slot, base: '', name: '', rarity, ilvl: lvl, power: basePower(slot, lvl, rarity, 1), affixes, sockets: 0, gems: [], quality: 0 }
  }
  const shell = { cls, mirrors: 0, codex: [], followers: [], minions: [], buffs: [], gear } as unknown as Hero
  const d = derive(shell, {}, gear, lvl, false)
  parCache.set(key, d)
  return d
}

// ---------------------------------------------------------------- items

const RARITY_MULT: Record<Rarity, number> = { normal: 1, magic: 1.1, rare: 1.25, unique: 1.45, set: 1.45 }

const basePower = (slot: Slot, ilvl: number, rarity: Rarity, roll: number) => {
  if (slot === 'neck' || slot === 'ring' || slot === 'ring2') return 0
  const base = slot === 'weapon' ? 3 + 1.4 * ilvl : 4 + 2.5 * ilvl
  return Math.round(base * RARITY_MULT[rarity] * roll)
}

/** An affix's size at this item level: the table's range up to 70, then on growing without end. */
export const affixValue = (k: StatKey, ilvl: number, roll: number) => {
  const a = AFFIX[k]
  const capped = Math.min(ilvl, 70) / 70
  const past = Math.max(0, ilvl - 70)
  const grow = a.pct ? 1 + past * 0.01 : 1 + past * 0.045
  const v = (a.lo + (a.hi - a.lo) * capped) * grow * roll
  return a.pct ? Math.round(v * 10) / 10 : Math.round(v)
}

const POOL: Record<'w' | 'a' | 'h' | 'j', StatKey[]> = {
  w: ['dmg', 'speed', 'critDmg', 'steal', 'elite', 'area', 'str', 'dex', 'int'],
  a: ['vit', 'life', 'armor', 'resist', 'mf', 'gf', 'xp', 'str', 'dex', 'int'],
  h: ['speed', 'crit', 'critDmg', 'vit', 'armor', 'str', 'dex', 'int'],
  j: ['crit', 'critDmg', 'speed', 'dmg', 'mf', 'gf', 'xp', 'elite', 'area', 'vit', 'resist', 'str', 'dex', 'int'],
}
const poolOf = (slot: Slot) => (slot === 'weapon' ? POOL.w : slot === 'hands' ? POOL.h : slot === 'neck' || slot === 'ring' || slot === 'ring2' ? POOL.j : POOL.a)
const MAINS = new Set<StatKey>(['str', 'dex', 'int'])

/** Rolls `n` different affixes; a main stat, when one comes up, is the hero's own four times in five. */
const rollAffixes = (r: R, slot: Slot, ilvl: number, n: number, main: StatKey, boost: number) => {
  const pool = poolOf(slot)
  const out: { k: StatKey; v: number }[] = []
  let tries = 0
  while (out.length < n && tries++ < 40) {
    let k = pick(r, pool)
    if (MAINS.has(k) && r() < 0.8) k = main
    if (out.some(a => a.k === k) || (MAINS.has(k) && out.some(a => MAINS.has(a.k)))) continue
    out.push({ k, v: affixValue(k, ilvl, Math.min(1, between(r, 0.55, 1) * boost)) })
  }
  return out
}

const maxSockets = (slot: Slot) => (slot === 'chest' ? 3 : slot === 'legs' ? 2 : slot === 'weapon' || slot === 'head' || slot === 'offhand' || slot === 'neck' ? 1 : 0)

export type DropOpts = { rarity?: Rarity; tier?: number }

/** One item: rarity rolled against magic find unless given, ancient and primal for the high and lucky. */
export const makeItem = (r: R, ilvl: number, mf: number, main: StatKey, opts: DropOpts = {}): Item => {
  let rarity: Rarity = opts.rarity ?? 'normal'
  if (!opts.rarity) {
    const u = r()
    const luck = 1 + mf / 100
    if (u < 0.0015 * luck) rarity = 'unique'
    else if (u < 0.0021 * luck) rarity = 'set'
    else if (u < 0.0021 * luck + 0.07 * (1 + mf / 300)) rarity = 'rare'
    else if (u < 0.35) rarity = 'magic'
  }
  let tier = 0
  if ((rarity === 'unique' || rarity === 'set') && ilvl >= 40) {
    const v = r()
    if (v < 0.005 + (opts.tier ?? 0) * 0.0002) tier = 2
    else if (v < 0.1) tier = 1
  }
  const boost = tier === 2 ? 99 : tier === 1 ? 1.3 : 1
  let slot: Slot = pick(r, SLOTS)
  let name = ''
  let uid: string | undefined
  if (rarity === 'unique') {
    const p = pick(r, POWERS)
    slot = p.slot
    name = p.item
    uid = p.id
  } else if (rarity === 'set') {
    const s = pick(r, SETS)
    const piece = pick(r, s.pieces)
    slot = piece.slot
    name = piece.name
    uid = s.id
  }
  const base = pick(r, BASES[slot])
  const n = rarity === 'normal' ? 0 : rarity === 'magic' ? int(r, 1, 2) : rarity === 'rare' ? int(r, 3, 5) : 4
  const affixes = rollAffixes(r, slot, ilvl, n, main, boost)
  if (rarity === 'magic') name = `${AFFIX[affixes[0]!.k].pre} ${base}${affixes[1] ? ` ${AFFIX[affixes[1].k].suf}` : ''}`
  else if (rarity === 'rare') name = `${pick(r, RARE_A)} ${pick(r, RARE_B)}`
  else if (rarity === 'normal') name = base
  const sockets = rarity === 'normal' ? 0 : Math.min(maxSockets(slot), r() < 0.35 ? int(r, 1, maxSockets(slot) || 1) : 0)
  return {
    slot, base, name, rarity, ilvl, power: basePower(slot, ilvl, rarity, (tier === 2 ? 1.6 : tier === 1 ? 1.3 : 1) * between(r, 0.85, 1.15)),
    affixes, sockets, gems: [], ...(uid ? { uid } : {}), ...(tier ? { tier } : {}), quality: 0,
  }
}

export const itemColor = (i: Item) => (i.tier === 2 ? PRIMAL_COLOR : i.tier === 1 ? ANCIENT_COLOR : RARITY_COLOR[i.rarity])
export const itemTitle = (i: Item) => `${i.tier === 2 ? 'Primal ' : i.tier === 1 ? 'Ancient ' : ''}${i.name}`

/** The slot an item goes in: a ring takes whichever ring finger it helps most. */
const targetSlots = (i: Item): Slot[] => (i.slot === 'ring' || i.slot === 'ring2' ? ['ring', 'ring2'] : [i.slot])

/** Puts a drop on if it makes the hero better, and gets rid of whatever loses. */
const handleDrop = (h: Hero, race: Fx, item: Item, t: number, notes: Notes, r: R) => {
  const now = scoreOf(h, race, h.gear)
  let best: { slot: Slot; score: number } | null = null
  for (const slot of targetSlots(item)) {
    const s = scoreOf(h, race, { ...h.gear, [slot]: item })
    if (s > now * 1.0001 && (!best || s > best.score)) best = { slot, score: s }
  }
  const notable = item.rarity === 'unique' || item.rarity === 'set'
  if (notable) {
    h.stats.legendaries++
    h.beam = { name: itemTitle(item), color: itemColor(item), at: t }
    say(h, t, `${item.rarity === 'set' ? '✦' : '★'} ${itemTitle(item)} dropped!`, itemColor(item))
    // A toast for a primal or a power never seen before; the rest go to the log.
    if (item.tier === 2) notes.push(`🔴 PRIMAL ${item.name}!`)
    else if (item.rarity === 'unique' && item.uid && !h.codex.includes(item.uid)) notes.push(`🟠 New legendary: ${itemTitle(item)}`)
    unlock(h, item.rarity === 'set' ? 'set' : 'legend', t, notes)
    if (item.tier === 1) unlock(h, 'ancient', t, notes)
    if (item.tier === 2) unlock(h, 'primal', t, notes)
  }
  if (best) {
    const old = h.gear[best.slot]
    h.gear[best.slot] = item
    const gain = Math.round((best.score / Math.max(1e-9, now) - 1) * 100)
    say(h, t, `Equipped ${itemTitle(item)} (+${gain}% power)`, itemColor(item))
    if (old) dispose(h, old, t, notes)
    const worn: Record<string, number> = {}
    for (const i of Object.values(h.gear)) if (i?.rarity === 'set' && i.uid) worn[i.uid] = (worn[i.uid] ?? 0) + 1
    if (Object.values(worn).some(n => n >= 4)) unlock(h, 'set4', t, notes)
  } else dispose(h, item, t, notes)
  void r
}

const dispose = (h: Hero, item: Item, t: number, notes: Notes) => {
  if (item.rarity === 'normal' || item.rarity === 'magic') {
    h.bag.n++
    h.bag.value += Math.round(item.ilvl * (item.rarity === 'magic' ? 6 : 2) + 1)
  } else if (item.rarity === 'rare') h.mats.crystal += 1 + Math.floor(item.ilvl / 25)
  else if (item.rarity === 'unique' && item.uid && !h.codex.includes(item.uid)) {
    h.codex.push(item.uid)
    say(h, t, `Extracted "${POWERS.find(p => p.id === item.uid)?.text ?? item.name}" into the Horadric Compiler`, '#c58bff')
    if (h.codex.length >= 5) unlock(h, 'cube5', t, notes)
  } else h.mats.soul++
}

// ---------------------------------------------------------------- where the hero is

export type Place = { title: string; sky: string; ground: string; foes: readonly string[]; tier: number; spot: number }

export const placeOf = (h: Hero): Place => {
  if (h.stage) {
    const act = ACTS[h.stage.act]!
    return { title: `${act.name.split(':')[0]} · ${act.zones[h.stage.zone]}`, sky: act.sky, ground: act.ground, foes: act.foes, tier: h.stage.act * 2 + h.stage.zone * 0.4, spot: h.stage.act }
  }
  return { title: `T${h.map.tier} ${h.map.name}`, sky: ATLAS.sky, ground: ATLAS.ground, foes: ATLAS.foes, tier: 10 + h.map.tier, spot: 5 }
}

const tierHp = (t: number) => 1.13 ** t
const tierDmg = (t: number) => 1.09 ** t
const tierReward = (t: number) => 1 + 0.08 * t
/** XP climbs with the tier far slower than loot, so pushing maps never shortcuts the curve. */
const tierXp = (t: number) => 1 + 0.02 * t

const RANK = {
  normal: { hp: 1, dmg: 1, xp: 1, loot: 1 },
  magic: { hp: 2, dmg: 1.4, xp: 2, loot: 3 },
  rare: { hp: 2, dmg: 1.6, xp: 4, loot: 5 },
  unique: { hp: 5, dmg: 2, xp: 6, loot: 10 },
  boss: { hp: 10, dmg: 2, xp: 20, loot: 25 },
  goblin: { hp: 3, dmg: 0.2, xp: 5, loot: 20 },
} as const

const plural = (s: string) => (s.endsWith('s') || s.endsWith('x') ? `${s}es` : s.endsWith('y') && !/[aeiou]y$/.test(s) ? `${s.slice(0, -1)}ies` : `${s}s`)

/** The next pack: its rank, size, affixes and numbers, scaled to the hero's par and the place's tier. */
const makeFoe = (h: Hero, r: R, place: Place, isBoss: boolean): Foe => {
  let rank: FoeRank = 'normal'
  let count = int(r, 2, 5)
  let name = `${pick(r, ADJ)} ${pick(r, place.foes)}`
  if (h.goblins > 0) {
    h.goblins--
    rank = 'goblin'; count = 1; name = 'Treasure Goblin'
  } else if (isBoss) {
    rank = 'boss'; count = 1
    name = h.stage ? ACTS[h.stage.act]!.boss : `${pick(r, MAP_BOSSES)}`
  } else {
    const u = r()
    if (u < 0.02) { rank = 'unique'; count = 1; name = `${pick(r, RARE_A)}${pick(r, RARE_B).toLowerCase()} the ${pick(r, place.foes)}` }
    else if (u < 0.1) { rank = 'rare'; count = 4; name = `${pick(r, RARE_A)} ${pick(r, RARE_B)}, ${pick(r, place.foes)}` }
    else if (u < 0.22) { rank = 'magic'; count = 3 }
  }
  const nMods = rank === 'magic' ? 1 : rank === 'rare' ? int(r, 2, 3) : rank === 'unique' || rank === 'boss' ? 2 + Math.floor(place.tier / 25) : 0
  const mods: string[] = []
  let hpMul = 1
  let dmgMul = 1
  while (mods.length < Math.min(nMods, 6)) {
    const m = pick(r, ELITE)
    if (mods.includes(m.name)) continue
    mods.push(m.name)
    hpMul += m.hp ?? 0
    dmgMul += m.dmg ?? 0
  }
  const level = h.level
  const par = parOf(h.cls, level)
  const k = RANK[rank]
  // The campaign eases off after deaths in a row, so no hero is stuck; the Atlas never does.
  const ease = h.stage ? 0.8 ** Math.min(8, h.map.deaths) : 1
  return {
    name, rank, level, count, mods, sprite: hash(name) % 6,
    hp: par.dps * 2.4 * count * k.hp * hpMul * tierHp(place.tier) * ease,
    dmg: par.life * 0.045 * Math.sqrt(count) * k.dmg * dmgMul * tierDmg(place.tier) * ease,
  }
}

/** Settles a fight up front: who wins, how long it takes, the hit the numbers show. */
const startFight = (h: Hero, r: R, race: Fx, t: number, isBoss: boolean): Task => {
  // A meal from camp if no meal is working.
  if (!h.buffs.some(b => b.name.startsWith('Meal:'))) {
    for (let tier = 3; tier >= 0; tier--) {
      if ((h.fish.meals[tier] ?? 0) > 0) {
        h.fish.meals[tier]!--
        const m = MEALS.find(x => x.tier === tier)!
        const potency = 1 + h.life.cooking.lvl / 100
        h.buffs.push({ name: `Meal: ${m.name}`, k: m.k, v: m.v * potency, left: 15 * MIN })
        break
      }
    }
  }
  if (!h.buffs.some(b => b.name.startsWith('Elixir:'))) {
    for (let tier = 3; tier >= 0; tier--) {
      if ((h.elixirs[tier] ?? 0) > 0) {
        h.elixirs[tier]!--
        const e = ELIXIRS.find(x => x.tier === tier)!
        h.buffs.push({ name: `Elixir: ${e.name}`, k: e.k, v: e.v * (1 + h.life.alchemy.lvl / 100), left: 30 * MIN })
        break
      }
    }
  }
  const place = placeOf(h)
  const foe = makeFoe(h, r, place, isBoss)
  const d = derive(h, race)
  const elite = foe.rank === 'normal' ? 0 : d.elite
  const area = foe.count > 1 ? d.area * Math.min(1, (foe.count - 1) / 3) : 0
  const dps = d.dps * (1 + elite / 100) * (1 + area / 100)
  const ttk = foe.hp / Math.max(1e-9, dps)
  const incoming = foe.dmg * takenShare(d, foe.level)
  const heal = d.life * (d.steal / 100) * 0.6
  const ttd = incoming > heal ? (d.life * 1.5) / (incoming - heal) : Infinity
  const win = foe.rank === 'goblin' || ttk <= ttd
  const minS = foe.rank === 'boss' ? 8 : foe.rank === 'goblin' ? 6 : foe.rank === 'normal' ? 1.5 : 3
  const secs = Math.min(20, Math.max(minS, win ? Math.min(ttk, foe.rank === 'goblin' ? 6 : ttk) : ttd))
  const crit = r() < d.crit
  const hit = d.hit * (crit ? 1 + d.critDmg : 1) * between(r, 0.9, 1.1)
  if (hit > h.stats.maxHit) h.stats.maxHit = hit
  const verb = pick(r, VERBS)
  const label = foe.rank === 'normal' ? `${verb} ${foe.count} ${plural(foe.name)}`
    : foe.rank === 'magic' ? `${verb} a champion pack of ${plural(foe.name)}`
    : foe.rank === 'goblin' ? 'Chasing a Treasure Goblin!'
    : foe.rank === 'boss' ? `Fighting ${foe.name}!`
    : `${verb} ${foe.name}`
  void t
  return { kind: 'fight', label, ms: Math.round(secs * 1000), done: 0, foe, win, hit, crit }
}

// ---------------------------------------------------------------- rewards

const gainXp = (h: Hero, xp: number, t: number, notes: Notes, race: Fx) => {
  h.xp += xp
  while (h.xp >= xpToNext(h.level)) {
    h.xp -= xpToNext(h.level)
    h.level++
    const k = KEYSTONES.find(x => x.at === h.level)
    say(h, t, `⬆ Level ${h.level}!${k ? ` Keystone: ${k.name} (${k.text})` : ''}`, '#ffd23f')
    if (h.level % 10 === 0 || k) notes.push(`⬆ ${h.name} reached level ${h.level}${k ? `: ${k.name}` : ''}`)
    if (k) unlock(h, 'keystone', t, notes)
    for (const [lvl, id] of [[10, 'lvl10'], [30, 'lvl30'], [50, 'lvl50'], [70, 'lvl70'], [92, 'lvl92'], [99, 'lvl99'], [120, 'para100']] as const) if (h.level >= lvl) unlock(h, id, t, notes)
    // A follower joins at these levels, like it or not.
    if ((h.level === 5 || h.level === 30 || h.level === 70) && h.followers.length < FOLLOWERS.length) addFollower(h, t, notes)
  }
  void race
}

const addFollower = (h: Hero, t: number, notes: Notes) => {
  const next = FOLLOWERS.find(f => !h.followers.includes(f))
  if (!next) return
  h.followers.push(next)
  say(h, t, `🛡 The ${next} joins your party!`, '#9fd8ff')
  notes.push(`🛡 The ${next} joined the party`)
  if (h.followers.length >= 3) unlock(h, 'party', t, notes)
}

const addGem = (h: Hero, type: number, tier: number, t: number, notes: Notes) => {
  h.gems[type * 8 + tier] = (h.gems[type * 8 + tier] ?? 0) + 1
  // The jeweler combines three into one of the next tier.
  for (let i = 0; i < 7; i++) {
    const at = type * 8 + i
    while ((h.gems[at] ?? 0) >= 3) {
      h.gems[at]! -= 3
      h.gems[at + 1] = (h.gems[at + 1] ?? 0) + 1
      if (i + 1 >= 5) unlock(h, 'royal', t, notes)
    }
  }
}

const gemName = (g: number) => `${GEM_TIERS[g % 100] ? `${GEM_TIERS[g % 100]} ` : ''}${GEMS[Math.floor(g / 100)]}`
export { gemName }

const finishFight = (h: Hero, r: R, race: Fx, task: Task, t: number, notes: Notes) => {
  const foe = task.foe!
  for (const b of h.buffs) b.left -= task.ms
  h.buffs = h.buffs.filter(b => b.left > 0)
  for (const m of h.minions) m.left -= task.ms
  h.minions = h.minions.filter(m => m.left > 0)
  const place = placeOf(h)
  if (!task.win) {
    h.deaths++
    h.gold = Math.floor(h.gold * 0.95)
    say(h, t, `☠ Slain by ${foe.name}${foe.mods.length ? ` [${foe.mods.join(', ')}]` : ''}.`, '#ff6b6b')
    unlock(h, 'death', t, notes)
    if (h.deaths >= 50) unlock(h, 'death50', t, notes)
    h.map.deaths++
    if (!h.stage) {
      if (h.map.deaths >= 3) {
        h.map.tier = Math.max(1, h.map.tier - 1)
        h.map.packs = 0
        h.map.deaths = 0
        h.map.name = pick(r, MAPS)
        say(h, t, `The Atlas pushes back: down to tier ${h.map.tier}.`, '#ff9b6b')
      }
    }
    h.task = { kind: 'dead', label: `Slain by ${foe.name}. Respawning at the checkpoint…`, ms: 6000, done: 0 }
    return true
  }
  if (h.stage) h.map.deaths = 0
  const d = derive(h, race)
  const k = RANK[foe.rank]
  const reward = tierReward(place.tier)
  h.kills += foe.count
  gainXp(h, XP_PER_FOE * foe.count * k.xp * tierXp(place.tier) * (1 + d.xp / 100), t, notes, race)
  const gold = Math.round(foe.level * foe.count * between(r, 1, 3) * (1 + d.gf / 100) * reward * (foe.rank === 'goblin' ? 60 : 1))
  h.gold += gold
  h.stats.goldEarned += gold
  for (const [n, id] of [[1, 'first_blood'], [100, 'k100'], [1000, 'k1000'], [10000, 'k10000'], [100000, 'k100000']] as const) if (h.kills >= n) unlock(h, id, t, notes)
  if (h.gold >= 1_000_000) unlock(h, 'million', t, notes)
  if (foe.rank === 'goblin') {
    say(h, t, `💰 The Treasure Goblin pops: ${fmt(gold)} gold!`, '#ffd23f')
    unlock(h, 'goblin', t, notes)
  }
  // Loot.
  const expected = 0.15 * foe.count * k.loot * reward
  const drops = Math.floor(expected) + (r() < expected % 1 ? 1 : 0)
  const main = classOf(h).main as StatKey
  for (let i = 0; i < drops; i++) {
    const item = makeItem(r, foe.level, d.mf, main, { tier: place.tier, ...(foe.rank === 'goblin' && i < 2 ? { rarity: 'rare' as const } : {}) })
    handleDrop(h, race, item, t, notes, r)
  }
  for (const c of CURRENCY) {
    if (r() < c.chance * foe.count * k.loot * (c.id === 'mirror' ? 1 : reward)) {
      if (c.id === 'mirror') {
        h.mirrors++
        say(h, t, '🪞 A MIRROR OF PROD! All damage doubles, forever.', '#ffffff')
        notes.push('🪞 Mirror of Prod! x2 damage forever')
        unlock(h, 'mirror', t, notes)
      } else h.currency[c.id] = (h.currency[c.id] ?? 0) + 1
    }
  }
  if (r() < 0.05 * foe.count) addGem(h, int(r, 0, 4), Math.max(0, Math.min(7, Math.floor(foe.level / 25) - int(r, 0, 1))), t, notes)
  if (r() < 0.005) {
    const s = pick(r, SHRINES)
    h.buffs.push({ name: s.name, k: s.k, v: s.v, left: 10 * MIN })
    say(h, t, `✨ ${s.name}!`, '#9fffcf')
  }
  // Progress through the campaign or the map.
  if (h.stage) {
    if (foe.rank === 'boss') {
      say(h, t, `👑 ${foe.name} is defeated!`, '#ff8a1f')
      notes.push(`👑 Defeated ${foe.name}`)
      if (h.stage.act === 0) unlock(h, 'act1', t, notes)
      if (h.stage.act === 3) unlock(h, 'act4', t, notes)
      if (h.stage.act === 4) {
        unlock(h, 'act5', t, notes)
        unlock(h, 'atlas', t, notes)
        h.stage = null
        h.map = { tier: 1, packs: 0, deaths: 0, best: 0, name: pick(r, MAPS) }
        say(h, t, '🗺 The Atlas of Repos opens. The maps never end.', '#c58bff')
      } else {
        h.stage = { act: h.stage.act + 1, zone: 0, packs: 0 }
        say(h, t, `${ACTS[h.stage.act]!.name} begins.`, '#e8e0d0')
      }
    } else if (foe.rank !== 'goblin') {
      h.stage.packs++
      if (h.stage.packs >= PACKS_PER_ZONE && h.stage.zone < 4) {
        h.stage.zone++
        h.stage.packs = 0
        say(h, t, `Entering ${ACTS[h.stage.act]!.zones[h.stage.zone]}…`, '#c8c0b0')
      }
    }
  } else if (foe.rank === 'boss') {
    const cleared = h.map.tier
    h.stats.maxTier = Math.max(h.stats.maxTier, cleared)
    h.map.best = Math.max(h.map.best, cleared)
    for (const [n, id] of [[10, 'map10'], [50, 'map50'], [100, 'map100'], [500, 'map500']] as const) if (cleared >= n) unlock(h, id, t, notes)
    say(h, t, `🗺 Cleared tier ${cleared} ${h.map.name}!`, '#c58bff')
    if (cleared % 10 === 0) notes.push(`🗺 Cleared a tier ${cleared} map`)
    h.map = { tier: h.map.deaths === 0 ? cleared + 1 : cleared, packs: 0, deaths: 0, best: h.map.best, name: pick(r, MAPS) }
  } else if (foe.rank !== 'goblin') h.map.packs++
  return false
}

// ---------------------------------------------------------------- town

const SOCKET_GEM: Partial<Record<Slot, number>> = { weapon: 1, head: 2, chest: 3, legs: 3, offhand: 0, neck: 4 }

const townVisit = (h: Hero, r: R, race: Fx, t: number, notes: Notes) => {
  const parts: string[] = []
  if (h.bag.n) {
    parts.push(`sold ${h.bag.n} items for ${fmt(h.bag.value)} gold`)
    h.gold += h.bag.value
    h.stats.goldEarned += h.bag.value
    h.bag = { n: 0, value: 0 }
  }
  const score = () => scoreOf(h, race, h.gear)
  // Try a change to one equipped item; keep it only if the hero got better.
  const attempt = (slot: Slot, change: (i: Item) => Item) => {
    const was = h.gear[slot]
    if (!was) return false
    const before = score()
    h.gear[slot] = change(was)
    if (score() > before) return true
    h.gear[slot] = was
    return false
  }
  const main = classOf(h).main as StatKey
  const equipped = (rarity: Rarity[]) => SLOTS.filter(s => h.gear[s] && rarity.includes(h.gear[s]!.rarity))
  let rolled = 0
  for (const [id, rarities, fn] of [
    ['chaos', ['rare'], (i: Item) => ({ ...i, affixes: rollAffixes(r, i.slot, i.ilvl, i.affixes.length, main, 1) })],
    ['refactor', ['magic'], (i: Item) => ({ ...i, affixes: rollAffixes(r, i.slot, i.ilvl, i.affixes.length, main, 1) })],
    ['divine', ['unique', 'set', 'rare'], (i: Item) => ({ ...i, affixes: i.affixes.map(a => ({ k: a.k, v: affixValue(a.k, i.ilvl, between(r, 0.55, 1) * (i.tier === 1 ? 1.3 : 1)) })) })],
    ['exalt', ['rare'], (i: Item) => (i.affixes.length >= 6 ? i : { ...i, affixes: [...i.affixes, ...rollAffixes(r, i.slot, i.ilvl, 6, main, 1).filter(a => !i.affixes.some(b => b.k === a.k)).slice(0, 1)] })],
    ['jeweler', ['rare', 'unique', 'set', 'magic'], (i: Item) => ({ ...i, sockets: Math.min(maxSockets(i.slot), i.sockets + 1) })],
  ] as const) {
    let have = h.currency[id] ?? 0
    const slots = equipped([...rarities])
    while (have > 0 && slots.length) {
      have--
      rolled++
      attempt(pick(r, slots), fn as (i: Item) => Item)
    }
    h.currency[id] = have
  }
  if (rolled) parts.push(`spent ${rolled} orbs`)
  // The mystic enchants: crystals reroll one affix.
  let enchants = 0
  while (h.mats.crystal >= 10 && enchants < 5) {
    const slots = equipped(['rare', 'unique', 'set'])
    if (!slots.length) break
    h.mats.crystal -= 10
    enchants++
    const slot = pick(r, slots)
    attempt(slot, i => {
      const at = int(r, 0, Math.max(0, i.affixes.length - 1))
      const fresh = rollAffixes(r, i.slot, i.ilvl, 6, main, i.tier === 1 ? 1.3 : 1).find(a => !i.affixes.some((b, j) => j !== at && b.k === a.k))
      return fresh ? { ...i, affixes: i.affixes.map((a, j) => (j === at ? fresh : a)) } : i
    })
  }
  if (enchants) parts.push(`enchanted ${enchants}x`)
  // The blacksmith: ore into quality on the weapon and chest.
  const qCap = 20 + Math.floor(h.life.smithing.lvl / 5)
  for (const slot of ['weapon', 'chest'] as const) {
    const i = h.gear[slot]
    while (i && i.quality < qCap && h.mats.ore >= 10) {
      h.mats.ore -= 10
      i.quality++
    }
  }
  // The jeweler: best gems into open sockets.
  for (const slot of SLOTS) {
    const i = h.gear[slot]
    const type = SOCKET_GEM[slot]
    if (!i || type === undefined) continue
    while (i.gems.length < i.sockets) {
      let tier = 7
      while (tier >= 0 && !(h.gems[type * 8 + tier] ?? 0)) tier--
      if (tier < 0) break
      h.gems[type * 8 + tier]!--
      i.gems.push(type * 100 + tier)
    }
    // Swap a socketed gem for a better loose one.
    i.gems = i.gems.map(g => {
      let tier = 7
      while (tier > g % 100 && !(h.gems[type * 8 + tier] ?? 0)) tier--
      if (tier <= g % 100) return g
      h.gems[type * 8 + tier]!--
      h.gems[type * 8 + (g % 100)] = (h.gems[type * 8 + (g % 100)] ?? 0) + 1
      return type * 100 + tier
    })
  }
  // Kadala's Package Registry: gamble spare gold on the weakest slot.
  const cost = Math.round(250 * h.level ** 1.6)
  let gambles = 0
  while (h.gold > cost * 4 && gambles < 3) {
    h.gold -= cost
    gambles++
    const item = makeItem(r, h.level, 0, main, { rarity: r() < 0.04 ? 'unique' : 'rare' })
    handleDrop(h, race, item, t, notes, r)
  }
  if (gambles) parts.push(`gambled ${gambles}x at Kadala's Package Registry`)
  say(h, t, `🏘 Town: ${parts.join(', ') || 'restocked potions'}.`, '#b8b0a0')
}

// ---------------------------------------------------------------- camp: fishing, mining, cooking

export const rodOf = (lvl: number) => [...RODS].reverse().find(x => x.at <= lvl)!.name
export const pickOf = (lvl: number) => [...PICKS].reverse().find(x => x.at <= lvl)!.name
export const oreOf = (lvl: number) => [...ORES].reverse().find(x => x.at <= lvl)!.name

const SKILL_ICON: Record<LifeSkill, string> = { fishing: '🎣', mining: '⛏', archaeology: '🏺', cooking: '🍳', smithing: '🔨', alchemy: '⚗' }
export const skillIcon = (s: LifeSkill) => SKILL_ICON[s]

const lifeXp = (h: Hero, skill: LifeSkill, xp: number, t: number, notes: Notes) => {
  const s = h.life[skill]
  s.xp += xp * LIFE_RATE
  while (s.xp >= lifeXpToNext(s.lvl)) {
    s.xp -= lifeXpToNext(s.lvl)
    s.lvl++
    if (s.lvl % 5 === 0) say(h, t, `${SKILL_ICON[skill]} ${skill[0]!.toUpperCase()}${skill.slice(1)} level ${s.lvl}!`, '#7fd4ff')
    if (s.lvl % 25 === 0) notes.push(`${SKILL_ICON[skill]} ${skill} reached level ${s.lvl}`)
    if (skill === 'cooking' && s.lvl >= 50) unlock(h, 'cook50', t, notes)
    if (skill === 'smithing' && s.lvl >= 50) unlock(h, 'smith50', t, notes)
    if (s.lvl >= 99) unlock(h, 'skill99', t, notes)
  }
}

const fishTask = (h: Hero, r: R): Task => {
  const spot = FISH_SPOTS[placeOf(h).spot]!
  const secs = between(r, 25, 60) * (1 - Math.min(0.6, h.life.fishing.lvl / 500))
  return { kind: 'fish', label: `Fishing at ${spot.name} with a ${rodOf(h.life.fishing.lvl)}`, ms: Math.round(secs * 1000), done: 0 }
}

const finishFish = (h: Hero, r: R, race: Fx, t: number, notes: Notes) => {
  const lvl = h.life.fishing.lvl
  const spot = FISH_SPOTS[placeOf(h).spot]!
  const u = r()
  const pJunk = Math.max(0.03, 0.18 - lvl * 0.002)
  const pChest = 0.01
  const pLegend = 0.002 * (1 + lvl / 40)
  if (u < pJunk) {
    say(h, t, `🎣 Reeled in… a ${pick(r, JUNK)}.`, '#8a8a8a')
    lifeXp(h, 'fishing', 2, t, notes)
    return
  }
  if (u < pJunk + pChest) {
    say(h, t, '🎣 A sunken treasure chest!', '#ffd23f')
    unlock(h, 'chest', t, notes)
    const item = makeItem(r, h.level, derive(h, race).mf + 100, classOf(h).main as StatKey, { rarity: r() < 0.12 ? 'unique' : 'rare' })
    handleDrop(h, race, item, t, notes, r)
    h.gold += Math.round(h.level * 50)
    lifeXp(h, 'fishing', 40, t, notes)
    return
  }
  const isLegend = u < pJunk + pChest + pLegend
  const idx = isLegend ? -1 : Math.min(5, Math.floor(r() ** 1.8 * 6))
  const name = isLegend ? pick(r, spot.legends) : spot.fish[idx]!
  const baseKg = isLegend ? 80 : 0.3 + idx * 0.8
  const kg = Math.round(baseKg * (1 + lvl / 100) * between(r, 0.6, 1.6) ** 2 * 100) / 100
  h.fish.journal[name] = (h.fish.journal[name] ?? 0) + 1
  h.fish.total++
  const record = kg > (h.fish.best[name] ?? 0)
  if (record) h.fish.best[name] = kg
  const tier = isLegend ? 3 : idx >= 5 ? 2 : idx >= 3 ? 1 : 0
  lifeXp(h, 'fishing', isLegend ? 1000 : 18 + 6 * idx, t, notes)
  const first = h.fish.journal[name] === 1
  if (tier > 0 || first || (record && h.fish.journal[name]! > 1) || h.fish.total % 10 === 0) {
    say(h, t, `🎣 Caught a ${kg}kg ${name}${first ? ' (new to the journal!)' : record ? ' (new record!)' : ''}`, isLegend ? '#ff8a1f' : tier === 2 ? '#f2e05a' : tier === 1 ? '#8080ff' : '#7fd4ff')
  }
  if (isLegend) {
    notes.push(`🐟 LEGENDARY FISH: ${name} (${kg}kg)`)
    unlock(h, 'fishlegend', t, notes)
  }
  unlock(h, 'fish1', t, notes)
  if (h.fish.total >= 1000) unlock(h, 'fish1000', t, notes)
  if ([...spot.fish, ...spot.legends].every(f => h.fish.journal[f])) unlock(h, 'journal', t, notes)
  // Every third fish goes in the pan: a meal for the next fight.
  if (h.fish.total % 3 === 0) {
    h.fish.meals[tier] = Math.min(20, (h.fish.meals[tier] ?? 0) + 1)
    lifeXp(h, 'cooking', 60 + 30 * tier, t, notes)
  }
}

const mineTask = (h: Hero, r: R): Task => {
  const secs = between(r, 20, 45) * (1 - Math.min(0.5, h.life.mining.lvl / 500))
  return { kind: 'mine', label: `Mining ${oreOf(h.life.mining.lvl)} with a ${pickOf(h.life.mining.lvl)}`, ms: Math.round(secs * 1000), done: 0 }
}

const finishMine = (h: Hero, r: R, t: number, notes: Notes) => {
  const lvl = h.life.mining.lvl
  const n = 1 + Math.floor(lvl / 10)
  h.mats.ore += n
  lifeXp(h, 'mining', 30, t, notes)
  // The camp forge smelts as it goes: smithing learns from every load.
  lifeXp(h, 'smithing', 25, t, notes)
  if (r() < 0.05) addGem(h, int(r, 0, 4), Math.min(7, Math.floor(lvl / 30)), t, notes)
  if (r() < 0.01) {
    const c = pick(r, CURRENCY.filter(x => x.id !== 'mirror'))
    h.currency[c.id] = (h.currency[c.id] ?? 0) + 1
    say(h, t, `⛏ A geode cracks open: ${c.name}!`, '#c58bff')
  } else if (r() < 0.15) say(h, t, `⛏ Mined ${n} ${oreOf(lvl)}.`, '#b0a090')
}

export const shovelOf = (lvl: number) => [...SHOVELS].reverse().find(x => x.at <= lvl)!.name

const digTask = (h: Hero, r: R): Task => {
  const site = RELIC_SITES[placeOf(h).spot]!
  const secs = between(r, 30, 70) * (1 - Math.min(0.5, h.life.archaeology.lvl / 500))
  return { kind: 'dig', label: `Excavating ${site.name} with a ${shovelOf(h.life.archaeology.lvl)}`, ms: Math.round(secs * 1000), done: 0 }
}

const finishDig = (h: Hero, r: R, race: Fx, t: number, notes: Notes) => {
  const lvl = h.life.archaeology.lvl
  const site = RELIC_SITES[placeOf(h).spot]!
  const u = r()
  lifeXp(h, 'archaeology', 30, t, notes)
  // Reagents for the alchemist, almost every dig; three brew an elixir.
  h.mats.reagent += 1 + Math.floor(lvl / 25)
  while (h.mats.reagent >= 3) {
    h.mats.reagent -= 3
    const al = h.life.alchemy.lvl
    const tier = Math.min(3, Math.floor(r() ** 2 * (1 + al / 25)))
    h.elixirs[tier] = Math.min(20, (h.elixirs[tier] ?? 0) + 1)
    lifeXp(h, 'alchemy', 60 + 30 * tier, t, notes)
    if (tier === 3) unlock(h, 'elixir', t, notes)
  }
  if (u < 0.12 + lvl * 0.001) {
    const relic = pick(r, site.relics)
    const isNew = !h.relics[relic]
    h.relics[relic] = (h.relics[relic] ?? 0) + 1
    if (isNew || h.relics[relic]! % 10 === 0) say(h, t, `🏺 Unearthed: ${relic}${isNew ? ' (new!)' : ` (x${h.relics[relic]})`}`, isNew ? '#e8c27a' : '#b8a080')
    unlock(h, 'relic', t, notes)
    if (isNew && site.relics.every(x => h.relics[x])) {
      say(h, t, `🏛 ${site.name} complete: +2% damage forever.`, '#ffd23f')
      notes.push(`🏛 Completed ${site.name}`)
      unlock(h, 'site', t, notes)
    }
  } else if (u < 0.135 + lvl * 0.001) {
    say(h, t, '🏺 An ancient fragment, still humming…', '#ff8a1f')
    handleDrop(h, race, makeItem(r, h.level, 200, classOf(h).main as StatKey, { rarity: r() < 0.5 ? 'unique' : 'set' }), t, notes, r)
  }
}

/** The gathering skill camp works on: the pinned one, or the lowest. */
const campSkill = (h: Hero): 'fish' | 'mine' | 'dig' => {
  const l = h.life
  const opts: ['fish' | 'mine' | 'dig', number][] = [['fish', l.fishing.lvl], ['mine', l.mining.lvl], ['dig', l.archaeology.lvl]]
  opts.sort((a, b) => a[1] - b[1])
  return opts[0]![0]
}

// ---------------------------------------------------------------- the loop

const isCombat = (task: Task) => task.kind === 'fight' || task.kind === 'dead' || task.kind === 'town'

const nextTask = (h: Hero, r: R, race: Fx, t: number, prev: Task) => {
  if (h.bag.n >= BAG_CAP) {
    h.task = { kind: 'town', label: 'Town portal: selling loot, crafting, gambling…', ms: 6000, done: 0 }
    return
  }
  if (h.focus > 0) {
    if (!isCombat(prev) && prev.kind !== 'travel') {
      h.task = { kind: 'travel', label: `Answering the call to ${placeOf(h).title}…`, ms: 3000, done: 0 }
      return
    }
    const isBoss = h.stage ? h.stage.zone === 4 && h.stage.packs >= PACKS_PER_ZONE : h.map.packs >= PACKS_PER_MAP
    h.task = startFight(h, r, race, t, isBoss)
    return
  }
  if (isCombat(prev)) {
    h.task = { kind: 'travel', label: `Heading back to camp at ${FISH_SPOTS[placeOf(h).spot]!.name}…`, ms: 4000, done: 0 }
    return
  }
  const skill = campSkill(h)
  h.task = skill === 'mine' ? mineTask(h, r) : skill === 'dig' ? digTask(h, r) : fishTask(h, r)
}

const finishTask = (h: Hero, r: R, race: Fx, t: number, notes: Notes) => {
  const task = h.task
  if (task.kind === 'fight') {
    if (finishFight(h, r, race, task, t, notes)) return
  } else if (task.kind === 'town') townVisit(h, r, race, t, notes)
  else if (task.kind === 'fish') finishFish(h, r, race, t, notes)
  else if (task.kind === 'mine') finishMine(h, r, t, notes)
  else if (task.kind === 'dig') finishDig(h, r, race, t, notes)
  nextTask(h, r, race, t, task)
}

/** Runs the game from where it was to `now`: fights while focus lasts, camp after. Returns what is worth a toast. */
export const step = (h: Hero, now: number, race: Fx): Notes => {
  const notes: Notes = []
  const r = rngOf(h)
  ensureBounties(h, now, r)
  let t = Math.max(h.lastTick, now - CATCH_UP_CAP)
  let guard = 0
  while (t < now && guard++ < 50_000) {
    const task = h.task
    const need = task.ms - task.done
    const avail = now - t
    const spend = Math.min(need, avail)
    task.done += spend
    if (isCombat(task)) h.focus = Math.max(-60_000, h.focus - spend)
    t += spend
    if (task.done >= task.ms) finishTask(h, r, race, t, notes)
  }
  h.lastTick = now
  return notes
}

// ---------------------------------------------------------------- real work

/** The daily bounty board: three real-work bounties a day, the same three for the whole day. */
const ensureBounties = (h: Hero, now: number, r: R) => {
  const day = dayKey(now)
  if (h.bounties.day === day) return
  const list: Bounty[] = []
  const seen = new Set<string>()
  const local = (() => { let s = hash(day + h.name); return () => ((s = Math.imul(s ^ (s >>> 13), 0x5bd1e995) >>> 0) % 10000) / 10000 })()
  while (list.length < 3) {
    const b = pick(local, BOUNTIES)
    if (seen.has(b.id)) continue
    seen.add(b.id)
    list.push({ id: b.id, text: b.text, k: b.k, need: b.need, have: 0 })
  }
  h.bounties = { day, list, boards: h.bounties.boards, claimed: [] }
  void r
}

const COUNT_KEYS = Object.keys(emptyCounts()) as (keyof Counts)[]

/** Folds one session's counts into the hero, using only what grew since the last time, so nothing counts twice. */
export const applyCounts = (h: Hero, sid: string, counts: Counts, now: number, race: Fx): Notes => {
  const notes: Notes = []
  const was = h.applied[sid] ?? emptyCounts()
  const d = emptyCounts()
  let any = false
  for (const k of COUNT_KEYS) {
    const v = (counts[k] ?? 0) - (was[k] ?? 0)
    d[k] = v > 0 ? v : 0
    if (d[k]) any = true
  }
  h.applied[sid] = { ...counts }
  if (!any) return notes
  const r = rngOf(h)
  const t = now
  ensureBounties(h, now, r)
  for (const k of COUNT_KEYS) h.counts[k] += d[k]
  const actions = d.edit + d.bash + d.read + d.agent + d.web
  h.focus = Math.min(FOCUS.cap, Math.max(0, h.focus) + actions * FOCUS.action + d.turns * FOCUS.turn + d.commit * FOCUS.commit + d.test * FOCUS.test)
  // Awakening: the class shows itself after 50 actions.
  if (!h.chosen) {
    const c = h.counts
    const total = c.edit + c.bash + c.read + c.agent + c.web
    if (total >= 50) {
      const by: [string, number][] = [['paladin', c.edit], ['sorcerer', c.bash], ['ranger', c.read], ['necromancer', c.agent * 4], ['rogue', c.web * 3]]
      by.sort((a, b) => b[1] - a[1])
      h.cls = by[0]![0]
      h.chosen = true
      say(h, t, `✨ ${h.name} awakens as a ${classOf(h).name}!`, classOf(h).color)
      notes.push(`✨ Awakened as a ${classOf(h).name}`)
      unlock(h, 'awaken', t, notes)
    }
  }
  if (d.commit) {
    h.goblins = Math.min(3, h.goblins + d.commit)
    say(h, t, '💰 A commit lands. A Treasure Goblin appears!', '#ffd23f')
  }
  for (let i = 0; i < d.test; i++) {
    if (r() < 0.35) {
      const s = pick(r, SHRINES)
      h.buffs.push({ name: s.name, k: s.k, v: s.v, left: 10 * MIN })
      say(h, t, `✨ Green tests: ${s.name}!`, '#9fffcf')
    }
  }
  for (let i = 0; i < d.agent && h.minions.length < 6; i++) {
    const m = pick(r, MINIONS)
    h.minions.push({ name: m, left: 15 * MIN })
    say(h, t, `💀 A subagent rises: ${m}.`, '#c58bff')
  }
  if (d.rested) {
    h.buffs = h.buffs.filter(b => b.name !== 'Well Rested')
    h.buffs.push({ name: 'Well Rested', k: 'xp', v: 50, left: 30 * MIN })
    h.stats.rested += d.rested
    say(h, t, '🛏 Rested at the Inn of Compaction: +50% XP.', '#9fd8ff')
    if (h.stats.rested >= 10) unlock(h, 'rested10', t, notes)
  }
  for (let i = 0; i < d.handoff; i++) addFollower(h, t, notes)
  if (d.web) {
    gainXp(h, xpToNext(h.level) * 0.01 * d.web, t, notes, race)
    say(h, t, `📜 Read ${d.web} lore tome${d.web > 1 ? 's' : ''} from the web.`, '#d8c8a0')
  }
  const tr = trainingOf(h.counts)
  if (tr.harmony >= 0.8) unlock(h, 'harmony', t, notes)
  if (d.fail && r() < 0.3) say(h, t, `❄ A failed command: you are Frozen for a moment.`, '#9fd8ff')
  const hour = new Date(now).getHours()
  if (hour >= 2 && hour < 5) unlock(h, 'night', t, notes)
  // Bounties.
  for (const b of h.bounties.list) {
    if (h.bounties.claimed.includes(b.id)) continue
    b.have = Math.min(b.need, b.have + d[b.k])
    if (b.have >= b.need) {
      h.bounties.claimed.push(b.id)
      say(h, t, `📋 Bounty complete: ${b.text}. A Horadric Cache!`, '#ffd23f')
      notes.push(`📋 Bounty done: ${b.text}`)
      const main = classOf(h).main as StatKey
      for (let i = 0; i < 3; i++) {
        const u = r()
        handleDrop(h, race, makeItem(r, h.level, 0, main, { rarity: u < 0.05 ? 'set' : u < 0.2 ? 'unique' : 'rare' }), t, notes, r)
      }
      h.gold += Math.round(500 * h.level)
      h.currency.chaos = (h.currency.chaos ?? 0) + 1
      if (h.bounties.claimed.length === h.bounties.list.length) {
        h.bounties.boards++
        if (h.bounties.boards >= 7) unlock(h, 'bounty7', t, notes)
      }
    }
  }
  return notes
}

/** A one-line catch-up of what happened between two saves. */
export const awaySummary = (before: Hero, after: Hero, ms: number) => {
  const parts: string[] = []
  const k = after.kills - before.kills
  if (k) parts.push(`slew ${fmt(k)} monsters`)
  if (after.level > before.level) parts.push(`gained ${after.level - before.level} level${after.level - before.level > 1 ? 's' : ''}`)
  const f = after.fish.total - before.fish.total
  if (f) parts.push(`caught ${f} fish`)
  const ore = after.mats.ore - before.mats.ore
  if (ore > 0) parts.push(`mined ${ore} ore`)
  const relics = Object.values(after.relics).reduce((a, b) => a + b, 0) - Object.values(before.relics).reduce((a, b) => a + b, 0)
  if (relics > 0) parts.push(`dug up ${relics} relic${relics > 1 ? 's' : ''}`)
  const l = after.stats.legendaries - before.stats.legendaries
  if (l) parts.push(`found ${l} legendar${l > 1 ? 'ies' : 'y'}`)
  const g = after.gold - before.gold
  if (g > 0) parts.push(`+${fmt(g)} gold`)
  if (!parts.length) return ''
  const h = Math.floor(ms / HOUR)
  const m = Math.round((ms % HOUR) / MIN)
  return `While you were away (${h ? `${h}h ` : ''}${m}m): ${parts.join(', ')}.`
}

export const logLines = (h: Hero, n: number): LogLine[] => h.log.slice(-n)
