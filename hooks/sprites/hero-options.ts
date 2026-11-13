// Hero look options for the task-18 comparison: ten candidate bodies, one gear pipeline. Nothing in the game imports this file;
// tools/render_hero_options.ts draws it. Every design is original. The gear library (hats, backs, shields, weapons, chest drawings)
// is reused as is, fitted to each body: pieces are drawn on the library's own canvas, then moved onto the body's anchors.
import { Cells, OUTLINE, TallCells, mix, pick, rng, shade } from './core'
import type { Part, Rect, Sprite } from './core'
import { BACKS } from './backs'
import { CHESTS, chestEmblem } from './chest'
import { CH, CRAB, CW, anchors, crabParts, shellAt } from './crab'
import { gearPal } from './gearpal'
import { putBack, putHat, putOff, putWeapon } from './gear'
import { OFFHANDS, WEAPONS } from './hands'
import { HATS } from './hats'

export type OptionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
export type HeroPose = 'stand' | 'attack' | 'sit'
export type Piece = { id: number; color: string }
export type GearSet = { name: string; head: Piece; chest: Piece; back: Piece; weapon: Piece; off: Piece; /** the left hand holds a second weapon, not a shield */ dual?: boolean }
export const OPTIONS: { id: OptionId; name: string; pitch: string }[] = [
  { id: 'A', name: 'FLAT CRAB FIXED', pitch: 'today crab, chest pieces only run across the shell' },
  { id: 'B', name: 'UPRIGHT CRAB KNIGHT', pitch: 'stands on back legs, shell is the torso, eye stalks are the head' },
  { id: 'C', name: 'HERMIT CRAB', pitch: 'small crab, the chest slot swaps its borrowed shell' },
  { id: 'D', name: 'CHIBI ADVENTURER', pitch: 'big-headed 16-bit humanoid, crimson scarf and hair' },
  { id: 'E', name: 'SLIME HERO', pitch: 'blue blob with pseudopod hands, armor is a band' },
  { id: 'F', name: 'FROG KNIGHT', pitch: 'upright frog, wide head, bulging eyes' },
  { id: 'G', name: 'CAT ADVENTURER', pitch: 'orange tabby, ears poke through helmets' },
  { id: 'H', name: 'CODE BOT', pitch: 'amber robot with a screen face, armor is plates' },
  { id: 'I', name: 'MUSHROOM FOLK', pitch: 'walking toadstool, the red cap is the head' },
  { id: 'J', name: 'DRAGON WHELP', pitch: 'violet baby dragon, wings are the back slot' },
]

const HH = 34
const cl = () => new Cells(CW, HH)
type Tri = { b: string; l: string; d: string }
const tri = (c: string): Tri => ({ b: c, l: shade(c, 0.3), d: shade(c, -0.3) })
const WHITE = '#ffffff'
const INK = OUTLINE

const ell = (c: Cells, cx: number, cy: number, rx: number, ry: number, col: string, hole = 0) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const q = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
    if (q <= 1 && q >= hole) c.put(x, y, col)
  }
}
/** A shaded ball: dark rim at the bottom and right, base color, a highlight up left. */
const ball = (c: Cells, cx: number, cy: number, rx: number, ry: number, p: Tri) => {
  ell(c, cx, cy, rx, ry, p.d)
  ell(c, cx - 0.5, cy - 0.5, rx - 0.5, ry - 0.5, p.b)
  ell(c, cx - rx * 0.38, cy - ry * 0.45, Math.max(1, rx * 0.3), Math.max(0.8, ry * 0.22), p.l)
}
const line = (c: Cells, x0: number, y0: number, x1: number, y1: number, t: number, col: string) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= n; i++) c.rect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t, t, col)
}
/** Copy the left half (x 0..14) onto the right half. */
const mir = (c: Cells) => {
  for (const [k, v] of [...c.m]) { const x = k % c.w; if (x < 15) c.put(c.w - 1 - x, Math.floor(k / c.w), v) }
  return c
}
const stamp = (dst: Cells, src: Cells) => { for (const [k, v] of src.m) dst.m.set(k, v) }
/** A box with a light left edge, dark right and bottom edges. */
const box = (c: Cells, x: number, y: number, w: number, h: number, p: Tri) => {
  c.rect(x, y, w, h, p.b); c.rect(x, y, 1, h, p.l); c.rect(x + w - 1, y, 1, h, p.d); c.rect(x, y + h - 1, w, 1, p.d)
}
const eye = (c: Cells, x: number, y: number) => { c.rect(x, y, 3, 3, WHITE); c.rect(x + 1, y + 1, 2, 2, INK) }

// ---- pieces: drawn on the library's canvas, then moved onto the body ----
const mv = (rs: Rect[], dx: number, dy: number): Rect[] => rs.map(([x, y, w, h, c]) => [x + dx, y + dy, w, h, c])
const hatRects = (p: Piece, y: number, w = 16, sy = 1): Rect[] => {
  const t = new Cells(CW, CH); putHat(t, p.id, p.color, 4, 0)
  if (w >= 16 && sy >= 1) return mv(t.rects(), 0, y - 11)
  // a narrower head: nearest-neighbour resample about the center line, bottom row kept on row y
  const o = new Cells(CW, 40), hw = Math.floor(w / 2)
  for (let r = 0; r < Math.ceil(12 * sy); r++) for (let x = 15 - hw; x < 15 + hw; x++) {
    const col = t.m.get((11 - Math.floor((r + 0.5) / sy)) * CW + Math.floor(15 + ((x + 0.5 - 15) * 16) / (2 * hw)))
    if (col !== undefined) o.put(x, 30 - r, col)
  }
  return mv(o.rects(), 0, y - 30)
}
const offRects = (p: Piece, at: readonly [number, number]): Rect[] => { const t = new Cells(CW, CH); putOff(t, p.id, p.color, [15, 14], 0); return mv(t.rects(), at[0] - 15, at[1] - 14) }
const weaponRects = (draw: (t: Cells) => void, at: readonly [number, number], flip = false): Rect[] => {
  const t = new TallCells(CW, CH, 14)
  draw(t)
  const rs = flip ? t.rects().map(([x, y, w, h, c]) => [27 - x - w, y, w, h, c] as Rect) : t.rects()
  return mv(rs, at[0] - 13, at[1] - 22)
}
/** The camp fishing rod: a pole in the hand, a line down to the ground and a bobber. */
const rodRects = (grip: readonly [number, number], foot: number): Rect[] => {
  const c = new Cells(CW + 10, 40)
  c.paint('.....W/....W./...W../..W.../.W@...', { W: '#94603a', '@': '#94603a' }, grip[0] - 2, grip[1] - 4)
  const x = grip[0] + 3
  c.rect(x, grip[1] - 4, 1, Math.max(1, foot - 2 - (grip[1] - 4)), '#e8e0d0'); c.rect(x - 1, foot - 2, 3, 1, '#e0443a'); c.rect(x, foot - 1, 1, 1, WHITE)
  return c.rects()
}
/** A cape or wings behind the body, from row `y`, narrowed by k so it frames this body instead of the crab's shell. */
const backRects = (p: Piece, y: number, k: number): Rect[] => {
  const t = new Cells(CW, CH)
  putBack(t, p.id, p.color, 0, 0)
  const o = new Cells(CW, 40)
  for (const [key, col] of t.m) {
    const x = key % CW
    if (x > 14) continue
    const dx = Math.round((14 - x) * k), ny = Math.floor(key / CW) + y - 9
    // nothing hangs below the feet or shows in the gap between the legs
    if (ny > 33 || (ny >= 30 && dx === 0)) continue
    o.put(14 - dx, ny, col); o.put(15 + dx, ny, col)
  }
  return o.rects()
}
/** A chest drawing fitted to a torso mask: the library's left half is resampled to the mask's box, then clipped to the mask. */
const torsoRects = (mask: Cells, p: Piece, from = 0): Rect[] => {
  let x0 = 99, y0 = 99, y1 = -1
  for (const k of mask.m.keys()) { x0 = Math.min(x0, k % CW); y0 = Math.min(y0, Math.floor(k / CW)); y1 = Math.max(y1, Math.floor(k / CW)) }
  if (y1 < 0) return []
  const s = pick(CHESTS, p.id), rows = s.r.split('/'), pal = gearPal(p.color)
  const hw = 15 - x0, th = y1 - y0 + 1
  const o = new Cells(CW, HH)
  // the whole torso is covered: item-colored cloth first, then the drawing's own pattern and outline over it
  for (const k of mask.m.keys()) o.m.set(k, shade(p.color, -0.18))
  for (let y = y0; y <= y1; y++) {
    const row = rows[Math.min(rows.length - 1, Math.floor(rows.length * (from + ((1 - from) * (y - y0)) / th)))] ?? ''
    for (let x = x0; x <= 14; x++) {
      const col = pal[row[Math.floor(((x - x0) * 8) / hw)] ?? '.']
      if (col === undefined) continue
      if (mask.m.has(y * CW + x)) o.put(x, y, col)
      if (mask.m.has(y * CW + 29 - x)) o.put(29 - x, y, col)
    }
  }
  const e = chestEmblem(s)
  if (e && th >= 6) {
    const em = new Cells(CW, HH).paint(e, pal, 12, y0 + Math.floor((th - 4) / 2))
    for (const [k, col] of em.m) { const x = k % CW, y = Math.floor(k / CW); if (mask.m.has(k)) o.put(x, y, col); if (mask.m.has(y * CW + 29 - x)) o.put(29 - x, y, col) }
  }
  return o.rects()
}

