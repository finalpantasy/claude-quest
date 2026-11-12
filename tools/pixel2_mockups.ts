// Pixel frame rebuilt to art rules (task-25): one curated palette (Resurrect 64 by Kerrie Lake, free to use), one pixel scale
// (every art pixel is 2 by 2 screen pixels at the band's 1x), hand-placed sprites, a bitmap-font HUD with no boxes, three depth
// layers at most. Two variants of one direction: V1 warm afternoon and V2 golden dusk, each as a fight and a boss frame.
// Not imported by the game; reuses only the PNG encoder in hooks/png.ts.
//
//   npx --no-install tsx tools/pixel2_mockups.ts            R1.png, R2.png, round7.png, round7-closeups.png, SVGs in src/
//   npx --no-install tsx tools/pixel2_mockups.ts --preview  composites into the scratch folder given by PREVIEW (no Edge)
//   npx --no-install tsx tools/pixel2_mockups.ts --perf     rasterize cost per frame (one Edge page)
// The default run also renders each SVG pair in headless Edge for R1.png and R2.png, checks every pixel against the composite and
// the palette, and prints bytes, colors, build time and the hero's head and body heights.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { base64, encodePng } from '../hooks/png'
import { png as rgbaPng } from './sheet'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, 'docs', 'art', 'styles')

// ---------- palette: Resurrect 64 (Kerrie Lake, lospec.com/palette-list/resurrect-64) ----------
export const R64 = [
  '#2e222f', '#3e3546', '#625565', '#966c6c', '#ab947a', '#694f62', '#7f708a', '#9babb2', '#c7dcd0', '#ffffff',
  '#6e2727', '#b33831', '#ea4f36', '#f57d4a', '#ae2334', '#e83b3b', '#fb6b1d', '#f79617', '#f9c22b', '#7a3045',
  '#9e4539', '#cd683d', '#e6904e', '#fbb954', '#4c3e24', '#676633', '#a2a947', '#d5e04b', '#fbff86', '#165a4c',
  '#239063', '#1ebc73', '#91db69', '#cddf6c', '#313638', '#374e4a', '#547e64', '#92a984', '#b2ba90', '#0b5e65',
  '#0b8a8f', '#0eaf9b', '#30e1b9', '#8ff8e2', '#323353', '#484a77', '#4d65b4', '#4d9be6', '#8fd3ff', '#45293f',
  '#6b3e75', '#905ea9', '#a884f3', '#eaaded', '#753c54', '#a24b6f', '#cf657f', '#ed8099', '#831c5d', '#c32454',
  '#f04f78', '#f68181', '#fca790', '#fdcbb0',
]
/** Names for the palette entries this file uses (every value is one of R64). */
const P = {
  ink: '#2e222f', night: '#3e3546', dusk: '#625565', clay: '#966c6c', sand: '#ab947a', plum: '#694f62', mauve: '#7f708a', mist: '#9babb2', cloud: '#c7dcd0', white: '#ffffff',
  blood: '#6e2727', red: '#b33831', scarlet: '#ea4f36', coral: '#f57d4a', crimson: '#ae2334', rose: '#e83b3b', orange: '#fb6b1d', amber: '#f79617', gold: '#f9c22b',
  wine: '#7a3045', rust: '#9e4539', copper: '#cd683d', tan: '#e6904e', straw: '#fbb954',
  umber: '#4c3e24', olive: '#676633', moss: '#a2a947', lime: '#d5e04b', cream: '#fbff86',
  pine: '#165a4c', green: '#239063', leaf: '#1ebc73', spring: '#91db69', sprout: '#cddf6c',
  slate: '#313638', fern: '#374e4a', sage: '#547e64', lichen: '#92a984', hay: '#b2ba90',
  deep: '#0b5e65', teal: '#0b8a8f', aqua: '#0eaf9b', mint: '#30e1b9', foam: '#8ff8e2',
  navy: '#323353', indigo: '#484a77', blue: '#4d65b4', sky: '#4d9be6', ice: '#8fd3ff',
  grape: '#45293f', violet: '#6b3e75', purple: '#905ea9', lilac: '#a884f3', blush: '#eaaded',
  berry: '#753c54', mulberry: '#a24b6f', pink: '#cf657f', salmon: '#ed8099',
  magenta: '#831c5d', ruby: '#c32454', hot: '#f04f78', peach: '#f68181', apricot: '#fca790', skin: '#fdcbb0',
} as const
for (const v of Object.values(P)) if (!R64.includes(v)) throw new Error(`not in Resurrect 64: ${v}`)

// ---------- the frame: 480 by 75 art pixels, shown at S screen pixels per art pixel ----------
export const AW = 480, AH = 75, S = 2
const FEET = 63

// ---------- pixel buffers ----------
type Col = string | undefined
export class Px {
  c: Col[]
  constructor(public w: number, public h: number, fill?: string) { this.c = new Array(w * h).fill(fill) }
  get(x: number, y: number): Col { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.c[y * this.w + x] : undefined }
  set(x: number, y: number, c: Col) { if (x >= 0 && y >= 0 && x < this.w && y < this.h && Number.isInteger(x) && Number.isInteger(y)) this.c[y * this.w + x] = c }
  rect(x: number, y: number, w: number, h: number, c: string) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c) }
  blit(src: Px, x: number, y: number) { for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) { const c = src.c[j * src.w + i]; if (c !== undefined) this.set(x + i, y + j, c) } }
  map(f: (c: string, x: number, y: number) => Col) { const o = new Px(this.w, this.h); for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) { const c = this.get(i, j); if (c !== undefined) o.set(i, j, f(c, i, j)) } return o }
  flip() { const o = new Px(this.w, this.h); for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) o.set(this.w - 1 - i, j, this.get(i, j)); return o }
  colors() { return new Set(this.c.filter((c): c is string => c !== undefined)).size }
  png() { return encodePng(this.w, this.h, this.c) }
}

/** A sprite from rows of keys; '.' and ' ' are clear. */
const spr = (rows: string[], keys: Record<string, string>) => {
  const w = Math.max(...rows.map(r => r.length)), px = new Px(w, rows.length)
  rows.forEach((r, y) => [...r].forEach((k, x) => { if (k === '.' || k === ' ') return; const c = keys[k]; if (!c) throw new Error(`no key ${k}`); px.set(x, y, c) }))
  return px
}
/** Grow a sprite by n pixels on every side (room for the outline). */
const pad = (p: Px, n = 1) => { const o = new Px(p.w + n * 2, p.h + n * 2); o.blit(p, n, n); return o }
/**
 * Selective outline: every clear pixel touching the sprite gets an outline. Below and right of the sprite (the shadow side for
 * light from the upper left) it is the ink color; above and left it is the dark of that part's own ramp, so lit edges stay soft.
 */
const outline = (p: Px, dark: (c: string) => string, ink: string = P.ink) => {
  const o = pad(p)
  const src = pad(p)
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
    if (src.get(x, y) !== undefined) continue
    const below = src.get(x, y + 1), right = src.get(x + 1, y), above = src.get(x, y - 1), left = src.get(x - 1, y)
    if (above !== undefined || left !== undefined) o.set(x, y, ink)
    else if (below !== undefined) o.set(x, y, dark(below))
    else if (right !== undefined) o.set(x, y, dark(right))
  }
  return o
}
/** Remove lone pixels: a pixel whose four neighbours all share one other color takes that color. */
const despeckle = (p: Px) => {
  const o = p.map(c => c)
  for (let y = 1; y < p.h - 1; y++) for (let x = 1; x < p.w - 1; x++) {
    const c = p.get(x, y), n = [p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1), p.get(x, y + 1)]
    if (c !== undefined && n.every(v => v !== undefined && v === n[0]) && n[0] !== c) o.set(x, y, n[0])
  }
  return o
}

// ---------- bitmap font: 5 rows, proportional, caps, digits and a few marks ----------
const GLYPHS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'], G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['#', '#', '#', '#', '#'], J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.##.', '#..#', '#..#', '#..#', '.##.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.##.', '#..#', '#..#', '#.#.', '.#.#'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#...#', '#...#', '.#.#.', '.#.#.', '..#..'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'], 3: ['###', '..#', '.##', '..#', '###'],
  4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'], 6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '##.'],
  '(': ['.#', '#.', '#.', '#.', '.#'], ')': ['#.', '.#', '.#', '.#', '#.'], ',': ['.', '.', '.', '#', '#'], '!': ['#', '#', '#', '.', '#'], '·': ['.', '.', '#', '.', '.'], '%': ['#.#', '..#', '.#.', '#..', '#.#'], '-': ['..', '..', '##', '..', '..'], ':': ['.', '#', '.', '#', '.'],
}
export const textWidth = (s: string) => [...s.toUpperCase()].reduce((w, ch, i) => w + (ch === ' ' ? 2 : (GLYPHS[ch]?.[0]?.length ?? 2)) + (i ? 1 : 0), 0)
/** Draw text with an optional one pixel drop shadow (down only, so letters keep their shape), or a full one pixel outline for numbers that float over any background. */
const text = (px: Px, s: string, x: number, y: number, col: string, shadow?: string, ring = false) => {
  const draw = (ox: number, oy: number, c: string) => {
    let cx = x
    for (const ch of s.toUpperCase()) {
      if (ch === ' ') { cx += 3; continue }
      const g = GLYPHS[ch]
      if (!g) throw new Error(`no glyph ${ch}`)
      g.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') px.set(cx + i + ox, y + j + oy, c) }))
      cx += (g[0]?.length ?? 0) + (ring ? 2 : 1) // outlined digits need a wider gap or their outlines join
    }
  }
  if (shadow) for (const [ox, oy] of ring ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[0, 1]]) draw(ox!, oy!, shadow)
  draw(0, 0, col)
}

// ======================= sprites =======================
// Light comes from the upper left in both variants; the dusk variant remaps colors and adds a warm rim on the sun side.

/** Colored outline for each fill color (the darkest step of its ramp). */
const DARK: Record<string, string> = {
  [P.skin]: P.copper, [P.apricot]: P.copper, [P.tan]: P.rust, [P.copper]: P.wine,
  [P.rust]: P.blood, [P.wine]: P.grape, [P.blood]: P.grape, [P.red]: P.blood, [P.scarlet]: P.blood, [P.coral]: P.red,
  [P.sky]: P.navy, [P.blue]: P.navy, [P.indigo]: P.navy, [P.navy]: P.ink, [P.ice]: P.blue,
  [P.mauve]: P.night, [P.dusk]: P.night, [P.night]: P.ink, [P.grape]: P.ink,
  [P.cloud]: P.dusk, [P.mist]: P.dusk, [P.white]: P.mist,
  [P.gold]: P.rust, [P.amber]: P.rust, [P.straw]: P.copper, [P.cream]: P.amber,
  [P.sprout]: P.green, [P.spring]: P.green, [P.leaf]: P.pine, [P.green]: P.pine, [P.pine]: P.ink,
  [P.lilac]: P.violet, [P.purple]: P.grape, [P.violet]: P.grape, [P.blush]: P.purple,
  [P.foam]: P.teal, [P.mint]: P.teal, [P.aqua]: P.deep, [P.teal]: P.deep, [P.deep]: P.ink,
  [P.rose]: P.blood, [P.crimson]: P.blood, [P.orange]: P.rust,
  [P.sand]: P.clay, [P.clay]: P.plum, [P.plum]: P.ink,
}
const darkOf = (c: string) => DARK[c] ?? P.ink

