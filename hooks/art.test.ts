// Scene tests for the D30 look: hero H1 in every task kind, the eight creatures and the boss, time of day, live work, the size budget.
import { expect, test } from 'claude-code/testing'
import type { Hero, Live } from '../types'
import * as art from './art'
import { BAND_H, STRIP_H, sceneSvg, speciesKey, stripSvg } from './art'
import { FOLLOWERS } from './data'
import { newHero } from './game'
import { heroSprite } from './sprites/pixel2/hero'
import { AURA_PAD, creatureBodies, faceOf, gearHero, lookOf, type Creature } from './sprites/pixel2'
import { LOADOUTS, it as itemOf, put } from '../tools/gear_loadouts'
import type { Pose } from './sprites/pixel2/hero'
import { SPECIES } from './sprites/species'

const at = (hour: number) => new Date(2026, 9, 5, hour, 0, 0).getTime()
const NOW = at(14)
const hero = (name = 'Brindle'): Hero => newHero(name, 'paladin', 7, NOW)
const task = (h: Hero, kind: Hero['task']['kind'], foe?: { name: string; rank: 'normal' | 'magic' | 'rare' | 'unique' | 'boss' | 'goblin'; count?: number; level?: number }): Hero => {
  h.task = { kind, label: `a ${kind}`, ms: 8000, done: 3000, ...(foe ? { foe: { name: foe.name, rank: foe.rank, level: foe.level ?? 40, hp: 100, dmg: 5, count: foe.count ?? 1, mods: ['Fast'], sprite: 0 }, win: true, hit: 1200, crit: true } : {}) }
  return h
}
const svgOf = (h: Hero, o: { w?: number; h?: number; now?: number; live?: Live } = {}) => sceneSvg(h, { w: o.w ?? 720, h: o.h ?? BAND_H, now: o.now ?? NOW, period: 0.8, live: o.live })
const poseOf = (svg: string) => [...svg.matchAll(/data-pose="(\w+)"/g)].map(m => m[1]!)

test('the band is 120 px: 60 art rows at two screen pixels each, and the scene is exactly that size', () => {
  expect(BAND_H).toBe(120)
  const svg = svgOf(task(hero(), 'travel'))
  expect(svg).toContain('width="720" height="120"')
  expect(sceneSvg(task(hero(), 'travel'), { w: 360, h: BAND_H, now: NOW, period: 0.8 })).toContain('width="360" height="120"')
  expect(svg).toContain('data-look="d30"')
  expect(svg).not.toContain('NaN')
})

test('H1: every pose fits the band, is one sprite size, and stands on straight symmetric legs (front view)', () => {
  const poses: Pose[] = ['stand', 'swing', 'sit', 'rod', 'pick', 'pickDown', 'shovel', 'shovelDown', 'dead']
  for (const p of poses) {
    const s = heroSprite(p)
    expect(s.px.w).toBe(48)
    expect(s.px.h).toBeLessThanOrEqual(60)
    expect(s.px.h * 2).toBeLessThanOrEqual(BAND_H)
    expect(s.px.colors()).toBeGreaterThanOrEqual(4)
  }
  // The legs and boots of the standing poses mirror about the body column: the same opaque pixels left and right.
  for (const p of ['stand', 'swing', 'pick', 'shovel'] as Pose[]) {
    const s = heroSprite(p), c = s.feetX
    for (let y = s.px.h - 14; y < s.px.h; y++) for (let d = 0; d <= 12; d++) {
      expect([p, y, d, s.px.get(c - d, y) !== undefined]).toEqual([p, y, d, s.px.get(c + d, y) !== undefined])
    }
  }
})

test('no crab: the scene module draws H1 only, and no scene or strip names a crab', () => {
  expect(Object.keys(art).some(k => /crab/i.test(k))).toBe(false)
  for (const kind of ['fight', 'fish', 'mine', 'dig', 'town', 'dead', 'travel'] as const) {
    const svg = svgOf(task(hero(), kind, kind === 'fight' ? { name: 'Null Pointer', rank: 'normal', count: 2 } : undefined))
    expect(svg).toContain('data-hero="h1"')
    expect(svg).not.toMatch(/crab/i)
  }
  const strip = stripSvg(task(hero(), 'travel'), { w: 720, xp: 0.3 })
  expect(strip).toContain('data-hero="h1"')
  expect(strip).not.toMatch(/crab/i)
})