// ---- rigs: one function per body ----
type Rig = {
  under: Cells; shell?: Cells; legA: Cells; legB: Cells; body: Cells; armL: Cells; armR: Cells; face: Cells
  /** where a chest piece may paint; absent when the body draws the chest slot itself */
  torso?: Cells
  hatY: number; grip: [number, number]; hold: [number, number]; capeY: number; capeK: number
  /** the band skips the top of a chest drawing (collars, fur) and shows its body */
  band?: boolean
  /** hats are resampled to this width (16 is the library's own) and this height scale */
  hatW?: number; hatS?: number
  /** a second dark ring: the bold-outline look */
  bold?: boolean
}

const arms = (pose: HeroPose, d: number, sleeve: Tri, hand: Tri, ax = 8) => {
  const armL = cl(), armR = cl(), sy = 24 + d, r0 = 28 - ax
  let grip: [number, number], hold: [number, number]
  if (pose === 'attack') {
    line(armR, r0 + 1, sy + 1, r0 + 3, sy - 4, 2, sleeve.b); armR.rect(r0 + 2, sy - 6, 3, 3, hand.b); grip = [r0 + 3, sy - 5]
    line(armL, ax, sy + 1, ax - 2, sy + 3, 2, sleeve.b); armL.rect(ax - 4, sy + 3, 3, 3, hand.b); hold = [ax - 3, sy + 4]
  } else if (pose === 'sit') {
    line(armR, r0 + 1, sy + 1, r0 + 3, sy + 3, 2, sleeve.b); armR.rect(r0 + 2, sy + 3, 3, 3, hand.b); grip = [r0 + 3, sy + 4]
    armL.rect(ax, sy, 2, 4, sleeve.b); armL.rect(ax - 1, sy + 4, 3, 3, hand.b); hold = [ax, sy + 5]
  } else {
    armR.rect(r0, sy, 2, 4, sleeve.b); armR.rect(r0, sy + 4, 3, 3, hand.b); grip = [r0 + 1, sy + 5]
    armL.rect(ax, sy, 2, 4, sleeve.b); armL.rect(ax - 1, sy + 4, 3, 3, hand.b); hold = [ax, sy + 5]
  }
  return { armL, armR, grip, hold }
}
const legs = (pose: HeroPose, pants: Tri, boot: Tri, wide = 0) => {
  const a = cl(), b = cl()
  if (pose === 'sit') { a.rect(9 - wide, 32, 5 + wide, 2, boot.b); b.rect(16, 32, 5 + wide, 2, boot.b) }
  else {
    a.rect(11 - wide, 30, 3 + wide, 2, pants.b); a.rect(10 - wide, 32, 4 + wide, 2, boot.b); a.rect(10 - wide, 33, 4 + wide, 1, boot.d)
    b.rect(16, 30, 3 + wide, 2, pants.b); b.rect(16, 32, 4 + wide, 2, boot.b); b.rect(16, 33, 4 + wide, 1, boot.d)
  }
  return { legA: a, legB: b }
}
const maskRect = (x: number, y: number, w: number, h: number) => { const m = cl(); m.rect(x, y, w, h, '#000000'); return m }

const chibi = (pose: HeroPose): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const skin = tri('#f2c49b'), hair = tri('#d03a2c'), tunic = tri('#3f6fc0'), pants = tri('#383465'), boot = tri('#6b4526')
  const body = cl(), face = cl()
  ball(body, 15, 16 + d, 7, 6, skin)
  for (let y = 10 + d; y <= 13 + d; y++) for (let x = 8; x <= 21; x++) if (body.m.has(y * CW + x)) body.put(x, y, y === 10 + d ? hair.l : hair.b)
  for (let x = 9; x <= 20; x++) if (x % 3 !== 1) body.put(x, 14 + d, hair.b)
  for (const x of [8, 9, 20, 21]) for (let y = 14 + d; y <= 18 + d; y++) if (body.m.has(y * CW + x)) body.put(x, y, y > 16 + d ? hair.d : hair.b)
  eye(face, 10, 16 + d); eye(face, 17, 16 + d)
  face.put(9, 19 + d, '#f08a80'); face.put(20, 19 + d, '#f08a80'); face.rect(14, 20 + d, 2, 1, '#9a3a2a')
  face.rect(11, 22 + d, 8, 2, hair.b); face.rect(11, 23 + d, 8, 1, hair.d); face.rect(17, 24 + d, 2, 4, hair.b); face.rect(17, 27 + d, 2, 1, hair.d)
  box(body, 10, 24 + d, 10, 6, tunic); body.rect(10, 28 + d, 10, 1, boot.b); body.rect(14, 28 + d, 2, 1, '#f2c94c')
  const a = arms(pose, d, tunic, skin)
  return { under: cl(), ...legs(pose, pants, boot), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 24 + d, 10, 6), hatY: 13 + d, grip: a.grip, hold: a.hold, capeY: 22 + d, capeK: 0.9 }
}

const frog = (pose: HeroPose): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const g = tri('#62bd45'), belly = tri('#eaf4b4'), dark = '#2e5a22'
  const body = cl(), face = cl()
  ball(body, 15, 17 + d, 8, 5, g)
  body.rect(9, 19 + d, 12, 1, dark); body.put(8, 18 + d, dark); body.put(21, 18 + d, dark)
  body.rect(12, 20 + d, 6, 2, belly.b); body.put(13, 17 + d, dark); body.put(16, 17 + d, dark)
  box(body, 10, 22 + d, 10, 8, g)
  ball(face, 9.5, 12 + d, 2.5, 2.5, g); ball(face, 20.5, 12 + d, 2.5, 2.5, g)
  eye(face, 8, 10 + d); eye(face, 19, 10 + d)
  const a = arms(pose, d, g, tri('#4f9d3a'))
  return { under: cl(), ...legs(pose, g, tri('#3f8a35'), 1), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 22 + d, 10, 8), hatY: 13 + d, grip: a.grip, hold: a.hold, capeY: 21 + d, capeK: 0.9 }
}

const cat = (pose: HeroPose): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const f = tri('#ee9a3c'), cream = '#fbe6c4', stripe = '#a85a18'
  const body = cl(), face = cl(), under = cl()
  ball(body, 15, 16 + d, 7, 6, f)
  for (const x of [8, 9, 20, 21]) { body.put(x, 17 + d, stripe); body.put(x, 19 + d, stripe) }
  ell(body, 15, 20 + d, 3.2, 2.2, cream)
  body.rect(14, 19 + d, 2, 1, '#f07a8a'); body.put(14, 21 + d, stripe); body.put(15, 21 + d, stripe)
  face.paint('.b../.bb./bpb./bbbb', { b: f.b, p: '#f08aa0' }, 8, 8 + d)
  face.put(8, 11 + d, f.d)
  mir(face)
  for (const x of [10, 17]) { face.rect(x, 16 + d, 3, 3, '#d8f25a'); face.rect(x + 1, 16 + d, 1, 3, INK) }
  for (const [x, y, w] of [[3, 19, 4], [4, 21, 3]] as const) { face.rect(x, y + d, w, 1, '#f6efe0'); face.rect(30 - x - w, y + d, w, 1, '#f6efe0') }
  line(under, 20, 28 + d, 24, 28 + d, 2, f.b); line(under, 24, 28 + d, 25, 22 + d, 2, f.b); under.rect(25, 21 + d, 2, 2, cream)
  box(body, 10, 22 + d, 10, 8, f)
  const a = arms(pose, d, f, tri(cream))
  return { under, ...legs(pose, f, tri(cream)), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 22 + d, 10, 8), hatY: 13 + d, grip: a.grip, hold: a.hold, capeY: 21 + d, capeK: 0.9 }
}

const robot = (pose: HeroPose): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const am = tri('#f0b429'), steel = tri('#9aa4b2'), screen = '#10202c', glow = '#62e6f2'
  const body = cl(), face = cl(), under = cl()
  box(body, 8, 10 + d, 14, 12, am)
  for (const [x, y] of [[8, 10], [21, 10], [8, 21], [21, 21]] as const) body.put(x, y + d, undefined)
  body.rect(10, 13 + d, 10, 8, screen); body.rect(6, 14 + d, 2, 4, steel.b); body.rect(22, 14 + d, 2, 4, steel.b)
  face.rect(11, 15 + d, 2, 3, glow); face.rect(17, 15 + d, 2, 3, glow); face.rect(13, 19 + d, 4, 1, '#2aa6b4')
  under.rect(14, 5 + d, 2, 5, steel.b); under.rect(14, 3 + d, 2, 2, '#e0443a')
  body.rect(13, 22 + d, 4, 1, steel.d); box(body, 10, 23 + d, 10, 7, am)
  const a = arms(pose, d, steel, tri('#5a6472'))
  return { under, ...legs(pose, steel, tri('#c98f1e')), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 23 + d, 10, 7), hatY: 13 + d, grip: a.grip, hold: a.hold, capeY: 22 + d, capeK: 0.9 }
}