/** The hero: an original human adventurer facing the camera, mid-swing with the sword raised toward the foes (D29). */
export const heroSprite = () => {
  const K = {
    h: P.rust, H: P.copper, I: P.tan, j: P.blood, // hair
    S: P.skin, s: P.apricot, k: P.tan, e: P.navy, m: P.pink, // face
    X: P.ice, B: P.sky, b: P.blue, d: P.indigo, D: P.navy, // tunic
    R: P.scarlet, r: P.red, q: P.blood, // cape
    w: P.wine, y: P.gold, Y: P.amber, // belt
    P: P.mauve, p: P.dusk, t: P.night, // trousers
    U: P.copper, u: P.rust, n: P.wine, N: P.grape, // boots, gloves
    L: P.cloud, l: P.mist, g: P.gold, G: P.amber, // sword
  }
  // body: 14 wide; row 0 is the top of the hair, row 35 the soles
  const body = spr([
    '.....hhhh.....',
    '....hHHIHh....',
    '....HSSSSh....',
    '....SeSSes....',
    '....SSSSSs....',
    '.....SSsk.....',
    '......sk......',
    '...BBBBbbb....',
    '..BBBXBbbbb...',
    '.rBBBBBbbbdr..',
    '.rBBBBbbbbdr..',
    '.rBBBBbbbbdr..',
    '.rBbBBbbbddr..',
    '.rbBBbbbbddq..',
    '.rbBBbbbbddq..',
    '.rwwwwyYwwwq..',
    '.rbBBbbbbddq..',
    '.qbBbbbbbddq..',
    '.qbbbbbbbddq..',
    '..PPpt.Pppt...',
    '..PPpt.Pppt...',
    '..PPpt.Pppt...',
    '..PPpt.Pppt...',
    '..PPpt.Pppt...',
    '..PPPt.PPpt...',
    '..PPpt.Pppt...',
    '..PPpt.Pppt...',
    '..PPpt.Pppt...',
    '..PPpt.Pppt...',
    '..UUUu.UUuu...',
    '..UUuu.Uuun...',
    '..Uuuu.uuun...',
    '..Uuun.uunn...',
    '.UUuun.uunnn..',
    '.nnnnn.nnnNN..',
  ], K)
  // raised sword arm and sword, in body coordinates (x right, y down; the blade tip is 13 rows above the hair)
  const arm = spr([
    '..........L..',
    '..........Ll.',
    '.........Ll..',
    '.........Ll..',
    '.........Ll..',
    '........Ll...',
    '........Ll...',
    '........Ll...',
    '.......Ll....',
    '.......Ll....',
    '.......Ll....',
    '......gggG...',
    '.......UUu...',
    '.......Uuu...',
    '......Uu.....',
    '......Uu.....',
    '.....Uu......',
    '....bBb......',
    '...Bbb.......',
    '..Bbb........',
    'bbbb.........',
    'bbb..........',
  ], K)
  const shield = spr([
    '..LLl..',
    '.LUUUl.',
    'LUUyUul',
    'LUyyyul',
    'LUUyuul',
    'lUuuuul',
    '.luuul.',
    '..lll..',
  ], { L: P.cloud, l: P.mist, U: P.copper, u: P.rust, y: P.gold })
  const top = 13, left = 2
  const fig = new Px(left + 25, top + 35)
  fig.blit(body, left, top)
  fig.blit(arm, left + 8, top - 13)
  fig.blit(shield, left - 2, top + 9)
  return { px: outline(fig, darkOf), headRows: 7, feetX: left + 1 + 7 }
}

// ---------- hero kit (task-26): figures drawn as parts, shaded from the upper left ----------
/** One material: deep (its outline on the lit side), shadow, base, light, an optional highlight for metal and hair, a shadow width and a light width. */
type Ramp = { deep: string; shade: string; base: string; light: string; hi?: string; wide?: number; lw?: number }
const ramp = (deep: string, shade: string, base: string, light: string, hi?: string, wide?: number, lw?: number): Ramp => ({ deep, shade, base, light, hi, wide, lw })

