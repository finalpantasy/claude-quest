// Hero H1, the swordsman (task-26, D30): drawn as parts and shaded from the upper left. Never a crab (D29).
// Every pose keeps H1's design, front view, straight legs; sitting bends at the hip only (legs foreshortened toward the viewer).
import { P, Px } from './core'

// ---------- hero kit (task-26): figures drawn as parts, shaded from the upper left ----------
/** One material: deep (its outline on the lit side), shadow, base, light, an optional highlight for metal and hair, a shadow width and a light width. */
export type Ramp = { deep: string; shade: string; base: string; light: string; hi?: string; wide?: number; lw?: number }
export const ramp = (deep: string, shade: string, base: string, light: string, hi?: string, wide?: number, lw?: number): Ramp => ({ deep, shade, base, light, hi, wide, lw })

/** A figure as part letters per pixel; a lower case letter is the same part forced into shadow (folds, creases). */
export class Fig {
  k: string[]
  constructor(public w: number, public h: number) { this.k = new Array(w * h).fill('') }
  at(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.k[y * this.w + x]! : '' }
  set(x: number, y: number, r: string) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.k[y * this.w + x] = r; return this }
  /** Fill [y, x0, x1] rows or [y0, y1, x0, x1] blocks with a part. */
  spans(r: string, list: number[][]) {
    for (const s of list) {
      const [y0, y1, x0, x1] = s.length === 3 ? [s[0]!, s[0]!, s[1]!, s[2]!] : [s[0]!, s[1]!, s[2]!, s[3]!]
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, r)
    }
    return this
  }
  disc(cx: number, cy: number, rad: number, r: string) {
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= rad * rad) this.set(x, y, r) }
    return this
  }
  /** Put the pixels of [y, x0, x1] rows into shadow (folds, creases, the underside of a form). */
  crease(list: number[][]) {
    for (const [y, x0, x1] of list) for (let x = x0!; x <= (x1 ?? x0)!; x++) { const r = this.at(x, y!); if (r) this.set(x, y!, r.toLowerCase()) }
    return this
  }
}

/**
 * Shade a figure with light from the upper left. Per pixel of a part: a cast shadow when a part in front of it sits directly above;
 * the light tone when open space or a part behind sits above or left of it; the shadow tone when its own part ends below it or within
 * the part's shadow width to its right; both or neither give the base. Lower case pixels are shadow. Metal and hair take a highlight on
 * lit corners. Parts named in inked get a contact line on the parts behind them. Marks then set single pixels, and the outline is ink below and right of the figure, the part's deep color above and left.
 */
export const shadeFig = (f: Fig, ramps: Record<string, Ramp>, order: string, marks: [number, number, string][] = [], inked = '') => {
  const reg = (x: number, y: number) => f.at(x, y).toUpperCase()
  const z = (r: string) => order.indexOf(r)
  const px = new Px(f.w + 2, f.h + 2), deep = new Map<number, string>()
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const k = f.at(x, y)
    if (!k) continue
    const R = k.toUpperCase(), rp = ramps[R]
    if (!rp || z(R) < 0) throw new Error(`no ramp or order for part ${R}`)
    const same = (dx: number, dy: number) => reg(x + dx, y + dy) === R
    const open = (dx: number, dy: number) => { const q = reg(x + dx, y + dy); return q === '' || (q !== R && z(q) < z(R)) }
    const above = reg(x, y - 1)
    let tone: 'shade' | 'base' | 'light' | 'hi' = 'base'
    if (k !== R || (above !== '' && above !== R && z(above) > z(R))) tone = 'shade'
    else {
      // the lit band covers the first lw pixels of the form from its left edge; parts in front of it are passed over, not counted
      let n = 1, edgeFound = false
      for (let i = 1; i <= 16; i++) { const q = reg(x - i, y); if (q === '' || (q !== R && z(q) < z(R))) { edgeFound = true; break } if (q === R) n++ }
      const lit = open(0, -1) || (edgeFound && n <= (rp.lw ?? 1))
      let edge = !same(0, 1)
      for (let i = 1; i <= (rp.wide ?? 1); i++) if (!same(i, 0)) edge = true
      tone = lit && !edge ? 'light' : edge && !lit ? 'shade' : 'base'
      if (tone === 'light' && rp.hi && open(0, -1) && open(-1, 0)) tone = 'hi'
    }
    // a contact line: where an inked part lies over this one, the touching pixel takes that part's deep color
    let line: string | undefined
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) { const q = reg(x + dx, y + dy); if (q && q !== R && inked.includes(q) && z(q) > z(R)) line = ramps[q]!.deep }
    px.set(x + 1, y + 1, line ?? rp[tone] ?? rp.light)
    deep.set((y + 1) * px.w + x + 1, rp.deep)
  }
  for (const [x, y, c] of marks) px.set(x + 1, y + 1, c)
  const o = px.map(c => c)
  for (let y = 0; y < px.h; y++) for (let x = 0; x < px.w; x++) {
    if (px.get(x, y) !== undefined) continue
    if (px.get(x, y - 1) !== undefined || px.get(x - 1, y) !== undefined) { o.set(x, y, P.ink); continue }
    const n = px.get(x, y + 1) !== undefined ? (y + 1) * px.w + x : px.get(x + 1, y) !== undefined ? y * px.w + x + 1 : -1
    if (n >= 0) o.set(x, y, deep.get(n) ?? P.ink)
  }
  return o
}

