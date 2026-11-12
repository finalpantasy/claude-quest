// Visible gear for hero H1 (task-28, D23): weapon, off-hand, head, chest and back pieces, rarity trims, auras and upgrade glows. Never a crab (D29).
// Hands, waist, legs, feet, neck and rings draw nothing (D23); the neck item only picks the cape. Pure data in, pixels out: no DOM, no Node.
import type { Item, Rarity, Slot } from '../../../types'
import { P, Px } from './core'
import { Fig, GOLD, SK, heroWith, ramp, type Hero, type Kit, type Pose, type Ramp } from './hero'

// ---------- looks: what an item becomes ----------
export type WeaponShape = 'sword' | 'dagger' | 'axe' | 'mace' | 'hammer' | 'staff' | 'wand' | 'spear'
export type OffShape = 'round' | 'kite' | 'orb' | 'tome' | 'quiver' | 'bare'
export type HeadShape = 'cap' | 'hood' | 'half' | 'full' | 'visor' | 'crown' | 'circlet' | 'headset'
export type ChestShape = 'tunic' | 'leather' | 'mail' | 'plate' | 'robe'
export type CapeCut = 'standard' | 'short' | 'long' | 'ragged' | 'mantle'
export type Piece<S> = { shape: S; rar: Rarity; plus: number; h: number; ilvl: number; n: string }
export type AuraKind = 'unique' | 'set2' | 'set4' | 'ancient' | 'primal'
export type Look = {
  weapon?: Piece<WeaponShape>
  off?: Piece<OffShape>
  head?: Piece<HeadShape>
  chest?: Piece<ChestShape>
  /** Cape cut and color index, from the neck item (none: H1's own red cape). */
  back?: { cut: CapeCut; color: number }
  /** Auras, strongest first (at most two are drawn). */
  auras: AuraKind[]
}

/** FNV-1a: a small stable hash for names. */
export const hashOf = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0 }

const WEAPON_WORDS: [RegExp, WeaponShape][] = [
  [/staff|scepter/i, 'staff'], [/wand|soldering/i, 'wand'], [/laser|pointer|dagger|knife/i, 'dagger'], [/flail|mace|club/i, 'mace'],
  [/spear|lance|pike/i, 'spear'], [/mallet|hammer/i, 'hammer'], [/\baxe\b|hatchet|deploy/i, 'axe'], [/keyboard|\bkey\b|sword|blade|answer/i, 'sword'],
]
const OFF_WORDS: [RegExp, OffShape][] = [[/quiver/i, 'quiver'], [/grimoire|tome|book|docs/i, 'tome'], [/orb|mug|coffee/i, 'orb'], [/monitor|screen/i, 'kite'], [/shield|duck|buckler/i, 'round']]
const HEAD_WORDS: [RegExp, HeadShape | 'helm'][] = [
  [/headset/i, 'headset'], [/crown/i, 'crown'], [/monad|circlet|tiara/i, 'circlet'], [/hood|cloak|cowl/i, 'hood'], [/visor|\bvr\b/i, 'visor'], [/\bcap\b|beanie/i, 'cap'], [/helm/i, 'helm'],
]
const CHEST_WORDS: [RegExp, ChestShape][] = [[/robe|hoodie|vestment/i, 'robe'], [/hauberk|mail|chain/i, 'mail'], [/plate|ward|armor|cuirass/i, 'plate'], [/cardigan|kevlar|leather|jerkin|vest/i, 'leather'], [/\btee\b|tunic|shirt/i, 'tunic']]

const find = <S>(table: [RegExp, S][], it: Item): S | undefined => {
  // a unique or a set piece has a fixed name and a random base, so its name speaks first; other items speak through their base
  const named = it.rarity === 'unique' || it.rarity === 'set'
  const a = named ? it.name : it.base, b = named ? it.base : it.name
  for (const text of [a, b]) { if (!text) continue; const hit = table.find(([re]) => re.test(text)); if (hit) return hit[1] }
  return undefined
}
const RARITIES: Rarity[] = ['normal', 'magic', 'rare', 'unique', 'set']
const piece = <S>(it: Item, shape: S): Piece<S> => ({
  shape, rar: RARITIES.includes(it.rarity) ? it.rarity : 'normal', plus: Number.isFinite(Number(it.plus)) ? Math.max(0, Math.min(15, Math.floor(Number(it.plus)))) : 0, h: hashOf(`${it.base}|${it.name}`), ilvl: it.ilvl ?? 0, n: `${it.base ?? ''} ${it.name ?? ''}`.toLowerCase(),
})
const CUTS: CapeCut[] = ['standard', 'short', 'long', 'ragged', 'mantle']

/**
 * What the hero's gear looks like. Missing items, unknown bases and old saves leave a field out and H1 keeps his task-27 part.
 * Auras come from every slot (a unique power, a set bonus, ancient or primal); an empty hero is just H1.
 */