const mushroom = (pose: HeroPose): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const red = tri('#e0452d'), stalk = tri('#f1e2c4'), boot = tri('#8a5a32')
  const body = cl(), face = cl()
  ball(body, 15, 15 + d, 9, 9, red)
  for (let y = 16 + d; y < HH; y++) for (let x = 0; x < CW; x++) body.put(x, y, undefined)
  body.rect(7, 16 + d, 16, 1, '#7a2118')
  for (const [x, y, w, h] of [[8, 13, 2, 2], [20, 13, 2, 2], [12, 12, 2, 2], [17, 14, 2, 1]] as const) body.rect(x, y + d, w, h, '#fff3e0')
  box(body, 10, 17 + d, 10, 5, stalk)
  for (const [x, y] of [[10, 17], [19, 17]] as const) body.put(x, y + d, undefined)
  for (const x of [11, 17]) { face.rect(x, 18 + d, 2, 3, INK); face.put(x, 18 + d, WHITE) }
  face.put(10, 20 + d, '#f08a80'); face.put(19, 20 + d, '#f08a80'); face.rect(14, 21 + d, 2, 1, '#9a5a3a')
  box(body, 11, 22 + d, 8, 8, stalk)
  const a = arms(pose, d, stalk, tri('#e8d3ae'), 9)
  return { under: cl(), ...legs(pose, stalk, boot), body, face, armL: a.armL, armR: a.armR, torso: maskRect(11, 22 + d, 8, 8), hatY: 10 + d, grip: a.grip, hold: a.hold, capeY: 21 + d, capeK: 0.85 }
}

const dragon = (pose: HeroPose): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const v = tri('#8e5bd8'), belly = tri('#f3d98c'), horn = '#d8c8a0'
  const body = cl(), face = cl(), under = cl(), fr = cl()
  line(under, 8, 11 + d, 7, 8 + d, 2, horn); under.put(6, 7 + d, horn)
  under.paint('..w/.ww/www/.ww', { w: v.l }, 5, 19 + d); mir(under)
  line(under, 20, 28 + d, 24, 29 + d, 2, v.b); line(under, 24, 29 + d, 26, 25 + d, 2, v.b); under.rect(26, 23 + d, 2, 3, horn)
  ball(body, 15, 16 + d, 7, 6, v)
  fr.paint('..S/.SS/SS.', { S: v.d }, 5, 15 + d); mir(fr); stamp(body, fr)
  body.rect(12, 19 + d, 6, 3, belly.b); body.rect(12, 21 + d, 6, 1, belly.d); body.put(13, 19 + d, '#3a2160'); body.put(16, 19 + d, '#3a2160')
  for (const x of [10, 17]) { face.rect(x, 16 + d, 3, 3, '#ffd23f'); face.rect(x + 1, 16 + d, 1, 3, INK) }
  box(body, 10, 22 + d, 10, 8, v); body.rect(12, 23 + d, 6, 6, belly.b); for (const y of [24, 26, 28]) body.rect(12, y + d, 6, 1, belly.d)
  const a = arms(pose, d, v, tri('#6a3fb0'))
  return { under, ...legs(pose, v, tri('#5b3a9e')), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 22 + d, 10, 8), hatY: 13 + d, grip: a.grip, hold: a.hold, capeY: 21 + d, capeK: 0.9 }
}

const slime = (pose: HeroPose): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const s = tri('#3fb4ea'), top = 15 + d
  const body = cl(), face = cl(), armL = cl(), armR = cl()
  body.rect(7, 31, 16, 3, s.d)
  ball(body, 15, (top + 34) / 2, 9, (34 - top) / 2, s)
  body.put(10, top + 3, WHITE); body.put(11, top + 3, WHITE); body.put(10, top + 4, WHITE)
  eye(face, 10, top + 7); eye(face, 17, top + 7)
  face.rect(13, top + 12, 4, 1, '#16526f'); face.put(12, top + 11, '#16526f'); face.put(17, top + 11, '#16526f')
  const torso = cl()
  for (let y = top + 12; y <= top + 16; y++) for (let x = 8; x <= 21; x++) if (body.m.has(y * CW + x)) torso.put(x, y, '#000000')
  let grip: [number, number], hold: [number, number]
  if (pose === 'attack') { line(armR, 22, top + 11, 24, top + 6, 3, s.b); ball(armR, 25, top + 4, 2.5, 2.5, s); grip = [25, top + 4]; ball(armL, 5, top + 11, 2.5, 2.5, s); hold = [5, top + 11] }
  else if (pose === 'sit') { ball(armR, 24, top + 10, 2.5, 2.5, s); grip = [24, top + 10]; ball(armL, 6, top + 10, 2.5, 2.5, s); hold = [5, top + 10] }
  else { ball(armR, 24, top + 12, 2.5, 2.5, s); grip = [24, top + 12]; ball(armL, 6, top + 12, 2.5, 2.5, s); hold = [5, top + 12] }
  return { under: cl(), legA: cl(), legB: cl(), body, face, armL, armR, torso, hatY: top + 2, grip, hold, capeY: top + 5, capeK: 0.85, band: true }
}

const CLAW = '.oo.oo./obbobbo/obllbbo/obbbbbo/.obbbo./..ooo..'
const CLAW_OPEN = 'oo...oo/obo.obo/obbobbo/obllbbo/.obbbo./..ooo..'
const clawPal = { o: CRAB.o, b: CRAB.b, l: CRAB.l, d: CRAB.d }
const upright = (pose: HeroPose): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const c = tri(CRAB.b), body = cl(), face = cl(), armL = cl(), armR = cl(), legA = cl(), legB = cl()
  box(body, 10, 15 + d, 10, 6, c)
  for (const [x, y] of [[10, 15], [19, 15], [10, 20], [19, 20]] as const) body.put(x, y + d, undefined)
  for (const [x, y] of [[13, 19], [14, 20], [15, 20], [16, 19]] as const) body.put(x, y + d, CRAB.o)
  body.put(10, 18 + d, '#f58a6a'); body.put(19, 18 + d, '#f58a6a')
  for (const x of [11, 18]) face.put(x, 14 + d, c.d)
  eye(face, 10, 11 + d); eye(face, 17, 11 + d)
  ball(body, 15, 26 + d, 7, 5, c)
  body.rect(11, 22 + d, 8, 1, c.l)
  for (const [x, y] of [[9, 25], [10, 28], [20, 28], [19, 25]] as const) body.put(x, y + d, c.d)
  const open = pose === 'attack'
  armL.paint(CLAW, clawPal, 2, 23 + d)
  let ry = 23 + d
  if (open) { line(armR, 21, 25, 23, 21, 2, c.d); ry = 16 }
  armR.paint(open ? CLAW_OPEN : CLAW, clawPal, 21, ry)
  if (pose === 'sit') { legA.rect(9, 33, 3, 1, c.d); legB.rect(18, 33, 3, 1, c.d) }
  else {
    legA.rect(11, 31, 3, 3, c.d); legA.rect(10, 33, 4, 1, CRAB.o); line(legA, 7, 29, 4, 32, 1, c.d)
    legB.rect(16, 31, 3, 3, c.d); legB.rect(16, 33, 4, 1, CRAB.o); line(legB, 22, 29, 25, 32, 1, c.d)
  }
  const torso = cl()
  for (let y = 22 + d; y <= 29 + d; y++) for (let x = 9; x <= 20; x++) if (body.m.has(y * CW + x) && body.m.has((y + 1) * CW + x) && body.m.has(y * CW + x - (x < 15 ? 1 : -1))) torso.put(x, y, '#000000')
  return { under: cl(), legA, legB, body, face, armL, armR, torso, hatY: 14 + d, grip: [24, ry + 3], hold: [5, 26 + d], capeY: 21 + d, capeK: 0.9 }
}

/** The hermit's borrowed shell: the chest slot picks one of six, in the piece's color. */
const SHELLS = ['spiral', 'pot', 'teapot', 'helmet', 'skull', 'chest'] as const
const hermitShell = (p: Piece | undefined, d: number): Cells => {
  const c = cl(), k = SHELLS[(p?.id ?? 0) % SHELLS.length], col = tri(p?.color ?? '#b98a5a')
  const y = (n: number) => n + d
  if (k === 'spiral') {
    ball(c, 15, y(15), 7, 7, col)
    for (const [x, yy] of [[15, 15], [16, 15], [16, 14], [15, 13], [14, 13], [12, 14], [12, 16], [13, 18], [15, 19], [17, 18], [18, 16], [18, 13], [16, 11], [13, 10], [10, 12], [9, 16]] as const) c.put(x, y(yy), col.d)
  } else if (k === 'pot') {
    ball(c, 15, y(16), 7, 6, tri('#4a4a58'))
    c.rect(9, y(9), 12, 2, '#8a8a9c'); c.rect(10, y(9), 10, 1, '#6fd04a'); c.rect(7, y(11), 2, 3, '#4a4a58'); c.rect(21, y(11), 2, 3, '#4a4a58')
    c.rect(11, y(13), 2, 2, col.b); c.rect(17, y(14), 2, 2, col.b)
  } else if (k === 'teapot') {
    ball(c, 15, y(16), 7, 6, col)
    c.rect(13, y(8), 4, 2, col.d); c.rect(14, y(7), 2, 1, col.l)
    line(c, 21, y(14), 25, y(10), 2, col.b); ell(c, 7, y(15), 2.8, 3.6, col.d, 0.3)
  } else if (k === 'helmet') {
    ball(c, 15, y(15), 7, 7, col)
    c.rect(9, y(14), 12, 2, INK); c.rect(14, y(6), 2, 4, '#e0443a'); c.rect(14, y(16), 2, 4, col.d)
  } else if (k === 'skull') {
    ball(c, 15, y(15), 7, 6, tri('#efe6d0'))
    c.rect(9, y(13), 3, 3, INK); c.rect(18, y(13), 3, 3, INK); c.rect(14, y(16), 2, 2, INK)
    for (let x = 10; x <= 19; x += 2) c.rect(x, y(19), 1, 2, INK)
  } else {
    c.rect(8, y(12), 14, 10, col.d); c.rect(8, y(12), 14, 9, col.b); ell(c, 15, y(12), 7, 4, col.b); c.rect(8, y(16), 14, 1, '#f2c94c'); c.rect(14, y(8), 2, 14, '#f2c94c'); c.rect(14, y(15), 2, 3, '#a47e1c')
    c.rect(8, y(12), 1, 10, '#f2c94c'); c.rect(21, y(12), 1, 10, '#f2c94c')
  }
  return c
}
const hermit = (pose: HeroPose, g?: GearSet): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const c = tri(CRAB.b), body = cl(), face = cl(), armL = cl(), armR = cl(), legA = cl(), legB = cl()
  ball(body, 15, 27 + d, 6, 3.4, c)
  for (const [x, y] of [[13, 27], [14, 28], [15, 28], [16, 27]] as const) body.put(x, y + d, CRAB.o)
  for (const x of [11, 18]) face.rect(x, 21 + d, 1, 3, c.d)
  eye(face, 10, 18 + d); eye(face, 17, 18 + d)
  armL.paint(CLAW, clawPal, 2, 24 + d)
  let ry = 24 + d
  if (pose === 'attack') { line(armR, 20, 27, 22, 22, 2, c.d); ry = 17 }
  armR.paint(pose === 'attack' ? CLAW_OPEN : CLAW, clawPal, 22, ry)
  if (pose !== 'sit') for (const x of [9, 11, 13]) { legA.rect(x, 30, 1, 3, c.d); legB.rect(29 - x, 30, 1, 3, c.d) }
  else { legA.rect(9, 33, 3, 1, c.d); legB.rect(18, 33, 3, 1, c.d) }
  return { under: cl(), shell: hermitShell(g?.chest, d), legA, legB, body, face, armL, armR, hatY: 10 + d, grip: [25, ry + 3], hold: [5, 27 + d], capeY: 17 + d, capeK: 0.95 }
}