/** A hero for the frame: the outlined sprite, the column under the body center, and the hair top, chin and sole rows (outlined coordinates). */
export type Hero = { px: Px; feetX: number; headTop: number; chin: number; soles: number; tones?: Record<string, number> }

export const SKIN = ramp(P.rust, P.tan, P.apricot, P.skin)
export const STEEL = ramp(P.night, P.mauve, P.mist, P.cloud, P.white)
export const GOLD = ramp(P.rust, P.amber, P.gold, P.cream)
export const LEATHER = ramp(P.grape, P.wine, P.rust, P.copper, P.tan)
export const SOLE = ramp(P.ink, P.ink, P.night, P.dusk)

/** The shared skeleton (task-26 heroes): head rows 13 to 20 (8 of 44), body center column 14, soles on row 56. */
export const SK = { c: 14, top: 13, chin: 20, soles: 56 }
/** Face part F (rows 16 to 20) and neck N; the hair or helm goes over the top. */
export const faceParts = (f: Fig) => f.spans('N', [[21, 13, 15]]).spans('F', [[14, 15, 11, 17], [16, 19, 11, 17], [20, 12, 16]])
/** Eyes, nose shadow and mouth on the face. */
export const faceMarks = (eye: string = P.navy): [number, number, string][] => [[12, 17, eye], [12, 18, P.ink], [16, 17, eye], [16, 18, P.ink], [15, 18, P.tan], [13, 19, P.tan], [14, 19, P.rust]]
/** Legs L and M (thigh to ankle), knees marked by a crease only. */
export const legParts = (f: Fig) => f.spans('L', [[35, 48, 10, 13]]).spans('M', [[35, 48, 15, 18]]).crease([[42, 11, 12], [42, 16, 17]])
/** Boots: cuffs E and D, shafts and feet K and J with toes turned slightly out, soles Z. */
export const bootParts = (f: Fig) =>
  f.spans('E', [[49, 9, 13]]).spans('K', [[50, 52, 10, 13], [53, 55, 9, 13], [54, 55, 8, 8]])
    .spans('D', [[49, 15, 19]]).spans('J', [[50, 52, 15, 18], [53, 55, 15, 19], [54, 55, 20, 20]])
    .spans('Z', [[56, 8, 13], [56, 15, 20]])
/** The raised sword arm: sleeve X from the right shoulder up to the wrist, fist G beside the head, guard Y, blade W (tip on row 3). */
export const swordArm = (f: Fig, tip = 3) =>
  f.spans('X', [[22, 19, 22], [21, 20, 23], [20, 21, 24], [18, 19, 22, 24]])
    .spans('G', [[17, 22, 24], [14, 16, 21, 24]]).crease([[15, 22], [15, 24]])
    .spans('Y', [[13, 20, 26]]).spans('W', [[tip + 1, 12, 22, 24], [tip, 23, 23]])
export const fistMarks: [number, number, string][] = [[21, 15, P.tan], [21, 14, P.copper]]
export const hero = (f: Fig, ramps: Record<string, Ramp>, order: string, marks: [number, number, string][], inked = 'AXG'): Hero => {
  // the belt on row 31 is one row tall, so its light and shade come from its ends: lit on the left, shaded on the right
  const belt = [...Array(f.w).keys()].filter(x => f.at(x, 31) === 'B'), ends: [number, number, string][] = belt.length < 4 ? []
    : [[belt[0]!, 31, P.rust], [belt[1]!, 31, P.rust], [belt[belt.length - 2]!, 31, P.grape], [belt[belt.length - 1]!, 31, P.grape]]
  const px = shadeFig(f, ramps, order, [...ends, ...marks], inked), seen: Record<string, Set<string>> = {}
  // colors each part shows in the final sprite (outline and contact lines included), for the card's tone counts
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const r = f.at(x, y).toUpperCase(), c = px.get(x + 1, y + 1)
    if (r && c) (seen[r] ??= new Set()).add(c)
  }
  const tones = Object.fromEntries(Object.entries(seen).map(([r, s]) => [r, s.size]))
  return { px, feetX: SK.c + 1, headTop: SK.top + 1, chin: SK.chin + 1, soles: SK.soles + 1, tones }
}
export const BOOTS = { K: LEATHER, J: LEATHER, E: LEATHER, D: LEATHER, Z: SOLE, G: LEATHER }