/** A figure as part letters per pixel; a lower case letter is the same part forced into shadow (folds, creases). */
class Fig {
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
const shadeFig = (f: Fig, ramps: Record<string, Ramp>, order: string, marks: [number, number, string][] = [], inked = '') => {
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
type Hero = { px: Px; feetX: number; headTop: number; chin: number; soles: number; tones?: Record<string, number> }

const SKIN = ramp(P.rust, P.tan, P.apricot, P.skin)
const STEEL = ramp(P.night, P.mauve, P.mist, P.cloud, P.white)
const GOLD = ramp(P.rust, P.amber, P.gold, P.cream)
const LEATHER = ramp(P.grape, P.wine, P.rust, P.copper, P.tan)
const SOLE = ramp(P.ink, P.ink, P.night, P.dusk)

/** The shared skeleton (task-26 heroes): head rows 13 to 20 (8 of 44), body center column 14, soles on row 56. */
const SK = { c: 14, top: 13, chin: 20, soles: 56 }
/** Face part F (rows 16 to 20) and neck N; the hair or helm goes over the top. */
const faceParts = (f: Fig) => f.spans('N', [[21, 13, 15]]).spans('F', [[14, 15, 11, 17], [16, 19, 11, 17], [20, 12, 16]])
/** Eyes, nose shadow and mouth on the face. */
const faceMarks = (eye: string = P.navy): [number, number, string][] => [[12, 17, eye], [12, 18, P.ink], [16, 17, eye], [16, 18, P.ink], [15, 18, P.tan], [13, 19, P.tan], [14, 19, P.rust]]
/** Legs L and M (thigh to ankle), knees marked by a crease only. */
const legParts = (f: Fig) => f.spans('L', [[35, 48, 10, 13]]).spans('M', [[35, 48, 15, 18]]).crease([[42, 11, 12], [42, 16, 17]])
/** Boots: cuffs E and D, shafts and feet K and J with toes turned slightly out, soles Z. */
const bootParts = (f: Fig) =>
  f.spans('E', [[49, 9, 13]]).spans('K', [[50, 52, 10, 13], [53, 55, 9, 13], [54, 55, 8, 8]])
    .spans('D', [[49, 15, 19]]).spans('J', [[50, 52, 15, 18], [53, 55, 15, 19], [54, 55, 20, 20]])
    .spans('Z', [[56, 8, 13], [56, 15, 20]])
/** The raised sword arm: sleeve X from the right shoulder up to the wrist, fist G beside the head, guard Y, blade W (tip on row 3). */
const swordArm = (f: Fig, tip = 3) =>
  f.spans('X', [[22, 19, 22], [21, 20, 23], [20, 21, 24], [18, 19, 22, 24]])
    .spans('G', [[17, 22, 24], [14, 16, 21, 24]]).crease([[15, 22], [15, 24]])
    .spans('Y', [[13, 20, 26]]).spans('W', [[tip + 1, 12, 22, 24], [tip, 23, 23]])
const fistMarks: [number, number, string][] = [[21, 15, P.tan], [21, 14, P.copper]]
const hero = (f: Fig, ramps: Record<string, Ramp>, order: string, marks: [number, number, string][], inked = 'AXG'): Hero => {
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
const BOOTS = { K: LEATHER, J: LEATHER, E: LEATHER, D: LEATHER, Z: SOLE, G: LEATHER }

/** H1 swordsman: chestnut hair, blue tunic with a collar trim and a belt, red cape with a dark lining, round wooden shield, sword raised beside the head. */
const heroH1 = (): Hero => {
  const f = new Fig(30, 57), c = SK.c
  // cape behind the body: red at both sides, the dark lining between the legs
  for (let y = 22; y <= 45; y++) { const half = 6 + Math.floor((y - 22) / 12); f.spans('C', [[y, c - half, c + half]]) }
  f.spans('V', [[36, 44, 13, 15]])
  legParts(f); bootParts(f); faceParts(f)
  f.spans('T', [[22, 10, 18], [23, 26, 8, 20], [27, 28, 9, 19], [29, 30, 10, 18], [32, 10, 18], [33, 35, 9, 19]])
  f.spans('Q', [[22, 12, 16]])
  f.spans('B', [[31, 10, 18]]).spans('Y', [[31, 13, 15]])
  f.spans('A', [[23, 24, 6, 8], [25, 26, 5, 7]])
  f.spans('H', [[13, 12, 16], [14, 11, 17], [15, 10, 18], [16, 18, 10, 10], [16, 19, 18, 18], [16, 12, 12], [16, 15, 15]])
  swordArm(f)
  f.disc(6.5, 31, 4.6, 'R').disc(6.5, 31, 3.6, 'S').disc(7, 32, 1.1, 'O')
  // folds: sternum and chest underside, two hem folds; hair partings; shield planks
  f.crease([[24, 14], [25, 14], [27, 10, 18], [33, 12], [34, 12], [35, 12], [33, 16], [34, 16], [35, 16], [14, 14], [15, 13], [15, 16], [28, 4], [29, 4], [30, 4], [33, 4], [34, 4], [28, 9], [29, 9], [33, 9], [34, 9]])
  const ramps: Record<string, Ramp> = {
    V: ramp(P.ink, P.grape, P.wine, P.berry), C: ramp(P.grape, P.blood, P.red, P.scarlet, undefined, 2, 1),
    L: ramp(P.ink, P.night, P.dusk, P.mauve), M: ramp(P.ink, P.night, P.dusk, P.mauve), ...BOOTS,
    N: ramp(P.wine, P.copper, P.tan, P.apricot), F: ramp(P.rust, P.tan, P.apricot, P.skin, undefined, 1, 2), H: ramp(P.grape, P.blood, P.rust, P.copper, P.tan),
    T: ramp(P.navy, P.indigo, P.blue, P.sky, undefined, 2, 3), A: ramp(P.navy, P.indigo, P.blue, P.sky), X: ramp(P.navy, P.indigo, P.blue, P.sky),
    Q: ramp(P.dusk, P.mauve, P.mist, P.cloud), B: ramp(P.ink, P.grape, P.blood, P.rust), Y: GOLD, W: STEEL,
    R: STEEL, S: ramp(P.grape, P.wine, P.rust, P.copper), O: GOLD,
  }
  return hero(f, ramps, 'CVLMEKDJZNTQBAFHXGYWRSO', [...faceMarks(), ...fistMarks, [12, 14, P.tan], [13, 13, P.copper], [11, 15, P.copper]])
}

/** H2 light knight: steel half helm with a gold band, breastplate and pauldrons over a teal tunic, red kite shield with a gold cross. */
const heroH2 = (): Hero => {
  const f = new Fig(30, 57)
  legParts(f); bootParts(f); faceParts(f)
  f.spans('T', [[22, 10, 18], [23, 26, 8, 20], [27, 30, 9, 19], [32, 10, 18], [33, 35, 9, 19]])
  f.spans('B', [[31, 10, 18]]).spans('Y', [[31, 14, 14]])
  f.spans('P', [[22, 11, 17], [23, 26, 9, 19], [27, 29, 10, 18], [30, 11, 17]]).crease([[24, 15], [25, 15], [26, 15], [27, 15], [28, 15], [29, 15]])
  f.spans('A', [[25, 26, 6, 8], [27, 28, 5, 7]])
  f.spans('U', [[13, 12, 16], [14, 11, 17], [15, 10, 18], [17, 18, 10, 10], [17, 18, 18, 18]]).spans('Y', [[16, 10, 18]]).crease([[13, 15], [14, 15]])
  swordArm(f)
  f.spans('I', [[22, 6, 9], [23, 5, 9], [24, 5, 8]]).spans('O', [[21, 19, 21], [22, 18, 22], [23, 19, 22]])
  f.spans('R', [[25, 31, 2, 10], [32, 33, 3, 9], [34, 4, 8], [35, 5, 7], [36, 6, 6]])
  f.spans('S', [[26, 31, 3, 9], [32, 33, 4, 8], [34, 5, 7], [35, 6, 6]]).spans('Q', [[27, 33, 6, 6], [29, 4, 8]])
  f.crease([[33, 12], [34, 12], [35, 12], [33, 16], [34, 16], [35, 16]])
  const ARMOR = ramp(P.night, P.dusk, P.mauve, P.mist, P.cloud, 2, 2)
  const ramps: Record<string, Ramp> = {
    L: ramp(P.ink, P.night, P.dusk, P.mauve), M: ramp(P.ink, P.night, P.dusk, P.mauve), ...BOOTS,
    N: ramp(P.wine, P.copper, P.tan, P.apricot), F: ramp(P.rust, P.tan, P.apricot, P.skin, undefined, 1, 2),
    T: ramp(P.ink, P.deep, P.teal, P.aqua, undefined, 2, 3), A: ramp(P.ink, P.deep, P.teal, P.aqua), X: ramp(P.ink, P.deep, P.teal, P.aqua),
    B: ramp(P.ink, P.grape, P.blood, P.rust), Y: GOLD, W: STEEL, P: ARMOR, U: ramp(P.night, P.mauve, P.mist, P.cloud, P.white, 1, 2),
    I: ramp(P.night, P.mauve, P.mist, P.cloud, P.white), O: ramp(P.night, P.mauve, P.mist, P.cloud, P.white),
    R: GOLD, S: ramp(P.grape, P.wine, P.crimson, P.rose), Q: GOLD,
  }
  const ridge: [number, number, string][] = [24, 25, 26, 27, 28].map(y => [14, y, P.cloud])
  return hero(f, ramps, 'LMEKDJZNTBPAFUXGYWIORSQ', [...faceMarks(), ...fistMarks, ...ridge, [12, 22, P.gold], [13, 22, P.gold], [14, 22, P.gold], [15, 22, P.amber], [16, 22, P.amber], ...[5, 6, 7, 8, 9].map((x): [number, number, string] => [x, 24, x < 7 ? P.gold : P.amber]), ...[18, 19, 20, 21, 22].map((x): [number, number, string] => [x, 23, P.amber])], 'AXGIO')
}

/** H3 ranger: blond hair, green hood down on the shoulders, red scarf, green tunic with a strap and a pouch, short sword raised, free hand at the side. */
const heroH3 = (): Hero => {
  const f = new Fig(30, 57)
  f.spans('C', [[21, 9, 19], [22, 8, 20], [23, 8, 20]])
  legParts(f); bootParts(f); faceParts(f)
  f.spans('T', [[22, 10, 18], [23, 26, 8, 20], [27, 28, 9, 19], [29, 30, 10, 18], [32, 10, 18], [33, 35, 9, 19]])
  for (let y = 23; y <= 30; y++) f.spans('P', [[y, 18 - (y - 23), 19 - (y - 23)]])
  f.spans('B', [[31, 10, 18]]).spans('Y', [[31, 14, 14]]).spans('O', [[32, 34, 16, 17]])
  f.spans('A', [[23, 24, 6, 8], [25, 28, 5, 7]]).spans('I', [[29, 30, 5, 7]]).spans('V', [[31, 32, 5, 7]])
  f.spans('S', [[22, 11, 17], [23, 12, 16], [24, 27, 11, 12], [28, 11, 11]])
  f.spans('H', [[13, 12, 16], [14, 11, 17], [15, 10, 18], [16, 18, 10, 10], [16, 18, 18, 18], [16, 11, 11], [16, 13, 13], [16, 16, 16]])
  swordArm(f, 6)
  f.crease([[33, 12], [34, 12], [35, 12], [33, 15], [34, 15], [35, 15], [14, 14], [15, 12], [15, 16], [23, 14]])
  const ramps: Record<string, Ramp> = {
    C: ramp(P.ink, P.pine, P.green, P.leaf), L: ramp(P.ink, P.plum, P.clay, P.sand), M: ramp(P.ink, P.plum, P.clay, P.sand), ...BOOTS,
    N: ramp(P.wine, P.copper, P.tan, P.apricot), F: ramp(P.rust, P.tan, P.apricot, P.skin, undefined, 1, 2), H: ramp(P.rust, P.tan, P.straw, P.cream, P.white),
    T: ramp(P.ink, P.pine, P.green, P.leaf, undefined, 2, 3), A: ramp(P.ink, P.pine, P.green, P.leaf), X: ramp(P.ink, P.pine, P.green, P.leaf),
    P: LEATHER, B: ramp(P.ink, P.grape, P.blood, P.rust), Y: GOLD, O: LEATHER, I: LEATHER, V: ramp(P.rust, P.tan, P.apricot, P.skin),
    S: ramp(P.blood, P.red, P.scarlet, P.coral), W: STEEL,
  }
  return hero(f, ramps, 'CLMEKDJZNTPBYOAIVFSHXGW', [...faceMarks(), ...fistMarks, [5, 31, P.skin], [6, 32, P.tan]], 'AXGIVS')
}

/** H4 spellblade: dark hair with a lilac sheen, long violet coat with a high collar and a crimson lining, glowing blade, a spark in the open hand. */
const heroH4 = (): Hero => {
  const f = new Fig(30, 57)
  f.spans('Q', [[19, 21, 10, 11], [19, 21, 17, 18]])
  legParts(f); bootParts(f); faceParts(f)
  f.spans('S', [[22, 30, 12, 16], [32, 12, 16]])
  f.spans('C', [[22, 10, 12], [22, 16, 18], [23, 26, 8, 12], [23, 26, 16, 20], [27, 30, 9, 12], [27, 30, 16, 19], [32, 36, 8, 12], [32, 36, 16, 20], [37, 44, 7, 11], [37, 44, 17, 21]])
  f.spans('V', [[23, 30, 12, 12], [32, 44, 12, 12], [37, 44, 11, 11]])
  f.spans('B', [[31, 9, 19]]).spans('Y', [[31, 14, 14]])
  f.spans('A', [[23, 24, 6, 8], [25, 28, 5, 7]]).spans('U', [[29, 30, 5, 7]])
  f.spans('H', [[13, 12, 16], [14, 11, 17], [15, 10, 18], [16, 19, 10, 10], [16, 19, 18, 18], [16, 11, 13], [16, 16, 16]])
  swordArm(f)
  f.crease([[14, 14], [15, 15], [34, 9], [35, 9], [36, 9], [38, 9], [39, 9], [40, 9], [34, 18], [35, 18], [36, 18], [38, 19], [39, 19], [40, 19]])
  const COAT = ramp(P.grape, P.violet, P.purple, P.lilac, undefined, 2, 2)
  const ramps: Record<string, Ramp> = {
    Q: ramp(P.violet, P.purple, P.lilac, P.blush), L: ramp(P.ink, P.night, P.dusk, P.mauve), M: ramp(P.ink, P.night, P.dusk, P.mauve),
    K: ramp(P.ink, P.night, P.plum, P.clay, P.sand), J: ramp(P.ink, P.night, P.plum, P.clay, P.sand), E: ramp(P.ink, P.night, P.plum, P.clay), D: ramp(P.ink, P.night, P.plum, P.clay), Z: SOLE, G: ramp(P.ink, P.night, P.plum, P.clay),
    N: ramp(P.wine, P.copper, P.tan, P.apricot), F: ramp(P.rust, P.tan, P.apricot, P.skin, undefined, 1, 2), H: ramp(P.ink, P.navy, P.indigo, P.blue, P.sky),
    S: ramp(P.dusk, P.mauve, P.mist, P.cloud), C: COAT, A: ramp(P.grape, P.violet, P.purple, P.lilac), X: ramp(P.grape, P.violet, P.purple, P.lilac),
    V: ramp(P.ink, P.grape, P.wine, P.mulberry), B: ramp(P.ink, P.grape, P.blood, P.rust), Y: GOLD, U: ramp(P.rust, P.tan, P.apricot, P.skin),
    W: ramp(P.deep, P.teal, P.mint, P.foam, P.white),
  }
  const spark: [number, number, string][] = [[3, 26, P.foam], [2, 27, P.mint], [3, 27, P.white], [4, 27, P.mint], [3, 28, P.foam], [1, 27, P.aqua], [5, 27, P.aqua], [3, 25, P.aqua]]
  return hero(f, ramps, 'QLMEKDJZNSCVBAUFHXGYW', [...faceMarks(P.purple), ...fistMarks, ...spark, [14, 24, P.gold], [14, 27, P.gold], [14, 33, P.gold]], 'AXGU')
}

/** The task-25 hero in the same shape, as the "before". */
const heroR7 = (): Hero => { const h = heroSprite(); return { px: h.px, feetX: h.feetX, headTop: 14, chin: 19, soles: 48 } }
const HEROES = { R7: heroR7, H1: heroH1, H2: heroH2, H3: heroH3, H4: heroH4 } as const
type HeroId = keyof typeof HEROES

/** Slime: a glossy green dome looking left, with a small smile. */
const slime = () => outline(spr([
  '.......GGGGgg.......',
  '.....GGHHGGgggg.....',
  '....GHHHGGgggggg....',
  '...GHHGGgggggggggd..',
  '..GHHGGggggggggggdd.',
  '..GHGGgggggggggggdd.',
  '.GGggLeggggggLegdddd',
  '.GGggeeggggggeegdddd',
  '.Ggggeeggggggeegdddd',
  'Gggggggggggggggggddd',
  'gggggggmggmggggggddd',
  'ggggggggmmgggggggddD',
  'dggggggggggggggdddDD',
  '.ddgggggggggggdddDD.',
  '..DDDDDDDDDDDDDDDD..',
], { H: P.sprout, G: P.spring, g: P.leaf, d: P.green, D: P.pine, e: P.ink, L: P.cloud, m: P.pine }), darkOf)

/** Mushroom: a red-capped walker with a grumpy face. */
const mushroom = () => outline(spr([
  '......rrRRRr......',
  '....rRRRooRRrr....',
  '...rRRRooooRRrq...',
  '..rRooRRooRRrrqq..',
  '.rRooooRRRRrrrrqq.',
  '.rRRooRRRRroorqqq.',
  'rRRRRRRRRrroooqqqq',
  'rrRRRRRrrrrroqqqqq',
  'qrrrrrrrrrrrqqqqqq',
  '.qwwwwwwwwwwwwwwq.',
  '....kSSSSSsssk....',
  '....SSSSSSsssk....',
  '....SbbSSbbssk....',
  '....SeSSSSessk....',
  '....SeSSSSessk....',
  '....SSSSSSsssk....',
  '....SSSmmmsssk....',
  '.....SSSSSsskk....',
  '....UUUu..UUuu....',
  '....uuun..uunn....',
], { R: P.scarlet, r: P.red, q: P.blood, o: P.skin, S: P.skin, s: P.apricot, k: P.tan, e: P.ink, b: P.wine, m: P.wine, w: P.clay, U: P.copper, u: P.rust, n: P.wine }), darkOf)

/** Bat: wings spread, hovering, small fangs. */
const bat = () => outline(spr([
  '............P....P..........',
  '............PP..PP..........',
  '...vvv......PPPPPP......vvv.',
  '..vLLPv....PPPPPPPP....vPPpv',
  '.vLLPPPv...PeLPPeLP...vPPPpv',
  'vLLPPPPPv..PPPPPPPP..vPPPPpv',
  'vLPPPPPPPv.PPPffPPp.vPPPPPpv',
  'vLPPPPPPPPvPPPPPPPpvPPPPPPpv',
  'vPPPPPPPPPPPPPPPPPpPPPPPPPpv',
  '.vPPPPvPPPPvpPPPPpvPPPPvPPv.',
  '..vPPv.vPPv.vpPPpv.vPPv.vv..',
  '...vv...vv...vppv...vv......',
  '..............vv............',
], { P: P.purple, p: P.violet, v: P.grape, L: P.lilac, e: P.rose, f: P.cloud }), darkOf)

/** Phantom (the rare elite): a crowned teal wraith with red eyes, reaching wisps and a curling tail. */
const phantom = () => outline(spr([
  '.....g..g..g......',
  '.....gggggggg.....',
  '.....GgYgGgYG.....',
  '....ffffffffff....',
  '...fFFFFFffffaa...',
  '..fFFFFFFfffaaaa..',
  '..fFFFFFffffaaaa..',
  '..fFeeFFFeefaaaa..',
  '..fFerFFFerfaaaa..',
  '..fFFFFFFfffaaaa..',
  '..fFFFFFffffaaat..',
  '..ffFFFFfffaaaat..',
  '.ffFFFFFfffaaatt..',
  'ff.fFFFffffaaattt.',
  'f..ffFFfffaaatttt.',
  '....ffffaaaatttt..',
  '.....ffaaaattttt..',
  '......faaattt.tt..',
  '.......aattt...t..',
  '........att.......',
  '.........tt.......',
  '..........t.......',
], { g: P.gold, G: P.amber, Y: P.rose, F: P.foam, f: P.mint, a: P.aqua, t: P.teal, e: P.ink, r: P.rose }), darkOf)

/** Ring loot: a gold signet with a blue stone. */
const ring = () => outline(spr([
  '.bB.',
  'gBbg',
  'g..G',
  'g..G',
  '.GG.',
], { b: P.blue, B: P.ice, g: P.gold, G: P.amber }), darkOf)
const glint = () => spr(['...w...', '...c...', '...c...', 'wccWccw', '...c...', '...c...', '...w...'], { w: P.gold, c: P.cream, W: P.white })
const spark = () => spr([
  '...y...',
  '.y.c.y.',
  '..ccc..',
  'ycWWWcy',
  '..ccc..',
  '.y.c.y.',
  '...y...',
], { y: P.gold, c: P.cream, W: P.white })

/** A thick stroke along points: radius from r0 to r1, color from the side of the stroke facing the light. */
const stroke = (px: Px, pts: [number, number][], r0: number, r1: number, col: (side: number, t: number) => string) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]!, [bx, by] = pts[i + 1]!
    const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 3))
    for (let k = 0; k <= n; k++) {
      const t = (i + k / n) / (pts.length - 1), r = r0 + (r1 - r0) * t
      const x = ax + (bx - ax) * (k / n), y = ay + (by - ay) * (k / n)
      const nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1
      for (let j = Math.floor(y - r - 1); j <= y + r + 1; j++) for (let q = Math.floor(x - r - 1); q <= x + r + 1; q++) {
        const dx = q + 0.5 - x, dy = j + 0.5 - y
        if (dx * dx + dy * dy <= r * r) px.set(q, j, col((dx * nx + dy * ny) / nl / Math.max(r, 0.5), t))
      }
    }
  }
}