export const lookOf = (gear: Partial<Record<Slot, Item>> | undefined): Look => {
  const look: Look = { auras: [] }
  const g = gear ?? {}
  const w = g.weapon, o = g.offhand, hd = g.head, c = g.chest, n = g.neck
  const ws = w && find(WEAPON_WORDS, w); if (w && ws) look.weapon = piece(w, ws)
  const os = o && find(OFF_WORDS, o); if (o && os) look.off = piece(o, os)
  const hs = hd && find(HEAD_WORDS, hd)
  if (hd && hs) look.head = piece(hd, hs === 'helm' ? (hd.rarity === 'normal' || hd.rarity === 'magic' ? 'half' : 'full') : hs)
  const cs = c && find(CHEST_WORDS, c); if (c && cs) look.chest = piece(c, cs)
  if (n && (n.name || n.base)) { const h = hashOf(`${n.base}|${n.name}`); look.back = { cut: CUTS[h % CUTS.length]!, color: (h >>> 8) % CAPES.length } }
  // an empty off-hand beside a weapon, helm or chest the hero is visibly wearing is a bare hand, not a shield; an unknown item or an invisible slot leaves his own kit
  if (!o && (look.weapon || look.head || look.chest)) look.off = { shape: 'bare', rar: 'normal', plus: 0, h: 0, ilvl: 0, n: '' }
  const items = Object.values(g).filter((i): i is Item => !!i)
  const sets = new Map<string, number>()
  for (const i of items) if (i.rarity === 'set' && i.uid) sets.set(i.uid, (sets.get(i.uid) ?? 0) + 1)
  const best = Math.max(0, ...sets.values())
  if (items.some(i => i.tier === 2)) look.auras.push('primal')
  if (items.some(i => i.tier === 1)) look.auras.push('ancient')
  if (best >= 4) look.auras.push('set4'); else if (best >= 2) look.auras.push('set2')
  if (items.some(i => i.rarity === 'unique')) look.auras.push('unique')
  return look
}

// ---------- rarity: trim and metal ----------
/** Trim color by rarity: bronze, violet, gold, orange, green (the game's own rarity hues). */
export const TRIM: Record<Rarity, Ramp> = {
  normal: ramp(P.wine, P.rust, P.copper, P.tan, P.straw),
  magic: ramp(P.grape, P.violet, P.purple, P.lilac, P.blush),
  rare: ramp(P.rust, P.amber, P.gold, P.cream, P.white),
  unique: ramp(P.blood, P.crimson, P.orange, P.amber, P.straw),
  set: ramp(P.pine, P.green, P.leaf, P.spring, P.sprout),
}
/** Steel, with the rarity's deep color on its lit outline and its highlight on the corners. */
export const metalOf = (r: Rarity): Ramp => r === 'normal' ? ramp(P.night, P.mauve, P.mist, P.cloud, P.white) : ramp(TRIM[r].deep, P.mauve, P.mist, P.cloud, TRIM[r].hi)
/** A gem or glass: the rarity ramp with a wide light. */
const gemOf = (r: Rarity): Ramp => ({ ...ramp(TRIM[r].deep, TRIM[r].shade, TRIM[r].base, TRIM[r].light, P.white), lw: 2 })
const SHIELD = ramp(P.grape, P.wine, P.rust, P.copper)
const WOOD2 = ramp(P.wine, P.rust, P.copper, P.tan)
const COAT = ramp(P.grape, P.wine, P.rust, P.copper, P.tan, 2, 3)

// ---------- cloth dyes and capes ----------
const BLUE = ramp(P.navy, P.indigo, P.blue, P.sky, undefined, 2, 3)
const DYES: Ramp[] = [
  ramp(P.ink, P.violet, P.purple, P.lilac, undefined, 2, 3), ramp(P.deep, P.teal, P.aqua, P.mint, undefined, 2, 3),
  ramp(P.pine, P.green, P.leaf, P.spring, undefined, 2, 3), ramp(P.night, P.dusk, P.mauve, P.mist, undefined, 2, 3), ramp(P.grape, P.blood, P.red, P.scarlet, undefined, 2, 3),
]
/** Cloth dyes without the gray hoodie, for caps and books. */
const CLOTH: Ramp[] = [DYES[0]!, DYES[1]!, DYES[2]!, DYES[4]!]
export const CAPES: { c: Ramp; v: Ramp }[] = [
  { c: ramp(P.grape, P.blood, P.red, P.scarlet, undefined, 2, 1), v: ramp(P.ink, P.grape, P.wine, P.berry) },
  { c: ramp(P.ink, P.grape, P.violet, P.purple, undefined, 2, 1), v: ramp(P.ink, P.ink, P.grape, P.berry) },
  { c: ramp(P.ink, P.pine, P.green, P.leaf, undefined, 2, 1), v: ramp(P.ink, P.ink, P.fern, P.pine) },
  { c: ramp(P.ink, P.deep, P.teal, P.aqua, undefined, 2, 1), v: ramp(P.ink, P.ink, P.deep, P.teal) },
  { c: ramp(P.ink, P.night, P.dusk, P.mauve, undefined, 2, 1), v: ramp(P.ink, P.ink, P.grape, P.wine) },
  { c: ramp(P.dusk, P.mauve, P.mist, P.cloud, undefined, 2, 1), v: ramp(P.night, P.dusk, P.mauve, P.mist) },
]
const FUR = ramp(P.dusk, P.mauve, P.mist, P.cloud, P.white, 1, 2)

