// Resurrect 64 pixel kit shared by every D30 sprite: palette, pixel buffers, outline, dusk relight (task-25, task-27). No DOM, no Node.
import { encodePng } from '../../png'

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
export const P = {
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


// ---------- pixel buffers ----------
export type Col = string | undefined
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
export const spr = (rows: string[], keys: Record<string, string>) => {
  const w = Math.max(...rows.map(r => r.length)), px = new Px(w, rows.length)
  rows.forEach((r, y) => [...r].forEach((k, x) => { if (k === '.' || k === ' ') return; const c = keys[k]; if (!c) throw new Error(`no key ${k}`); px.set(x, y, c) }))
  return px
}
/** Grow a sprite by n pixels on every side (room for the outline). */
export const pad = (p: Px, n = 1) => { const o = new Px(p.w + n * 2, p.h + n * 2); o.blit(p, n, n); return o }
/**
 * Selective outline: every clear pixel touching the sprite gets an outline. Below and right of the sprite (the shadow side for
 * light from the upper left) it is the ink color; above and left it is the dark of that part's own ramp, so lit edges stay soft.
 */
export const outline = (p: Px, dark: (c: string) => string, ink: string = P.ink) => {
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
export const despeckle = (p: Px) => {
  const o = p.map(c => c)
  for (let y = 1; y < p.h - 1; y++) for (let x = 1; x < p.w - 1; x++) {
    const c = p.get(x, y), n = [p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1), p.get(x, y + 1)]
    if (c !== undefined && n.every(v => v !== undefined && v === n[0]) && n[0] !== c) o.set(x, y, n[0])
  }
  return o
}

export const DARK: Record<string, string> = {
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
export const darkOf = (c: string) => DARK[c] ?? P.ink

export const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

/** Smooth wave for silhouettes (not textures): a sum of sines, deterministic. */
export const wave = (x: number, seed: number, f: number) => Math.sin(x * f + seed) * 0.6 + Math.sin(x * f * 2.3 + seed * 1.7) * 0.3 + Math.sin(x * f * 5.1 + seed * 0.3) * 0.1

/** Grass blade cluster depth along an edge: 0, 1 or 2 rows, in runs. */
export const blade = (x: number, s: number) => { const k = (x * 7 + s * 13 + Math.floor(x / 9) * 5) % 12; return k < 2 ? 2 : k < 5 ? 1 : 0 }

/** Round clumps drawn back to front, each lit on its upper left, with a dark seam where a front clump overlaps. */
export const clumps = (px: Px, list: [number, number, number][], ramp: readonly string[]) => {
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

// ======================= dusk relight =======================
/** V2: every sprite color one step toward the dusk (warmer lights, purple shadows), plus a gold rim on the side facing the sun. */
export const DUSK: Record<string, string> = {
  [P.cloud]: P.apricot, [P.mist]: P.clay, [P.ice]: P.lilac, [P.sky]: P.blue, [P.blue]: P.indigo, [P.indigo]: P.navy,
  [P.skin]: P.apricot, [P.apricot]: P.tan, [P.tan]: P.copper,
  [P.mauve]: P.dusk, [P.dusk]: P.night, [P.spring]: P.moss, [P.sprout]: P.lime, [P.leaf]: P.green, [P.green]: P.pine,
  [P.foam]: P.mint, [P.mint]: P.aqua, [P.aqua]: P.teal, [P.teal]: P.deep,
  [P.lilac]: P.purple, [P.purple]: P.violet, [P.violet]: P.grape,
}
export const relight = (p: Px, sunRight: boolean) => {
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


// ---------- night: every color pulled toward a dim blue, snapped back to the palette ----------
const nearestCache = new Map<string, string>()
const rgbOf = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
export const nearest = (r: number, g: number, b: number): string => {
  const key = `${Math.round(r)},${Math.round(g)},${Math.round(b)}`
  let c = nearestCache.get(key)
  if (c) return c
  let best = 1e12
  c = R64[0]!
  for (const q of R64) { const [qr, qg, qb] = rgbOf(q), d = (qr - r) ** 2 + (qg - g) ** 2 + (qb - b) ** 2; if (d < best) { best = d; c = q } }
  nearestCache.set(key, c)
  return c
}
const moonMemo = new Map<string, string>()
/** One color of a character at night: only slightly dimmed and cooled, so figures stay bright against the dark backdrop. */
export const moonOf = (c: string): string => {
  let n = moonMemo.get(c)
  if (!n) { const [r, g, b] = rgbOf(c); n = nearest(r * 0.8, g * 0.86 + 3, b * 0.96 + 12); moonMemo.set(c, n) }
  return n
}
const nightMemo = new Map<string, string>()
/** One color at night: dimmer, bluer. */
export const nightOf = (c: string): string => {
  let n = nightMemo.get(c)
  if (!n) { const [r, g, b] = rgbOf(c); n = nearest(r * 0.42, g * 0.52 + 6, b * 0.74 + 24); nightMemo.set(c, n) }
  return n
}