/** Mephisto the Monorepo: a tall horned demon sorcerer in a robe, a flame raised toward the hero, a staff in the other hand. */
const bossSprite = () => {
  const px = new Px(50, 58), c = 27, top = 12
  // staff behind the right side: a dark shaft with a violet gem in a gold cradle
  for (let y = top + 2; y < 58; y++) { px.set(c + 15, y, P.wine); px.set(c + 16, y, P.grape) }
  const gem = spr(['.g.g.', 'gLlvg', 'glvvg', '.gvg.', '..g..'], { g: P.amber, L: P.blush, l: P.lilac, v: P.purple })
  px.blit(gem, c + 13, top - 3)
  // robe: shoulders at top + 15, a flared hem; lit band on the left, two folds, dark right side
  for (let y = top + 15; y < 58; y++) {
    const t = (y - top - 15) / (57 - top - 15), half = Math.round(10 + t * 9 + (t > 0.85 ? (t - 0.85) * 18 : 0))
    for (let x = c - half; x < c + half; x++) {
      const u = (x - (c - half)) / (half * 2)
      let col: string = u < 0.12 ? P.lilac : u < 0.26 ? P.purple : u < 0.68 ? P.violet : P.grape
      const fold1 = Math.round(c - 5 - t * 4), fold2 = Math.round(c + 4 + t * 5)
      if (x === fold1 || x === fold2) col = P.grape
      if (x === fold1 - 1 && t > 0.15) col = P.purple
      px.set(x, y, col)
    }
  }
  // center opening with gold trim down to the hem
  for (let y = top + 19; y < 58; y++) { const w = 1 + Math.floor((y - top - 19) / 9); for (let x = c - w; x < c + w; x++) px.set(x, y, P.berry); px.set(c - w - 1, y, P.gold); px.set(c + w, y, P.amber) }
  // sash with a clasp, hem trim
  for (let x = c - 12; x < c + 12; x++) if (px.get(x, top + 22)) { px.set(x, top + 22, x < c ? P.gold : P.amber); px.set(x, top + 23, P.rust) }
  px.rect(c - 1, top + 21, 3, 4, P.gold); px.set(c + 1, top + 24, P.amber); px.set(c - 1, top + 21, P.cream)
  for (let x = 0; x < 50; x++) if (px.get(x, 57) && px.get(x, 57) !== P.wine && px.get(x, 57) !== P.grape) px.set(x, 57, x < c ? P.gold : P.amber)
  // high collar behind the head
  for (let y = top; y < top + 16; y++) for (let x = c - 10; x <= c + 10; x++) { const dx = x + 0.5 - c, dy = y - top - 16; if (dx * dx / 100 + dy * dy / 196 <= 1) px.set(x, y, dx < -6 ? P.purple : dx < 0 ? P.violet : P.grape) }
  // pauldrons with gold rims
  for (const sx of [-1, 1]) for (let y = top + 10; y < top + 19; y++) for (let x = c + sx * 10 - 6; x < c + sx * 10 + 6; x++) {
    const dx = x + 0.5 - (c + sx * 10), dy = y + 0.5 - (top + 16)
    if (dx * dx + dy * dy * 1.7 <= 30 && dy < 2.5) px.set(x, y, dy < -2.6 ? (sx < 0 && dx < 1 ? P.gold : P.amber) : dx < -1.5 ? P.purple : sx < 0 ? P.violet : P.grape)
  }
  // head: lit from the left, heavy brow, glowing eyes, fangs, a dark pointed beard
  const head = spr([
    '..KKKkkkj..',
    '.KKKkkkkkj.',
    'KKKkkkkkkjj',
    'KKkkkkkkkjJ',
    'Kkoookooojj',
    'kkyYkkkyYjJ',
    'kkkkkkkkkjJ',
    'Kkkkk.kkkjj',
    'kkoooooookJ',
    'kkfkkkkfkjJ',
    '.kkkkkkkjJ.',
    '..bbbbbbb..',
    '...bbbbb...',
    '....bbb....',
    '.....b.....',
  ], { K: P.scarlet, k: P.red, j: P.blood, J: P.wine, o: P.blood, y: P.gold, Y: P.cream, f: P.cloud, b: P.grape })
  head.set(5, 7, P.blood)
  px.blit(head, c - 5, top + 2)
  // horns: from the top of the head up and out, curling down at the tips
  for (const sx of [-1, 1]) {
    const pts: [number, number][] = [[c + sx * 3.5, top + 3], [c + sx * 7, top - 2], [c + sx * 10.5, top - 5], [c + sx * 14.5, top - 5.5], [c + sx * 17, top - 3], [c + sx * 17.5, top]]
    stroke(px, pts, 2.8, 0.7, (side, t) => { const lit = side * sx < 0; return t > 0.86 ? P.cloud : lit ? (side * sx < -0.45 ? P.cloud : P.sand) : side * sx > 0.45 ? P.plum : P.clay })
  }
  // raised arm toward the hero: a wide bell sleeve with gold cuff, a red hand, a flame above it
  stroke(px, [[c - 10, top + 15], [c - 15, top + 10], [c - 18, top + 5]], 3.2, 2.4, side => (side > 0.25 ? P.grape : side < -0.45 ? P.lilac : P.purple))
  for (let i = -2; i <= 2; i++) px.set(c - 18 + i, top + 3 + Math.round(i * 0.4), i < 0 ? P.gold : P.amber)
  px.rect(c - 20, top - 1, 4, 4, P.red); px.set(c - 20, top - 1, P.scarlet); px.set(c - 19, top - 1, P.scarlet); px.set(c - 17, top + 2, P.blood)
  const flame = spr([
    '....r.....',
    '...rr..r..',
    '...rfr.rr.',
    '..rffrrfr.',
    '..rfyffrr.',
    '.rffyYffr.',
    '.rfyYYyfr.',
    'rffyYYyffr',
    'rfyYYYYyfr',
    '.rfyYYyfr.',
    '..rffffr..',
  ], { r: P.orange, f: P.amber, y: P.gold, Y: P.cream })
  px.blit(flame, c - 23, top - 12)
  return outline(despeckle(px), darkOf)
}

// ======================= world =======================
type Variant = 'V1' | 'V2'
type Look = {
  sky: [number, string][] // rows where each sky band starts, top to bottom
  cloud: [string, string, string] // shade, body, lit
  far: [string, string] // mountains: shadow face, lit face
  mid: [string, string, string] // tree line: shadow, body, lit rim
  grass: [string, string] // meadow, its lit edge
  path: [string, string, string] // shadow edge, body, lit
  near: [string, string] // foreground grass, its lit top
  trunk: [string, string]
  canopy: [string, string, string, string] // dark, mid, light, highlight
  shade: (c: string) => string // color under a cast shadow
  sun?: { x: number; y: number }
}
const shadeMap = (pairs: [string, string][]) => { const m = new Map(pairs); return (c: string) => m.get(c) ?? c }

const LOOKS: Record<Variant, Look> = {
  V1: {
    sky: [[0, P.sky], [14, P.ice]],
    cloud: [P.mist, P.cloud, P.skin], // warm lit tops: pure white is kept for sparkles
    far: [P.mist, P.cloud],
    mid: [P.fern, P.sage, P.lichen],
    grass: [P.leaf, P.spring],
    path: [P.clay, P.sand, P.hay],
    near: [P.green, P.leaf],
    trunk: [P.umber, P.olive],
    canopy: [P.pine, P.green, P.leaf, P.spring],
    shade: shadeMap([[P.sand, P.clay], [P.hay, P.sand], [P.clay, P.plum], [P.spring, P.leaf], [P.leaf, P.green], [P.green, P.pine]]),
  },
  V2: {
    sky: [[0, P.violet], [8, P.mulberry], [16, P.pink], [23, P.salmon], [29, P.apricot]],
    cloud: [P.mulberry, P.salmon, P.apricot],
    far: [P.mulberry, P.pink],
    mid: [P.grape, P.berry, P.coral],
    grass: [P.olive, P.moss],
    path: [P.rust, P.copper, P.tan],
    near: [P.umber, P.olive],
    trunk: [P.grape, P.wine],
    canopy: [P.grape, P.fern, P.olive, P.moss],
    shade: shadeMap([[P.copper, P.rust], [P.tan, P.copper], [P.rust, P.wine], [P.moss, P.olive], [P.olive, P.umber], [P.umber, P.slate]]),
    sun: { x: 236, y: 21 },
  },
}

