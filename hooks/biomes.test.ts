// task-13: a biome for every place, weather, and the flavor count.
import { expect, test } from 'claude-code/testing'

import { DING_MS, EFX, holidaysOf, moonOf, sceneSvg, TROPHY_MS } from './art'
import { ACT_INTRO, ACT_OUTRO, ACTS, ADJ, BOSS_TAUNTS, ELITE, FOLLOWERS, JUNK, MAP_BOSSES, MAPS, MINIONS, RARE_A, RARE_B, VERBS } from './data'
import { ENTER, LAND, rollEvent, TEMPLATE_COUNT } from './events'
import { applyCounts, emptyCounts, newHero, step } from './game'
import { BIOMES, biomeOf, PALS, rng, world } from './sprites/pixel2'

const places = [...ACTS.flatMap(a => a.zones), ...MAPS]
const DAY = Date.parse('2026-11-12T15:00:00'), NIGHT = Date.parse('2026-11-12T23:00:00')

test('task-13 AC1: every place has its own biome, 40+ of them, with every layer kind and weather in use', () => {
  expect(places.length).toBeGreaterThanOrEqual(45)
  for (const p of places) expect(BIOMES[p]).toBeDefined()
  const combos = new Set(places.map(p => JSON.stringify(biomeOf(p))))
  expect(combos.size).toBeGreaterThanOrEqual(40)
  const used = (k: 'pal' | 'far' | 'mid' | 'wx') => new Set(places.map(p => biomeOf(p)[k]))
  expect(used('pal').size).toBe(Object.keys(PALS).length)
  expect(used('far').size).toBe(7)
  expect(used('mid').size).toBe(9)
  for (const wx of ['rain', 'snow', 'embers', 'fog', 'fireflies', 'aurora', 'spores', 'leaves', 'sand']) expect(used('wx').has(wx as never)).toBe(true)
  // an unknown place still gets a biome, the same one every time
  expect(biomeOf('Somewhere New')).toEqual(biomeOf('Somewhere New'))
  // the meadow without a biome is still drawn the old way
  expect(world('V1').w).toBe(480)
})

test('task-13 AC1+AC2: each place draws its own scene with its weather, under 40 KB by day and by night', () => {
  const h = newHero('Ada', 'paladin', 5, DAY)
  let max = 0
  const seen = new Set<string>()
  places.forEach((p, i) => {
    const ai = ACTS.findIndex(a => a.zones.includes(p))
    if (ai >= 0) h.stage = { act: ai, zone: ACTS[ai]!.zones.indexOf(p), packs: 0 }
    else { h.stage = null; h.map = { ...h.map, name: p } }
    for (const now of i % 4 === 0 ? [DAY, NIGHT] : [DAY]) {
      const s = sceneSvg(h, { w: 720, h: 120, now, period: 0.8 })
      max = Math.max(max, s.length)
      const wx = biomeOf(p).wx
      if (wx) expect(s).toContain(`data-wx="${wx}"`)
      else expect(s).not.toContain('data-wx')
      if (now === DAY) seen.add(s.match(/href="([^"]+)"/)![1]!)
    }
  })
  expect(max).toBeLessThan(40_000)
  expect(seen.size).toBeGreaterThanOrEqual(40)
})

test('task-13 AC3: flavor tables are at least three times the base word tables, and the land lines show up', () => {
  // base 9d46e52: ADJ 20, VERBS 12, JUNK 8, RARE_A 16, RARE_B 16, MAP_BOSSES 8, FOLLOWERS 5, MINIONS 4; no tale tables
  const BASE = 89
  const now = [ADJ, VERBS, JUNK, RARE_A, RARE_B, MAP_BOSSES, FOLLOWERS, MINIONS].reduce((s, t) => s + t.length, 0) + TEMPLATE_COUNT
  expect(now).toBeGreaterThanOrEqual(BASE * 3)
  for (const k of Object.keys(PALS)) expect(LAND[k]!.length).toBeGreaterThanOrEqual(6)
  for (const l of Object.values(LAND).flat()) expect(l.replaceAll('{H}', 'Brindle').length).toBeLessThanOrEqual(60)
  const h = newHero('Ada', 'paladin', 5, DAY)
  const r = rng(42), lines = new Set<string>()
  for (let i = 0; i < 3000; i++) { const t = rollEvent(h, r, DAY, 'Desert of Deprecation', 'desert'); if (t) lines.add(t.line) }
  expect(lines.has('A vulture follows Ada at a polite distance.')).toBe(true)
})