test('each task kind takes its own H1 pose', () => {
  const poses = (kind: Hero['task']['kind'], foe?: Parameters<typeof task>[2]) => poseOf(svgOf(task(hero(), kind, foe)))
  expect(poses('fight', { name: 'Null Pointer', rank: 'normal' })).toEqual(['stand', 'swing'])
  expect(poses('fish')).toEqual(['rod'])
  expect(poses('mine')).toEqual(['pick', 'pickDown'])
  expect(poses('dig')).toEqual(['shovel', 'shovelDown'])
  expect(poses('dead')).toEqual(['dead'])
  expect(poses('town')).toEqual(['stand'])
  expect(poses('travel')).toEqual(['stand'])
})

test('a fight draws the pack, a boss, and ranks and elements change the look', () => {
  const pack = svgOf(task(hero(), 'fight', { name: 'Null Pointer', rank: 'normal', count: 5 }))
  expect((pack.match(/data-foe="Null Pointer"/g) ?? []).length).toBe(3)
  const narrow = sceneSvg(task(hero(), 'fight', { name: 'Null Pointer', rank: 'normal', count: 5 }), { w: 360, h: BAND_H, now: NOW, period: 0.8 })
  expect((narrow.match(/data-foe="Null Pointer"/g) ?? []).length).toBe(2)
  const rare = svgOf(task(hero(), 'fight', { name: 'Null Pointer', rank: 'rare', count: 1 }))
  expect(rare).toContain('data-foe="Null Pointer"')
  expect(rare).not.toBe(svgOf(task(hero(), 'fight', { name: 'Null Pointer', rank: 'normal', count: 1 })))
  const b = svgOf(task(hero(), 'fight', { name: 'The Butcher of Builds', rank: 'boss', level: 50 }))
  expect(b).toContain('data-boss="The Butcher of Builds"')
  expect(b).not.toContain('data-foe=')
  expect(svgOf(task(hero(), 'fight', { name: 'Treasure Goblin', rank: 'goblin' }))).toContain('data-foe="Treasure Goblin"')
  // An element swaps the creature's colors; the same base in another element is another picture.
  const fire = SPECIES.find(s => s.element === 'fire' && s.look.body === 'slime')!
  const frost = SPECIES.find(s => s.element === 'frost' && s.look.body === 'slime')!
  expect(svgOf(task(hero(), 'fight', { name: fire.name, rank: 'normal' }))).not.toBe(svgOf(task(hero(), 'fight', { name: frost.name, rank: 'normal' })))
  // A pack's adjective, rare name or unique title does not hide the creature.
  expect(speciesKey('Undocumented Transitive Dep')).toBe('Transitive Dep')
  expect(speciesKey('Grimfang Skullcrusher, Null Pointer')).toBe('Null Pointer')
  expect(speciesKey('Doomgaze the Merge Conflict')).toBe('Merge Conflict')
  expect(speciesKey('Cinder Null Pointer')).toBe('Cinder Null Pointer')
})

test('task-29: each of the eight creatures draws a pack of 8 and a crowned rare, every scene under 40 KB', () => {
  const h = hero()
  h.followers = FOLLOWERS.slice(0, 3)
  const all: Creature[] = ['slime', 'mushroom', 'bat', 'phantom', 'golem', 'imp', 'spider', 'skeleton']
  for (const c of all) {
    const sp = SPECIES.find(s => s.look.body !== undefined && creatureBodies(c).includes(s.look.body))
    expect([c, sp !== undefined]).toEqual([c, true])
    for (const foe of [{ name: sp!.name, rank: 'normal', count: 8 }, { name: sp!.name, rank: 'rare', count: 3 }] as const) {
      const svg = svgOf(task(h, 'fight', foe), { w: 760, h: 150, now: at(14) })
      expect(svg.length).toBeLessThan(40 * 1024)
    }
  }
})

test('evening is golden dusk and night is darker: the three times of day draw three different scenes', () => {
  const h = task(hero(), 'fight', { name: 'Null Pointer', rank: 'normal', count: 2 })
  const day = svgOf(h, { now: at(14) }), dusk = svgOf(h, { now: at(18) }), night = svgOf(h, { now: at(23) })
  expect(new Set([day, dusk, night]).size).toBe(3)
  // 3 a.m. is night too; only the baked sky may differ, as the real moon moves on through the night
  const noSky = (svg: string) => svg.replace(/<image [^>]*>/, '')
  expect(noSky(svgOf(h, { now: at(3) }))).toBe(noSky(night))
  expect(svgOf(h, { now: at(7) })).toBe(day)
})