const RIGS: Partial<Record<OptionId, (pose: HeroPose, g?: GearSet) => Rig>> = { B: upright, C: hermit, D: chibi, E: slime, F: frog, G: cat, H: robot, I: mushroom, J: dragon }

// ---- the dark ring around the whole geared hero, as the crab has ----
const ringPart = (parts: Part[]): Part => {
  const occ = new Set<number>(), key = (x: number, y: number) => (y + 40) * 200 + x + 20
  for (const p of parts) for (const [x, y, w, h] of p.rects) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) occ.add(key(x + i, y + j))
  const rows = new Map<number, Set<number>>()
  for (const p of parts) for (const [x, y, w, h] of p.rects) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const xx = x + i + dx, yy = y + j + dy
      if (occ.has(key(xx, yy))) continue
      const row = rows.get(yy) ?? new Set<number>()
      row.add(xx); rows.set(yy, row)
    }
  }
  const rects: Rect[] = []
  for (const [y, xs] of rows) {
    const sorted = [...xs].sort((a, b) => a - b)
    let s = sorted[0] ?? 0, prev = s
    for (let i = 1; i <= sorted.length; i++) {
      const v = sorted[i]
      if (v === prev + 1) { prev = v; continue }
      rects.push([s, y, prev - s + 1, 1, OUTLINE])
      if (v === undefined) break
      s = v; prev = v
    }
  }
  return { rects }
}
const finish = (parts: Part[], foot: number, bold = false): Sprite => {
  const live = parts.filter(p => p.rects.length > 0)
  const ring = ringPart(live)
  if (!bold) return { w: CW, h: HH, foot, parts: [ring, ...live] }
  const outer = ringPart([ring, ...live])
  // the outer ring stays off the ground row, so the feet still stand on it
  return { w: CW, h: HH, foot, parts: [{ rects: [...outer.rects.filter(r => r[1] <= foot), ...ring.rects] }, ...live] }
}

// ---- A: today's crab with chest pieces that only run across the shell ----
type FlatStyle = 'collar' | 'pauldrons' | 'belt'
const FLAT: Record<string, FlatStyle> = { sash: 'collar', collar: 'collar', apron: 'belt', plate: 'belt', belt: 'belt', pauldrons: 'pauldrons' }
const FLAT_TOP: Record<FlatStyle, number> = { collar: 1, pauldrons: 2, belt: 7 }
const inFlat = (st: FlatStyle, x: number, r: number) => {
  const f = Math.min(x, 29 - x)
  if (st === 'collar') return r >= 1 && r <= 3
  if (st === 'pauldrons') return r >= 2 && r <= 5 && f <= 11
  return r === 8 || (r === 7 && f <= 11)
}
const putChestFlat = (c: Cells, p: Piece, by: number) => {
  const s = pick(CHESTS, p.id), pal = gearPal(p.color), shell = shellAt(by), top = 10 + by
  const st = FLAT[s.st] ?? 'belt'
  const rows = s.r.split('/')
  const u = new Cells(CW, CH)
  for (const [k, ch] of shell) {
    const x = k % CW, r = Math.floor(k / CW) - top
    if (ch === 'o' || !inFlat(st, x, r)) continue
    const row = rows[Math.min(rows.length - 1, Math.max(0, r - FLAT_TOP[st]))] ?? ''
    u.m.set(k, pal[row[Math.min(7, Math.max(0, 14 - Math.min(x, 29 - x)))] ?? 'M'] ?? p.color)
  }
  for (const k of [...u.m.keys()]) { const below = k + CW; if (shell.has(below) && shell.get(below) !== 'o' && !u.m.has(below)) u.m.set(k, shade(u.m.get(k) ?? p.color, -0.35)) }
  const rim = mix(CRAB.o, p.color, 0.45)
  for (const [k, ch] of shell) if (ch === 'o') u.m.set(k, rim)
  stamp(c, u)
}
const crabFlat = (pose: HeroPose, g?: GearSet): Sprite => {
  const ap = anchors(pose)
  const sp = crabParts({ pose, trim: '#4aa3ff' }, {
    // a cape never shows below the shell between the legs
    back: g ? c => { const t = new Cells(CW, CH); putBack(t, g.back.id, g.back.color, ap.by, 0); for (const [k, v] of t.m) { const x = k % CW; if (!(x >= 11 && x <= 18 && Math.floor(k / CW) > 19 + ap.by)) c.m.set(k, v) } } : undefined,
    chest: g ? c => putChestFlat(c, g.chest, ap.by) : undefined,
    head: g ? c => putHat(c, g.head.id, g.head.color, ap.by, 0) : undefined,
    off: g && pose !== 'sit' && !g.dual ? c => putOff(c, g.off.id, g.off.color, ap.hold, 0) : undefined,
    weapon: pose !== 'sit' && g ? (c: Cells) => putWeapon(c, g.weapon.id, g.weapon.color, ap.grip, 0) : undefined,
  })
  const parts = sp.parts
  if (pose === 'sit') parts.push({ cls: 'wpn', rects: rodRects(ap.grip, 27) })
  if (g?.dual && pose !== 'sit') parts.push({ cls: 'off', rects: weaponRects(t => putWeapon(t, g.off.id, g.off.color, [13, 22], 0), ap.hold, true) })
  return finish(parts, 27)
}

// ---- task-19: standard adventurer variants V1 to V8, with random looks (identity is random, D25) ----
export type AdvId = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8'
export type HeroId = OptionId | AdvId
export const ADVENTURERS: { id: AdvId; name: string; pitch: string }[] = [
  { id: 'V1', name: 'CHIBI POLISHED', pitch: 'two heads tall, brows and a jaw, scarf' },
  { id: 'V2', name: 'CLASSIC 16-BIT', pitch: 'three heads tall JRPG adventurer, satchel strap' },
  { id: 'V3', name: 'ACTION ARPG', pitch: 'four heads tall, broad shoulders, small head' },
  { id: 'V4', name: 'HOODED WANDERER', pitch: 'face in shadow, bright eyes, gear on the cloak' },
  { id: 'V5', name: 'STOCKY DWARF', pitch: 'wide body, big beard, short legs' },
  { id: 'V6', name: 'LANKY ELF', pitch: 'tall and thin, long ears through any helmet' },
  { id: 'V7', name: 'BOLD CARTOON', pitch: 'thick outline, flat bright colors, big eyes' },
  { id: 'V8', name: 'SCARF RUNNER', pitch: 'wildcard: bold outline, long scarf trailing behind' },
]
export const isAdv = (id: HeroId): id is AdvId => id.startsWith('V')