test('task-13 flavor: boss taunts, act lines and entry lines exist, and a boss fight taunts under a red sky', () => {
  expect(BOSS_TAUNTS.length).toBeGreaterThanOrEqual(20)
  expect(ACT_INTRO.length).toBe(ACTS.length)
  expect(ACT_OUTRO.length).toBe(ACTS.length)
  for (const k of Object.keys(PALS)) expect(ENTER[k]!.length).toBeGreaterThanOrEqual(3)
  for (const l of [...BOSS_TAUNTS, ...ACT_INTRO.flat(), ...ACT_OUTRO.flat(), ...Object.values(ENTER).flat()]) {
    expect(l.length).toBeLessThanOrEqual(60)
    expect(l.includes('—')).toBe(false)
  }
  const h = newHero('Ada', 'paladin', 5, DAY)
  applyCounts(h, 's1', { ...emptyCounts(), edit: 400 }, DAY, {})
  h.stage = { act: 0, zone: 4, packs: 99 }
  let t = DAY
  for (let i = 0; i < 200 && !(h.task.kind === 'fight' && h.task.foe?.rank === 'boss'); i++) step(h, t += 5_000, {})
  expect(h.task.foe?.rank).toBe('boss')
  expect(h.log.some(l => BOSS_TAUNTS.some(q => l.s.includes(q)))).toBe(true)
  const s = sceneSvg(h, { w: 720, h: 120, now: t, period: 0.8 })
  expect(s).toContain('data-arena="1"')
  expect(s).toContain('data-wx=')
})

test('task-13 town stalls: a market stall, anvil, forge and dice booth past the houses, the booth dropped when narrow', () => {
  const h = newHero('Ada', 'paladin', 5, DAY)
  h.task = { kind: 'town', label: 'Town portal: selling loot, crafting, gambling…', ms: 6000, done: 1000 }
  const wide = sceneSvg(h, { w: 720, h: 120, now: DAY, period: 0.8 }), narrow = sceneSvg(h, { w: 360, h: 120, now: NIGHT, period: 0.8 })
  for (const k of ['stall', 'anvil', 'fire', 'booth']) expect(wide).toContain(`data-stall="${k}"`)
  expect(narrow).toContain('data-stall="fire"')
  expect(narrow).not.toContain('data-stall="booth"')
  expect(Math.max(wide.length, narrow.length)).toBeLessThan(40_000)
})

test('task-13 gathering spots: a fish bucket on the bank, a cart at the mine, a flag and bucket at the dig', () => {
  const h = newHero('Ada', 'paladin', 5, DAY)
  for (const [kind, n] of [['fish', 1], ['mine', 1], ['dig', 2]] as const) {
    h.task = { kind, label: 'Gathering at camp', ms: 60_000, done: 1000 }
    for (const w of [720, 360]) {
      const s = sceneSvg(h, { w, h: 120, now: DAY, period: 0.8 })
      expect(s.split(`data-spot="${kind}"`).length - 1).toBe(n)
      expect(s.length).toBeLessThan(40_000)
    }
  }
})

test('task-13 weather in motion: a falling or rising particle never shows inside the two text rows', () => {
  // how far each keyframe lifts a visible particle, in art pixels; the text rows end at y 18
  const lift: Record<string, number> = { rain: 12, snow: 8, leaves: 8, embers: 10, spores: 10, fireflies: 2, sand: 0 }
  const h = newHero('Ada', 'paladin', 5, DAY)
  let checked = 0
  for (const p of places) {
    const wx = biomeOf(p).wx
    if (!wx || !(wx in lift)) continue
    const ai = ACTS.findIndex(a => a.zones.includes(p))
    if (ai >= 0) h.stage = { act: ai, zone: ACTS[ai]!.zones.indexOf(p), packs: 0 }
    else { h.stage = null; h.map = { ...h.map, name: p } }
    for (const w of [720, 360]) {
      const g = sceneSvg(h, { w, h: 120, now: DAY, period: 0.8 }).match(/<g class="wx-\w+" data-wx="\w+">(.*?)<\/g>/)![1]!
      for (const m of g.matchAll(/ y="(\d+)"/g)) { expect(Number(m[1]) / 2 - lift[wx]!).toBeGreaterThanOrEqual(18); checked++ }
    }
  }
  expect(checked).toBeGreaterThan(100)
})