/** Stamp rows of part letters with their top-left at (x, y); '.' and ' ' leave the figure alone. */
const stamp = (f: Fig, x: number, y: number, rows: string[]) => rows.forEach((r, j) => [...r].forEach((k, i) => { if (k !== '.' && k !== ' ') f.set(x + i, y + j, k) }))

// ---------- the cape (back) ----------
const capeCut = (f: Fig, cut: CapeCut) => {
  const c = SK.c
  const row = (y: number, half: number) => f.spans('C', [[y, c - half, c + half]])
  if (cut === 'standard') { for (let y = 22; y <= 45; y++) row(y, 6 + Math.floor((y - 22) / 12)); f.spans('V', [[36, 44, 13, 15]]) }
  else if (cut === 'short') { for (let y = 22; y <= 39; y++) row(y, 6 + (y >= 34 ? 1 : 0)); f.spans('V', [[36, 39, 13, 15]]) }
  else if (cut === 'long') { for (let y = 22; y <= 52; y++) row(y, 6 + Math.floor((y - 22) / 9)); f.spans('V', [[36, 52, 13, 15]]) }
  else if (cut === 'ragged') {
    for (let y = 22; y <= 46; y++) {
      const half = 6 + Math.floor((y - 22) / 12)
      for (let x = c - half; x <= c + half; x++) if (y <= 41 + ((x * 7 + 3) % 6)) f.set(x, y, 'C')
    }
    f.spans('V', [[36, 44, 13, 15]])
  } else { for (let y = 22; y <= 34; y++) row(y, 6); f.spans('V', [[33, 34, 13, 15]]); f.spans('0', [[21, 11, 17], [22, 10, 18]]) }
}

// ---------- weapons: shafts 2 wide on columns 22 and 23 (centered on the fist), heads above; stamped from column 18, row 3 ----------
const WEAPON_ROWS: Record<WeaponShape, string[]> = {
  sword: ['.....W......', '....WWW.....', '....WWW.....', '....WWW.....', '....WWW.....', '....WWW.....', '....WWW.....', '....WWW.....', '....WWW.....', '....WWW.....', '..1111111...'],
  dagger: ['............', '............', '............', '............', '.....W......', '....WWW.....', '....WWW.....', '....WWW.....', '....WWW.....', '....WWW.....', '...11111....'],
  staff: ['....33......', '...3333.....', '..333333....', '..333333....', '..333333....', '...3333.....', '..111111....', '....22......', '....22......', '....22......', '....22......'],
  wand: ['............', '............', '............', '............', '....33......', '...3333.....', '...3333.....', '....33......', '...1111.....', '....22......', '....22......'],
  spear: ['....WW......', '...WWWW.....', '...WWWW.....', '...WWWW.....', '...WWWW.....', '....WW......', '...1111.....', '....22......', '....22......', '....22......', '....22......'],
  mace: ['....11......', '...WWWW.....', '..WWWWWW....', '.1WWWWWW1...', '..WWWWWW....', '..WWWWWW....', '...WWWW.....', '....11......', '...1111.....', '....22......', '....22......'],
  axe: ['....WW......', '....22WW....', '....22WWW...', '....22WWWW..', '....22WWWWW.', '....22WWWWW.', '....22WWWW..', '....22WWW...', '....22WW....', '....22......', '....11......'],
  hammer: ['............', '..WWWWWW....', '.1WWWWWW1...', '.1WWWWWW1...', '.1WWWWWW1...', '..WWWWWW....', '....22......', '....22......', '....22......', '....22......', '....11......'],
}
const drawWeapon = (f: Fig, p: Piece<WeaponShape>) => {
  f.spans('', [[3, 13, 19, 27]])
  stamp(f, 18, 3, WEAPON_ROWS[p.shape])
  // a gem in the guard of a better sword
  if ((p.shape === 'sword' || p.shape === 'dagger') && p.rar !== 'normal') f.set(23, 13, '3')
}

/**
 * The swing pose: the same weapon turned onto the swing's diagonal (guard at the fist, tip down and to the right, as H1's own blade),
 * its shaft or blade lengthened by repeating one body row so it reaches as far as the plain swing does. Sampled backwards so no pixel is missed.
 */
const STRETCH: Record<WeaponShape, [number, number]> = { sword: [5, 12], dagger: [6, 3], staff: [8, 7], wand: [9, 3], spear: [8, 9], mace: [9, 6], axe: [9, 7], hammer: [7, 9] }
const SWING_AT = [24, 12] as const
const drawSwing = (f: Fig, p: Piece<WeaponShape>) => {
  const base = WEAPON_ROWS[p.shape], [at, n] = STRETCH[p.shape]
  const rows = [...base.slice(0, at), ...Array<string>(n).fill(base[at]!), ...base.slice(at)]
  const N = rows.length, len = Math.hypot(15, 19), dx = 15 / len, dy = 19 / len, nx = -dy, ny = dx
  for (let y = 0; y < f.h; y++) for (let x = 10; x < f.w; x++) {
    const ox = x - SWING_AT[0], oy = y - SWING_AT[1]
    const r = N - 1 - Math.round(ox * dx + oy * dy), i = Math.round(ox * nx + oy * ny) + 5
    if (r < 0 || r >= N || i < 0 || i > 11) continue
    const k = rows[r]![i]!
    if (k !== '.') f.set(x, y, k)
  }
  if ((p.shape === 'sword' || p.shape === 'dagger') && p.rar !== 'normal') f.set(SWING_AT[0], SWING_AT[1], '3')
}

