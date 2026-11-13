// task-14: downtime. The campfire first, gathering after; Rested from time away; Farming and Expeditions on the real clock.
import { expect, test } from 'claude-code/testing'

import type { Hero } from '../types'
import { sceneSvg } from './art'
import { CAMP_QUIPS, GATHER_QUIPS } from './data'
import { addRested, applyCounts, awaySummary, CAMPFIRE_MS, derive, emptyCounts, newHero, RESTED, step } from './game'

const NOW = Date.parse('2026-11-12T12:00:00Z')
const MIN = 60_000, HOUR = 60 * MIN
const work = (h: Hero, now: number, edits: number) => applyCounts(h, 's1', { ...emptyCounts(), edit: edits }, now, {})
const run = (h: Hero, from: number, to: number, every = 5 * MIN) => { for (let t = from + every; t <= to; t += every) step(h, t, {}) }

test('task-14 AC1: after Focus runs out the hero sits at the campfire, then goes gathering', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  work(h, NOW, 20)
  run(h, NOW, NOW + 20 * MIN, MIN)
  expect(h.campT).toBeGreaterThan(NOW)
  const out = h.campT!
  step(h, out + 10 * MIN, {})
  expect(h.task.kind).toBe('camp')
  expect(h.task.label).toContain('Campfire')
  expect(sceneSvg(h, { w: 720, h: 120, now: out + 10 * MIN, period: 0.8 }).length).toBeLessThan(40_000)
  run(h, out + 10 * MIN, out + CAMPFIRE_MS + 30 * MIN, MIN)
  expect(['fish', 'mine', 'dig']).toContain(h.task.kind)
  expect(h.life.cooking.xp + h.life.cooking.lvl).toBeGreaterThan(1)
})

test('task-14 AC2: time away fills Rested up to its cap, and it doubles kill XP while it lasts', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  work(h, NOW, 10)
  expect(h.buffs.find(b => b.name === 'Rested')).toBeUndefined()
  const xp0 = derive(h, {}).xp
  work(h, NOW + 4 * HOUR, 20)
  expect(h.buffs.find(b => b.name === 'Rested')!.left).toBe(4 * HOUR * RESTED.per)
  expect(derive(h, {}).xp - xp0).toBe(100)
  work(h, NOW + 40 * HOUR, 30)
  expect(h.buffs.find(b => b.name === 'Rested')!.left).toBe(RESTED.cap)
  applyCounts(h, 's1', { ...emptyCounts(), edit: 30, rested: 3 }, NOW + 40 * HOUR + MIN, {})
  expect(h.buffs.find(b => b.name === 'Rested')!.left).toBe(RESTED.cap)
  // a short break fills nothing
  const g = newHero('Bea', 'paladin', 6, NOW)
  work(g, NOW, 10)
  work(g, NOW + 20 * MIN, 20)
  expect(g.buffs.find(b => b.name === 'Rested')).toBeUndefined()
  // it runs down only while fighting
  const k = newHero('Cy', 'paladin', 7, NOW)
  addRested(k, 30 * MIN)
  work(k, NOW, 200)
  run(k, NOW, NOW + 3 * HOUR)
  expect(k.buffs.find(b => b.name === 'Rested')?.left ?? 0).toBeLessThan(30 * MIN)
})

test('task-14 AC3: crops ripen and are harvested on the real clock; expeditions leave and come home with loot', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  step(h, NOW + MIN, {})
  expect(h.farm!.plots.length).toBe(1)
  expect(h.trip!.who).not.toBe('')
  const gold = h.gold
  run(h, NOW + MIN, NOW + 14 * HOUR, 10 * MIN)
  expect(h.farm!.crops).toBeGreaterThan(2)
  expect(h.life.farming.lvl * 1000 + h.life.farming.xp).toBeGreaterThan(1000)
  expect(h.trip!.n).toBeGreaterThan(0)
  expect(h.life.expeditions.lvl * 1000 + h.life.expeditions.xp).toBeGreaterThan(1000)
  expect(h.gold).toBeGreaterThan(gold)
  // the log tells both (the log keeps its last lines only, so look at a short stretch)
  const k = newHero('Bo', 'paladin', 9, NOW)
  step(k, NOW + MIN, {})
  run(k, NOW + MIN, Math.max(k.farm!.plots[0]!.ripe, k.trip!.back) + MIN, 30 * MIN)
  expect(k.log.some(l => l.s.startsWith('🌱 Harvested'))).toBe(true)
  expect(k.log.some(l => l.s.startsWith('🧭 '))).toBe(true)
})

test('task-14 AC5: the welcome back line names crops, expeditions and Rested', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  work(h, NOW, 10)
  step(h, NOW + MIN, {})
  const before = JSON.parse(JSON.stringify(h)) as Hero
  run(h, NOW + MIN, NOW + 13 * HOUR, 10 * MIN)
  work(h, NOW + 13 * HOUR, 20)
  const s = awaySummary(before, h, 13 * HOUR)
  expect(s).toContain('harvested')
  expect(s).toContain('came home')
  expect(s).toContain('Rested 60m')
})

test('task-14 AC6: an old save without the downtime fields loads and starts them', () => {
  const h = newHero('Old', 'paladin', 3, NOW)
  const life = h.life as Partial<Hero['life']>
  delete life.farming
  delete life.expeditions
  delete (h as { farm?: unknown }).farm
  delete (h as { trip?: unknown }).trip
  expect(derive(h, {}).gf).toBeGreaterThanOrEqual(0)
  work(h, NOW, 40)
  run(h, NOW, NOW + 3 * HOUR)
  expect(h.life.farming.lvl).toBeGreaterThanOrEqual(1)
  expect(h.farm!.plots.length).toBeGreaterThan(0)
  expect(h.trip!.who).not.toBe('')
})

test('task-13 crab quips: one line on reaching the campfire, one on heading out to gather, none in between', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  work(h, NOW, 20)
  run(h, NOW, NOW + 20 * MIN, MIN)
  const out = h.campT!
  // a short stretch past the campfire, so the 60-line log still holds the first quip
  run(h, NOW + 20 * MIN, out + CAMPFIRE_MS + 5 * MIN, MIN)
  const quips = h.log.filter(l => l.s.startsWith('🦀 Ada: "') && l.t >= out)
  expect(quips.length).toBe(2)
  expect(CAMP_QUIPS.some(q => quips[0]!.s.includes(q))).toBe(true)
  expect(GATHER_QUIPS.some(q => quips[1]!.s.includes(q))).toBe(true)
})