const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

/** Smooth wave for silhouettes (not textures): a sum of sines, deterministic. */
const wave = (x: number, seed: number, f: number) => Math.sin(x * f + seed) * 0.6 + Math.sin(x * f * 2.3 + seed * 1.7) * 0.3 + Math.sin(x * f * 5.1 + seed * 0.3) * 0.1

/** Grass blade cluster depth along an edge: 0, 1 or 2 rows, in runs. */
const blade = (x: number, s: number) => { const k = (x * 7 + s * 13 + Math.floor(x / 9) * 5) % 12; return k < 2 ? 2 : k < 5 ? 1 : 0 }

/** Round clumps drawn back to front, each lit on its upper left, with a dark seam where a front clump overlaps. */
const clumps = (px: Px, list: [number, number, number][], ramp: readonly string[]) => {
  const owner = new Int16Array(px.w * px.h).fill(-1)
  list.forEach(([cx, cy, r], i) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, re = r * (1 + 0.1 * Math.cos(Math.atan2(dy, dx) * 7 + i * 1.3))
      if (dx * dx + dy * dy > re * re || x < 0 || y < 0 || x >= px.w || y >= px.h) continue
      owner[y * px.w + x] = i
      const hx = dx + r * 0.38, hy = dy + r * 0.38, sx = dx + 1.6, sy = dy + 1.6
      let c = ramp[1]!
      if (sx * sx + sy * sy > re * re) c = ramp[0]!
      else if (hx * hx + hy * hy < r * r * 0.12) c = ramp[3]!
      else if (hx * hx + hy * hy < r * r * 0.42) c = ramp[2]!
      px.set(x, y, c)
    }
  })
  for (let y = 0; y < px.h; y++) for (let x = 0; x < px.w; x++) {
    const o = owner[y * px.w + x]!
    if (o < 0) continue
    const up = y > 0 ? owner[(y - 1) * px.w + x]! : -1
    if (up > o) px.set(x, y, ramp[0]!)
  }
}

/** The meadow scene. Width, height and `dy` (rows the ground and trees sit lower than in the 75 row frame, 0 for round 7) let the band layout reuse it. */
const world = (v: Variant, AW = 480, AH = 75, dy = 0) => {
  const L = LOOKS[v], px = new Px(AW, AH), r = rng(v === 'V1' ? 7 : 11)
  // sky: flat bands with one checker row at each seam (the only dither in the frame)
  for (let y = 0; y < AH; y++) {
    let c = L.sky[0]![1]
    for (const [y0, col] of L.sky) if (y >= y0) c = col
    px.rect(0, y, AW, 1, c)
    const next = L.sky.find(([y0]) => y0 === y + 1)
    if (next) for (let x = y & 1; x < AW; x += 2) px.set(x, y, next[1])
  }
  // dusk sun: a low disc in the two lightest warm colors, half behind the mountains
  if (L.sun) for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { const d = x * x + y * y; if (d <= 81) px.set(Math.round(AW * L.sun.x / 480) + x, L.sun.y + (dy >> 1) + y, d <= 36 ? P.cream : P.straw) }
  // clouds: a few flat clumps with a lit top and a straight shaded base
  const clouds = (v === 'V1' ? [[70, 15, 18], [262, 9, 12], [366, 12, 16], [520, 11, 17], [650, 16, 13]] : [[120, 19, 20], [360, 12, 14], [560, 17, 18]]).filter(c => c[0]! < AW + 10)
  for (const [cx, cy, w] of clouds as [number, number, number][]) {
    const bumps: [number, number, number][] = [[cx - w * 0.5, cy, w * 0.32], [cx, cy - 2, w * 0.42], [cx + w * 0.45, cy, w * 0.3]]
    for (let y = cy - w; y <= cy + 2; y++) for (let x = cx - w; x <= cx + w; x++) {
      let inside = false, top = false
      for (const [bx, by, br] of bumps) { const dx = x + 0.5 - bx, dy = (y + 0.5 - by) * 1.6; if (dx * dx + dy * dy <= br * br) { inside = true; const ty = dy + 2.4; top = top || dx * dx + ty * ty > br * br } }
      if (inside) px.set(x, y, y >= cy + 1 ? L.cloud[0] : top ? L.cloud[2] : L.cloud[1])
    }
  }
  // layer 1, far mountains: peaks from a few triangles, faces turned to the light are lit
  const peaks: [number, number, number][] = []
  for (let x = -20; x < AW + 40; x += 34 + Math.floor(r() * 30)) peaks.push([x, 22 + (dy >> 1) + Math.floor(r() * 10), 0.55 + r() * 0.25])
  const hAt = (x: number) => Math.min(...peaks.map(([x0, y0, k]) => y0 + Math.abs(x - x0) * k))
  for (let x = 0; x < AW; x++) {
    const peak = peaks.some(([x0]) => Math.abs(x + 0.5 - x0) < 1.5), top = Math.round(hAt(x)) + (peak ? 1 : 0), lit = hAt(x - 1) > hAt(x + 1)
    for (let y = Math.max(top, 0); y < AH; y++) px.set(x, y, lit && y < top + 14 ? L.far[1] : L.far[0])
  }
  // layer 2, tree line: groups of round crowns and a few pines, darker than the mountains
  const crowns: [number, number, number][] = []
  for (let x = -4; x < AW + 8;) {
    const n = 2 + Math.floor(r() * 4)
    for (let i = 0; i < n; i++) { const cr = 3 + Math.floor(r() * 7); crowns.push([x, 45 + dy - cr * 0.8 - Math.floor(r() * 5), cr]); x += cr * 1.1 + 1 }
    x += 6 + Math.floor(r() * 18)
  }
  for (let x = 0; x < AW; x++) for (let y = 30 + dy; y < AH; y++) {
    let inside = y >= 44 + dy, lit = false
    for (const [cx, cy, cr0] of crowns) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, cr = cr0 * (1 + 0.12 * Math.cos(Math.atan2(dy, dx) * 6 + cx)); if (dx * dx + dy * dy <= cr * cr) { inside = true; const lx = dx + 1.5, ly = dy + 1.5; if (lx * lx + ly * ly > cr * cr && dx < 0.5 && dy < 0.5) lit = true } }
    if (inside) px.set(x, y, lit ? L.mid[2] : y >= 47 + dy ? L.mid[0] : L.mid[1])
  }
  // layer 3, the ground: meadow, path, near grass
  const pathTop = 56 + dy, pathBot = 68 + dy
  for (let x = 0; x < AW; x++) {
    const e0 = blade(x, 1)
    for (let y = 49 + dy - e0; y < AH; y++) px.set(x, y, y === 49 + dy - e0 && e0 > 0 ? L.grass[1] : L.grass[0])
    const pt = pathTop + Math.round(wave(x, 4, 0.03) * 1.2), pb = pathBot + Math.round(wave(x, 7, 0.025) * 1.2)
    // grass edges in short blade clusters, not a ruler line
    const e1 = blade(x, 3), e2 = blade(x, 8)
    for (let y = pt; y < pb; y++) px.set(x, y, y < pt + e1 ? L.grass[0] : y === pt + e1 ? L.path[2] : y >= pb - 1 - e2 ? L.path[0] : L.path[1])
    for (let y = pb - e2; y < AH; y++) px.set(x, y, y <= pb - e2 ? L.near[1] : L.near[0])
  }
  // a few grass tufts and pebbles, hand stamps placed on purpose
  const tuft = spr(['.g..', 'g.g.', 'ggg.'], { g: L.grass[1] })
  const ntuft = spr(['g...g', '.g.g.', 'ggggg'], { g: L.near[1] })
  for (const x of [52, 150, 236, 356, 446, 520, 610, 680].filter(x => x < AW - 6)) px.blit(tuft, x, pathTop - 2)
  for (const x of [120, 290, 404, 560, 650].filter(x => x < AW - 6)) px.blit(ntuft, x, pathBot - 2)
  for (const [x, y] of [[176, 62], [334, 65], [452, 60], [540, 63], [700, 66]].filter(([x]) => x! < AW - 3).map(([x, y]) => [x!, y! + dy]) as [number, number][]) { px.set(x, y, L.path[0]); px.set(x + 1, y, L.path[0]); px.set(x, y - 1, L.path[2]) }
  const mark = spr(['g.g', '.g.'], { g: L.grass[1] }), nmark = spr(['g.g', '.g.'], { g: L.near[1] })
  for (let x = 6; x < AW; x += 23) { px.blit(mark, x + ((x * 3) % 7), 51 + dy + ((x >> 2) % 3)); px.blit(nmark, x + 11, 71 + dy + ((x >> 3) % 2)) }
  // meadow flowers, two-pixel clusters
  for (const [x, y, c] of [[30, 51, P.skin], [96, 53, P.gold], [170, 51, P.skin], [312, 52, P.gold], [380, 51, P.skin], [470, 53, P.gold], [560, 52, P.skin], [640, 51, P.gold]].filter(([x]) => x! < AW - 4).map(([x, y, c]) => [x!, y! + dy, c!]) as [number, number, string][]) { px.set(x, y, c); px.set(x + 1, y, c); px.set(x, y + 1, L.grass[1]) }
  // prop: one framing tree on the left edge, trunk with roots, canopy of lit clumps
  const t = new Px(60, 70)
  for (let y = 24; y < 70; y++) { const half = 3 + (y > 62 ? Math.floor((y - 62) * 0.8) : 0); for (let x = 22 - half; x < 22 + half; x++) t.set(x, y, x < 21 ? L.trunk[1] : L.trunk[0]) }
  clumps(t, [[34, 22, 9], [10, 20, 9], [24, 10, 10], [8, 30, 8], [30, 30, 8], [18, 24, 9], [40, 12, 7]], L.canopy)
  px.blit(outline(despeckle(t), () => L.canopy[0]), -10, -1 + (dy >> 1))
  // the tree's shadow pool on the meadow and path
  for (let y = 49 + dy; y < 62 + dy; y++) for (let x = 0; x < 52; x++) { const ex = (x - 18) / 34, ey = (y - 55 - dy) / 6.5; if (ex * ex + ey * ey <= 1) { const c = px.get(x, y); if (c) px.set(x, y, L.shade(c)) } }
  // a rock between the hero and the loot
  px.blit(outline(spr(['..hhH..', '.hHHHhs', 'hHHhhss', 'hhhhsss'], { H: P.cloud, h: P.mist, s: P.dusk }), darkOf), 150, 61 + dy)
  return px
}

/** A flat cast shadow: the ground colors under an ellipse, each one step darker. */
const castShadow = (px: Px, cx: number, y: number, w: number, look: Look, floating = false) => {
  const rows = floating ? [[0, w - 1]] : [[-1, w - 2], [0, w], [1, w - 2]]
  for (const [j, half] of rows as [number, number][]) for (let i = -half; i <= half; i++) { const c = px.get(cx + i, y + j); if (c) px.set(cx + i, y + j, look.shade(c)) }
}

