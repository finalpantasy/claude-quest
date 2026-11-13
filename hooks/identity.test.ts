// task-12 slice: birth labels and a title from gear. Words only: no power, no draws from the game's RNG.
import { expect, test } from 'claude-code/testing'

import type { Hero } from '../types'
import { ACTS, ANCESTRY, BASES, PERSONALITIES, PROFESSIONS, TITLES } from './data'
import { PETS } from './sprites/pets'
import { sceneSvg } from './art'
import { applyCounts, dayKey, derive, emptyCounts, moonOf, newHero, PET_EVOLVE, rollBirth, step, titleOf } from './game'
import { biomeOf, PALS, petOf, stagesOf } from './sprites/pixel2'

const NOW = Date.parse('2026-11-12T12:00:00Z')
const MIN = 60_000, HOUR = 60 * MIN
const run = (h: Hero, hours: number) => {
  applyCounts(h, 's1', { ...emptyCounts(), edit: 300, read: 300 }, NOW, {})
  for (let t = NOW + MIN; t <= NOW + hours * HOUR; t += 5 * MIN) step(h, t, {})
}

test('task-12 AC4: birth labels are rolled once, never change, and change nothing else', () => {
  expect(ANCESTRY.length).toBeGreaterThanOrEqual(24)
  expect(PROFESSIONS.length).toBeGreaterThanOrEqual(40)
  expect(PERSONALITIES.length).toBeGreaterThanOrEqual(40)
  const a = newHero('Ada', 'paladin', 77, NOW), b = newHero('Ada', 'paladin', 77, NOW)
  step(a, NOW + 1000, {}); step(b, NOW + 1000, {})
  expect(a.birth).toEqual(rollBirth(a))
  const born = { ...a.birth! }
  b.birth = { kin: 'Somebody', job: 'Else', mood: 'Entirely' }
  run(a, 30); run(b, 30)
  expect(a.birth).toEqual(born)
  expect(b.birth).toEqual({ kin: 'Somebody', job: 'Else', mood: 'Entirely' })
  expect([b.level, b.xp, b.gold, b.kills]).toEqual([a.level, a.xp, a.gold, a.kills])
  expect(derive(b, {})).toEqual(derive(a, {}))
  // seeds spread across the tables
  expect(new Set(Array.from({ length: 200 }, (_, i) => rollBirth({ name: 'Ada', createdAt: NOW + i }).job)).size).toBeGreaterThanOrEqual(30)
})

test('task-12 slice: the gear names a title, a change is logged, and an old save takes one quietly', () => {
  expect(new Set(TITLES.flat()).size).toBe(BASES.weapon.length * (BASES.offhand.length + 1))
  expect(TITLES.flat()).not.toContain('Bone Ranger')
  const h = newHero('Ada', 'paladin', 5, NOW)
  run(h, 30)
  expect(h.title).toBe(titleOf(h.gear))
  const g = { ...h.gear, weapon: { ...h.gear.weapon!, base: 'Stack Trace Spear' }, offhand: { ...h.gear.offhand!, base: 'Rubber Duck Shield' } }
  expect(titleOf(g)).toBe('Skylancer')
  expect(titleOf({ ...g, offhand: undefined })).toBe('Ronin')
  expect(titleOf({})).toBe('Wanderer')
  const titles = h.log.filter(l => l.s.startsWith('🎭 ')).map(l => l.s)
  for (const s of titles) expect(s).toMatch(/^🎭 Ada is now an? [A-Z]/)
  // an old save: no labels, no title; the first step sets both and logs nothing about it
  const old = newHero('Old', 'paladin', 9, NOW)
  run(old, 2)
  delete (old as { birth?: unknown }).birth
  delete (old as { title?: unknown }).title
  step(old, NOW + 2 * HOUR + MIN, {})
  expect(old.birth).toEqual(rollBirth(old))
  expect(old.title).toBe(titleOf(old.gear))
  expect(old.log.some(l => l.t > NOW + 2 * HOUR && l.s.startsWith('🎭 '))).toBe(false)
})