// ---------- off-hand ----------
const ARM =(f: Fig) => { f.spans('A', [[27, 28, 5, 8], [29, 30, 5, 8], [31, 6, 8]]); f.spans('G', [[32, 33, 6, 8], [34, 6, 7]]).crease([[33, 8]]) }
const OFF_ROWS: Partial<Record<OffShape, { x: number; y: number; rows: string[] }>> = {
  kite: { x: 2, y: 26, rows: ['RRRRRRRRR', 'RSSSSSSSR', 'RSSSSSSSR', 'RSSSOOSSR', 'RSSSOOSSR', 'RSSSSSSSR', 'RSSSSSSSR', '.RSSSSSR.', '.RSSSSSR.', '..RSSSR..', '..RSSSR..', '...RSR...', '....R....'] },
  tome: { x: 3, y: 26, rows: ['RRRRRR.', 'RSSSSS4', 'RSSSSS4', 'RSOOSS4', 'RSOOSS1', 'RSSSSS1', 'RSSSSS4', 'RSSSSS4', 'RRRRRR4', '.444444'] },
}
const drawOff = (f: Fig, p: Piece<OffShape>) => {
  const sh = p.shape
  if (sh === 'round') f.disc(6.5, 31, 4.6, 'R').disc(6.5, 31, 3.6, 'S').disc(7, 32, 1.1, 'O')
  else if (sh === 'kite') stamp(f, 2, 26, OFF_ROWS.kite!.rows)
  else if (sh === 'tome') { f.spans('A', [[27, 31, 5, 8]]); stamp(f, 3, 26, OFF_ROWS.tome!.rows); f.spans('G', [[35, 36, 3, 6]]) }
  else if (sh === 'orb') { ARM(f); f.disc(6.5, 29.5, 3.2, 'S') }
  else ARM(f)
  if (sh === 'quiver') {
    // worn on the back: the mouth and the arrows rise past the screen-left shoulder, the body hangs behind the arm
    stamp(f, 3, 14, ['..!...!..', '..!.!.!..', '..$.$.$..', '..$.$.$..', '..$.$.$..', '..$.$.$..', '..$.$.$..'])
    for (let y = 21; y <= 32; y++) f.spans('4', [[y, 4 - Math.floor((y - 21) / 6), 9]])
    f.spans('4', [[33, 3, 7]])
  }
}

// ---------- head ----------
const HEAD_ROWS: Record<HeadShape, { x: number; y: number; rows: string[] }> = {
  cap: { x: 10, y: 11, rows: ['...555...', '.5555555.', '555555555', 'IIIIIIIII'] },
  hood: { x: 8, y: 11, rows: ['....55555....', '..555555555..', '.55555555555.', '.55.......55.', '.55.......55.', '.55.......55.', '.55.......55.', '.55.......55.', '..55.....55..', '..555...555..', '.5555...5555.'] },
  half: { x: 10, y: 11, rows: ['...UUU...', '.UUUUUUU.', 'UUUUUUUUU', 'IIIIIIIII', '....U....', '....U....'] },
  full: { x: 10, y: 10, rows: ['....I....', '...III...', '...UUU...', '.UUUUUUU.', 'UUUUUUUUU', 'IIIIIIIII', 'U...U...U', 'U...U...U', 'U.......U', '.U.....U.'] },
  visor: { x: 10, y: 15, rows: ['II66666II', 'II66666II'] },
  crown: { x: 10, y: 10, rows: ['....I....', '....I....', '.I..I..I.', '.II.I.II.', 'IIIIIIIII', 'II66666II'] },
  circlet: { x: 10, y: 14, rows: ['IIIIIIIII', '...I6I...'] },
  headset: { x: 8, y: 11, rows: ['....UUUUU....', '..UUU...UUU..', '.UU.......UU.', '.UU.......UU.', 'III.......III', 'III.......III', 'III.......III', 'III.......III'] },
}
const drawHead = (f: Fig, p: Piece<HeadShape>) => {
  const s = HEAD_ROWS[p.shape]; stamp(f, s.x, s.y, s.rows)
  // the hood's brim and inner edge are a darker band where the cloth meets the face, so it never reads as hair
  if (p.shape === 'hood') { stamp(f, 10, 13, ['%%%%%%%%%']); for (let y = 14; y <= 18; y++) { f.set(10, y, '%'); f.set(18, y, '%') } }
}