// ======================= dusk relight =======================
/** V2: every sprite color one step toward the dusk (warmer lights, purple shadows), plus a gold rim on the side facing the sun. */
const DUSK: Record<string, string> = {
  [P.cloud]: P.apricot, [P.mist]: P.clay, [P.ice]: P.lilac, [P.sky]: P.blue, [P.blue]: P.indigo, [P.indigo]: P.navy,
  [P.skin]: P.apricot, [P.apricot]: P.tan, [P.tan]: P.copper,
  [P.mauve]: P.dusk, [P.dusk]: P.night, [P.spring]: P.moss, [P.sprout]: P.lime, [P.leaf]: P.green, [P.green]: P.pine,
  [P.foam]: P.mint, [P.mint]: P.aqua, [P.aqua]: P.teal, [P.teal]: P.deep,
  [P.lilac]: P.purple, [P.purple]: P.violet, [P.violet]: P.grape,
}
const relight = (p: Px, sunRight: boolean) => {
  const o = p.map(c => DUSK[c] ?? c)
  const dx = sunRight ? 1 : -1
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const c = p.get(x, y)
    if (c === undefined || c === P.ink) continue
    if (y > p.h * 0.66 || DARK[c] === undefined || c === P.cream || c === P.gold) continue
    if (p.get(x + dx, y) === undefined || p.get(x + dx, y) === P.ink) o.set(x, y, P.apricot)
  }
  return o
}

// ======================= frame =======================
type Layer = { px: Px; x: number; y: number; cls?: string }
const C = {
  act: 'Act II · Peer Dependency Palace',
  who: 'Lv 14 Refactor Paladin',
  task: 'Debugging 5 Hardcoded Phantom Packages',
  rare: 'Fast Vampiric Phantom',
  boss: 'Lv 18 Mephisto the Monorepo',
  bossTask: 'Fighting Mephisto the Monorepo',
  hit: ['18', '17', '142!'],
  xp: 0.63, heroHp: 0.62, foeHp: 0.56,
}

/** A thin bar: one row of fill inside a one pixel ink frame (3 rows tall in all). */
const bar = (w: number, f: number, fill: string, lit: string) => {
  const b = new Px(w, 3, P.ink)
  const n = Math.max(1, Math.round((w - 2) * f))
  b.rect(1, 1, w - 2, 1, P.night); b.rect(1, 1, n, 1, fill); b.set(1, 1, lit)
  return b
}

const cache = new Map<string, Px>()
const once = (k: string, f: () => Px) => { let v = cache.get(k); if (!v) { v = f(); cache.set(k, v) } return v }

export const frame = (v: Variant, boss: boolean, heroId: HeroId = 'R7') => {
  const L = LOOKS[v], dusk = v === 'V2'
  const sun = (p: Px, right = true) => (dusk ? relight(p, right) : p)
  const hero = HEROES[heroId]()
  const H = once(`${v}-hero-${heroId}`, () => sun(hero.px))
  const foes = [slime(), mushroom(), bat()]
  const layers: Layer[] = []
  const bg = once(`${v}-world`, () => world(v)).map(c => c)
  const heroX = 75, packX = [270, 316, 362], rareX = 426, bossX = 404
  const feet = (p: Px, cx: number, fx = Math.floor(p.w / 2)) => ({ x: cx - fx, y: FEET - p.h + 1 })
  // cast shadows go into the static background
  castShadow(bg, heroX + 2, FEET, 8, L)
  if (!boss) { packX.forEach((x, i) => castShadow(bg, x + 1, FEET, i === 2 ? 5 : 8, L, i === 2)); castShadow(bg, rareX + 1, FEET, 5, L, true) }
  else castShadow(bg, bossX + 2, FEET, 20, L)
  layers.push({ px: bg, x: 0, y: 0 })
  // hero
  const hp = feet(H, heroX, hero.feetX)
  layers.push({ px: H, ...hp, cls: 'bob' })
  const hud = new Px(AW, AH)
  hud.blit(bar(14, C.heroHp, P.leaf, P.spring), heroX - 9, hp.y + hero.headTop - 6)
  if (!boss) {
    // the pack: slime, mushroom, bat (the bat hovers), then the rare phantom
    foes.forEach((f0, i) => {
      const f = once(`${v}-foe${i}`, () => sun(f0, false))
      const lift = i === 2 ? 10 : 0
      const p = feet(f, packX[i]!)
      layers.push({ px: f, x: p.x, y: p.y - lift, cls: i === 2 ? 'fly' : 'bob2' })
      hud.blit(bar(12, i === 0 ? 0.35 : C.foeHp, P.rose, P.peach), packX[i]! - 6, p.y - lift - 5)
      // damage number just above the right end of the bar (font height, about an eye row)
      if (i < 2) text(hud, C.hit[i]!, packX[i]! + 4, p.y - lift - 12, P.skin, P.ink, true)
    })
    const R = once(`${v}-rare`, () => sun(phantom(), false))
    const rp = feet(R, rareX)
    layers.push({ px: R, x: rp.x, y: rp.y - 3, cls: 'fly' })
    const nw = textWidth(C.rare)
    text(hud, C.rare, rareX - Math.floor(nw / 2), rp.y - 15, P.gold, P.ink)
    hud.blit(bar(24, C.foeHp, P.rose, P.peach), rareX - 12, rp.y - 8)
    // loot and its glint, in the open ground between the hero and the pack
    const rg = sun(ring())
    layers.push({ px: rg, x: 203, y: FEET - 6 })
    layers.push({ px: glint(), x: 205, y: FEET - 13, cls: 'tw' })
    // hit spark on the first foe and damage numbers (font height, the size of an eye row)
    layers.push({ px: spark(), x: packX[0]! - 12, y: FEET - 12, cls: 'tw' })
    text(hud, C.hit[2]!, rareX - 14 - textWidth(C.hit[2]!), rp.y + 2, P.gold, P.ink, true)
  } else {
    const B = once(`${v}-boss`, () => sun(bossSprite(), false))
    const bp = feet(B, bossX)
    layers.push({ px: B, ...bp, cls: 'bob2' })
    // the boss name and a long thin bar float in the open sky to its left, clear of the horns and the flame
    const right = bossX - 34, bw = textWidth(C.boss)
    text(hud, C.boss, right - bw, 18, P.gold, P.ink)
    hud.blit(bar(bw, C.foeHp, P.rose, P.peach), right - bw, 25)
    text(hud, C.hit[2]!, bossX - 24 - textWidth(C.hit[2]!), FEET - 22, P.gold, P.ink, true)
    layers.push({ px: spark(), x: bossX - 23, y: FEET - 26, cls: 'tw' })
  }
  // HUD text: act line top left, task bottom left, level bottom right, XP strip along the bottom edge
  text(hud, C.act, 4, 3, P.skin, P.ink)
  text(hud, boss ? C.bossTask : C.task, 4, 67, P.skin, P.ink)
  const who = `${C.who}  ${Math.round(C.xp * 100)}%`
  text(hud, who, AW - 4 - textWidth(who), 67, P.cloud, P.ink)
  hud.rect(0, AH - 1, AW, 1, P.ink); hud.rect(0, AH - 1, Math.round(AW * C.xp), 1, P.gold)
  layers.push({ px: hud, x: 0, y: 0 })
  return layers
}

// ======================= band layout (task-27 step 1) =======================
/** The real band: W by 88 screen pixels, every art pixel one screen pixel (H1 is 46 rows tall with its outline, so 2 pixels per art pixel cannot fit under 88). */
export const BAND_H = 88
const BAND_FEET = 72
/**
 * The D30 frame laid out for the band at width `w` (720 or 360): hero H1 at left, the pack and the rare name line at right, act line
 * top left, task line bottom left, level and XP percent bottom right, thin bars, XP strip on the bottom row. At 360 the pack is two
 * foes plus the rare phantom, and the loot ring and some scenery are dropped to keep the row readable.
 */
export const bandFrame = (v: Variant, boss: boolean, w: number): Layer[] => {
  const L = LOOKS[v], dusk = v === 'V2', wide = w >= 600
  const sun = (p: Px, right = true) => (dusk ? relight(p, right) : p)
  const hero = HEROES.H1()
  const H = once(`${v}-hero-H1`, () => sun(hero.px))
  const bg = world(v, w, BAND_H, 8)
  const heroX = wide ? 92 : 52
  const packX = wide ? [360, 412, 464] : [168, 202, 236], rareX = wide ? 570 : 304, bossX = wide ? 560 : 290
  const feet = (p: Px, cx: number, fx = Math.floor(p.w / 2)) => ({ x: cx - fx, y: BAND_FEET - p.h + 1 })
  const layers: Layer[] = []
  castShadow(bg, heroX + 2, BAND_FEET, 8, L)
  if (!boss) { packX.forEach((x, i) => castShadow(bg, x + 1, BAND_FEET, i === 2 ? 5 : 8, L, i === 2)); castShadow(bg, rareX + 1, BAND_FEET, 5, L, true) }
  else castShadow(bg, bossX + 2, BAND_FEET, 20, L)
  layers.push({ px: bg, x: 0, y: 0 })
  const hp = feet(H, heroX, hero.feetX)
  layers.push({ px: H, ...hp, cls: 'bob' })
  const hud = new Px(w, BAND_H)
  hud.blit(bar(14, C.heroHp, P.leaf, P.spring), heroX - 9, hp.y + hero.headTop - 6)
  if (!boss) {
    const foes = [slime(), mushroom(), bat()]
    foes.forEach((f0, i) => {
      const f = once(`${v}-foe${i}`, () => sun(f0, false)), lift = i === 2 ? 10 : 0, p = feet(f, packX[i]!)
      layers.push({ px: f, x: p.x, y: p.y - lift, cls: i === 2 ? 'fly' : 'bob2' })
      hud.blit(bar(12, i === 0 ? 0.35 : C.foeHp, P.rose, P.peach), packX[i]! - 6, p.y - lift - 5)
      if (i < 2) text(hud, C.hit[i]!, packX[i]! + 4, p.y - lift - 12, P.skin, P.ink, true)
    })
    const R = once(`${v}-rare`, () => sun(phantom(), false)), rp = feet(R, rareX)
    layers.push({ px: R, x: rp.x, y: rp.y - 3, cls: 'fly' })
    const nw = textWidth(C.rare) + C.rare.length // the outlined font is one pixel wider per letter
    text(hud, C.rare, Math.min(rareX - Math.floor(nw / 2), w - 4 - nw), rp.y - 15, P.gold, P.ink, true)
    hud.blit(bar(24, C.foeHp, P.rose, P.peach), rareX - 12, rp.y - 8)
    if (wide) {
      layers.push({ px: sun(ring()), x: 250, y: BAND_FEET - 6 })
      layers.push({ px: glint(), x: 252, y: BAND_FEET - 13, cls: 'tw' })
    }
    layers.push({ px: spark(), x: packX[0]! - 12, y: BAND_FEET - 12, cls: 'tw' })
    text(hud, C.hit[2]!, rareX - 14 - textWidth(C.hit[2]!), rp.y + 2, P.gold, P.ink, true)
  } else {
    const B = once(`${v}-boss`, () => sun(bossSprite(), false)), bp = feet(B, bossX)
    layers.push({ px: B, ...bp, cls: 'bob2' })
    const right = bossX - 34, bw = textWidth(C.boss)
    text(hud, C.boss, right - bw, 18, P.gold, P.ink)
    hud.blit(bar(bw, C.foeHp, P.rose, P.peach), right - bw, 25)
    text(hud, C.hit[2]!, bossX - 24 - textWidth(C.hit[2]!), BAND_FEET - 22, P.gold, P.ink, true)
    layers.push({ px: spark(), x: bossX - 23, y: BAND_FEET - 26, cls: 'tw' })
  }
  text(hud, C.act, 4, 3, P.skin, P.ink)
  text(hud, boss ? C.bossTask : C.task, 4, 79, P.skin, P.ink)
  const who = `${C.who}  ${Math.round(C.xp * 100)}%`
  text(hud, who, w - 4 - textWidth(who), 79, P.cloud, P.ink)
  hud.rect(0, BAND_H - 1, w, 1, P.ink); hud.rect(0, BAND_H - 1, Math.round(w * C.xp), 1, P.gold)
  layers.push({ px: hud, x: 0, y: 0 })
  return layers
}
export const compositeAt = (layers: Layer[], w: number, h: number) => { const o = new Px(w, h); for (const l of layers) o.blit(l.px, l.x, l.y); return o }

