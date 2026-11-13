// task-29: the bestiary and armory pack (more monsters, elite affixes with words, named monsters, gear, bestiary).
import { expect, test } from 'claude-code/testing'

import { ACTS, ELITE, MAPS, MAP_BOSSES, NAMED, POWERS, SETS } from './data'
import { applyCounts, bestiaryKey, bestiaryKinds, bestiaryPerk, derive, emptyCounts, newHero, step } from './game'
import { BASE_FOES } from './sprites/species'

const NOW = Date.parse('2026-11-12T12:00:00Z')
const MIN = 60_000

test('task-29 AC1: every act has 12 kinds of monster, and every one has a drawing in the bestiary', () => {
  const known = new Set(BASE_FOES.map(f => f[0]))
  for (const a of ACTS) {
    expect(a.foes.length).toBe(12)
    expect(new Set(a.foes).size).toBe(12)
    for (const f of a.foes) expect([a.name, f, known.has(f)]).toEqual([a.name, f, true])
  }
  expect(MAPS.length).toBeGreaterThanOrEqual(24)
  expect(MAP_BOSSES.length).toBeGreaterThanOrEqual(16)
})

test('task-29 AC2: 30 elite affixes, each with its own line, and the average stays where it was', () => {
  expect(ELITE.length).toBe(30)
  expect(new Set(ELITE.map(e => e.name)).size).toBe(30)
  for (const e of ELITE) expect(e.text.length).toBeGreaterThan(8)
  const mean = ELITE.reduce((s, e) => s + (e.hp ?? 0) + (e.dmg ?? 0), 0) / ELITE.length
  // the first 16 averaged 0.40 of extra life or damage; softer elites let the hero climb the Atlas and slow its XP, so the mean holds
  expect(mean).toBeGreaterThan(0.38)
  expect(mean).toBeLessThan(0.44)
})

test('task-29 AC3: named monsters are well formed, three per act and six in the Atlas', () => {
  const known = new Set(BASE_FOES.map(f => f[0]))
  expect(new Set(NAMED.map(n => n.name)).size).toBe(NAMED.length)
  for (let a = 0; a < ACTS.length; a++) expect(NAMED.filter(n => n.act === a).length).toBe(3)
  expect(NAMED.filter(n => n.act === -1).length).toBe(6)
  for (const n of NAMED) {
    expect([n.name, known.has(n.base)]).toEqual([n.name, true])
    for (const m of n.mods) expect([n.name, m, ELITE.some(e => e.name === m)]).toEqual([n.name, m, true])
    expect(n.line.length).toBeLessThan(60)
  }
  expect(POWERS.length).toBe(25)
  expect(new Set(POWERS.map(p => p.id)).size).toBe(25)
  expect(SETS.length).toBe(4)
})

test('task-29 AC4: a long run fills the bestiary, meets named monsters and pays the perk', () => {
  const h = newHero('Ada', 'paladin', 11, NOW)
  let now = NOW
  let named = 0
  for (let hr = 0; hr < 4; hr++) {
    applyCounts(h, 's1', { ...emptyCounts(), edit: 300 * (hr + 1) }, now, {})
    now += 60 * MIN
    step(h, now, {})
    if (h.task.foe?.named) named++
  }
  const kinds = bestiaryKinds(h)
  expect(kinds).toBeGreaterThanOrEqual(25)
  expect(bestiaryPerk(h)).toBe(Math.floor(kinds / 5))
  expect(h.ach['best25'] !== undefined).toBe(true)
  // the log keeps only its last 60 lines, so the first kills' bestiary lines are checked on a fresh hero
  const fresh = newHero('Bea', 'paladin', 11, NOW)
  applyCounts(fresh, 's1', { ...emptyCounts(), edit: 200 }, NOW, {})
  step(fresh, NOW + 30 * MIN, {})
  expect(fresh.log.some(l => l.s.startsWith('📖 New in the bestiary'))).toBe(true)
  expect(NAMED.some(n => (h.bestiary ?? {})[n.name]) || named > 0 || h.ach['named1'] !== undefined).toBe(true)
  // the perk shows up as gold find and nowhere else
  const withBook = derive(h, {})
  const saved = h.bestiary
  h.bestiary = {}
  const without = derive(h, {})
  h.bestiary = saved
  expect(withBook.gf - without.gf).toBe(bestiaryPerk(h))
  expect(withBook.dps).toBe(without.dps)
})

test('task-29 AC5: an old save without a bestiary loads and starts one', () => {
  const h = newHero('Old', 'paladin', 3, NOW)
  delete (h as { bestiary?: unknown }).bestiary
  expect(bestiaryKinds(h)).toBe(0)
  expect(derive(h, {}).gf).toBeGreaterThanOrEqual(0)
  applyCounts(h, 's1', { ...emptyCounts(), edit: 200 }, NOW, {})
  step(h, NOW + 30 * MIN, {})
  expect(bestiaryKinds(h)).toBeGreaterThan(0)
  expect(bestiaryKey({ name: 'Feral Null Pointer', rank: 'normal', level: 1, hp: 1, dmg: 1, count: 3, mods: [], sprite: 0 })).toBe('Feral Null Pointer')
  expect(bestiaryKey({ name: 'Feral Null Pointer', base: 'Null Pointer', rank: 'normal', level: 1, hp: 1, dmg: 1, count: 3, mods: [], sprite: 0 })).toBe('Null Pointer')
})