// ---------- H1 and its poses ----------
export type Pose = 'stand' | 'swing' | 'sit' | 'rod' | 'pick' | 'pickDown' | 'shovel' | 'shovelDown' | 'dead'
const FIG_W = 46

/** A line of the part r with a square brush of `thick` pixels (blades, handles, rods). */
const stroke = (f: Fig, x0: number, y0: number, x1: number, y1: number, r: string, thick = 1) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n)
    for (let a = 0; a < thick; a++) for (let b = 0; b < thick; b++) f.set(x + a, y + b, r)
  }
}

/** Squat for sitting: the torso and head drop 8 rows and the legs shorten to a thigh stub, so the boots come toward the viewer (a bend at the hip, no knees). */
const squat = (src: Fig) => {
  const out = new Fig(src.w, src.h)
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const k = src.at(x, y)
    if (!k || (y >= 38 && y <= 45)) continue
    out.set(x, y < 38 ? y + 8 : y, k)
  }
  return out
}

const WOOD = ramp(P.wine, P.rust, P.copper, P.tan)
const GHOST: [number, string][] = [[70, P.indigo], [110, P.mauve], [150, P.mist], [200, P.cloud], [999, P.white]]
const ghostOf = (c: string) => {
  const l = 0.3 * parseInt(c.slice(1, 3), 16) + 0.59 * parseInt(c.slice(3, 5), 16) + 0.11 * parseInt(c.slice(5, 7), 16)
  return (GHOST.find(([m]) => l < m) ?? GHOST[4]!)[1]
}

/**
 * Gear for H1 (task-28): each slot may redraw its own parts of the figure, and add ramps, marks and a final pass. Every field is optional;
 * an empty kit is H1 as task-27 drew him. Hands, waist, legs, feet, neck and rings have no hook (D23).
 */
export type Kit = {
  /** The cape: replaces the default cut (parts C and V). */
  back?: (f: Fig) => void
  /** Torso, collar and shoulder: replaces tunic T, collar Q and the shoulder A (the belt stays H1's). */
  chest?: (f: Fig) => void
  /** Drawn over the hair. */
  head?: (f: Fig) => void
  /** Replaces the round shield (parts R, S, O). */
  offhand?: (f: Fig) => void
  /** Replaces the blade and guard (parts W, Y above the fist) in the stand pose. */
  weapon?: (f: Fig) => void
  /** The same weapon in the swing pose: replaces the guard row and the blade stroke. */
  swing?: (f: Fig) => void
  /** Ramps that replace H1's own for a part letter, extra marks (figure coordinates), and the z order (back to front) to use. */
  ramps?: Record<string, Ramp>
  marks?: [number, number, string][]
  order?: string
  /** Last pass over the shaded sprite (sprite coordinates are figure coordinates + 1). */
  post?: (px: Px, f: Fig) => Px
}