// ---------- chest ----------
const chestRamp = (p: Piece<ChestShape>): Ramp => p.shape === 'leather' ? COAT : p.shape === 'mail' ? ramp(P.night, P.dusk, P.mauve, P.mist, P.cloud, 2, 3)
  : p.shape === 'plate' ? ramp(P.night, P.mauve, P.mist, P.cloud, P.white, 2, 3) : p.shape === 'robe' ? DYES[p.h % DYES.length]! : BLUE
const drawChest = (f: Fig, p: Piece<ChestShape>) => {
  const sh = p.shape
  f.spans('T', [[22, 10, 18], [23, 26, 8, 20], [27, 28, 9, 19], [29, 30, 10, 18], [32, 10, 18], [33, 35, 9, 19]])
  f.spans('Q', [[22, 12, 16]])
  f.spans('A', [[23, 24, 6, 8], [25, 26, 5, 7]])
  if (p.rar !== 'normal') f.spans('8', [[35, 9, 19]])
  if (sh === 'leather') f.spans('9', [[22, 12, 16], [23, 13, 15], [24, 14, 14]]).crease([[26, 12, 16], [29, 12, 16], [33, 12, 16]])
  if (sh === 'mail') f.crease([[24, 10, 18], [26, 10, 18], [28, 10, 18], [30, 11, 17], [33, 10, 18]])
  if (sh === 'plate') {
    f.spans('7', [[22, 7, 9], [23, 5, 9], [24, 4, 9], [25, 4, 8], [26, 5, 8], [22, 17, 21], [23, 17, 22], [24, 17, 22], [25, 18, 21]])
    f.spans('Q', [[22, 12, 16], [23, 12, 16]]).spans('9', [[24, 13, 15], [25, 13, 15], [26, 13, 15], [27, 13, 15], [28, 13, 15], [29, 13, 15]])
  }
  if (sh === 'robe') {
    f.spans('T', [[36, 39, 9, 19], [40, 43, 8, 20]]).spans('8', [[43, 8, 20]]).crease([[38, 14], [39, 14], [40, 14], [41, 14], [42, 14], [43, 14]])
    f.spans('Q', [[21, 12, 16]])
  }
}
const chestRamps = (p: Piece<ChestShape>): Record<string, Ramp> => {
  const body = chestRamp(p), t = TRIM[p.rar], m = metalOf(p.rar)
  const out: Record<string, Ramp> = { T: body, 8: p.rar === 'normal' ? body : t }
  if (p.shape === 'tunic') { out.Q = p.rar === 'normal' ? ramp(P.dusk, P.mauve, P.mist, P.cloud) : t }
  if (p.shape === 'leather') { out.Q = ramp(P.grape, P.wine, P.rust, P.copper); out['9'] = BLUE }
  if (p.shape === 'mail') { out.Q = m }
  if (p.shape === 'plate') { out.Q = m; out['7'] = m; out['9'] = ramp(t.deep, P.mist, P.cloud, P.white, P.white, 1, 1) }
  if (p.shape === 'robe') { out.Q = t; out.A = body; out.X = body }
  return out
}

// ---------- the kit for a look ----------
const kitFor = (look: Look): Kit => {
  const kit: Kit = {}
  const ramps: Record<string, Ramp> = {}
  const off = look.off
  const quiver = off?.shape === 'quiver'
  // back to front: cape, quiver, legs and boots, neck, chest, belt and shoulder, hair, head gear, plate, sleeve, haft and fist, blade, off-hand
  const order = `CV${quiver ? '4!$' : ''}LMEKDJZNTQ980BAFHUI5%6X72GYW13${quiver ? '' : 'RS4O'}P`
  kit.order = order

  const cape = look.back ?? { cut: 'standard' as CapeCut, color: 0 }
  if (look.back) { kit.back = f => capeCut(f, cape.cut); const c = CAPES[cape.color]!; ramps.C = c.c; ramps.V = c.v; ramps['0'] = FUR }

  if (look.chest) { const p = look.chest; kit.chest = f => drawChest(f, p); Object.assign(ramps, chestRamps(p)) }

  if (look.head) {
    const p = look.head, t = TRIM[p.rar], m = metalOf(p.rar)
    kit.head = f => drawHead(f, p)
    ramps.U = m; ramps.I = p.shape === 'crown' || p.shape === 'circlet' ? ramp(P.rust, P.amber, P.gold, P.cream, P.white) : p.rar === 'normal' && (p.shape === 'half' || p.shape === 'full') ? ramp(P.ink, P.night, P.dusk, P.mauve, P.mist) : t; ramps['6'] = gemOf(p.rar)
    ramps['5'] = p.shape === 'hood' ? DYES[p.h % DYES.length]! : CLOTH[(p.h >>> 4) % CLOTH.length]!
    if (p.shape === 'hood') { const d = ramps['5']; ramps['%'] = ramp(P.ink, P.ink, d.deep, d.shade) }
  }

  if (look.weapon) {
    const p = look.weapon, t = TRIM[p.rar]
    kit.weapon = f => drawWeapon(f, p)
    kit.swing = f => drawSwing(f, p)
    ramps.W = metalOf(p.rar); ramps['1'] = t; ramps['3'] = gemOf(p.rar); ramps['2'] = WOOD2
    if (p.shape === 'axe' || p.shape === 'hammer' || p.shape === 'mace') ramps['1'] = p.rar === 'normal' ? ramp(P.ink, P.night, P.dusk, P.mauve, P.mist) : t
    if (p.shape === 'staff' || p.shape === 'wand') ramps['3'] = p.rar === 'normal' ? ramp(P.grape, P.violet, P.purple, P.lilac, P.blush, 1, 2) : gemOf(p.rar)
  }

  if (off) {
    const t = TRIM[off.rar], m = metalOf(off.rar)
    kit.offhand = f => drawOff(f, off)
    if (off.shape === 'round') { ramps.R = m; ramps.S = /duck/.test(off.n) ? GOLD : SHIELD; ramps.O = /duck/.test(off.n) ? ramp(P.rust, P.copper, P.orange, P.straw) : t }
    if (off.shape === 'kite') { ramps.R = m; ramps.S = ramp(P.ink, P.navy, P.indigo, P.blue, P.ice, 2, 3); ramps.O = t }
    if (off.shape === 'tome') { ramps.R = t; ramps.S = CLOTH[off.h % CLOTH.length]!; ramps.O = t; ramps['4'] = ramp(P.clay, P.sand, P.hay, P.cream, P.white); ramps['1'] = t }
    if (off.shape === 'orb') { ramps.S = off.rar === 'normal' ? ramp(P.grape, P.wine, P.rust, P.copper, P.straw, 1, 2) : gemOf(off.rar) }
    if (off.shape === 'quiver') { ramps['4'] = COAT; ramps['!'] = ramp(P.dusk, P.mist, P.cloud, P.white); ramps.$ = ramp(P.ink, P.wine, P.rust, P.copper) }
  }
  if (Object.keys(ramps).length) kit.ramps = ramps
  return kit
}