/** The random identity a hero is born with: skin, hair (color and style), eyes, one face detail, an accent for scarf or hood. */
export type HeroLook = { skin: string; hair: string; style: number; eyes: string; detail: number; accent: string }
export const SKINS = ['#fbe0c8', '#f2c49b', '#e3a878', '#c98a5a', '#a86e44', '#8a5634', '#6a3f24', '#4f2e1c']
export const HAIRS = ['#2a2230', '#4e3324', '#7a4a2a', '#a8452a', '#d0482c', '#e8862e', '#e8c45a', '#ece4c8', '#a8a8bc', '#3f6ad8', '#3aa060', '#e86aa8', '#8a4ad0', '#ffffff']
export const IRISES = ['#6b3f22', '#3a7ad8', '#3aa060', '#8a6a2a', '#7a8a9a', '#8a4ad0', '#d0a020', '#c03030']
export const ACCENTS = ['#d0342c', '#e8862e', '#f2c94c', '#3aa060', '#2fa8c8', '#3f6ad8', '#8a4ad0', '#e86aa8', '#e8e0d0', '#2a2a3a']
export const HAIR_STYLES = ['spiky', 'swept', 'bob', 'ponytail', 'long', 'buzz', 'curly', 'topknot', 'mohawk', 'braid'] as const
export const DETAILS = ['none', 'freckles', 'scar', 'eyepatch', 'stubble', 'bandage', 'blush', 'warpaint'] as const
const DEFAULT_LOOK: Record<AdvId, HeroLook> = {
  V1: { skin: '#f2c49b', hair: '#7a4a2a', style: 0, eyes: '#3a7ad8', detail: 0, accent: '#d0342c' },
  V2: { skin: '#e3a878', hair: '#4e3324', style: 1, eyes: '#6b3f22', detail: 0, accent: '#3aa060' },
  V3: { skin: '#e3a878', hair: '#2a2230', style: 1, eyes: '#3a7ad8', detail: 2, accent: '#d0342c' },
  V4: { skin: '#e3a878', hair: '#4a5a44', style: 0, eyes: '#62e6f2', detail: 0, accent: '#3e5478' },
  V5: { skin: '#e3a878', hair: '#d0482c', style: 0, eyes: '#3a7ad8', detail: 0, accent: '#8a6a2a' },
  V6: { skin: '#f2c49b', hair: '#e8c45a', style: 4, eyes: '#3aa060', detail: 0, accent: '#3aa060' },
  V7: { skin: '#f2c49b', hair: '#e8862e', style: 0, eyes: '#3a7ad8', detail: 0, accent: '#3aa060' },
  V8: { skin: '#e3a878', hair: '#2a2230', style: 0, eyes: '#6b3f22', detail: 0, accent: '#2fa8c8' },
}
export const defaultLook = (id: AdvId): HeroLook => DEFAULT_LOOK[id]
export const randomLook = (seed: number): HeroLook => {
  const r = rng(seed * 7919 + 13), at = <T>(a: readonly T[]) => pick(a, Math.floor(r() * a.length))
  return { skin: at(SKINS), hair: at(HAIRS), style: Math.floor(r() * HAIR_STYLES.length), eyes: at(IRISES), detail: Math.floor(r() * DETAILS.length), accent: at(ACCENTS) }
}
const GEAR_COLORS = ['#b8c4d8', '#c0392b', '#7a4ad0', '#f2c94c', '#4a8a5a', '#8a6a44', '#2f5aa8', '#e0902a', '#ffffff', '#3a3a52', '#e86aa8', '#5ee0ea']
/** A random full set from the whole library, as two players might roll. */
export const randomGear = (seed: number): GearSet => {
  const r = rng(seed * 104729 + 7), n = (k: number) => Math.floor(r() * k), c = () => pick(GEAR_COLORS, n(GEAR_COLORS.length))
  const dual = r() < 0.15
  return { name: `Random ${seed}`, head: { id: n(HATS.length), color: c() }, chest: { id: n(CHESTS.length), color: c() }, back: { id: n(BACKS.length), color: c() },
    weapon: { id: n(WEAPONS.length), color: c() }, off: { id: n(dual ? WEAPONS.length : OFFHANDS.length), color: c() }, dual }
}