const heroH1 = (pose: Pose, kit: Kit = {}): Hero => {
  const f = new Fig(FIG_W, 57), c = SK.c
  // cape behind the body: red at both sides, the dark lining between the legs
  if (kit.back) kit.back(f)
  else {
    for (let y = 22; y <= 45; y++) { const half = 6 + Math.floor((y - 22) / 12); f.spans('C', [[y, c - half, c + half]]) }
    f.spans('V', [[36, 44, 13, 15]])
  }
  legParts(f); bootParts(f); faceParts(f)
  if (kit.chest) kit.chest(f)
  else {
    f.spans('T', [[22, 10, 18], [23, 26, 8, 20], [27, 28, 9, 19], [29, 30, 10, 18], [32, 10, 18], [33, 35, 9, 19]])
    f.spans('Q', [[22, 12, 16]])
  }
  f.spans('B', [[31, 10, 18]]).spans('Y', [[31, 13, 15]])
  if (!kit.chest) f.spans('A', [[23, 24, 6, 8], [25, 26, 5, 7]])
  f.spans('H', [[13, 12, 16], [14, 11, 17], [15, 10, 18], [16, 18, 10, 10], [16, 19, 18, 18], [16, 12, 12], [16, 15, 15]])
  kit.head?.(f)
  // the sword arm: sleeve up from the right shoulder to a fist beside the head, as in H1; the blade depends on the pose
  const arm = () => f.spans('X', [[22, 19, 22], [21, 20, 23], [20, 21, 24], [18, 19, 22, 24]]).spans('G', [[17, 22, 24], [14, 16, 21, 24]]).crease([[15, 22], [15, 24]])
  if (pose === 'stand' || pose === 'dead') { swordArm(f); if (kit.weapon) { f.spans('', [[3, 12, 20, 26]]); kit.weapon(f) } }
  else if (pose === 'swing') { arm(); if (kit.swing) kit.swing(f); else { f.spans('Y', [[13, 20, 26]]); stroke(f, 24, 12, 39, 31, 'W', 2) } }
  else if (pose === 'pick') { arm(); stroke(f, 22, 4, 22, 22, 'P', 2); f.spans('W', [[3, 16, 29], [4, 14, 17], [4, 28, 31], [5, 13, 15], [5, 30, 32], [6, 12, 13], [6, 31, 33]]) }
  else if (pose === 'pickDown') { arm(); stroke(f, 23, 18, 35, 40, 'P', 2); f.spans('W', [[40, 41, 30, 41], [42, 43, 30, 32], [42, 43, 39, 41]]) }
  else if (pose === 'shovel') { arm(); stroke(f, 22, 9, 22, 22, 'P', 2); f.spans('W', [[3, 21, 24], [4, 20, 25], [5, 6, 20, 25], [7, 21, 24], [8, 22, 23]]) }
  else if (pose === 'shovelDown') { arm(); stroke(f, 23, 18, 35, 40, 'P', 2); f.spans('W', [[42, 45, 33, 40], [46, 34, 39]]) }
  else if (pose === 'rod') f.spans('X', [[22, 19, 22], [23, 20, 23], [24, 21, 24]]).spans('G', [[25, 27, 22, 25]]).crease([[26, 22], [26, 24]])
  if (kit.offhand) kit.offhand(f)
  else f.disc(6.5, 31, 4.6, 'R').disc(6.5, 31, 3.6, 'S').disc(7, 32, 1.1, 'O')
  f.crease([[24, 14], [25, 14], [27, 10, 18], [33, 12], [34, 12], [35, 12], [33, 16], [34, 16], [35, 16], [14, 14], [15, 13], [15, 16], [28, 4], [29, 4], [30, 4], [33, 4], [34, 4], [28, 9], [29, 9], [33, 9], [34, 9]])
  let fig = f
  if (pose === 'sit' || pose === 'rod') {
    fig = squat(f)
    if (pose === 'rod') {
      // the rod from the fist (column 23, row 33 after the squat) up and out over the water
      stroke(fig, 24, 33, 44, 12, 'P', 1)
    }
  }
  const ramps: Record<string, Ramp> = {
    V: ramp(P.ink, P.grape, P.wine, P.berry), C: ramp(P.grape, P.blood, P.red, P.scarlet, undefined, 2, 1),
    L: ramp(P.ink, P.night, P.dusk, P.mauve), M: ramp(P.ink, P.night, P.dusk, P.mauve), ...BOOTS,
    N: ramp(P.wine, P.copper, P.tan, P.apricot), F: ramp(P.rust, P.tan, P.apricot, P.skin, undefined, 1, 2), H: ramp(P.grape, P.blood, P.rust, P.copper, P.tan),
    T: ramp(P.navy, P.indigo, P.blue, P.sky, undefined, 2, 3), A: ramp(P.navy, P.indigo, P.blue, P.sky), X: ramp(P.navy, P.indigo, P.blue, P.sky),
    Q: ramp(P.dusk, P.mauve, P.mist, P.cloud), B: ramp(P.ink, P.grape, P.blood, P.rust), Y: GOLD, W: STEEL,
    R: STEEL, S: ramp(P.grape, P.wine, P.rust, P.copper), O: GOLD, P: WOOD, ...kit.ramps,
  }
  const shift = pose === 'sit' || pose === 'rod' ? 8 : 0
  const fist: [number, number, string][] = pose === 'rod' || pose === 'sit' ? [] : fistMarks
  const h = hero(fig, ramps, kit.order ?? 'CVLMEKDJZNTQBAFHXGYWRSOP', [...faceMarks().map(([x, y, col]): [number, number, string] => [x, y + shift, col]), ...fist, ...[[12, 14, P.tan], [13, 13, P.copper], [11, 15, P.copper]].map(([x, y, col]): [number, number, string] => [x as number, (y as number) + shift, col as string]), ...(kit.marks ?? [])])
  if (kit.post) h.px = kit.post(h.px, fig)
  if (pose === 'dead') return { ...h, px: h.px.map(ghostOf) }
  return { ...h, headTop: h.headTop + shift, chin: h.chin + shift, soles: h.soles }
}

/** H1 wearing a kit (not cached: gear.ts caches per loadout). */
export const heroWith = (pose: Pose, kit: Kit): Hero => heroH1(pose, kit)
const heroCache = new Map<Pose, Hero>()
/** H1 in a pose (cached). The sprite is FIG_W + 2 wide with the body center on column `feetX`. */
export const heroSprite = (pose: Pose): Hero => { let h = heroCache.get(pose); if (!h) { h = heroH1(pose); heroCache.set(pose, h) } return h }