// ---------- upgrade glow (+1 to +15): metal catches the light, then sparkles, then light behind the blade ----------
/** Glow step 0 to 6 for a forge level: +1..3, +4..6, +7..9, +10..12, +13..14, +15. */
export const glowStep = (plus: number) => plus <= 0 ? 0 : plus >= 15 ? 6 : plus >= 13 ? 5 : Math.ceil(plus / 3)
/** The light behind the blade by step: its margin in art pixels and its tones from the outer edge in. */
const BEHIND: Record<number, [number, string[]]> = { 3: [2, [P.copper]], 4: [2.6, [P.amber, P.straw]], 5: [3.2, [P.amber, P.straw, P.cream]], 6: [3.2, [P.amber, P.straw, P.cream]] }
type GlowGroup = { letters: string; step: number; kind: 'weapon' | 'off' | 'head' | 'chest'; metal: string; diag?: boolean }
const sparkle = (out: Px, orig: Px, x: number, y: number) => {
  const put = (dx: number, dy: number, c: string) => { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < out.w && Y < out.h && orig.get(X, Y) === undefined) out.set(X, Y, c) }
  put(0, 0, P.white)
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) put(dx, dy, P.cream)
  for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]] as const) put(dx, dy, P.gold)
}
const fancy = (out: Px, orig: Px, f: Fig, g: GlowGroup) => {
  const cells: [number, number][] = []
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const k = f.at(x, y); if (k && g.letters.includes(k.toUpperCase())) cells.push([x + 1, y + 1]) }
  if (!cells.length) return
  const letter = (x: number, y: number) => f.at(x - 1, y - 1).toUpperCase()
  if (g.kind !== 'weapon') {
    // a shield, helm or breastplate: one small white glint on its lit upper left, no trace around it
    const c = g.step >= 2 ? cells.find(([x, y]) => g.metal.includes(letter(x, y))) : undefined
    if (c) { out.set(c[0], c[1], P.white); if (g.metal.includes(letter(c[0] + 1, c[1]))) out.set(c[0] + 1, c[1], P.white) }
    return
  }
  const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const [m, tones] = BEHIND[g.step] ?? [0, []]
  if (tones.length && g.diag) {
    // a weapon on the swing's diagonal: its light hugs the shape (the distance to the nearest part of it), a bounding oval would swallow the hero
    const reach = m * 1.6
    for (let y = Math.floor(y0 - reach); y <= y1 + reach; y++) for (let x = Math.floor(x0 - reach); x <= x1 + reach; x++) {
      if (x < 0 || y < 0 || x >= out.w || y >= out.h || orig.get(x, y) !== undefined) continue
      let d = 99
      for (const [cx2, cy2] of cells) d = Math.min(d, Math.hypot(x - cx2, y - cy2))
      if (d <= reach) out.set(x, y, tones[Math.min(tones.length - 1, Math.floor((1 - d / reach) * tones.length))]!)
    }
  } else if (tones.length) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 + m, ry = (y1 - y0) / 2 + m * 0.85
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if (x < 0 || y < 0 || x >= out.w || y >= out.h || orig.get(x, y) !== undefined) continue
      const u = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
      if (u <= 1) out.set(x, y, tones[Math.min(tones.length - 1, Math.floor((1 - u) * tones.length))]!)
    }
  }
  // the blade's lit edge: warm at +1 to +3, white from +4
  for (const [x, y] of cells) if (g.metal.includes(letter(x, y)) && letter(x - 1, y) !== letter(x, y)) out.set(x, y, g.step === 1 ? P.cream : P.white)
  if (g.step >= 3) sparkle(out, orig, Math.round(x1 + 3), Math.round(y0 + (y1 - y0) * 0.3))
  if (g.step >= 6) sparkle(out, orig, Math.round(x1 + 3), Math.round(y0 + (y1 - y0) * 0.78))
}
const glowPass = (px: Px, f: Fig, groups: GlowGroup[]): Px => { const out = px.map(c => c); for (const g of groups) fancy(out, px, f, g); return out }