type Head = { x0: number; x1: number; top: number; bot: number }
/** A rounded box head with a dark right edge and chin. */
const headAt = (c: Cells, top: number, hw: number, h: number, skin: Tri): Head => {
  const x0 = 15 - hw, x1 = 14 + hw, bot = top + h - 1
  c.rect(x0, top, 2 * hw, h, skin.b)
  c.rect(x1, top + 1, 1, h - 1, skin.d); c.rect(x0 + 1, bot, 2 * hw - 2, 1, skin.d)
  for (const [x, y] of [[x0, top], [x1, top], [x0, bot], [x1, bot]] as const) c.put(x, y, undefined)
  if (hw >= 6) for (const [x, y] of [[x0 + 1, top], [x1 - 1, top], [x0, top + 1], [x1, top + 1], [x0, bot - 1], [x1, bot - 1], [x0 + 1, bot], [x1 - 1, bot]] as const) c.put(x, y, undefined)
  return { x0, x1, top, bot }
}
/** Hair in one of ten styles, sized to the head: `back` goes behind the head and body, `front` over the head. */
const hairOn = (back: Cells, front: Cells, h: Head, style: number, col: string, ey: number) => {
  const t = tri(col), { x0, x1, top, bot } = h, w = x1 - x0 + 1
  const s = pick(HAIR_STYLES, style)
  const cap = Math.max(2, Math.round((ey - top) * 0.5))
  const fringe = top + cap
  if (s === 'buzz') {
    for (let x = x0 + 1; x <= x1 - 1; x++) { front.put(x, top, t.d); front.put(x, top + 1, mix(t.d, '#000000', 0.1)) }
    front.put(x0, top + 1, t.d); front.put(x1, top + 1, t.d); front.put(x0, top + 2, t.d); front.put(x1, top + 2, t.d)
    return
  }
  if (s === 'curly') { ell(back, 15, top + cap - 1, w / 2 + 3, cap + 3.5, t.d); for (let x = x0 - 2; x <= x1 + 2; x += 2) { back.put(x, top - 3, t.b); back.put(x + 1, top - 2, t.b) } }
  if (s === 'long') { back.rect(x0 - 2, top + 1, w + 4, bot + 5 - top, t.d); back.rect(x0 - 2, bot + 5, 3, 1, t.b); back.rect(x1, bot + 5, 3, 1, t.b) }
  if (s === 'bob') back.rect(x0 - 2, top + 1, w + 4, bot - top, t.d)
  // the cap: one row narrower on top, one wider each side below (volume)
  front.rect(x0 + 1, top - 1, w - 2, 1, t.b)
  front.rect(x0, top, w, 1, t.b)
  if (cap > 1) front.rect(x0 - 1, top + 1, w + 2, cap - 1, t.b)
  for (let x = x0 + 2; x <= x0 + Math.max(3, Math.floor(w / 3)); x++) front.put(x, top, t.l)
  front.put(x0 + 1, top + 1, t.l)
  // sideburns down to the eyes
  for (let y = fringe; y < ey; y++) { front.put(x0 - 1, y, t.d); front.put(x0, y, t.b); front.put(x1, y, t.b); front.put(x1 + 1, y, t.d) }
  if (s === 'spiky') {
    for (let x = x0; x <= x1; x++) if ((x - x0) % 3 !== 2) front.put(x, fringe, t.b)
    for (let x = x0; x <= x1 - 1; x += 3) { front.put(x, top - 2, t.b); front.put(x + 1, top - 2, t.b); front.put(x + 1, top - 3, t.l) }
    front.put(x0 - 2, top + 1, t.b); front.put(x1 + 2, top + 1, t.b)
  } else if (s === 'swept' || s === 'braid') {
    for (let x = x0; x <= x0 + Math.round(w * 0.65); x++) front.put(x, fringe, t.b)
    for (let x = x0; x <= x0 + Math.round(w * 0.3); x++) front.put(x, fringe + 1, t.d)
    if (s === 'braid') { for (let y = fringe; y <= bot + 6; y++) back.rect(x0 - 3 + (y % 2), y, 2, 1, y % 2 ? t.b : t.d); back.rect(x0 - 3, bot + 7, 3, 1, '#e0443a') }
  } else if (s === 'bob') {
    for (let x = x0; x <= x1; x++) front.put(x, fringe, t.b)
    for (let y = fringe; y <= bot - 1; y++) { front.put(x0 - 2, y, t.d); front.put(x0 - 1, y, t.b); front.put(x0, y, t.d); front.put(x1, y, t.d); front.put(x1 + 1, y, t.b); front.put(x1 + 2, y, t.d) }
  } else if (s === 'ponytail') {
    for (let x = x0; x <= x1; x += 2) front.put(x, fringe, t.b)
    // the tail hangs at the back of the head, which is the left side (the hero faces right)
    back.rect(x0 - 3, top, 3, 3, t.b); back.rect(x0 - 4, top + 3, 3, cap + 4, t.b); back.rect(x0 - 4, top + 3, 1, cap + 4, t.d); back.rect(x0 - 3, top + 2, 2, 1, '#e0443a')
  } else if (s === 'long') {
    for (let x = x0; x <= x1; x++) if (x !== 14 && x !== 15) front.put(x, fringe, t.b)
    for (let y = fringe; y <= bot + 3; y++) { front.put(x0 - 1, y, t.b); front.put(x1 + 1, y, t.b) }
  } else if (s === 'curly') {
    for (let x = x0; x <= x1; x++) if (x % 2 === 0) front.put(x, fringe, t.b)
  } else if (s === 'topknot') {
    for (let x = x0; x <= x1; x += 3) front.put(x, fringe, t.b)
    front.rect(12, top - 5, 6, 4, t.b); front.put(12, top - 5, undefined); front.put(17, top - 5, undefined); front.rect(13, top - 5, 2, 1, t.l); front.rect(13, top - 1, 4, 1, '#e0443a')
  } else if (s === 'mohawk') {
    for (let y = top - 1; y < fringe; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (front.m.has(y * CW + x)) front.put(x, y, t.d)
    front.rect(13, top - 5, 4, cap + 4, t.b); front.rect(13, top - 5, 1, cap + 4, t.l); front.rect(12, top - 3, 6, 1, t.b)
  }
}
/** Two small ears at the head's sides, over the hair. */
const earsOn = (f: Cells, xl: number, xr: number, y: number, skin: Tri) => { f.rect(xl, y, 1, 2, skin.b); f.put(xl, y + 1, skin.d); f.rect(xr, y, 1, 2, skin.d) }
type EyeKind = 'big' | 'small' | 'toon' | 'glow'
/** Two eyes looking right (toward the foes): a dark lid, a white catchlight and the iris. */
const eyesOn = (f: Cells, xl: number, xr: number, y: number, kind: EyeKind, iris: string) => {
  for (const x of [xl, xr]) {
    if (kind === 'big') { f.rect(x, y, 2, 1, INK); f.put(x, y + 1, WHITE); f.put(x + 1, y + 1, INK); f.rect(x, y + 2, 2, 1, iris) }
    else if (kind === 'small') { f.rect(x, y, 2, 1, INK); f.put(x, y + 1, WHITE); f.put(x + 1, y + 1, iris) }
    else if (kind === 'glow') { f.rect(x, y, 2, 1, shade(iris, 0.45)); f.put(x + 1, y, WHITE) }
    else { f.rect(x, y, 3, 4, WHITE); f.rect(x + 1, y + 1, 2, 3, iris); f.rect(x + 2, y + 1, 1, 2, INK); f.put(x + 1, y + 1, WHITE); f.rect(x, y - 1, 3, 1, INK) }
  }
}
/** One face detail on the cheeks: `cl` and `cr` are the cheek cells under each eye. */
const detailOn = (f: Cells, k: number, cl: readonly [number, number], cr: readonly [number, number], eyeR: readonly [number, number], skin: Tri, hair: string, accent: string) => {
  const d = pick(DETAILS, k)
  if (d === 'freckles') { f.put(cl[0], cl[1], skin.d); f.put(cl[0] + 1, cl[1] + 1, skin.d); f.put(cr[0], cr[1], skin.d); f.put(cr[0] - 1, cr[1] + 1, skin.d) }
  else if (d === 'scar') { f.put(eyeR[0] + 1, eyeR[1] - 1, '#b04848'); f.put(eyeR[0] + 1, eyeR[1] + 2, '#b04848'); f.put(eyeR[0], eyeR[1] + 3, '#b04848') }
  else if (d === 'eyepatch') { f.rect(eyeR[0], eyeR[1], 2, 2, INK); f.put(eyeR[0] - 1, eyeR[1] - 1, INK); f.put(eyeR[0] - 2, eyeR[1] - 2, INK) }
  else if (d === 'stubble') { f.put(cl[0], cl[1] + 1, mix(skin.d, hair, 0.5)); f.put(cr[0], cr[1] + 1, mix(skin.d, hair, 0.5)); f.rect(cl[0] + 1, cl[1] + 2, cr[0] - cl[0] - 1, 1, mix(skin.d, hair, 0.5)) }
  else if (d === 'bandage') { f.rect(cr[0] - 1, cr[1], 2, 1, '#f4ecd8'); f.put(cr[0] - 1, cr[1], '#d8c8a8') }
  else if (d === 'blush') { f.put(cl[0], cl[1], '#f08a80'); f.put(cr[0], cr[1], '#f08a80') }
  else if (d === 'warpaint') { f.rect(cl[0], cl[1], 2, 1, accent); f.rect(cr[0] - 1, cr[1], 2, 1, accent) }
}
/** Arms for any shoulder row, arm length and width: the right hand holds the weapon, the left the shield. */
const armsAt = (pose: HeroPose, sy: number, sleeve: Tri, hand: Tri, ax: number, len: number, aw = 2, hs = 3) => {
  const armL = cl(), armR = cl(), r0 = 30 - ax - aw
  let grip: [number, number], hold: [number, number]
  if (pose === 'attack') {
    line(armR, r0 + aw - 1, sy + 1, r0 + aw + 1, sy + 1 - len, aw, sleeve.b); armR.rect(r0 + aw, sy - len - 1, hs, hs, hand.b); grip = [r0 + aw + 1, sy - len]
    line(armL, ax, sy + 1, ax - 2, sy + 3, aw, sleeve.b); armL.rect(ax - 4, sy + 3, hs, hs, hand.b); hold = [ax - 3, sy + 4]
  } else if (pose === 'sit') {
    line(armR, r0 + aw - 1, sy + 1, r0 + aw + 1, sy + len - 1, aw, sleeve.b); armR.rect(r0 + aw, sy + len - 1, hs, hs, hand.b); grip = [r0 + aw + 1, sy + len]
    armL.rect(ax, sy, aw, len, sleeve.b); armL.rect(ax + aw - hs, sy + len, hs, hs, hand.b); hold = [ax, sy + len + 1]
  } else {
    armR.rect(r0, sy, aw, len, sleeve.b); armR.rect(r0, sy + len, hs, hs, hand.b); grip = [r0 + 1, sy + len + 1]
    armL.rect(ax, sy, aw, len, sleeve.b); armL.rect(ax + aw - hs, sy + len, hs, hs, hand.b); hold = [ax, sy + len + 1]
  }
  for (const a of [armL, armR]) for (const [k, v] of a.m) if (v === sleeve.b && !a.m.has(k + CW)) a.m.set(k, sleeve.d)
  return { armL, armR, grip, hold }
}
/** Two legs from the hip row to the ground, a clear gap at x 14 and 15; sitting folds them in front. */
const legsAt = (pose: HeroPose, hip: number, pants: Tri, boot: Tri, lw: number, bw = 1, bootH = 2) => {
  const a = cl(), b = cl()
  if (pose === 'sit') {
    a.rect(14 - lw - 3, 31, lw + 4, 2, pants.b); b.rect(15, 31, lw + 4, 2, pants.b); a.rect(14 - lw - 3, 32, lw + 4, 1, pants.d); b.rect(15, 32, lw + 4, 1, pants.d)
    a.rect(14 - lw - 5, 31, 3, 3, boot.b); b.rect(16 + lw + 2, 31, 3, 3, boot.b); a.rect(14 - lw - 5, 33, 3, 1, boot.d); b.rect(16 + lw + 2, 33, 3, 1, boot.d)
  } else {
    const by = 34 - bootH
    a.rect(14 - lw, hip, lw, by - hip, pants.b); a.rect(13, hip, 1, by - hip, pants.d)
    b.rect(16, hip, lw, by - hip, pants.b); b.rect(15 + lw, hip, 1, by - hip, pants.d)
    a.rect(14 - lw - bw, by, lw + bw, bootH, boot.b); a.rect(14 - lw - bw, 33, lw + bw, 1, boot.d)
    b.rect(16, by, lw + bw, bootH, boot.b); b.rect(16, 33, lw + bw, 1, boot.d)
  }
  return { legA: a, legB: b }
}

// V1: today's D, polished. Same two-heads chibi, but brows, a nose, a narrower jaw and smaller eyes read older and braver.
const advChibi = (pose: HeroPose, lk: HeroLook): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const skin = tri(lk.skin), tunic = tri('#3f6fc0'), pants = tri('#4a3a2c'), boot = tri('#6b4526'), sc = tri(lk.accent)
  const body = cl(), face = cl(), under = cl()
  const h = headAt(body, 10 + d, 7, 12, skin)
  body.put(8, 20 + d, undefined); body.put(21, 20 + d, undefined); body.put(9, 21 + d, skin.d); body.put(20, 21 + d, skin.d)
  hairOn(under, body, h, lk.style, lk.hair, 16 + d)
  earsOn(face, 7, 22, 17 + d, skin)
  eyesOn(face, 10, 17, 16 + d, 'big', lk.eyes)
  face.rect(10, 15 + d, 2, 1, shade(lk.hair, -0.35)); face.rect(17, 15 + d, 2, 1, shade(lk.hair, -0.35))
  face.put(15, 18 + d, skin.d); face.rect(14, 20 + d, 3, 1, '#8a3a2a')
  detailOn(face, lk.detail, [10, 19 + d], [19, 19 + d], [17, 16 + d], skin, lk.hair, lk.accent)
  box(body, 10, 23 + d, 10, 7, tunic); body.rect(10, 28 + d, 10, 1, '#5a3a20'); body.rect(14, 28 + d, 2, 1, '#f2c94c')
  face.rect(10, 22 + d, 10, 2, sc.b); face.rect(10, 23 + d, 10, 1, sc.d); face.rect(8, 23 + d, 2, 4, sc.b); face.rect(7, 26 + d, 2, 2, sc.d)
  const a = armsAt(pose, 24 + d, tunic, skin, 8, 3)
  return { under, ...legsAt(pose, 30, pants, boot, 3), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 24 + d, 10, 4), hatY: 13 + d, grip: a.grip, hold: a.hold, capeY: 22 + d, capeK: 0.9 }
}

// V2: the classic three-heads 16-bit adventurer: tunic, belt, satchel strap, boots.
const advClassic = (pose: HeroPose, lk: HeroLook): Rig => {
  const d = pose === 'sit' ? 5 : 0
  const skin = tri(lk.skin), tunic = tri(lk.accent), pants = tri('#5a4632'), boot = tri('#7a4a26'), strap = '#6a3e1e'
  const body = cl(), face = cl(), under = cl()
  const h = headAt(body, 7 + d, 6, 9, skin)
  hairOn(under, body, h, lk.style, lk.hair, 11 + d)
  earsOn(face, 8, 21, 11 + d, skin)
  eyesOn(face, 11, 17, 11 + d, 'big', lk.eyes)
  face.rect(11, 10 + d, 2, 1, shade(lk.hair, -0.35)); face.rect(17, 10 + d, 2, 1, shade(lk.hair, -0.35))
  face.rect(14, 14 + d, 2, 1, '#8a3a2a')
  detailOn(face, lk.detail, [10, 13 + d], [19, 13 + d], [17, 11 + d], skin, lk.hair, lk.accent)
  body.rect(14, 16 + d, 2, 1, skin.d)
  box(body, 10, 17 + d, 10, 8, tunic); body.rect(9, 17 + d, 12, 2, tunic.l); body.rect(10, 23 + d, 10, 1, '#5a3a20'); body.rect(14, 23 + d, 2, 1, '#f2c94c')
  body.rect(10, 24 + d, 10, 1, tunic.d)
  for (let i = 0; i < 6; i++) face.put(11 + i, 17 + i + d, strap)
  const a = armsAt(pose, 18 + d, tunic, skin, 7, 5)
  return { under, ...legsAt(pose, 25, pants, boot, 3), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 17 + d, 10, 6), hatY: 10 + d, hatW: 14, grip: a.grip, hold: a.hold, capeY: 15 + d, capeK: 0.85 }
}

