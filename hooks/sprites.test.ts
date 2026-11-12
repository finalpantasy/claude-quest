import { expect, test } from 'claude-code/testing'

import { BASES, POWERS, RELIC_SITES } from './data'
import { BOSS_NAMES, boss, bossLook } from './sprites/bosses'
import { BODIES } from './sprites/bodies'
import { bad, count, outline, sig } from './sprites/core'
import { FAMILIES } from './sprites/parts'
import { ragged } from './sprites/gearpal'
import { OFFHANDS, TOOLS, WEAPONS } from './sprites/hands'
import { HATS, MASKS } from './sprites/hats'
import { CHESTS } from './sprites/chest'
import { PETS, petSprite } from './sprites/pets'
import { SPECIES, foeSprite } from './sprites/species'
import { AURAS, AURA_VARIANTS, BACKS, BACK_VARIANTS, HEADS, VARIANTS, aura, auraAt, crabSprite, draw, lookFor, pieceSprite, POSES, SPRITE_CSS } from './sprites'

const RAR = ['#c8c8c8', '#8080ff', '#f2e05a', '#ff8a1f', '#2fd05a'] as const

test('AC1: 2,000+ named monsters, 200+ bosses and 500+ pets, each with a unique name and a unique look', () => {
  expect(SPECIES.length).toBeGreaterThanOrEqual(2000)
  expect(new Set(SPECIES.map(s => s.name)).size).toBe(SPECIES.length)
  expect(new Set(SPECIES.map(s => sig(foeSprite(s.name)))).size).toBe(SPECIES.length)
  expect(BOSS_NAMES.length).toBeGreaterThanOrEqual(200)
  expect(new Set(BOSS_NAMES).size).toBe(BOSS_NAMES.length)
  expect(new Set(BOSS_NAMES.map(n => sig(boss(n)))).size).toBe(BOSS_NAMES.length)
  expect(new Set(BOSS_NAMES.map(n => outline(boss(n)))).size).toBe(BOSS_NAMES.length)
  expect(PETS.length).toBeGreaterThanOrEqual(500)
  expect(new Set(PETS.map(p => p.name)).size).toBe(PETS.length)
  expect(new Set(PETS.map(p => sig(petSprite(p)))).size).toBe(PETS.length)
  const lines = new Set(PETS.map(p => p.line))
  expect(lines.size).toBeGreaterThanOrEqual(150)
  expect(new Set(PETS.map(p => p.element)).size).toBeGreaterThanOrEqual(12)
})

test('AC1: 2,000+ distinct weapons, 2,000+ armor pieces and 2,000+ auras by rect-list hash', () => {
  const col = '#8080ff'
  const weapons = new Set<number>()
  for (let id = 0; id < WEAPONS.length; id++) for (let v = 0; v < VARIANTS.weapon; v++) weapons.add(sig(pieceSprite('weapon', { id, color: col, v })))
  expect(weapons.size).toBeGreaterThanOrEqual(2000)
  const armor = new Set<number>()
  const per = (slot: 'head' | 'chest' | 'offhand' | 'back', n: number, vs: number) => {
    const set = new Set<number>()
    for (let id = 0; id < n; id++) for (let v = 0; v < vs; v++) set.add(sig(pieceSprite(slot, { id, color: col, v })))
    for (const h of set) armor.add(h)
    return set.size
  }
  expect(per('head', HEADS.length, VARIANTS.head)).toBeGreaterThanOrEqual(250)
  expect(per('chest', CHESTS.length, VARIANTS.chest)).toBeGreaterThanOrEqual(250)
  expect(per('back', BACKS.length, BACK_VARIANTS)).toBeGreaterThanOrEqual(250)
  expect(per('offhand', OFFHANDS.length, VARIANTS.offhand)).toBeGreaterThanOrEqual(250)
  expect(armor.size).toBeGreaterThanOrEqual(2000)
  const auras = new Set<number>()
  for (let n = 0; n < AURA_VARIANTS; n++) { const l = aura(auraAt(n)); auras.add(sig({ w: 0, h: 0, parts: [...l.back, ...l.front] })) }
  expect(auras.size).toBeGreaterThanOrEqual(2000)
  // a name with no drawing of its own is hashed to a drawing and a variant
  const l = lookFor('weapon', 'Some Rare Sword Nobody Named')
  expect(l.exact).toBe(false)
  expect(l.v).toBeLessThan(VARIANTS.weapon)
})

