// task-15: random events. Random gaps, thousands of lines without repeats, small rewards, shown in the band and the pane.
import { expect, test } from 'claude-code/testing'

import type { Hero } from '../types'
import { freshTale, sceneSvg, stripSvg } from './art'
import { CHAINS, lineHash, nextGapMs, noteTale, rollEvent } from './events'
import { applyCounts, emptyCounts, newHero, step } from './game'

const NOW = Date.parse('2026-11-12T12:00:00Z')
const MIN = 60_000
const seeded = (seed: number) => { let s = seed >>> 0; return () => ((s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0) % 1_000_000) / 1_000_000 }

test('task-15 AC1: events come at random gaps, about one every 10 to 30 minutes, never on a schedule', () => {
  const r = seeded(7)
  const gaps = Array.from({ length: 2000 }, () => nextGapMs(r) / MIN)
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
  expect(mean).toBeGreaterThan(10)
  expect(mean).toBeLessThan(30)
  expect(Math.min(...gaps)).toBeGreaterThanOrEqual(6)
  expect(Math.max(...gaps)).toBeLessThanOrEqual(45)
  expect(new Set(gaps.map(g => Math.round(g))).size).toBeGreaterThan(25)
  // and in a played day: 12 hours of work
  const h = newHero('Ada', 'paladin', 5, NOW)
  let now = NOW
  for (let m = 5; m <= 12 * 60; m += 5) {
    now = NOW + m * MIN
    applyCounts(h, 's1', { ...emptyCounts(), edit: m * 0.6, read: m * 0.8, bash: m * 0.4, turns: m * 0.25 }, now, {})
    step(h, now, {})
  }
  const times = (h.tales?.recent ?? []).map(l => l.t)
  expect(times.length).toBeGreaterThan(20)
  expect(times.length).toBeLessThan(72)
  const played = times.slice(1).map((t, i) => (t - times[i]!) / MIN)
  expect(Math.max(...played) / Math.min(...played)).toBeGreaterThan(3)
})

test('task-15 AC2: 10,000 events make 2,000+ different lines, none repeated within 200, all under 60 characters', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  const kinds: Hero['task']['kind'][] = ['fight', 'fish', 'mine', 'dig', 'town', 'travel', 'dead']
  const r = seeded(11)
  const lines: string[] = []
  const finished = new Set<string>()
  const lastTpl = new Map<number, number>()
  let tplRepeats = 0
  for (let i = 0; i < 10_000; i++) {
    h.task = { kind: kinds[i % kinds.length]!, label: 'x', ms: 1000, done: 0, ...(i % kinds.length === 0 ? { foe: { name: 'Feral Null Pointer', base: 'Null Pointer', rank: 'normal', level: 3, hp: 1, dmg: 1, count: 3, mods: [], sprite: 0 } } : {}) }
    const tale = rollEvent(h, r, NOW + i * MIN, 'T3 Shard Abyss')
    if (!tale) continue
    noteTale(h, tale, NOW + i * MIN)
    lines.push(tale.line)
    if (tale.tpl !== undefined) { const j = lastTpl.get(tale.tpl); if (j !== undefined && lines.length - j <= 30) tplRepeats++; lastTpl.set(tale.tpl, lines.length) }
    if (tale.chain && tale.chain.step === CHAINS.find(c => c.id === tale.chain!.id)!.steps.length) finished.add(tale.chain.id)
  }
  expect(lines.length).toBeGreaterThan(9_000)
  expect(new Set(lines).size).toBeGreaterThan(2_000)
  // the same joke shape rests for 30 tales (running gags excepted)
  expect(tplRepeats).toBe(0)
  expect(lines.filter(l => l.length > 60)).toEqual([])
  const last = new Map<number, number>()
  const repeats: string[] = []
  lines.forEach((l, i) => { const k = lineHash(l), j = last.get(k); if (j !== undefined && i - j < 200) repeats.push(l); last.set(k, i) })
  expect(repeats).toEqual([])
  // every running gag gets told to its end
  expect([...finished].sort()).toEqual(CHAINS.map(c => c.id).sort())
})

test('task-15 AC3: rewards are small: gold under 80 x level, buffs at most 10% for 30 minutes, items no better than rare', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  h.level = 30
  const r = seeded(3)
  for (let i = 0; i < 5000; i++) {
    h.task = { kind: i % 2 ? 'fish' : 'town', label: 'x', ms: 1000, done: 0 }
    const tale = rollEvent(h, r, NOW + i * MIN)
    if (!tale) continue
    noteTale(h, tale, NOW + i * MIN)
    if (tale.gold) expect(Math.abs(tale.gold)).toBeLessThanOrEqual(80 * h.level)
    if (tale.buff) { expect(tale.buff.v).toBeLessThanOrEqual(10); expect(tale.buff.left).toBeLessThanOrEqual(30 * MIN) }
    if (tale.item) expect(['magic', 'rare'].includes(tale.item)).toBe(true)
  }
})

test('task-15 AC4: a fresh event shows in the strip and the scene for 8 seconds, then the task label returns; only big ones are toasts', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  h.task = { kind: 'fish', label: 'Fishing at the pier', ms: 60_000, done: 0 }
  noteTale(h, { line: 'Ada argues with a goose about tabs and spaces.' }, NOW)
  expect(freshTale(h, NOW + 2000)).toBe('Ada argues with a goose about tabs and spaces.')
  expect(stripSvg(h, { w: 720, xp: 0.3, now: NOW + 2000 })).toContain('argues with a goose')
  expect(stripSvg(h, { w: 720, xp: 0.3, now: NOW + 9000 })).toContain('Fishing at the pier')
  expect(sceneSvg(h, { w: 720, h: 120, now: NOW + 2000, period: 0.8 })).toContain('data-tale="1"')
  expect(sceneSvg(h, { w: 720, h: 120, now: NOW + 9000, period: 0.8 })).not.toContain('data-tale')
  // narrow: a long tale takes both text rows instead of being cut
  expect(sceneSvg(h, { w: 360, h: 120, now: NOW + 2000, period: 0.8 })).toContain('data-tale="1"')
  // toasts: over a played day, only a few events are worth one
  const p = newHero('Bea', 'paladin', 9, NOW)
  let toasts = 0
  for (let m = 5; m <= 24 * 60; m += 5) {
    const now = NOW + m * MIN
    if (m <= 12 * 60) applyCounts(p, 's1', { ...emptyCounts(), edit: m * 0.6, read: m * 0.8 }, now, {})
    toasts += step(p, now, {}).filter(n => n.startsWith('💬')).length
  }
  expect(p.tales!.n).toBeGreaterThan(20)
  expect(toasts).toBeLessThan(p.tales!.n / 5)
  expect(p.log.some(l => l.s.startsWith('💬 '))).toBe(true)
})

test('task-15: an old save without tales loads and starts telling them', () => {
  const h = newHero('Old', 'paladin', 3, NOW)
  delete (h as { tales?: unknown }).tales
  applyCounts(h, 's1', { ...emptyCounts(), edit: 400 }, NOW, {})
  step(h, NOW + 3 * 60 * MIN, {})
  expect((h.tales?.n ?? 0)).toBeGreaterThan(0)
})
