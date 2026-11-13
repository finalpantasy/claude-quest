// Pixel painter for the task-24 mockups (tools only, not imported by the game).
// A canvas holds art pixels. Shapes are written in design units (screen pixels at 1x, feet on y 0) and sampled at pixel centers,
// so one drawing can be rasterized at several resolutions (res 1 = one art pixel per design unit, res 0.5 = chunky).
// Shading is a ray march toward the light inside each part: no gradients, no smoothing, only ramp steps.
import { ramp, mixc } from '../hooks/sprites/hero-32bit'
import type { Ramp } from '../hooks/sprites/hero-32bit'
import { deflateSync } from 'node:zlib'
import { base64, encodePng } from '../hooks/png'

export { ramp, mixc }
export type { Ramp }
export type Mask = (x: number, y: number) => boolean
export type Pt = [number, number]

export const ellipseM = (cx: number, cy: number, rx: number, ry: number): Mask => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
export const rectM = (x0: number, y0: number, x1: number, y1: number): Mask => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1
export const polyM = (pts: Pt[]): Mask => (x, y) => {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!, [xj, yj] = pts[j]!
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
export const capsuleM = (x0: number, y0: number, x1: number, y1: number, r: number): Mask => (x, y) => {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2))
  return (x - (x0 + dx * t)) ** 2 + (y - (y0 + dy * t)) ** 2 <= r * r
}
export const rrectM = (x0: number, y0: number, x1: number, y1: number, r: number): Mask => (x, y) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x, cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}
export const union = (...ms: Mask[]): Mask => (x, y) => ms.some(m => m(x, y))
export const minus = (a: Mask, b: Mask): Mask => (x, y) => a(x, y) && !b(x, y)
export const both = (a: Mask, b: Mask): Mask => (x, y) => a(x, y) && b(x, y)

export type PaintOpts = {
  /** a fixed ramp index (flat fill) */
  flat?: number
  /** shift the shading score (positive = lighter) */
  bias?: number
  /** light direction in pixel space, default upper left */
  light?: Pt
  /** allow the brightest ramp tone */
  hl?: boolean
  /** never go darker than this ramp index */
  min?: number
  /** never go lighter than this ramp index */
  max?: number
  /** replace the ramp color per pixel */
  pick?: (x: number, y: number, tone: number) => string | undefined
}