test('elite tells: every affix but Horde draws a mark, two at most, clear of the text rows and inside the budget', () => {
  for (const e of ELITE) if (e.name !== 'Horde') expect(EFX[e.name]).toBeDefined()
  const fams = [...new Set(Object.values(EFX))]
  expect(fams.length).toBeGreaterThanOrEqual(12)
  const h = newHero('Ada', 'paladin', 5, DAY)
  h.stage = { act: 1, zone: 1, packs: 0 }
  const fight = (mods: string[], count = 2) => ({ kind: 'fight' as const, label: 'Fighting', ms: 6000, done: 1000, win: true,
    foe: { name: 'Linter Imp', base: 'Linter Imp', rank: 'magic' as const, level: 10, hp: 100, dmg: 5, count, mods, sprite: 0 } })
  for (const fam of fams) {
    const mods = [Object.keys(EFX).find(m => EFX[m] === fam)!]
    h.task = fight(mods)
    for (const w of [720, 360]) {
      const s = sceneSvg(h, { w, h: 120, now: DAY, period: 0.8 })
      expect(s).toContain(`data-efx="${fam}"`)
      expect(s.length).toBeLessThan(40_000)
      for (const m of s.matchAll(/<(?:image|rect)[^>]* y="(\d+)"[^>]*data-efx=/g)) expect(Number(m[1]) / 2).toBeGreaterThanOrEqual(26)
    }
  }
  // two marks at most, the same family once, and Horde or no affix draws none
  h.task = fight(['Molten', 'Overclocked', 'Frozen', 'Vampiric'])
  expect(new Set(sceneSvg(h, { w: 720, h: 120, now: DAY, period: 0.8 }).match(/data-efx="\w+"/g)).size).toBe(2)
  for (const mods of [['Horde'], []]) { h.task = fight(mods); expect(sceneSvg(h, { w: 720, h: 120, now: DAY, period: 0.8 })).not.toContain('data-efx') }
  // a returning nemesis is labeled by its name until it is beaten
  h.task = fight([])
  expect(sceneSvg(h, { w: 720, h: 120, now: DAY, period: 0.8 })).not.toContain('data-nemesis')
  h.nemesis = { base: 'Linter Imp', name: 'Linter Imp the Smug', at: DAY, wins: 1 }
  expect(sceneSvg(h, { w: 720, h: 120, now: DAY, period: 0.8 })).toContain('data-nemesis')
  h.nemesis.beaten = DAY
  expect(sceneSvg(h, { w: 720, h: 120, now: DAY, period: 0.8 })).not.toContain('data-nemesis')
})

test('boss enrage: a boss fight carries a ring and a tag timed to show from halfway, and other fights do not', () => {
  const h = newHero('Ada', 'paladin', 5, DAY)
  h.stage = { act: 2, zone: 4, packs: 0 }
  const foe = { name: 'The Merge Conflict', rank: 'boss' as const, level: 30, hp: 1000, dmg: 50, count: 1, mods: [], sprite: 0 }
  h.task = { kind: 'fight', label: 'Fighting', ms: 9000, done: 2500, win: true, foe }
  const s = sceneSvg(h, { w: 720, h: 120, now: DAY, period: 0.8 })
  expect(s).toContain('data-enrage="1"')
  expect(s).toContain('@keyframes enr{0%{opacity:0}50%,100%{opacity:1}}')
  expect(s.match(/animation:enr 9000ms step-end -2500ms forwards/g)!.length).toBe(2)
  expect(s.length).toBeLessThan(40_000)
  h.task = { ...h.task, foe: { ...foe, rank: 'rare' as const, name: 'Linter Imp', base: 'Linter Imp' } }
  expect(sceneSvg(h, { w: 720, h: 120, now: DAY, period: 0.8 })).not.toContain('data-enrage')
})

test('holidays: the real calendar decorates the scene, looks only, and a plain day draws none', () => {
  const at = (iso: string) => Date.parse(iso)
  expect(holidaysOf(at('2026-10-31T12:00:00'), 'day')).toEqual(['pumpkins'])
  expect(holidaysOf(at('2026-10-14T12:00:00'), 'day')).toEqual([])
  expect(holidaysOf(at('2026-12-24T12:00:00'), 'day')).toEqual(['tree'])
  expect(holidaysOf(at('2026-12-31T12:00:00'), 'day')).toEqual(['tree'])
  expect(holidaysOf(at('2026-12-31T22:00:00'), 'night')).toEqual(['tree', 'fireworks'])
  expect(holidaysOf(at('2027-02-14T12:00:00'), 'day')).toEqual(['hearts'])
  expect(holidaysOf(at('2027-07-04T21:00:00'), 'dusk')).toEqual(['fireworks'])
  expect(holidaysOf(at('2026-11-12T12:00:00'), 'day')).toEqual([])
  const scene = (iso: string, kind: 'travel' | 'fight' | 'fish', w = 720) => {
    const now = at(iso), h = newHero('Ada', 'paladin', 7, now)
    h.stage = null
    if (kind === 'fight') { step(h, now + 1000, {}); let n = 0; while (h.task.kind !== 'fight' && n++ < 400) step(h, now + 1000 + n * 60_000, {}) }
    else h.task = { kind, label: 'x', ms: 6000, done: 1000 }
    return sceneSvg(h, { w, h: 120, now, period: 0.8 })
  }
  for (const [iso, k] of [['2026-10-31T15:00:00', 'pumpkins'], ['2026-12-24T22:00:00', 'tree'], ['2027-02-14T12:00:00', 'hearts'], ['2027-07-04T21:30:00', 'fireworks']] as const)
    for (const w of [720, 360]) {
      const svg = scene(iso, 'travel', w)
      expect(svg).toContain(`data-holiday="${k}"`)
      expect(svg.length).toBeLessThan(40_000)
    }
  expect(scene('2026-11-12T12:00:00', 'travel')).not.toContain('data-holiday')
  // ground pieces stay out of fights and off the water; sky pieces still show
  expect(scene('2026-10-31T15:00:00', 'fight')).not.toContain('data-holiday="pumpkins"')
  expect(scene('2026-12-24T12:00:00', 'fish')).not.toContain('data-holiday="tree"')
  expect(scene('2027-02-14T12:00:00', 'fish')).toContain('data-holiday="hearts"')
})