test('live work still plays: active spark, one-shots, damage numbers, the crit', () => {
  const live: Live = { active: true, acts: [{ kind: 'melee', at: NOW }, { kind: 'arrow', at: NOW - 100 }, { kind: 'spell', at: NOW - 200 }, { kind: 'summon', at: NOW - 300 }, { kind: 'portal', at: NOW - 400 }], hits: [{ tokens: 2000, at: NOW, crit: false }, { tokens: 90_000, at: NOW - 200, crit: true }], turnTokens: 92_000, word: 'strike', kind: 'melee' }
  const h = task(hero(), 'fight', { name: 'Null Pointer', rank: 'normal', count: 2 })
  const svg = svgOf(h, { live })
  expect(svg).toContain('data-live="active"')
  for (const k of ['melee', 'arrow', 'spell', 'summon', 'portal']) expect(svg).toContain(`data-act="${k}"`)
  expect(svg).toContain('data-dmg="2000"')
  expect(svg).toContain('data-crit="1"')
  expect(svgOf(h)).not.toContain('data-live="active"')
  expect(svgOf(h, { live: { ...live, acts: [{ kind: 'melee', at: NOW - 5000 }], hits: [{ tokens: 1, at: NOW - 9000, crit: false }] } })).not.toContain('data-act=')
  expect(stripSvg(h, { w: 720, xp: 0.5, live })).toContain('data-live="active"')
})

test('followers and minions trail behind the hero', () => {
  const h = task(hero(), 'travel')
  h.followers = FOLLOWERS.slice(0, 3)
  h.minions = [1, 2].map(i => ({ name: `m${i}`, left: 1000 }))
  const svg = svgOf(h)
  expect(svg.split('data-follower=').length - 1).toBe(3)
  expect(svg.length).toBeGreaterThan(svgOf(task(hero(), 'travel')).length)
})

test('budget: every task kind, size and time of day stays under 40 KB, finite, and starts as an svg', () => {
  const h = hero()
  h.followers = FOLLOWERS.slice(0, 3)
  h.minions = [1, 2, 3, 4].map(i => ({ name: `m${i}`, left: 1000 }))
  const live: Live = { active: true, acts: [{ kind: 'melee', at: NOW }, { kind: 'spell', at: NOW }], hits: [{ tokens: 500, at: NOW, crit: false }], turnTokens: 500, word: 'strike', kind: 'melee' }
  let largest = 0
  for (const [hr, sizes] of [[14, [{ w: 360, h: BAND_H }, { w: 720, h: BAND_H }, { w: 760, h: 150 }]], [18, [{ w: 720, h: BAND_H }]], [23, [{ w: 720, h: BAND_H }]]] as const) {
    for (const size of sizes) {
      for (const [kind, foe] of [['fight', { name: 'Null Pointer', rank: 'normal', count: 8 }], ['fight', { name: 'Merge Conflict', rank: 'rare', count: 3 }], ['fight', { name: 'Mephisto the Monorepo', rank: 'boss' }], ['fish'], ['mine'], ['dig'], ['town'], ['dead'], ['travel']] as const) {
        const svg = svgOf(task(h, kind, foe as Parameters<typeof task>[2]), { ...size, now: at(hr), live })
        expect(svg.startsWith('<svg')).toBe(true)
        expect(svg).not.toContain('NaN')
        expect(svg).not.toContain('Infinity')
        largest = Math.max(largest, svg.length)
      }
    }
  }
  expect(largest).toBeLessThan(40 * 1024)
})

test('the strip keeps its 18 px height and shows the H1 face', () => {
  const svg = stripSvg(task(hero(), 'fight', { name: 'Null Pointer', rank: 'normal' }), { w: 720, xp: 0.3 })
  expect(STRIP_H).toBe(18)
  expect(svg).toContain('data-hero="h1"')
  expect(svg).toContain('height="18"')
  expect(svg).not.toContain('NaN')
  expect(svg.length).toBeLessThan(8 * 1024)
})

test('an old save (items without forge fields, no beam, no minions) still draws in every task kind', () => {
  const old = JSON.parse(JSON.stringify(hero('Elder'))) as Hero
  delete old.beam
  for (const kind of ['fight', 'fish', 'mine', 'dig', 'town', 'dead', 'travel'] as const) {
    const svg = svgOf(task(old, kind, kind === 'fight' ? { name: 'Null Pointer', rank: 'normal' } : undefined))
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('data-hero="h1"')
  }
})