// ---------- the hero in his gear ----------
const slotLetters = (look: Look) => [
  { letters: '12W3', piece: look.weapon, kind: 'weapon' as const, metal: 'W' }, { letters: look.off?.shape === 'quiver' ? '' : look.off?.shape === 'orb' ? 'S' : 'RSO4', piece: look.off, kind: 'off' as const, metal: 'R' },
  { letters: 'UI5%6', piece: look.head, kind: 'head' as const, metal: 'U' }, { letters: look.chest?.shape === 'plate' ? 'TQ789' : 'TQ89', piece: look.chest, kind: 'chest' as const, metal: 'Q' },
]
const cache = new Map<string, { hero: Hero; aura?: Px; ring?: Px; motes?: Mote[] }>()
const TOOL_POSES: Pose[] = ['pick', 'pickDown', 'shovel', 'shovelDown']
/**
 * H1 wearing a look, in a pose, with the aura layers to draw behind him (cached by look and pose; at most 64 entries).
 * A pick or shovel replaces the weapon while he gathers (plain steel head, no weapon glow); the off-hand and the rest of the kit stay.
 * Every pose that stands shares one aura (from the standing figure) so it does not jump between frames; sitting has its own and a ghost has none.
 */
export const gearHero = (look: Look, pose: Pose = 'stand'): { hero: Hero; aura?: Px; ring?: Px; motes?: Mote[] } => {
  const key = `${pose}|${JSON.stringify(look)}`
  let v = cache.get(key)
  if (v) return v
  const kit = kitFor(look)
  const tool = TOOL_POSES.includes(pose)
  if (tool && kit.ramps) delete kit.ramps.W
  const groups = slotLetters(look).filter(s => !(tool && s.kind === 'weapon')).map(s => ({ letters: s.letters, step: glowStep(s.piece?.plus ?? 0), kind: s.kind, metal: s.metal, diag: pose === 'swing' && s.kind === 'weapon' })).filter(s => s.step > 0)
  if (groups.length) kit.post = (px, f) => glowPass(px, f, groups)
  const hero = heroWith(pose, kit)
  const shape = pose === 'sit' || pose === 'rod' ? hero : pose === 'stand' ? hero : pose === 'dead' ? undefined : gearHero(look, 'stand').hero
  const layers = look.auras.length && shape ? auraLayers(shape.px, shape.feetX, look.auras) : undefined
  v = { hero, aura: layers?.glow, ring: layers?.ring, motes: layers?.motes }
  if (cache.size >= 64) cache.delete(cache.keys().next().value as string)
  cache.set(key, v)
  return v
}

// ---------- auras: light from behind H1, motes rising, a ring of light on the ground ----------
type AuraStyle = { rank: number; steps: [string, string, string]; grow: number; motes: string[]; ground: [string, string]; n: number }
const AURA: Record<AuraKind, AuraStyle> = {
  unique: { rank: 1, steps: [P.orange, P.amber, P.straw], grow: 3, motes: [P.orange, P.amber, P.straw], ground: [P.amber, P.cream], n: 4 },
  set2: { rank: 1, steps: [P.leaf, P.spring, P.sprout], grow: 3, motes: [P.leaf, P.spring, P.sprout], ground: [P.spring, P.sprout], n: 4 },
  set4: { rank: 2, steps: [P.leaf, P.mint, P.foam], grow: 4, motes: [P.spring, P.mint, P.foam], ground: [P.mint, P.foam], n: 6 },
  ancient: { rank: 3, steps: [P.gold, P.straw, P.cream], grow: 4, motes: [P.gold, P.straw, P.cream], ground: [P.gold, P.cream], n: 6 },
  primal: { rank: 4, steps: [P.coral, P.apricot, P.white], grow: 4, motes: [P.scarlet, P.white, P.cream, P.coral], ground: [P.coral, P.white], n: 9 },
}
export const AURA_PAD = 8
/** The glow oval is drawn at this opacity (SVG opacity on its image), so the sky and grass show through; the ground ring and motes stay full strength. */
export const AURA_ALPHA = 0.45
/** Half the width of his body and cape, the aura's width is measured from here, not from the sword and shield. */
const BODY_HALF = 7
/** A mote of light: where it starts in the aura layer, its color, whether it is a small cross, and how long it takes to rise (for the CSS). */
export type Mote = { x: number; y: number; c: string; big: boolean; delay: number; dur: number }
const bounds = (hero: Px) => {
  let x0 = hero.w, x1 = 0, y0 = hero.h, y1 = 0
  for (let y = 0; y < hero.h; y++) for (let x = 0; x < hero.w; x++) if (hero.get(x, y) !== undefined) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  return { x0, x1, y0, y1 }
}
/** What an aura is made of: the strongest kind sets the light, a set bonus adds its own color. */
const styleOf = (kinds: AuraKind[]) => {
  const main = [...kinds].sort((a, b) => AURA[b].rank - AURA[a].rank)[0]!
  const set = kinds.filter(k => k === 'set2' || k === 'set4').sort((a, b) => AURA[b].rank - AURA[a].rank)[0]
  return { main: AURA[main], set: set && set !== main ? AURA[set] : undefined, primal: main === 'primal' }
}
/**
 * The aura layer for a hero sprite, AURA_PAD pixels bigger on every side (draw it at hero x - AURA_PAD, hero y - AURA_PAD, behind him):
 * a tall oval of three solid tones, with a ring of light on the ground at his feet. The motes are separate so CSS can lift them.
 */