export class Cv {
  c: (string | undefined)[]
  id: Int16Array
  parts = 0
  constructor(public w: number, public h: number, public res = 1, public ox = 0, public oy = 0) {
    this.c = new Array(w * h).fill(undefined)
    this.id = new Int16Array(w * h).fill(-1)
  }
  /** design coordinate of a pixel center */
  dx(i: number) { return (i + 0.5 - this.ox) / this.res }
  dy(j: number) { return (j + 0.5 - this.oy) / this.res }
  px(x: number) { return Math.round(x * this.res + this.ox) }
  py(y: number) { return Math.round(y * this.res + this.oy) }
  get(i: number, j: number) { return i >= 0 && j >= 0 && i < this.w && j < this.h ? this.c[j * this.w + i] : undefined }
  set(i: number, j: number, col: string | undefined) { if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.c[j * this.w + i] = col }
  /** paint a part: every pixel whose center is inside the mask */
  paint(mask: Mask, rp: Ramp, o: PaintOpts = {}) {
    const pid = this.parts++
    const [lx0, ly0] = o.light ?? [-0.55, -0.83]
    const lm = Math.hypot(lx0, ly0), lx = lx0 / lm, ly = ly0 / lm
    const inside = (i: number, j: number) => mask(this.dx(i), this.dy(j))
    const hit: number[] = []
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) if (inside(i, j)) hit.push(j * this.w + i)
    for (const k of hit) {
      const i = k % this.w, j = (k - i) / this.w
      let tone = o.flat ?? 3
      if (o.flat === undefined) {
        let a = 0, b = 0
        while (a < 60 && mask(this.dx(i + 0.5 + lx * (a + 0.5) - 0.5), this.dy(j + 0.5 + ly * (a + 0.5) - 0.5))) a += 0.5
        while (b < 60 && mask(this.dx(i + 0.5 - lx * (b + 0.5) - 0.5), this.dy(j + 0.5 - ly * (b + 0.5) - 0.5))) b += 0.5
        const s = (b - a) / (a + b + 0.6) + (o.bias ?? 0)
        tone = s > 0.8 && o.hl ? 5 : s > 0.34 ? 4 : s > -0.3 ? 3 : s > -0.68 ? 2 : 1
      }
      tone = Math.max(o.min ?? 1, Math.min(o.max ?? (o.hl ? 5 : 4), tone))
      this.c[k] = o.pick?.(i, j, tone) ?? rp[tone]
      this.id[k] = pid
    }
    return pid
  }
  rect(x0: number, y0: number, w: number, h: number, col: string | undefined) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x0 + i, y0 + j, col) }
  line(x0: number, y0: number, x1: number, y1: number, col: string, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let s = 0; s <= n; s++) { const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n); for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) this.set(x + a, y + b, col) }
  }
  /** a selective outline: each clear pixel next to a painted one takes that color pulled toward `ink` (not black) */
  outline(ink: string, amount = 0.72, litSide: Pt = [-0.55, -0.83], litAmount = amount) {
    const add: [number, number, string][] = []
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      if (this.get(i, j)) continue
      let best: string | undefined, lit = false
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Pt[]) {
        const n = this.get(i + a, j + b)
        if (n) { best = best ?? n; if (a * litSide[0] + b * litSide[1] < 0) lit = true }
      }
      if (best) add.push([i, j, mixc(best, ink, lit ? litAmount : amount)])
    }
    for (const [i, j, col] of add) this.set(i, j, col)
  }
  /** pixels whose neighbor toward `side` is clear get tinted: the rim light */
  rim(col: string, side: Pt, amount: number, only?: (i: number, j: number) => boolean) {
    const add: [number, number][] = []
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      if (!this.get(i, j) || (only && !only(i, j))) continue
      const sx = Math.sign(side[0]), sy = Math.sign(side[1])
      if ((sx !== 0 && !this.get(i + sx, j)) || (sy !== 0 && !this.get(i, j + sy))) add.push([i, j])
    }
    for (const [i, j] of add) this.set(i, j, mixc(this.get(i, j)!, col, amount))
  }
  /** darken painted pixels that sit just behind `front` toward the shadow side (contact shadow) */
  shadow(front: Mask, dx: number, dy: number, ink: string, amount: number, onlyParts?: number[]) {
    const add: [number, number][] = []
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      const v = this.get(i, j)
      if (!v || (onlyParts && !onlyParts.includes(this.id[j * this.w + i]!))) continue
      if (!front(this.dx(i), this.dy(j)) && front(this.dx(i - dx), this.dy(j - dy))) add.push([i, j])
    }
    for (const [i, j] of add) this.set(i, j, mixc(this.get(i, j)!, ink, amount))
  }
  /** what the same indexed PNG would cost with a real deflate (dynamic Huffman): the best case for the encoder in hooks/png.ts */
  zbytes() {
    const idx = new Map<string, number>(), raw = new Uint8Array((this.w + 1) * this.h)
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.c[y * this.w + x]
      let v = 0
      if (c !== undefined) { v = idx.get(c) ?? 0; if (!v) { v = idx.size + 1; idx.set(c, v) } }
      raw[y * (this.w + 1) + 1 + x] = v
    }
    return deflateSync(raw, { level: 9 }).length + 3 * idx.size + 70
  }
  static log: { w: number; h: number; b: number; z: number }[] = []
  colors() { return new Set(this.c.filter(v => v !== undefined)).size }
  /** the image drawn crisp with `s` screen pixels per art pixel at (x, y) */
  image(x: number, y: number, s: number, attrs = '') {
    Cv.log.push({ w: this.w, h: this.h, b: this.bytes(), z: this.zbytes() })
    return `<image x="${x}" y="${y}" width="${this.w * s}" height="${this.h * s}" style="image-rendering:pixelated" ${attrs}href="${this.uri()}"/>`
  }
  uri() { return `data:image/png;base64,${base64(encodePng(this.w, this.h, this.c))}` }
  bytes() { return encodePng(this.w, this.h, this.c).length }
}

export const lighten = (c: string, t: number, warm = '#fff1c8') => mixc(c, warm, t)
export const darken = (c: string, t: number, cool = '#2a1d4a') => mixc(c, cool, t)