// V3: four heads tall: a small head, broad shoulders, long legs, a heroic stance.
const advAction = (pose: HeroPose, lk: HeroLook): Rig => {
  const d = pose === 'sit' ? 8 : 0
  const skin = tri(lk.skin), tunic = tri('#6a4a8a'), leather = tri('#8a5a32'), pants = tri('#3a3448'), boot = tri('#5a3a22')
  const body = cl(), face = cl(), under = cl()
  const h = headAt(body, 5 + d, 4, 8, skin)
  hairOn(under, body, h, lk.style, lk.hair, 8 + d)
  eyesOn(face, 12, 16, 8 + d, 'small', lk.eyes)
  face.rect(14, 11 + d, 2, 1, '#7a3a2a')
  detailOn(face, lk.detail, [12, 10 + d], [17, 10 + d], [16, 8 + d], skin, lk.hair, lk.accent)
  body.rect(13, 13 + d, 4, 1, skin.d)
  // torso: a V from the shoulders to the belt
  const tm = cl()
  for (let y = 14; y <= 22; y++) {
    const hw = y < 16 ? 7 : Math.max(4, 7 - Math.floor((y - 15) / 2))
    body.rect(15 - hw, y + d, 2 * hw, 1, tunic.b); body.put(14 + hw, y + d, tunic.d); body.put(15 - hw, y + d, tunic.l)
    if (y >= 15 && y <= 21) tm.rect(16 - hw, y + d, 2 * hw - 2, 1, '#000000')
  }
  box(body, 7, 14 + d, 4, 3, leather); box(body, 19, 14 + d, 4, 3, leather)
  body.rect(11, 22 + d, 8, 2, leather.d); body.rect(14, 22 + d, 2, 2, '#f2c94c')
  const a = armsAt(pose, 16 + d, tunic, skin, 7, 6, 2, 2)
  return { under, ...legsAt(pose, 24, pants, boot, 3, 1, 3), body, face, armL: a.armL, armR: a.armR, torso: tm, hatY: 8 + d, hatW: 10, hatS: 0.8, grip: a.grip, hold: a.hold, capeY: 12 + d, capeK: 0.75 }
}

// V4: the hooded wanderer: the hood keeps the face in shadow, two eyes glow out of it; the chest piece shows on the cloak front.
const advHooded = (pose: HeroPose, lk: HeroLook): Rig => {
  const d = pose === 'sit' ? 4 : 0
  const cloak = tri(lk.accent), shadow = '#140f1c', boot = tri('#4a3426'), pants = tri('#2e2a36')
  const body = cl(), face = cl(), under = cl()
  // the hood: a rounded peak, then the face opening
  ell(body, 15, 15 + d, 7.5, 7.5, cloak.b); body.rect(8, 15 + d, 14, 6, cloak.b)
  body.rect(15, 7 + d, 3, 1, cloak.b); body.put(17, 6 + d, cloak.d)
  for (let y = 9; y <= 20; y++) body.put(21, y + d, cloak.d)
  for (let x = 10; x <= 13; x++) body.put(x, 9 + d, cloak.l)
  ell(face, 15, 16.5 + d, 4.6, 4.2, shadow)
  face.rect(12, 19 + d, 6, 1, mix(lk.skin, shadow, 0.55)); face.rect(13, 20 + d, 4, 1, mix(lk.skin, shadow, 0.25))
  eyesOn(face, 11, 16, 16 + d, 'glow', lk.eyes)
  if (pick(DETAILS, lk.detail) === 'scar') face.put(17, 15 + d, '#b04848')
  else if (lk.detail % 2 === 1) face.rect(11, 19 + d, 8, 2, shade(lk.accent, -0.45))
  // the cloak: wider toward the hem, parted in front so the legs show
  for (let y = 21; y <= 31; y++) {
    const hw = 7 + Math.floor((y - 21) / 4)
    const slit = y >= 27 ? Math.min(4, y - 26) : 0
    for (let x = 15 - hw; x < 15 + hw; x++) if (Math.abs(x + 0.5 - 15) >= slit) body.put(x, y + d, x === 14 + hw - 1 || y === 31 ? cloak.d : cloak.b)
  }
  for (let y = 21; y <= 26; y++) body.put(15, y + d, cloak.d)
  const a = armsAt(pose, 22 + d, cloak, tri(lk.skin), 7, 3)
  const lg = pose === 'sit' ? legsAt(pose, 31, pants, boot, 2) : legsAt(pose, 28, pants, boot, 2)
  return { under, ...lg, body, face, armL: a.armL, armR: a.armR, torso: maskRect(11, 21 + d, 8, 6), hatY: 11 + d, hatW: 14, grip: a.grip, hold: a.hold, capeY: 17 + d, capeK: 0.95 }
}

// V5: the stocky dwarf: wide barrel body, a beard over the chest, short legs, big boots.
const BEARDS = ['full', 'forked', 'braided', 'short', 'long'] as const
const advDwarf = (pose: HeroPose, lk: HeroLook): Rig => {
  const d = pose === 'sit' ? 2 : 0
  const skin = tri(lk.skin), tunic = tri('#3f5a8a'), pants = tri('#4a3a2c'), boot = tri('#5a3a22'), bd = tri(lk.hair)
  const body = cl(), face = cl(), under = cl()
  const h = headAt(body, 11 + d, 6, 8, skin)
  // dwarves keep a short crop under the helmet; the style picks the beard
  for (let x = h.x0 + 1; x <= h.x1 - 1; x++) body.put(x, h.top, bd.d)
  body.rect(h.x0, h.top + 1, 1, 3, bd.d); body.rect(h.x1, h.top + 1, 1, 3, bd.d)
  face.rect(10, 13 + d, 4, 1, bd.d); face.rect(16, 13 + d, 4, 1, bd.d)
  eyesOn(face, 11, 17, 14 + d, 'small', lk.eyes)
  face.rect(14, 15 + d, 2, 2, skin.d); face.put(14, 15 + d, skin.l)
  const style = pick(BEARDS, lk.style)
  const long = style === 'long' ? 4 : style === 'short' ? -4 : 0
  for (let y = 16; y <= 25 + long; y++) {
    const hw = y < 18 ? 6 : Math.max(2, 6 - Math.floor((y - 17) / (style === 'short' ? 1 : 2)))
    for (let x = 15 - hw; x < 15 + hw; x++) face.put(x, y + d, x === 14 + hw || (x % 3 === 0 && y > 17) ? bd.d : y === 16 && x < 13 ? bd.l : bd.b)
  }
  if (style === 'forked') for (let y = 21; y <= 25; y++) { face.put(14, y + d, undefined); face.put(15, y + d, undefined) }
  if (style === 'braided') for (const x of [12, 17]) { face.rect(x, 24 + d, 1, 4, bd.d); face.put(x, 27 + d, '#f2c94c') }
  face.rect(11, 16 + d, 8, 1, bd.d); face.rect(13, 17 + d, 4, 1, '#3a1a14')
  detailOn(face, lk.detail === 3 ? 0 : lk.detail, [10, 15 + d], [19, 15 + d], [17, 14 + d], skin, lk.hair, lk.accent)
  box(body, 7, 19 + d, 16, 11, tunic); body.rect(7, 19 + d, 16, 1, tunic.l)
  body.rect(7, 27 + d, 16, 2, '#4a2c18'); body.rect(13, 27 + d, 4, 2, '#f2c94c'); body.rect(14, 27 + d, 2, 1, '#a47e1c')
  const a = armsAt(pose, 20 + d, tunic, skin, 4, 4, 3, 3)
  return { under, ...legsAt(pose, 30, pants, boot, 4, 1, 2), body, face, armL: a.armL, armR: a.armR, torso: maskRect(7, 19 + d, 16, 8), hatY: 14 + d, hatW: 16, grip: a.grip, hold: a.hold, capeY: 17 + d, capeK: 1 }
}

// V6: the lanky elf: tall and thin, long hair, ears that poke out of any helmet.
const advElf = (pose: HeroPose, lk: HeroLook): Rig => {
  const d = pose === 'sit' ? 8 : 0
  const skin = tri(lk.skin), tunic = tri('#2f7a4a'), pants = tri('#5a4a32'), boot = tri('#4a3622'), trim = '#d8c070'
  const body = cl(), face = cl(), under = cl()
  const h = headAt(body, 5 + d, 4, 8, skin)
  hairOn(under, body, h, lk.style, lk.hair, 8 + d)
  // ears in the face layer, in front of hats
  for (const [x, y] of [[10, 9], [9, 9], [9, 8], [8, 8], [7, 7], [8, 7]] as const) { face.put(x, y + d, skin.b); face.put(29 - x, y + d, skin.d) }
  face.put(10, 10 + d, skin.d)
  eyesOn(face, 12, 16, 8 + d, 'small', lk.eyes)
  face.rect(14, 11 + d, 2, 1, '#9a4a3a')
  detailOn(face, lk.detail, [12, 10 + d], [17, 10 + d], [16, 8 + d], skin, lk.hair, lk.accent)
  body.rect(14, 13 + d, 2, 1, skin.d)
  box(body, 11, 14 + d, 8, 9, tunic); body.rect(10, 14 + d, 10, 2, tunic.l); body.rect(11, 21 + d, 8, 1, trim)
  body.rect(14, 16 + d, 2, 5, trim)
  const a = armsAt(pose, 15 + d, tunic, skin, 8, 7, 2, 2)
  return { under, ...legsAt(pose, 23, pants, boot, 2, 1, 3), body, face, armL: a.armL, armR: a.armR, torso: maskRect(11, 14 + d, 8, 7), hatY: 8 + d, hatW: 10, hatS: 0.8, grip: a.grip, hold: a.hold, capeY: 12 + d, capeK: 0.75 }
}

