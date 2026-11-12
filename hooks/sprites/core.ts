// The pixel kit: grids of letters become merged rects, sprites are lists of rect groups, groups draw as a few SVG paths.
// Pure functions, no I/O. Every sprite here is original drawing, MIT like the rest of the repo.
export type Rect = [x: number, y: number, w: number, h: number, c: string]
export type Pal = Record<string, string>
/** A named group of rects, so CSS can move it (legs, claws, a weapon). */
export type Part = { cls?: string; rects: Rect[]; op?: number; st?: string }
export type Sprite = { w: number; h: number; parts: Part[]; /** the body's bottom row, for standing it on the ground */ foot?: number }

/** Element `i` of a non-empty list, wrapping around. */
export const pick = <T>(a: readonly T[], i: number): T => a[((i % a.length) + a.length) % a.length] as T
export const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
/** Small seeded generator (mulberry32) for stable picks. */
export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const rgb = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const h2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
export const mix = (a: string, b: string, t: number) => {
  const x = rgb(a), y = rgb(b)
  return `#${h2(x[0] + (y[0] - x[0]) * t)}${h2(x[1] + (y[1] - x[1]) * t)}${h2(x[2] + (y[2] - x[2]) * t)}`
}
export const shade = (c: string, t: number) => (t < 0 ? mix(c, '#000000', -t) : mix(c, '#ffffff', t))
/** Hue rotate in degrees, for rare color swaps. */
export const hue = (c: string, deg: number) => {
  const [r, g, b] = rgb(c).map(v => v / 255) as [number, number, number]
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let hh = d === 0 ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  hh = (((hh * 60 + deg) % 360) + 360) % 360
  const l = (mx + mn) / 2, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  const k = (n: number) => (n + hh / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return `#${h2(f(0) * 255)}${h2(f(8) * 255)}${h2(f(4) * 255)}`
}
/** Perceived brightness, 0 to 255. */
export const luma = (c: string) => { const [r, g, b] = rgb(c); return 0.299 * r + 0.587 * g + 0.114 * b }
/** Chroma, 0 to 1: how far a color is from grey. */
export const chroma = (c: string) => { const v = rgb(c); return (Math.max(...v) - Math.min(...v)) / 255 }
/** Greyer and darker, for pieces that frame the crab instead of competing with its orange: a third of the way to grey, then at least 18% darker and never brighter than `max`. */
export const tame = (c: string, max = 104) => {
  const l = luma(c)
  const g = mix(c, `#${h2(l)}${h2(l)}${h2(l)}`, 0.32)
  return shade(g, -(1 - Math.min(0.82, max / Math.max(1, luma(g)))))
}
/** A four-step ramp from one color: b base, l light, d dark, o outline. */
export const ramp = (c: string): Pal => ({ b: c, l: shade(c, 0.32), d: shade(c, -0.32), o: shade(c, -0.7) })

/** Letters not in the palette that a grid used; tests assert this stays at zero. */
export const bad: string[] = []

/** A canvas of cells painted in order, merged into rects on read. Later paint covers earlier. */
export class Cells {
  m = new Map<number, string>()
  constructor(public w: number, public h: number) {}
  put(x: number, y: number, c: string | undefined) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    if (c === undefined) this.m.delete(y * this.w + x)
    else this.m.set(y * this.w + x, c)
  }
  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, c)
  }
  /** Paint a grid: rows split by `/`, `.` is empty, `~` erases, letters come from the palette. mir 1 mirrors the row, 2 mirrors around its last column. */
  paint(rows: string, pal: Pal, ox = 0, oy = 0, mir = 0) {
    rows.split('/').forEach((row, j) => {
      if (mir === 1) row = row + [...row].reverse().join('')
      else if (mir === 2) row = row + [...row.slice(0, -1)].reverse().join('')
      for (let i = 0; i < row.length; i++) {
        const ch = row[i] ?? '.'
        if (ch === '.' || ch === ' ') continue
        if (ch === '~') this.put(ox + i, oy + j, undefined)
        else if (pal[ch] !== undefined) this.put(ox + i, oy + j, pal[ch])
        else bad.push(ch)
      }
    })
    return this
  }
  rects(): Rect[] {
    const seen = new Set<number>()
    const out: Rect[] = []
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const k = y * this.w + x
        const c = this.m.get(k)
        if (c === undefined || seen.has(k)) continue
        let w = 1
        while (x + w < this.w && this.m.get(k + w) === c && !seen.has(k + w)) w++
        let h = 1
        grow: for (; y + h < this.h; h++) for (let i = 0; i < w; i++) if (this.m.get((y + h) * this.w + x + i) !== c || seen.has((y + h) * this.w + x + i)) break grow
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) seen.add((y + j) * this.w + x + i)
        out.push([x, y, w, h, c])
      }
    }
    return out
  }
}

/** A canvas with spare rows above row 0, so a tall weapon raised in an attack pose is not cut off; `rects` come back in the normal coordinates. */
export class TallCells extends Cells {
  constructor(w: number, h: number, public up: number) { super(w, h + up) }
  put(x: number, y: number, c: string | undefined) { super.put(x, y + this.up, c) }
  rects(): Rect[] { return super.rects().map(([x, y, w, h, c]) => [x, y - this.up, w, h, c] as Rect) }
}

export const count = (s: Sprite) => s.parts.reduce((n, p) => n + p.rects.length, 0)
/** Stable string of a sprite's pixels, for the uniqueness tests. */
export const sig = (s: Sprite) => hash(s.parts.map(p => `${p.cls ?? ''}:` + p.rects.map(r => r.join(',')).join(';')).join('|'))
/** The silhouette alone (every color the same), to tell two shapes apart. */
export const outline = (s: Sprite) => hash(s.parts.map(p => p.rects.map(r => r.slice(0, 4).join(',')).join(';')).join('|'))

/** Rects as one path per color: small strings the SVG draws crisp. */
export const paths = (rects: Rect[]) => {
  const by = new Map<string, string>()
  for (const [x, y, w, h, c] of rects) by.set(c, (by.get(c) ?? '') + `M${x} ${y}h${w}v${h}H${x}z`)
  let s = ''
  for (const [c, d] of by) s += `<path fill="${c}" d="${d}"/>`
  return s
}
/** A sprite as SVG markup at (x, y), `s` screen pixels per art pixel; flip mirrors it left to right. */
export const draw = (sp: Sprite, x: number, y: number, s: number, flip = false) =>
  `<g transform="translate(${flip ? x + sp.w * s : x} ${y}) scale(${flip ? -s : s} ${s})">${sp.parts.map(p => (p.cls || p.op !== undefined || p.st ? `<g${p.cls ? ` class="${p.cls}"` : ''}${p.op !== undefined ? ` opacity="${p.op}"` : ''}${p.st ? ` style="${p.st}"` : ''}>${paths(p.rects)}</g>` : paths(p.rects))).join('')}</g>`

export const OUTLINE = '#1a1220'