// ---------- visible gear on H1 (task-28) ----------
const POSES: Pose[] = ['stand', 'swing', 'sit', 'rod', 'pick', 'pickDown', 'shovel', 'shovelDown', 'dead']
const pixels = (g: Hero['gear'], pose: Pose) => gearHero(lookOf(g), pose).hero.px.c.join(',')
const KINDS: [Hero['task']['kind'], Parameters<typeof task>[2]][] = [['fight', { name: 'Null Pointer', rank: 'normal', count: 3 }], ['fight', { name: 'Mephisto the Monorepo', rank: 'boss' }], ['fish', undefined], ['mine', undefined], ['dig', undefined], ['town', undefined], ['dead', undefined], ['travel', undefined]]
const withGear = (g: Hero['gear']): Hero => { const h = hero(); h.gear = g; return h }

test('gear: hands, waist, legs, feet and rings change no pixel of H1, in any pose, whatever their rarity', () => {
  const extras = (r: 'normal' | 'unique' | 'set') => put(
    itemOf('hands', 'Fingerless Gloves', 'Gloves of Typing', r, { plus: 15, tier: 2, uid: 'x' }), itemOf('waist', 'Cable Sash', 'Cord of Many Buffers', r, { plus: 12, uid: 'x' }),
    itemOf('legs', 'Cargo Pants', 'Pinky-Strain Leggings', r, { plus: 9, uid: 'x' }), itemOf('feet', 'Sneakers', 'Boots of Haste', r, { plus: 15 }),
    itemOf('ring', 'Band of Bandwidth', 'Band of Ninety-Hour Weeks', r, { plus: 15, tier: 1 }), itemOf('ring2', 'Loop of Recursion', 'Loop of Burnout', r, { plus: 15 }))
  for (const l of LOADOUTS) {
    for (const r of ['normal', 'unique', 'set'] as const) {
      const both = { ...l.gear, ...extras(r) }
      for (const pose of POSES) expect([l.label, r, pose, pixels(both, pose) === pixels(l.gear, pose)]).toEqual([l.label, r, pose, true])
    }
  }
  // the neck only picks the cape: nothing else of what it looks like depends on it
  const neckA = itemOf('neck', 'Badge of Access', 'Badge of Access', 'rare'), neckB = itemOf('neck', 'Lanyard Amulet', 'The Regex That Works', 'unique', { uid: 'regex' })
  for (const l of LOADOUTS) {
    const a = lookOf({ ...l.gear, neck: neckA }), b = lookOf({ ...l.gear, neck: neckB })
    expect({ ...a, back: undefined, auras: [] }).toEqual({ ...b, back: undefined, auras: [] })
  }
})

test('gear: every pose wears the gear, keeps one sprite size, and a pick or shovel replaces the weapon', () => {
  for (const l of LOADOUTS) for (const pose of POSES) {
    const g = gearHero(lookOf(l.gear), pose).hero, plain = heroSprite(pose)
    expect([l.label, pose, g.px.w, g.px.h, g.feetX]).toEqual([l.label, pose, plain.px.w, plain.px.h, plain.feetX])
  }
  const sword = put(itemOf('weapon', 'Mechanical Keyboard', 'Mechanical Keyboard', 'rare', { plus: 4 })), axe = put(itemOf('weapon', 'Rubber Mallet', 'Rubber Mallet', 'rare', { plus: 4 }))
  expect(pixels(sword, 'stand')).not.toEqual(pixels({}, 'stand'))
  expect(pixels(sword, 'swing')).not.toEqual(pixels({}, 'swing'))
  expect(pixels(sword, 'swing')).not.toEqual(pixels(axe, 'swing'))
  for (const tool of ['pick', 'pickDown', 'shovel', 'shovelDown', 'rod', 'sit'] as Pose[]) expect(pixels(sword, tool)).toEqual(pixels(axe, tool))
  // the off-hand stays while he works; a kite shield is not the plain round one
  const kite = put(itemOf('offhand', 'Second Monitor', 'Second Monitor', 'rare'))
  for (const pose of ['stand', 'swing', 'pick', 'shovel', 'rod', 'sit'] as Pose[]) expect(pixels(kite, pose)).not.toEqual(pixels({}, pose))
})