// V7: the bold cartoon: flat bright colors, huge eyes, a thick dark outline (two rings) and ink lines between the parts.
const flat = (c: string): Tri => ({ b: c, l: c, d: c })
const advToon = (pose: HeroPose, lk: HeroLook): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const skin = flat(lk.skin), shirt = flat(lk.accent), pants = flat('#3f4fc0'), boot = flat('#d0342c')
  const body = cl(), face = cl(), under = cl()
  ell(body, 15, 14.5 + d, 7.2, 6, skin.b)
  const h: Head = { x0: 8, x1: 21, top: 9 + d, bot: 20 + d }
  hairOn(under, body, h, lk.style, lk.hair, 13 + d)
  for (const [k, v] of [...body.m]) if (v !== skin.b) body.m.set(k, lk.hair)
  for (const k of [...under.m.keys()]) under.m.set(k, shade(lk.hair, -0.25))
  eyesOn(face, 10, 16, 13 + d, 'toon', lk.eyes)
  face.rect(13, 18 + d, 4, 1, INK); face.put(12, 17 + d, INK); face.put(17, 17 + d, INK); face.rect(14, 19 + d, 2, 1, '#e05a5a')
  detailOn(face, lk.detail === 3 ? 6 : lk.detail, [9, 17 + d], [20, 17 + d], [16, 14 + d], tri(lk.skin), lk.hair, lk.accent)
  body.rect(10, 21 + d, 10, 7, shirt.b); body.rect(10, 21 + d, 10, 1, INK); body.rect(10, 27 + d, 10, 1, INK)
  const a = armsAt(pose, 22 + d, shirt, skin, 8, 3)
  return { under, ...legsAt(pose, 28, pants, boot, 3, 1, 3), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 22 + d, 10, 5), hatY: 12 + d, grip: a.grip, hold: a.hold, capeY: 20 + d, capeK: 0.9, bold: true }
}

// V8 (wildcard): the scarf runner: a two-and-a-half heads hero with a bold outline and a long scarf in the accent color streaming behind.
const advScarf = (pose: HeroPose, lk: HeroLook): Rig => {
  const d = pose === 'sit' ? 3 : 0
  const skin = tri(lk.skin), coat = tri('#3a4a6a'), pants = tri('#4a3a2c'), boot = tri('#6b4526'), sc = tri(lk.accent)
  const body = cl(), face = cl(), under = cl()
  const h = headAt(body, 9 + d, 6, 11, skin)
  hairOn(under, body, h, lk.style, lk.hair, 14 + d)
  earsOn(face, 8, 21, 15 + d, skin)
  eyesOn(face, 10, 17, 14 + d, 'big', lk.eyes)
  face.rect(10, 13 + d, 2, 1, shade(lk.hair, -0.35)); face.rect(17, 13 + d, 2, 1, shade(lk.hair, -0.35))
  face.put(15, 16 + d, skin.d); face.rect(14, 18 + d, 2, 1, '#8a3a2a')
  detailOn(face, lk.detail, [10, 17 + d], [19, 17 + d], [17, 14 + d], skin, lk.hair, lk.accent)
  box(body, 10, 21 + d, 10, 8, coat); body.rect(14, 21 + d, 2, 7, coat.d); body.rect(10, 27 + d, 10, 1, '#5a3a20')
  // the scarf: a thick wrap and a long tail blowing back to the left
  face.rect(9, 20 + d, 12, 2, sc.b); face.rect(9, 21 + d, 12, 1, sc.d); face.rect(9, 20 + d, 3, 1, sc.l)
  under.paint('....LS..../..SSSSSSSD/.SS..DSSDD/SD....SSD./D.....SD../......D...', { S: sc.b, D: sc.d, L: sc.l }, 0, 19 + d)
  const a = armsAt(pose, 22 + d, coat, skin, 8, 3)
  return { under, ...legsAt(pose, 29, pants, boot, 3), body, face, armL: a.armL, armR: a.armR, torso: maskRect(10, 22 + d, 10, 5), hatY: 12 + d, hatW: 14, grip: a.grip, hold: a.hold, capeY: 19 + d, capeK: 0.85, bold: true }
}

const ADV_RIGS: Record<AdvId, (pose: HeroPose, lk: HeroLook) => Rig> = { V1: advChibi, V2: advClassic, V3: advAction, V4: advHooded, V5: advDwarf, V6: advElf, V7: advToon, V8: advScarf }

/** One hero: option, pose, gear (none draws the bare body); adventurers also take a look (none draws the variant's default). */
export const heroSprite = (id: HeroId, pose: HeroPose, g?: GearSet, look?: HeroLook): Sprite => {
  if (id === 'A') return crabFlat(pose, g)
  const rig = isAdv(id) ? ADV_RIGS[id](pose, look ?? DEFAULT_LOOK[id]) : (RIGS[id] ?? chibi)(pose, g)
  const parts: Part[] = []
  if (g) parts.push({ rects: backRects(g.back, rig.capeY, rig.capeK) })
  parts.push({ rects: rig.under.rects() })
  if (rig.shell) parts.push({ rects: rig.shell.rects() })
  parts.push({ cls: 'l1', rects: rig.legA.rects() }, { cls: 'l2', rects: rig.legB.rects() }, { rects: rig.body.rects() })
  if (g && rig.torso) parts.push({ rects: torsoRects(rig.torso, g.chest, rig.band ? 0.45 : 0) })
  parts.push({ cls: 'cl', rects: rig.armL.rects() }, { cls: 'cr', rects: rig.armR.rects() })
  if (g) parts.push({ rects: hatRects(g.head, rig.hatY, rig.hatW, rig.hatS) })
  parts.push({ rects: rig.face.rects() })
  if (g && pose !== 'sit') parts.push({ cls: 'off', rects: g.dual ? weaponRects(t => putWeapon(t, g.off.id, g.off.color, [13, 22], 0), rig.hold, true) : offRects(g.off, rig.hold) })
  if (pose === 'sit') parts.push({ cls: 'wpn', rects: rodRects(rig.grip, 34) })
  else if (g) parts.push({ cls: 'wpn', rects: weaponRects(t => putWeapon(t, g.weapon.id, g.weapon.color, [13, 22], 0), rig.grip) })
  return finish(parts, 34, rig.bold)
}

// ---- the eight gear sets every option wears ----
const idOf = (list: { n: string }[], name: string) => {
  const i = list.findIndex(s => s.n === name)
  if (i < 0) throw new Error(`no piece named ${name}`)
  return i
}
const set = (name: string, head: [string, string], chest: [string, string], back: [string, string], weapon: [string, string], off: [string, string], dual = false): GearSet => ({
  name,
  head: { id: idOf(HATS, head[0]), color: head[1] },
  chest: { id: idOf(CHESTS, chest[0]), color: chest[1] },
  back: { id: idOf(BACKS, back[0]), color: back[1] },
  weapon: { id: idOf(WEAPONS, weapon[0]), color: weapon[1] },
  off: { id: dual ? idOf(WEAPONS, off[0]) : idOf(OFFHANDS, off[0]), color: off[1] },
  dual,
})
export const GEAR_SETS: GearSet[] = [
  set('Knight', ['Horned Helm', '#b8c4d8'], ['Plate Armor', '#9fb0c8'], ['Short Cape', '#c0392b'], ['Claymore', '#c8c8c8'], ['Tower Shield', '#8080ff']),
  set('Wizard', ['Wizard Hat', '#7a4ad0'], ['Starry Robe', '#5a6ad8'], ['Starry Cape', '#6a3ab0'], ['Crystal Staff', '#5ee0ea'], ['Spell Tome', '#f2e05a']),
  set('King', ['Crown', '#f2c94c'], ['Royal Mantle', '#c8302c'], ['Royal Cape', '#a02030'], ['Longsword', '#e8eef8'], ['Heater Shield', '#f2e05a']),
  set('Rogue', ['Hood', '#4a8a5a'], ['Leather Vest', '#8a6a44'], ['Shadow Cloak', '#3a3a52'], ['Dagger', '#c8c8c8'], ['Dagger', '#c8c8c8'], true),
  set('Samurai', ['Kabuto', '#b03030'], ['Samurai Do', '#c8302c'], ['Raven Wings', '#2a2a3a'], ['Katana', '#e8eef8'], ['Lantern', '#ff8a1f']),
  set('Pirate', ['Pirate Bandana', '#c8302c'], ['Pirate Coat', '#2f5aa8'], ['Pirate Coattails', '#7a2030'], ['Scimitar', '#c8c8c8'], ['Compass', '#f2c94c']),
  set('Dev', ['Chef Toque', '#ffffff'], ['Conference Tee', '#4d8dff'], ['Backpack', '#e0902a'], ['Rubber Mallet', '#e0443a'], ['Rubber Duck Shield', '#ffe45e']),
  set('Cleric', ['Mitre', '#f2e05a'], ['Paladin Plate', '#d8dce8'], ['Angel Wings', '#ffffff'], ['Mace', '#f2c94c'], ['Heart Shield', '#e0443a']),
]