export const auraLayers = (hero: Px, feetX: number, kinds: AuraKind[]): { glow: Px; ring: Px; motes: Mote[] } => {
  const { main, set, primal } = styleOf(kinds)
  const { x0, x1, y0, y1 } = bounds(hero), W = hero.w + AURA_PAD * 2, H = hero.h + AURA_PAD * 2, glow = new Px(W, H), ground = new Px(W, H)
  const cx = feetX + AURA_PAD, cy = (y0 + y1) / 2 + AURA_PAD + 3
  const rx = BODY_HALF + main.grow, ry = (y1 - y0) / 2 + main.grow + 1
  const [c0, c1, c2] = main.steps
  const gy = y1 + AURA_PAD - 1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
    if (u > 1) continue
    // the oval ends where the ground ring begins: nothing of it hangs below the ring, the ring is its bottom edge
    if (y > gy && ((x - cx) / 13) ** 2 + ((y - gy) / 3.2) ** 2 > 0.62) continue
    glow.set(x, y, u > 0.8 ? (set ? set.steps[1] : c0) : u > 0.5 ? c1 : c2)
  }
  // the ring on the ground: an oval one pixel thick, a second wider one for primal and a set bonus of four
  const ring = (rx2: number, ry2: number, c: string) => {
    for (let y = Math.floor(gy - ry2) - 1; y <= gy + ry2 + 1; y++) for (let x = Math.floor(cx - rx2 - 1); x <= cx + rx2 + 1; x++) {
      const u = ((x - cx) / rx2) ** 2 + ((y - gy) / ry2) ** 2
      if (u <= 1 && u > 0.62 && x >= 0 && y >= 0 && x < W && y < H) ground.set(x, y, c)
    }
  }
  ring(13, 3.2, main.ground[0]); ring(9.5, 2.2, main.ground[1])
  if (primal) ring(6, 1.4, P.white)
  if (set) ring(13, 3.2, set.ground[1])
  // motes: a few spots clear of his body, spread over his height, each with its own delay and a slow rise
  const colors = [...main.motes, ...(set ? set.motes : [])]
  let seed = (kinds.reduce((a, k) => a + k.length, 0) + hero.w) * 2654435761 >>> 0
  const rnd = () => { seed = Math.imul(seed ^ (seed >>> 15), 2246822519) >>> 0; seed = Math.imul(seed ^ (seed >>> 13), 3266489917) >>> 0; return ((seed ^ (seed >>> 16)) >>> 0) / 4294967296 }
  const motes: Mote[] = []
  for (let tries = 0; motes.length < main.n + (set ? 2 : 0) && tries < 200; tries++) {
    const side = rnd() < 0.5 ? -1 : 1, x = Math.round(cx + side * (Math.max(feetX - x0, x1 - feetX) + 1 + rnd() * (main.grow - 1))), y = Math.round(y0 + AURA_PAD + 4 + rnd() * (y1 - y0 - 6))
    if (x < 3 || x >= W - 3 || y < 4 || y >= H - 4 || hero.get(x - AURA_PAD, y - AURA_PAD) !== undefined || motes.some(m => Math.abs(m.x - x) < 4 && Math.abs(m.y - y) < 6)) continue
    motes.push({ x, y, c: colors[motes.length % colors.length]!, big: motes.length % 3 === 0, delay: motes.length * 0.9, dur: 5 + rnd() * 3 })
  }
  return { glow, ring: ground, motes }
}
/** Paint the motes as they stand at one moment (the sheets, a still frame): a pixel each, a few as a small cross. */
export const paintMotes = (dst: Px, motes: Mote[], ox: number, oy: number) => {
  for (const m of motes) {
    dst.set(ox + m.x, oy + m.y, m.big ? P.white : m.c)
    if (m.big) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) dst.set(ox + m.x + dx, oy + m.y + dy, m.c)
  }
}

/** Which letters mark the pixels of a slot, for tests that check the invisible slots change nothing. */
export const VISIBLE_SLOTS: Slot[] = ['weapon', 'offhand', 'head', 'chest']