test('gear: the aura is a 45% light behind him with the ground ring as its bottom edge, and the scene stays under 40 KB for the late loadout', () => {
  const late = LOADOUTS[11]!.gear
  for (const [kind, foe] of KINDS) {
    const h = task(withGear(late), kind, foe)
    h.followers = FOLLOWERS.slice(0, 3)
    for (const hr of [14, 18, 22]) {
      const svg = svgOf(h, { now: at(hr) })
      expect(svg.length).toBeLessThan(40 * 1024)
      expect(svg).not.toContain('NaN')
      expect(svg.includes('data-aura="glow"')).toBe(kind !== 'dead')
      if (kind !== 'dead') { expect(svg).toContain('opacity="0.45"'); expect(svg).toContain('data-aura="ring"'); expect(svg).toContain('class="mote"') }
    }
  }
  // nothing of the glow hangs below the ring: in every column the glow ends above the ring's lowest pixel
  for (const l of LOADOUTS) for (const pose of ['stand', 'rod'] as Pose[]) {
    const w = gearHero(lookOf(l.gear), pose)
    if (!w.aura || !w.ring) continue
    for (let x = 0; x < w.aura.w; x++) {
      let glow = -1, ring = -1
      for (let y = 0; y < w.aura.h; y++) {
        if (w.aura.get(x, y)) glow = y
        for (const dx of [-1, 0, 1]) if (w.ring.get(x + dx, y)) ring = Math.max(ring, y) // a thin ring has one-pixel gaps in its flat parts
      }
      if (glow >= 0) expect([l.label, pose, x, ring >= glow]).toEqual([l.label, pose, x, true])
    }
  }
  // the aura layer is AURA_PAD bigger than the hero on every side
  const w = gearHero(lookOf(late)), s = w.hero.px
  expect([w.aura!.w, w.aura!.h]).toEqual([s.w + AURA_PAD * 2, s.h + AURA_PAD * 2])
  // a fresh hero has no aura at all
  expect(svgOf(task(withGear({}), 'travel'))).not.toContain('data-aura')
})

test("gear: old saves and odd items fall back to H1's own kit and still draw in every task kind", () => {
  const odd = [
    undefined, {}, { weapon: undefined },
    { weapon: { slot: 'weapon' } }, { weapon: { slot: 'weapon', base: 'Zorp Gadget', name: 'Unknown Thing', rarity: 'rare' } },
    { weapon: null, head: 7, chest: 'tunic', offhand: { base: null, name: null } },
    { weapon: { slot: 'weapon', base: 'Mechanical Keyboard', name: 'x', rarity: 'bogus', plus: Number.NaN, tier: 9 }, neck: { slot: 'neck' } },
    { head: { slot: 'head', base: 'Thinking Cap', name: 'Thinking Cap', rarity: 'normal', plus: 99 } },
  ] as unknown as Hero['gear'][]
  for (const g of odd) {
    for (const [kind, foe] of KINDS) {
      const svg = svgOf(task(withGear(g as Hero['gear']), kind, foe))
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg).toContain('data-hero="h1"')
      expect(svg).not.toContain('NaN')
    }
    const strip = stripSvg(task(withGear(g as Hero['gear']), 'fight', { name: 'Null Pointer', rank: 'normal' }), { w: 720, xp: 0.3 })
    expect(strip).toContain('data-hero="h1"')
  }
  // items the tables do not know leave H1 exactly as task-27 drew him, in every pose
  for (const g of [undefined, {}, { weapon: { slot: 'weapon', base: 'Zorp Gadget', name: 'Unknown Thing', rarity: 'rare' } }, { hands: { slot: 'hands', base: 'Gloves', name: 'Gloves', rarity: 'unique' } }] as unknown as Hero['gear'][]) {
    for (const pose of POSES) expect([pose, pixels(g as Hero['gear'], pose) === heroSprite(pose).px.c.join(',')]).toEqual([pose, true])
  }
  // a save made before the gear field existed has no gear at all
  const bare = hero() as unknown as Record<string, unknown>
  delete bare.gear
  expect(svgOf(task(bare as unknown as Hero, 'fight', { name: 'Null Pointer', rank: 'normal' }))).toContain('data-pose="swing"')
})

test('gear: the strip portrait wears his helm or hood and keeps its size', () => {
  const plain = faceOf(lookOf({})), helm = faceOf(lookOf(put(itemOf('head', 'Noise-Cancelling Helm', 'Modal Crown', 'set', { uid: 'vim' }))))
  expect([plain.w, plain.h, helm.w, helm.h]).toEqual([13, 9, 13, 9])
  expect(helm.c.join(',')).not.toEqual(plain.c.join(','))
  const svg = stripSvg(task(withGear(put(itemOf('head', 'Hoodie Hood', 'Cloak of the Kanban', 'unique', { uid: 'kanban' }))), 'travel'), { w: 720, xp: 0.3 })
  expect(svg).toContain('height="18"')
  expect(svg.length).toBeLessThan(8 * 1024)
})