// ---------- SVG and composite ----------
// two-state motion only (step-end holds each keyframe), so a sprite is always on the art pixel grid and fully opaque or hidden
const CSS = `<style>.bob{animation:b 1.6s step-end infinite}.bob2{animation:b 1.2s step-end infinite}.fly{animation:f 0.9s step-end infinite}.tw{animation:t 1.1s step-end infinite}
@keyframes b{50%{transform:translateY(${S}px)}}@keyframes f{50%{transform:translateY(-${S * 2}px)}}@keyframes t{50%{opacity:0}}</style>`
export const svgOf = (layers: Layer[]) => `<svg xmlns="http://www.w3.org/2000/svg" width="${AW * S}" height="${AH * S}" viewBox="0 0 ${AW * S} ${AH * S}">${CSS}${layers.map(l =>
  `<image${l.cls ? ` class="${l.cls}"` : ''} x="${l.x * S}" y="${l.y * S}" width="${l.px.w * S}" height="${l.px.h * S}" style="image-rendering:pixelated" href="data:image/png;base64,${base64(l.px.png())}"/>`).join('')}</svg>`
export const composite = (layers: Layer[]) => { const o = new Px(AW, AH); for (const l of layers) o.blit(l.px, l.x, l.y); return o }

/** RGBA bytes of a pixel buffer scaled z times, with a background for clear pixels. */
const rgba = (p: Px, z: number, bg = '#2e222f') => {
  const w = p.w * z, h = p.h * z, out = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = p.get(Math.floor(x / z), Math.floor(y / z)) ?? bg, k = (y * w + x) * 4
    out[k] = parseInt(c.slice(1, 3), 16); out[k + 1] = parseInt(c.slice(3, 5), 16); out[k + 2] = parseInt(c.slice(5, 7), 16); out[k + 3] = 255
  }
  return { w, h, out }
}
const savePx = (file: string, p: Px, z: number) => { const r = rgba(p, z); writeFileSync(file, rgbaPng(r.w, r.h, r.out)) }

/** A sheet: rows of pixel buffers at a zoom, each with a label in the bitmap font, on the palette's darkest color. */
const sheetOf = (rows: { label: string; px: Px; z: number }[], gap = 6) => {
  const lab = 9
  const w = Math.max(...rows.map(r => r.px.w * r.z))
  const h = rows.reduce((s, r) => s + lab + r.px.h * r.z + gap, gap)
  // labels are drawn at 2 screen px per font pixel into an overlay, then the rows are pasted at their zoom
  const outW = w + gap * 2, out = new Uint8Array(outW * h * 4)
  const put = (x: number, y: number, c: string) => { if (x < 0 || y < 0 || x >= outW || y >= h) return; const k = (y * outW + x) * 4; out[k] = parseInt(c.slice(1, 3), 16); out[k + 1] = parseInt(c.slice(3, 5), 16); out[k + 2] = parseInt(c.slice(5, 7), 16); out[k + 3] = 255 }
  for (let i = 0; i < outW * h; i++) { out[i * 4] = 0x2e; out[i * 4 + 1] = 0x22; out[i * 4 + 2] = 0x2f; out[i * 4 + 3] = 255 }
  let y = gap
  for (const r of rows) {
    const lp = new Px(Math.ceil(textWidth(r.label)) + 2, 6); text(lp, r.label, 0, 0, P.mist)
    for (let j = 0; j < lp.h; j++) for (let i = 0; i < lp.w; i++) { const c = lp.get(i, j); if (c) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) put(gap + i * 2 + a, y + j * 2 + b - 2, c) }
    y += lab + 4
    const img = rgba(r.px, r.z)
    for (let j = 0; j < img.h; j++) for (let i = 0; i < img.w; i++) { const k = (j * img.w + i) * 4; const o = ((y + j) * outW + gap + i) * 4; out[o] = img.out[k]!; out[o + 1] = img.out[k + 1]!; out[o + 2] = img.out[k + 2]!; out[o + 3] = 255 }
    y += img.h + gap - 4
  }
  return { w: outW, h, out }
}

// ---------- closeups ----------
export const sprites = () => ({ hero: heroSprite().px, slime: slime(), mushroom: mushroom(), bat: bat(), phantom: phantom(), boss: bossSprite() })

// ---------- Edge ----------
const EDGE = process.env.EDGE ?? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => existsSync(p))
const AT = 0 // paused at the start, where every two-state motion shows its rest pose (the composite)
const pause = `<script>for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${AT} }</script>`
const edge = (work: string, flags: string[], html: string, timeout = 120_000) => {
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE to msedge.exe')
  const file = join(work, `${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(file, html)
  return execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${join(work, 'profile')}`, ...flags, pathToFileURL(file).href], { encoding: 'utf8', timeout })
}
/** Screenshot of SVG frames stacked, at a device scale (2 means every art pixel is 4 by 4 image pixels). */
const shoot = (work: string, svgs: string[], png: string, scale: number) =>
  edge(work, [`--force-device-scale-factor=${scale}`, `--window-size=${AW * S},${AH * S * svgs.length}`, '--virtual-time-budget=800', `--screenshot=${png}`],
    `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#2e222f;overflow:hidden}svg{display:block}</style></head><body>${svgs.join('')}${pause}</body></html>`)

/** A small PNG reader for Edge screenshots (8-bit RGB or RGBA, all five row filters). */
const readPng = (file: string) => {
  const b = readFileSync(file)
  let o = 8, w = 0, h = 0, type = 0
  const idat: Buffer[] = []
  while (o < b.length) {
    const len = b.readUInt32BE(o), t = b.toString('latin1', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len)
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); type = d[9]! }
    if (t === 'IDAT') idat.push(d)
    o += 12 + len
  }
  const bpp = type === 6 ? 4 : 3, raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, px = new Uint8Array(w * h * 4)
  const cur = new Uint8Array(stride), prev = new Uint8Array(stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]!, row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp]! : 0, up = prev[i]!, c = i >= bpp ? prev[i - bpp]! : 0
      const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c)
      const pred = f === 1 ? a : f === 2 ? up : f === 3 ? (a + up) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? up : c) : 0
      cur[i] = (row[i]! + pred) & 255
    }
    for (let x = 0; x < w; x++) { px[(y * w + x) * 4] = cur[x * bpp]!; px[(y * w + x) * 4 + 1] = cur[x * bpp + 1]!; px[(y * w + x) * 4 + 2] = cur[x * bpp + 2]!; px[(y * w + x) * 4 + 3] = 255 }
    prev.set(cur)
  }
  return { w, h, px }
}
const hexOf = (r: number, g: number, b: number) => `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`

// ---------- numbers for the card ----------
/** Head and full height of the hero in art pixels: rows from the top of the hair to the soles over the body columns 3 to 15 (column 16 would catch the outline of the sword guard). */
export const heroNumbers = () => {
  const { px } = heroSprite()
  let top = -1, bottom = -1
  for (let y = 0; y < px.h; y++) for (let x = 3; x <= 15; x++) if (px.get(x, y) !== undefined) { if (top < 0) top = y; bottom = y }
  const chin = 13 + 1 + 5 // hair row 0 sits at figure row 13, the outline shifts it by 1, the chin is body row 5
  return { headWithOutline: chin - top + 1, bodyWithOutline: bottom - top + 1, head: chin - top, body: bottom - top - 1 }
}

