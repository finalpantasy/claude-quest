// The art parts library for Claude Quest: the orange crab hero and his gear, 600+ named monsters, bosses, pets and auras.
// Pure functions that return sprites (lists of rects in named groups); `draw` turns one into SVG. Nothing here touches the game state.
import { BASES } from './data'
import { Cells, OUTLINE, TallCells, count, draw, hash } from './sprites/core'
import type { Part, Rect, Sprite } from './sprites/core'
import { anchors, CH, CW, POSES, crabParts } from './sprites/crab'
import type { Pose } from './sprites/crab'
import { BACKS } from './sprites/backs'
import { CHESTS } from './sprites/chest'
import { putBack, putChest, putHat, putMask, putOff, putTool, putWeapon } from './sprites/gear'
import { WEAPON_VARIANTS, variantCount } from './sprites/variants'
import { HATS, MASKS } from './sprites/hats'
import { OFFHANDS, WEAPONS } from './sprites/hands'
import { AURAS, AURA_VARIANTS, SPRITE_CSS, aura, auraAt, auraOf } from './sprites/auras'
import { BOSS_NAMES, boss } from './sprites/bosses'
import { PETS, petSprite, type Pet } from './sprites/pets'
import { SPECIES, foeSprite, speciesOf } from './sprites/species'

export { draw, count, SPRITE_CSS, AURAS, AURA_VARIANTS, aura, auraAt, auraOf, BOSS_NAMES, boss, PETS, petSprite, SPECIES, foeSprite, speciesOf, POSES, CW, CH, BACKS, CHESTS, HATS, MASKS, OFFHANDS, WEAPONS }
export type { Sprite, Pose, Pet }

/** Where a visible item sits in its registry; `exact` is false when the name had no drawing of its own and a hash picked one. */
export type Slot4 = 'weapon' | 'offhand' | 'head' | 'chest'
export const HEADS = [...HATS, ...MASKS]
const REG: Record<Slot4, { n: string }[]> = { weapon: WEAPONS, offhand: OFFHANDS, head: HEADS, chest: CHESTS }
const ALIAS: Record<string, string> = {
  'Chainmail of Linting': 'Chainmail', 'Headset of Standups': 'Headset', 'The Rubber Duck': 'Rubber Duck Shield', 'Bottomless Mug': 'Mug of Brew', 'The Senior Dev\'s Hoodie': 'Hoodie of Holding',
  'Fork Bomb Gauntlets': 'Gauntlet Fist', 'Escape Key of Vim': 'Mechanical Keyboard', 'Monad of Understanding': 'Thinking Cap', 'Cloak of the Kanban': 'Hooded Robe', 'Lambda Staff of the Ancients': 'Crystal Staff',
  'Ward of 100% Coverage': 'Tower Shield', 'Friday Deploy': 'Flame Sword', "Stack Overflow's Accepted Answer": 'Quill',
}
/** Variants per drawing: trims, plumes and gems for armor, materials and runes for weapons. Variant 0 is the plain drawing. */
export const VARIANTS: Record<Slot4, number> = { weapon: WEAPON_VARIANTS, offhand: variantCount('offhand'), head: variantCount('head'), chest: variantCount('chest') }
export const BACK_VARIANTS = variantCount('back')
/** The look for an item name. A name with a drawing of its own keeps the plain variant; any other name is hashed to a drawing and a variant. */
export const lookFor = (slot: Slot4, name: string) => {
  const reg = REG[slot]
  const want = ALIAS[name] ?? name
  const i = reg.findIndex(s => s.n === want)
  if (i >= 0) return { id: i, v: 0, exact: true }
  const h = hash(`${slot}:${name}`)
  return { id: h % reg.length, v: (h >>> 12) % VARIANTS[slot], exact: false }
}

/**
 * A 1-cell dark outline around the whole geared crab, not around each piece: every empty cell beside the composite.
 * Each outline cell joins the first part it borders: the parts that move on their own (legs, weapon) keep theirs so it moves with
 * their CSS, every other cell goes to the first part, drawn first, so the ring is a few long runs.
 */