test('AC2: part counts meet the minimums', () => {
  expect(BODIES.length).toBeGreaterThanOrEqual(50)
  expect(FAMILIES.length).toBeGreaterThanOrEqual(25)
  for (const f of FAMILIES) expect(f.v.length).toBeGreaterThanOrEqual(3)
  expect(HEADS.length).toBeGreaterThanOrEqual(50)
  expect(CHESTS.length).toBeGreaterThanOrEqual(50)
  expect(BACKS.length).toBeGreaterThanOrEqual(50)
  expect(OFFHANDS.length).toBeGreaterThanOrEqual(50)
  expect(WEAPONS.length).toBeGreaterThanOrEqual(50)
  expect(AURAS.length).toBeGreaterThanOrEqual(RELIC_SITES.length + POWERS.length + 10)
  for (const p of POWERS) expect(AURAS.some(a => a.id === p.id)).toBe(true)
  expect(POSES.length).toBe(9)
  expect(new Set(HEADS.map(s => s.r)).size).toBe(HEADS.length)
  expect(new Set(CHESTS.map(s => s.n)).size).toBe(CHESTS.length)
})

test('AC3: every base item for a visible slot has a drawing of its own, and every drawing is well formed', () => {
  for (const slot of ['weapon', 'offhand', 'head', 'chest'] as const) for (const name of BASES[slot]) expect([slot, name, lookFor(slot, name).exact]).toEqual([slot, name, true])
  for (const list of [HATS, MASKS, OFFHANDS, WEAPONS, TOOLS]) expect(ragged(list)).toEqual([])
  expect(ragged(CHESTS)).toEqual([])
  expect(bad.length).toBe(0)
  const color = '#8080ff'
  for (const pose of POSES) {
    for (let i = 0; i < HEADS.length; i++) expect(count(crabSprite({ pose, trim: '#fff', head: { id: i, color } }))).toBeGreaterThan(0)
  }
  for (let i = 0; i < WEAPONS.length; i++) expect(count(crabSprite({ pose: 'stand', trim: '#fff', weapon: { id: i, color } }))).toBeGreaterThan(0)
  expect(bad.length).toBe(0)
})

test('AC4: sprite and scene budgets hold', () => {
  let maxFoe = 0, maxBoss = 0
  for (const s of SPECIES) maxFoe = Math.max(maxFoe, count(foeSprite(s.name, { rank: 'unique' })))
  for (const n of BOSS_NAMES) maxBoss = Math.max(maxBoss, count(boss(n)))
  expect(maxFoe).toBeLessThan(160)
  expect(maxBoss).toBeLessThan(320)
  let maxPet = 0
  for (const p of PETS) maxPet = Math.max(maxPet, count(petSprite(p)))
  expect(maxPet).toBeLessThan(160)
  // a fully geared crab with an aura, eight monsters and a pet, as one SVG
  const hero = crabSprite({ pose: 'attack', trim: '#4aa3ff', head: { id: 3, color: RAR[3] }, chest: { id: 20, color: RAR[2] }, back: { id: 40, color: RAR[1] }, weapon: { id: 5, color: RAR[3] }, offhand: { id: 8, color: RAR[4] }, aura: 'primal' })
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="150"><style>${SPRITE_CSS}</style>${draw(hero, 20, 20, 4)}`
  for (let i = 0; i < 8; i++) svg += draw(foeSprite(SPECIES[i * 37]!.name, { rank: i % 2 ? 'rare' : undefined }), 300 + i * 70, 40, 4)
  svg += `${draw(petSprite(PETS[200]!), 120, 60, 4)}</svg>`
  expect(svg.length).toBeLessThan(40000)
  expect(svg).not.toContain('NaN')
  expect(count(hero)).toBeLessThan(400)
})

test('looks are stable: the same name gives the same sprite, and unknown names still get one', () => {
  expect(sig(foeSprite('Null Pointer'))).toBe(sig(foeSprite('Null Pointer')))
  expect(count(foeSprite('Some Name Nobody Wrote Down'))).toBeGreaterThan(0)
  expect(sig(foeSprite('Null Pointer'))).not.toBe(sig(foeSprite('Null Pointer', { shiny: true })))
  expect(sig(foeSprite('Null Pointer'))).not.toBe(sig(foeSprite('Null Pointer', { rank: 'rare' })))
  expect(sig(boss('Not A Listed Boss'))).toBe(sig(boss('Not A Listed Boss')))
  expect(bossLook('The Final Merge').look.chassis).toBeGreaterThanOrEqual(0)
})