// ---------- main ----------
const args = process.argv.slice(2)
const VARIANTS: Variant[] = ['V1', 'V2']
const NAME: Record<Variant, string> = { V1: 'V1 warm afternoon', V2: 'V2 golden dusk' }
if (args.includes('--band')) {
  // task-27 step 1: the band layout at 720 and 360 by 88, fight and boss, each at 1x and 3x, written to docs/art/styles/band-720.png and band-360.png
  for (const w of [720, 360]) {
    const fight = compositeAt(bandFrame('V1', false, w), w, BAND_H), boss = compositeAt(bandFrame('V1', true, w), w, BAND_H)
    const dusk = compositeAt(bandFrame('V2', false, w), w, BAND_H), duskBoss = compositeAt(bandFrame('V2', true, w), w, BAND_H)
    const rows = [
      { label: `${w} by 88 fight at 1x (the real size)`, px: fight, z: 1 }, { label: `${w} by 88 boss at 1x`, px: boss, z: 1 },
      { label: `${w} by 88 dusk fight at 1x`, px: dusk, z: 1 }, { label: `${w} by 88 dusk boss at 1x`, px: duskBoss, z: 1 },
      { label: `${w} by 88 fight at 3x`, px: fight, z: 3 }, { label: `${w} by 88 boss at 3x`, px: boss, z: 3 },
    ]
    const sheet = sheetOf(rows)
    writeFileSync(join(OUT, `band-${w}.png`), rgbaPng(sheet.w, sheet.h, sheet.out))
    const n = new Set([...fight.c, ...boss.c, ...dusk.c, ...duskBoss.c].filter(Boolean))
    console.log(`band-${w}.png ${sheet.w}x${sheet.h}, frame colors ${n.size}, outside Resurrect 64: ${[...n].filter(c => !R64.includes(c!)).length}`)
  }
  const sp = sprites()
  console.log(`sprite sizes (art px): ${Object.entries(sp).map(([k, p]) => `${k} ${p.w}x${p.h}`).join(', ')}, H1 ${HEROES.H1().px.w}x${HEROES.H1().px.h}`)
} else if (args.includes('--preview')) {
  const dir = process.env.PREVIEW ?? join(tmpdir(), 'pixel2')
  mkdirSync(dir, { recursive: true })
  for (const v of VARIANTS) for (const b of [false, true]) savePx(join(dir, `${v}-${b ? 'boss' : 'fight'}.png`), composite(frame(v, b)), 2)
  console.log('preview in', dir)
} else if (args.includes('--heroes')) {
  // task-26 deliverables: hero-H1..H4.png (the V1 fight frame with that hero, Edge at 2x, checked against the composite) and heroes-r8.png
  const ids = ['H1', 'H2', 'H3', 'H4'] as const
  const NAMES: Record<HeroId, string> = { R7: 'before (task-25)', H1: 'H1 swordsman', H2: 'H2 light knight', H3: 'H3 ranger', H4: 'H4 spellblade' }
  const work = mkdtempSync(join(tmpdir(), 'pixel2-'))
  try {
    for (const id of ids) {
      const fight = frame('V1', false, id), png = join(OUT, `hero-${id}.png`)
      shoot(work, [svgOf(fight)], png, 2)
      const shot = readPng(png), ref = composite(fight), used = new Set<string>()
      let same = 0
      for (let y = 0; y < shot.h; y++) for (let x = 0; x < shot.w; x++) {
        const k = (y * shot.w + x) * 4, c = hexOf(shot.px[k]!, shot.px[k + 1]!, shot.px[k + 2]!)
        used.add(c); if (c === ref.get(Math.floor(x / 4), Math.floor(y / 4))) same++
      }
      const off = [...used].filter(c => !R64.includes(c))
      const h = HEROES[id](), { px } = h
      let top = -1, bottom = -1
      for (let y = 0; y < px.h; y++) { if (top < 0 && px.get(h.feetX, y) !== undefined) top = y; for (let x = 0; x < px.w; x++) if (px.get(x, y) !== undefined) bottom = y }
      console.log(`${id}: Edge ${shot.w}x${shot.h}, ${((same / (shot.w * shot.h)) * 100).toFixed(3)}% equal to the composite, outside Resurrect 64: ${off.length ? off.join(' ') : 'none'}`)
      console.log(`  sprite ${px.w}x${px.h}, head ${h.chin - top + 1} of ${bottom - top + 1} rows with outline (${((h.chin - top + 1) / (bottom - top + 1)).toFixed(3)}), ${h.chin - top} of ${bottom - top - 1} without (${((h.chin - top) / (bottom - top - 1)).toFixed(3)}), sprite colors ${px.colors()}`)
      console.log(`  tones per part: ${Object.entries(h.tones ?? {}).map(([r, n]) => `${r} ${n}`).join(', ')}`)
    }
    const all: HeroId[] = ['R7', ...ids]
    const sp = all.map(id => HEROES[id]().px), hmax = Math.max(...sp.map(p => p.h))
    const line = new Px(sp.reduce((s, p) => s + p.w + 8, 8), hmax + 2)
    let x = 8
    for (const p of sp) { line.blit(p, x, hmax + 1 - p.h); x += p.w + 8 }
    const sheet = sheetOf([
      { label: `${all.map(id => NAMES[id]).join(', ')} at 6x`, px: line, z: 12 },
      ...all.map(id => ({ label: `${NAMES[id]} in the V1 fight frame at 1x (the band size)`, px: composite(frame('V1', false, id)), z: 2 })),
    ])
    writeFileSync(join(OUT, 'heroes-r8.png'), rgbaPng(sheet.w, sheet.h, sheet.out))
    const n = heroNumbers()
    console.log(`R7 before: head ${n.headWithOutline} of ${n.bodyWithOutline} with outline, ${n.head} of ${n.body} without; heroes-r8.png ${sheet.w}x${sheet.h}`)
  } finally { rmSync(work, { recursive: true, force: true }) }
} else if (args.includes('--hero-preview')) {
  // working view for the hero redraw: the heroes alone at 6x, then each in the V1 fight frame (crop at 2x, whole frame at 1x)
  const dir = process.env.PREVIEW ?? join(tmpdir(), 'pixel2')
  mkdirSync(dir, { recursive: true })
  const ids = Object.keys(HEROES) as HeroId[]
  const sp = ids.map(id => HEROES[id]().px), hmax = Math.max(...sp.map(p => p.h))
  const line = new Px(sp.reduce((s, p) => s + p.w + 6, 6), hmax + 2)
  let x = 6
  for (const p of sp) { line.blit(p, x, hmax + 1 - p.h); x += p.w + 6 }
  const shots = ids.map(id => composite(frame('V1', false, id)))
  const crop = (p: Px) => { const o = new Px(140, AH); for (let j = 0; j < AH; j++) for (let i = 0; i < 140; i++) o.set(i, j, p.get(20 + i, j)); return o }
  const sheet = sheetOf([
    { label: ids.join('  ') + ' at 6x', px: line, z: 12 },
    ...ids.map((id, i) => ({ label: `${id} in the V1 frame at 2x`, px: crop(shots[i]!), z: 4 })),
    ...ids.map((id, i) => ({ label: `${id} at 1x`, px: shots[i]!, z: 2 })),
  ])
  writeFileSync(join(dir, 'heroes.png'), rgbaPng(sheet.w, sheet.h, sheet.out))
  console.log('heroes in', dir)
} else if (args.includes('--glyphs')) {
  // digits and marks in the HUD colors over the sky and mountains where the damage numbers sit, at 1x (z 2) and 2x (z 4)
  const dir = process.env.PREVIEW ?? join(tmpdir(), 'pixel2')
  mkdirSync(dir, { recursive: true })
  const rows = VARIANTS.map(v => {
    const w = world(v), p = new Px(110, 22)
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) p.set(x, y, w.get(250 + x, 24 + y))
    text(p, '0123456789 ! %', 3, 3, P.skin, P.ink)
    text(p, '18 17 142!', 3, 13, P.skin, P.ink, true)
    text(p, '142!', 70, 13, P.gold, P.ink, true)
    return { v, p }
  })
  const sheet = sheetOf([...rows.map(r => ({ label: `${NAME[r.v]} digits at 1x`, px: r.p, z: 2 })), ...rows.map(r => ({ label: `${NAME[r.v]} digits at 2x`, px: r.p, z: 4 }))])
  writeFileSync(join(dir, 'glyphs.png'), rgbaPng(sheet.w, sheet.h, sheet.out))
  console.log('glyphs in', dir)
} else if (args.includes('--perf')) {
  // rasterize cost: each SVG drawn 40 times onto a 1920 by 300 canvas inside one Edge page
  const work = mkdtempSync(join(tmpdir(), 'pixel2-'))
  try {
    const svgs = VARIANTS.flatMap(v => [false, true].map(b => ({ id: `${v}-${b ? 'boss' : 'fight'}`, svg: svgOf(frame(v, b)) })))
    const html = `<!doctype html><html><body><pre id="o"></pre><script>(async () => {
const items = ${JSON.stringify(svgs)}; const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 300; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; const out = []
for (const it of items) { const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(it.svg))); await img.decode()
  for (let i = 0; i < 5; i++) g.drawImage(img, 0, 0, 1920, 300); const t0 = performance.now(); for (let i = 0; i < 40; i++) { g.clearRect(0, 0, 1920, 300); g.drawImage(img, 0, 0, 1920, 300); g.getImageData(0, 0, 1, 1) } out.push(it.id + ' ' + ((performance.now() - t0) / 40).toFixed(2)) }
document.getElementById('o').textContent = out.join('\\n') })()</script></body></html>`
    const dom = edge(work, ['--virtual-time-budget=60000', '--dump-dom'], html, 240_000)
    console.log((/<pre id="o">([^<]*)<\/pre>/.exec(dom)?.[1] ?? 'no result').replace(/\n/g, '\n'))
  } finally { rmSync(work, { recursive: true, force: true }) }
} else {
  // default: the deliverables, then the checks the card asks for
  mkdirSync(join(OUT, 'src'), { recursive: true })
  const work = mkdtempSync(join(tmpdir(), 'pixel2-'))
  try {
    const t0 = performance.now()
    const built = VARIANTS.map(v => ({ v, fight: frame(v, false), boss: frame(v, true) }))
    const cold = performance.now() - t0
    const t1 = performance.now(); frame('V1', true); const warm = performance.now() - t1
    for (const { v, fight, boss } of built) {
      const id = v === 'V1' ? 'R1' : 'R2'
      const fs = svgOf(fight), bs = svgOf(boss)
      writeFileSync(join(OUT, 'src', `${id}-fight.svg`), fs)
      writeFileSync(join(OUT, 'src', `${id}-boss.svg`), bs)
      shoot(work, [fs, bs], join(OUT, `${id}.png`), 2)
      // Edge against the composite: every image pixel of the Edge render compared with the composite drawn 4 by 4
      const shot = readPng(join(OUT, `${id}.png`))
      const ref = [composite(fight), composite(boss)]
      let same = 0, total = 0
      const used = new Set<string>()
      for (let y = 0; y < shot.h; y++) for (let x = 0; x < shot.w; x++) {
        const k = (y * shot.w + x) * 4, c = hexOf(shot.px[k]!, shot.px[k + 1]!, shot.px[k + 2]!)
        const f = Math.floor(y / (AH * 4)), want = ref[f]?.get(Math.floor(x / 4), Math.floor((y % (AH * 4)) / 4))
        used.add(c); total++; if (c === want) same++
      }
      const off = [...used].filter(c => !R64.includes(c))
      console.log(`${id} ${NAME[v]}: Edge render ${shot.w}x${shot.h}, ${same} of ${total} pixels equal the composite (${((same / total) * 100).toFixed(3)}%), ${used.size} colors, outside Resurrect 64: ${off.length ? off.join(' ') : 'none'}`)
      const layerBytes = (ls: Layer[]) => ls.map(l => l.px.png().length)
      console.log(`  fight SVG ${(Buffer.byteLength(fs) / 1024).toFixed(1)} KB (layers ${layerBytes(fight).join(', ')} bytes PNG), boss SVG ${(Buffer.byteLength(bs) / 1024).toFixed(1)} KB, frame colors ${composite(fight).colors()} and ${composite(boss).colors()}`)
    }
    console.log(`build: all four frames cold ${cold.toFixed(0)} ms, one boss frame with sprite caches ${warm.toFixed(1)} ms`)
    // round7.png: both fights at 2x, then at 1x, labeled in the bitmap font
    const fights = built.map(b => composite(b.fight))
    const sheet = sheetOf([
      ...built.map((b, i) => ({ label: `${NAME[b.v]} fight at 2x`, px: fights[i]!, z: 4 })),
      ...built.map((b, i) => ({ label: `${NAME[b.v]} fight at 1x (the band size)`, px: fights[i]!, z: 2 })),
    ])
    writeFileSync(join(OUT, 'round7.png'), rgbaPng(sheet.w, sheet.h, sheet.out))
    // round7-closeups.png: the hero and the four foes alone at 4x (8 image pixels per art pixel), then the boss
    const sp = sprites()
    const strip = (keys: (keyof ReturnType<typeof sprites>)[]) => {
      const w = keys.reduce((s, k) => s + sp[k].w + 4, 4), h = Math.max(...keys.map(k => sp[k].h)) + 2, p = new Px(w, h)
      let x = 4
      for (const k of keys) { p.blit(sp[k], x, h - 1 - sp[k].h); x += sp[k].w + 4 }
      return p
    }
    const cl = sheetOf([
      { label: 'hero, slime, mushroom, bat, phantom (rare, crowned) at 4x', px: strip(['hero', 'slime', 'mushroom', 'bat', 'phantom']), z: 8 },
      { label: 'boss: mephisto the monorepo at 4x', px: strip(['boss']), z: 8 },
    ])
    writeFileSync(join(OUT, 'round7-closeups.png'), rgbaPng(cl.w, cl.h, cl.out))
    const n = heroNumbers()
    console.log(`hero: head ${n.headWithOutline} of ${n.bodyWithOutline} rows with outline (${(n.headWithOutline / n.bodyWithOutline).toFixed(3)}), ${n.head} of ${n.body} without (${(n.head / n.body).toFixed(3)})`)
    console.log(`sprite sizes (art px, with outline): ${Object.entries(sp).map(([k, p]) => `${k} ${p.w}x${p.h}`).join(', ')}`)
  } finally { rmSync(work, { recursive: true, force: true }) }
}