const MOVES = /^(l1|l2|wpn)$/
const outlined = (parts: Part[]): Part[] => {
  const occ = new Set<string>()
  const each = (p: Part, f: (x: number, y: number) => void) => { for (const [x, y, w, h] of p.rects) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) f(x + i, y + j) }
  for (const p of parts) each(p, (x, y) => occ.add(`${x},${y}`))
  const done = new Set<string>()
  const ring: [number, number][][] = parts.map(() => [])
  parts.forEach((p, n) => each(p, (x, y) => {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const k = `${x + dx},${y + dy}`
      if (!occ.has(k) && !done.has(k)) { done.add(k); ring[MOVES.test(p.cls ?? '') ? n : 0]!.push([x + dx, y + dy]) }
    }
  }))
  return parts.map((p, n) => {
    const mine = ring[n] ?? []
    if (!mine.length) return p
    // merged into as few rects as the cells allow, on a canvas shifted to cover a raised weapon
    const x0 = Math.min(...mine.map(c => c[0])), y0 = Math.min(...mine.map(c => c[1]))
    const c = new Cells(Math.max(...mine.map(q => q[0])) - x0 + 1, Math.max(...mine.map(q => q[1])) - y0 + 1)
    for (const [x, y] of mine) c.put(x - x0, y - y0, OUTLINE)
    return { ...p, rects: [...c.rects().map(([x, y, w, h, col]) => [x + x0, y + y0, w, h, col] as Rect), ...p.rects] }
  })
}

export type GearLook = { id: number; color: string; v?: number }
export type HeroLook = { pose: Pose; trim: string; head?: GearLook; chest?: GearLook; back?: GearLook; weapon?: GearLook; offhand?: GearLook; tool?: 'rod' | 'pick' | 'shovel'; aura?: string; /** false leaves out the dark ring around the crab (icon sizes) */ outline?: boolean }
/** The crab with its gear: back first, then shell and robe, hat, mask, claws holding the off-hand and the weapon. Auras are layers around it. */
export const crabSprite = (o: HeroLook): Sprite => {
  const a = anchors(o.pose)
  const head = o.head && o.head.id < HATS.length ? o.head : undefined
  const mask = o.head && o.head.id >= HATS.length ? o.head : undefined
  const sp = crabParts({ pose: o.pose, trim: o.trim }, {
    back: o.back ? c => putBack(c, o.back!.id, o.back!.color, a.by, o.back!.v) : undefined,
    chest: o.chest ? c => putChest(c, o.chest!.id, o.chest!.color, a.by, o.chest!.v) : undefined,
    head: head ? c => putHat(c, head.id, head.color, a.by, head.v) : undefined,
    mask: mask ? c => putMask(c, mask.id - HATS.length, mask.color, a.by, mask.v) : undefined,
    off: o.offhand && !o.tool ? c => putOff(c, o.offhand!.id, o.offhand!.color, a.hold, o.offhand!.v) : undefined,
    weapon: o.tool ? (c: Cells) => putTool(c, o.tool!, a.grip) : o.weapon ? (c: Cells) => putWeapon(c, o.weapon!.id, o.weapon!.color, a.grip, o.weapon!.v) : undefined,
  })
  if (o.pose === 'dead') {
    // a ghost: faded, nothing in its claws, a halo over it
    sp.parts = sp.parts.filter(p => p.cls !== 'wpn' && p.cls !== 'off').map(p => ({ ...p, op: 0.62 }))
    const h = new Cells(CW, CH)
    h.rect(11, 6, 8, 1, '#ffe27a'); h.rect(10, 7, 1, 1, '#ffe27a'); h.rect(19, 7, 1, 1, '#ffe27a'); h.rect(11, 8, 8, 1, '#ffe27a')
    sp.parts.push({ cls: 'ghost', rects: h.rects() })
  }
  if (o.outline !== false) sp.parts = outlined(sp.parts)
  const au = o.aura ? auraOf(o.aura) : undefined
  if (au) { const l = aura(au, a.by); sp.parts = [...l.back, ...sp.parts, ...l.front] }
  return sp
}

/** One piece drawn alone on the crab's canvas (stand pose), for counting and for catalogs. */
export const pieceSprite = (slot: Slot4 | 'back', look: GearLook): Sprite => {
  const a = anchors('stand')
  const c = slot === 'weapon' ? new TallCells(CW, CH, 14) : new Cells(CW, CH)
  const col = look.color
  if (slot === 'weapon') putWeapon(c, look.id, col, a.grip, look.v)
  else if (slot === 'offhand') putOff(c, look.id, col, a.hold, look.v)
  else if (slot === 'chest') putChest(c, look.id, col, a.by, look.v)
  else if (slot === 'back') putBack(c, look.id, col, a.by, look.v)
  else if (look.id < HATS.length) putHat(c, look.id, col, a.by, look.v)
  else putMask(c, look.id - HATS.length, col, a.by, look.v)
  return { w: CW, h: CH, parts: [{ rects: c.rects() }] }
}