test('later-system achievements: tales, crops, expeditions, titles and lands unlock from their counters', () => {
  const h = newHero('Ada', 'paladin', 5, NOW)
  step(h, NOW + 1000, {})
  expect(h.lands!.length).toBe(1)
  expect(h.titles!.length).toBe(1)
  h.tales = { next: NOW + HOUR, n: 25, chain: {}, ring: [], recent: [] }
  h.farm = { plots: [], rare: 0, crops: 25 }
  h.titles = ['A', 'B', 'C', 'D']
  h.stage = { act: 4, zone: 4, packs: 0 }
  const here = biomeOf(ACTS[4]!.zones[4]!).pal
  h.lands = Object.keys(PALS).filter(k => k !== here).slice(0, 6)
  step(h, NOW + 2000, {})
  for (const id of ['tales25', 'crops25', 'titles5', 'lands7']) expect(h.ach[id]).toBeGreaterThan(0)
  for (const id of ['tales1000', 'crops250', 'trips100', 'titles20', 'lands14']) expect(h.ach[id]).toBeUndefined()
})

test('nemesis: an elite that wins is named, greets the hero when its kind returns, is settled once beaten, and changes nothing else', () => {
  const live = (block: boolean) => {
    const h = newHero('Ada', 'paladin', 12345, NOW), lines: string[] = []
    let seen = 0, k = 0
    for (let m = 0; m < 36 * 60; m += 5) {
      const t = NOW + m * MIN
      if (m < 12 * 60 && m % 30 === 0) applyCounts(h, 's1', { ...emptyCounts(), edit: 6 * ++k, read: 6 * k, bash: 3 * k }, t, {})
      if (block) h.nemesis = { base: '-', name: '-', at: t, wins: 0, beaten: t }
      step(h, t, {})
      for (const l of h.log) if (l.t > seen) lines.push(l.s)
      seen = Math.max(seen, ...h.log.map(l => l.t))
    }
    return { h, lines }
  }
  const a = live(false), b = live(true)
  const made = a.lines.filter(s => s.includes('Your nemesis now: ')), back = a.lines.filter(s => / is back: "/.test(s)), rev = a.lines.filter(s => s.startsWith('⚔ Revenge on '))
  expect(made.length).toBeGreaterThan(0)
  expect(back.length).toBeGreaterThan(0)
  expect(rev.length).toBeGreaterThan(0)
  expect(a.h.ach.revenge).toBeGreaterThan(0)
  // each revenge settles the nemesis named before it
  for (const s of rev) {
    const name = s.slice('⚔ Revenge on '.length, s.indexOf('!'))
    expect(made.some(m => m.endsWith(`Your nemesis now: ${name}.`))).toBe(true)
  }
  // words only: blocking every nemesis leaves the run identical
  expect(b.lines.some(s => s.includes('nemesis'))).toBe(false)
  expect([a.h.level, a.h.xp, a.h.gold, a.h.kills, a.h.deaths]).toEqual([b.h.level, b.h.xp, b.h.gold, b.h.kills, b.h.deaths])
})

test('win streaks: callouts at the thresholds, a best run kept, reset by a death', () => {
  const h = newHero('Ada', 'paladin', 12345, NOW), lines: string[] = []
  let seen = 0, k = 0, reset = false
  for (let m = 0; m < 14 * 60; m += 5) {
    const t = NOW + m * MIN
    if (m % 30 === 0) applyCounts(h, 's1', { ...emptyCounts(), edit: 6 * ++k, read: 6 * k, bash: 3 * k }, t, {})
    const deaths = h.deaths
    step(h, t, {})
    if (h.deaths > deaths && (h.streak ?? 0) < (h.bestStreak ?? 0)) reset = true
    for (const l of h.log) if (l.t > seen) lines.push(l.s)
    seen = Math.max(seen, ...h.log.map(l => l.t))
    expect(h.streak ?? 0).toBeLessThanOrEqual(h.bestStreak ?? 0)
  }
  expect(lines).toContain('🔥 On a Roll! 100 wins in a row.')
  expect(lines).toContain('🔥 Hot Streak! 250 wins in a row.')
  expect(h.bestStreak).toBeGreaterThanOrEqual(250)
  expect(h.ach.streak250).toBeGreaterThan(0)
  if (h.deaths > 0) expect(reset).toBe(true)
})

test('pets: expedition eggs hatch into a pet that follows the hero, grows with kills, and changes nothing else', () => {
  const live = (block: boolean) => {
    const h = newHero('Ada', 'paladin', 12345, NOW), lines: string[] = []
    let seen = 0, k = 0
    step(h, NOW, {})
    const trip = (h.trip ??= { who: '', at: 0, back: 0, n: 0, eggs: 0 })
    trip.eggs = 2
    for (let m = 1; m < 16 * 60; m += 5) {
      const t = NOW + m * MIN
      if (m < 12 * 60 && m % 30 === 1) applyCounts(h, 's1', { ...emptyCounts(), edit: 6 * ++k, read: 6 * k, bash: 3 * k }, t, {})
      if (block) h.pets = Array.from({ length: 50 }, () => ({ line: 0, stage: 3, at: 0, k0: 0 }))
      step(h, t, {})
      for (const l of h.log) if (l.t > seen) lines.push(l.s)
      seen = Math.max(seen, ...h.log.map(l => l.t))
    }
    return { h, lines }
  }
  const a = live(false), b = live(true)
  const hatched = a.lines.filter(s => s.startsWith('🥚 An egg hatched! '))
  expect(hatched.length).toBe(a.h.trip!.eggs)
  expect(a.h.pets!.length).toBe(a.h.trip!.eggs)
  expect(a.h.ach.pets1).toBeGreaterThan(0)
  // the newest pet cheers each level-up, by name
  const cheers = a.lines.filter(s => s.startsWith('🐾 '))
  expect(cheers.length).toBeGreaterThan(0)
  for (const s of cheers) expect(PETS.some(p => s.startsWith(`🐾 ${p.name} `))).toBe(true)
  for (const [i, p] of a.h.pets!.entries()) {
    expect(hatched[i]).toBe(`🥚 An egg hatched! ${petOf(p.line, 1).name} follows Ada now.`)
    if (i < a.h.pets!.length - 1) expect(p.stage).toBe(1) // only the newest pet grows
  }
  // the same hero hatches the same pets: a hash of name, birth time and egg number, not the RNG
  expect(live(false).h.pets!.map(p => p.line)).toEqual(a.h.pets!.map(p => p.line))
  // words and looks only: blocking every hatch leaves the run identical
  expect(b.lines.some(s => s.startsWith('🥚 An egg hatched') || s.includes(' evolved into '))).toBe(false)
  expect([a.h.level, a.h.xp, a.h.gold, a.h.kills, a.h.deaths]).toEqual([b.h.level, b.h.xp, b.h.gold, b.h.kills, b.h.deaths])
  expect(derive(a.h, {})).toEqual(derive(b.h, {}))
  // it grows one stage per step once it has the kills, and the scene draws the newest pet by name
  const h = a.h, pet = h.pets![h.pets!.length - 1]!, line = pet.line, end = NOW + 17 * HOUR
  pet.stage = 1
  pet.k0 = h.kills - PET_EVOLVE[1]!
  step(h, end, {}); step(h, end + 1000, {})
  expect(pet.stage).toBe(stagesOf(line))
  expect(h.log.some(l => l.s === `✨ ${petOf(line, 1).name} evolved into ${petOf(line, 2).name}!`)).toBe(true)
  if (stagesOf(line) === 3) expect(h.ach.petFinal).toBeGreaterThan(0)
  h.task = { kind: 'travel', label: 'Walking…', ms: 6000, done: 1000 }
  const walk = sceneSvg(h, { w: 720, h: 120, now: end, period: 0.8 })
  expect(walk).toContain(`data-pet="${petOf(line, pet.stage).name}"`)
  expect(walk).not.toContain('data-zz')
  h.task = { kind: 'camp', label: 'Campfire', ms: 6000, done: 1000 }
  expect(sceneSvg(h, { w: 720, h: 120, now: end, period: 0.8 })).toContain('data-zz')
})

test('daily tally: the first step of a new day reviews the last one, once, and changes nothing else', () => {
  const T0 = Date.parse('2026-11-12T08:00:00')
  const live = (block: boolean) => {
    const h = newHero('Ada', 'paladin', 12345, T0), lines: string[] = []
    let seen = 0, k = 0
    for (let m = 0; m < 3 * 24 * 60; m += 5) {
      const t = T0 + m * MIN
      if (m % (24 * 60) < 12 * 60 && m % 30 === 0) applyCounts(h, 's1', { ...emptyCounts(), edit: 6 * ++k, read: 6 * k, bash: 3 * k }, t, {})
      if (block) h.today = { day: dayKey(t), kills: 0, deaths: 0, level: 0, legendaries: 0, gold: 0 }
      step(h, t, {})
      for (const l of h.log) if (l.t > seen) lines.push(l.s)
      seen = Math.max(seen, ...h.log.map(l => l.t))
    }
    return { h, lines }
  }
  const a = live(false), b = live(true)
  const tallies = a.lines.filter(s => s.startsWith('📜 '))
  expect(tallies.length).toBe(3) // three midnights crossed
  expect(tallies[0]).toMatch(/^📜 Nov 12 in review: [\d,]+ foes, .*(no deaths|\d+ deaths?)\.$/)
  expect(tallies[1]).toMatch(/^📜 Nov 13 in review: [\d,]+ foes/)
  expect(b.lines.some(s => s.startsWith('📜 '))).toBe(false)
  expect([a.h.level, a.h.xp, a.h.gold, a.h.kills, a.h.deaths]).toEqual([b.h.level, b.h.xp, b.h.gold, b.h.kills, b.h.deaths])
  expect(derive(a.h, {})).toEqual(derive(b.h, {}))
})

test('full moon: one line on the evening of a real full moon, none on other nights, and nothing else changes', () => {
  const night = (iso: string, block: boolean) => {
    const T = Date.parse(iso), h = newHero('Ada', 'paladin', 12345, T), lines: string[] = []
    for (let m = 0; m < 8 * 60; m += 5) {
      const t = T + m * MIN
      if (m % 30 === 0) applyCounts(h, 's1', { ...emptyCounts(), edit: 6 * (m / 30 + 1), read: 6 * (m / 30 + 1) }, t, {})
      if (block) h.fullMoon = dayKey(t)
      step(h, t, {})
      for (const l of h.log) if (l.t === t) lines.push(l.s)
    }
    return { h, moons: lines.filter(s => s.startsWith('🌕 ')) }
  }
  expect(moonOf(Date.parse('2026-11-24T22:00:00'))).toBe(4)
  const full = night('2026-11-24T17:00:00', false), blocked = night('2026-11-24T17:00:00', true)
  expect(full.moons.length).toBe(1)
  expect(full.moons[0]).not.toContain('$')
  expect(night('2026-11-12T17:00:00', false).moons.length).toBe(0)
  expect(blocked.moons.length).toBe(0)
  expect([full.h.level, full.h.xp, full.h.gold, full.h.kills, full.h.deaths]).toEqual([blocked.h.level, blocked.h.xp, blocked.h.gold, blocked.h.kills, blocked.h.deaths])
})