test('celebrations: a level-up lifts a pillar and names the level, a boss kill rains confetti, each for a few seconds', () => {
  const T = Date.parse('2026-11-12T15:00:00')
  const h = newHero('Ada', 'paladin', 7, T)
  applyCounts(h, 's1', { ...emptyCounts(), edit: 300, read: 300 }, T, {})
  for (let t = T + 60_000; t <= T + 6 * 3_600_000 && h.ding?.kind !== 'level'; t += 60_000) step(h, t, {})
  expect(h.ding?.kind).toBe('level')
  expect(h.ding?.text).toBe(`Level ${h.level}`)
  const at = h.ding!.at, draw = (now: number) => sceneSvg(h, { w: 720, h: 120, now, period: 0.8 })
  expect(draw(at + 1000)).toContain('data-ding="level"')
  expect(draw(at + DING_MS + 1)).not.toContain('data-ding')
  expect(draw(at - 1000)).not.toContain('data-ding')
  h.ding = { kind: 'boss', text: 'The Pager at 3 AM', at }
  for (const w of [720, 360]) {
    const svg = sceneSvg(h, { w, h: 120, now: at + 2000, period: 0.8 })
    expect(svg).toContain('data-ding="boss"')
    expect(svg.length).toBeLessThan(40_000)
  }
})

test('trophy: the newest achievement shows by name for a few seconds, never over a fight, and old unlocks stay quiet', () => {
  const T = Date.parse('2026-11-12T15:00:00')
  const h = newHero('Ada', 'paladin', 7, T)
  h.stage = null
  h.task = { kind: 'travel', label: 'x', ms: 6000, done: 1000 }
  h.ach = { kills1: T - 86_400_000, trips100: T }
  const draw = (now: number, w = 720) => sceneSvg(h, { w, h: 120, now, period: 0.8 })
  for (const w of [720, 360]) expect(draw(T + 2000, w)).toContain('data-trophy="trips100"')
  expect(draw(T + TROPHY_MS + 1)).not.toContain('data-trophy')
  h.ach = { kills1: T - 86_400_000 }
  expect(draw(T)).not.toContain('data-trophy')
  h.ach.trips100 = T
  step(h, T + 1000, {}); let n = 0
  while (h.task.kind !== 'fight' && n++ < 400) step(h, T + 1000 + n * 1000, {})
  h.ach.trips100 = T + 1000 + n * 1000
  expect(draw(h.ach.trips100 + 500)).not.toContain('data-trophy')
})

test('moon phase: the night moon follows the real calendar, and the day sky does not change with it', () => {
  // dated new, first quarter, full and last quarter moons from 2024
  expect(moonOf(Date.UTC(2024, 0, 11, 11, 57))).toBe(0)
  expect(moonOf(Date.UTC(2024, 0, 18, 3, 52))).toBe(2)
  expect(moonOf(Date.UTC(2024, 0, 25, 17, 54))).toBe(4)
  expect(moonOf(Date.UTC(2024, 1, 2, 23, 18))).toBe(6)
  expect(new Set(Array.from({ length: 30 }, (_, d) => moonOf(Date.UTC(2026, 10, 1 + d)))).size).toBe(8)
  const sky = (iso: string) => {
    const h = newHero('Brindle', 'paladin', 7, Date.parse(iso))
    h.task = { kind: 'travel', label: 'Walking…', ms: 6000, done: 1000 }
    return sceneSvg(h, { w: 720, h: 120, now: Date.parse(iso), period: 0.8 }).match(/<image [^>]*>/)![0]
  }
  // 2026-11-09 is near new and 2026-11-24 near full: the night backdrops differ, the noon ones match
  expect(moonOf(Date.parse('2026-11-09T22:00:00'))).not.toBe(moonOf(Date.parse('2026-11-24T22:00:00')))
  expect(sky('2026-11-09T22:00:00')).not.toBe(sky('2026-11-24T22:00:00'))
  expect(sky('2026-11-09T12:00:00')).toBe(sky('2026-11-24T12:00:00'))
})
