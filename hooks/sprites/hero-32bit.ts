// task-20: a 32-bit test of the V1 and V8 adventurers. Nothing in the game imports this file; tools/render_hero_options.ts --b32
// draws it. One cell is one screen pixel at band size (the hero is about 52 px tall), drawn from shaded shapes (ellipsoids,
// capsules, bevelled polygons) lit from the upper left, with hue-shifted six-tone ramps, lines where parts overlap and a
// selective dark outline. Every design is original.
import { Cells } from './core'
import type { Part, Sprite } from './core'

export const W32 = 72, H32 = 72, FOOT32 = 68
export type Pose32 = 'stand' | 'attack' | 'sit'
export type Hero32 = 'V1' | 'V8'

// ---- color: hue-shifted ramps ----
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const rgbOf = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const hx = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
const toHsl = (c: string): [number, number, number] => {
  const [r, g, b] = rgbOf(c).map(v => v / 255) as [number, number, number]
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}
const fromHsl = (h: number, s: number, l: number) => {
  s = clamp01(s); l = clamp01(l)
  const a = s * Math.min(l, 1 - l), k = (n: number) => (n + h / 30) % 12
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return `#${hx(f(0) * 255)}${hx(f(8) * 255)}${hx(f(4) * 255)}`
}
const toward = (h: number, t: number, deg: number) => { const d = ((t - h + 540) % 360) - 180; return (h + Math.sign(d) * Math.min(Math.abs(d), deg) + 360) % 360 }
export const mixc = (a: string, b: string, t: number) => { const x = rgbOf(a), y = rgbOf(b); return `#${hx(x[0] + (y[0] - x[0]) * t)}${hx(x[1] + (y[1] - x[1]) * t)}${hx(x[2] + (y[2] - x[2]) * t)}` }

/** Six tones: 0 line, 1 deep shadow, 2 shadow, 3 base, 4 light, 5 highlight. Shadows lean to `cool`, lights to `warm`. */
export type Ramp = readonly [string, string, string, string, string, string]
export const ramp = (base: string, o: { cool?: number; warm?: number; k?: number; sat?: number; hs?: number } = {}): Ramp => {
  let [h, s, l] = toHsl(base)
  const grey = s < 0.08, k = o.k ?? 1, cool = o.cool ?? 245, warm = o.warm ?? 48
  if (grey) h = 225
  const sd = (grey ? 0.35 : 1) * (o.sat ?? 1), hs = (grey ? 0.4 : 1) * (o.hs ?? 1)
  const t = (ll: number, deg: number, ds: number) => fromHsl(toward(h, deg >= 0 ? warm : cool, Math.abs(deg) * hs), (grey ? Math.max(s, 0.04) : s) + ds * sd, ll)
  const up = (f: number) => l + Math.min((1 - l) * f * k, (l + 0.1) * f * 1.5)
  return [t(l * 0.22, -28, 0.14), t(l * (1 - 0.46 * k), -18, 0.1), t(l * (1 - 0.24 * k), -9, 0.05), base, t(up(0.32), 8, -0.02), t(up(0.66), 14, -0.14)]
}

// ---- the raster: shapes painted back to front, each pixel keeps its part and ramp ----
export type N3 = [number, number, number]
type NFn = (x: number, y: number) => N3
const LIGHT: N3 = (() => { const v: N3 = [-0.52, -0.64, 0.56], m = Math.hypot(...v); return [v[0] / m, v[1] / m, v[2] / m] })()
export const norm = (x: number, y: number, z: number): N3 => { const m = Math.hypot(x, y, z) || 1; return [x / m, y / m, z / m] }
const toneOf = (n: N3, bias = 0) => {
  const d = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2] + bias
  return d > 0.94 ? 5 : d > 0.74 ? 4 : d > 0.4 ? 3 : d > 0.1 ? 2 : 1
}
export type Paint = { n?: NFn; bias?: number; tone?: number; /** cap the brightest tone (matte cloth never gets 5) */ max?: number; min?: number }
export type Box = [number, number, number, number]

export class Raster {
  c: (string | undefined)[]
  part: Int16Array
  rid: Int16Array
  ramps: Ramp[] = []
  parts: { cls?: string; line: boolean }[] = []
  cur = -1
  clip?: (x: number, y: number) => boolean
  constructor(public w: number, public h: number) {
    this.c = new Array<string | undefined>(w * h).fill(undefined)
    this.part = new Int16Array(w * h).fill(-1)
    this.rid = new Int16Array(w * h).fill(-1)
  }
  /** Start a new part: later paint covers earlier; `line` draws a dark edge where it covers another material. */
  layer(cls?: string, line = true) { this.parts.push({ cls, line }); this.cur = this.parts.length - 1; return this }
  private rampId(r: Ramp) { let i = this.ramps.indexOf(r); if (i < 0) { this.ramps.push(r); i = this.ramps.length - 1 } return i }
  has(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.c[y * this.w + x] !== undefined }
  set(x: number, y: number, col: string, r?: Ramp) {
    x = Math.floor(x); y = Math.floor(y)
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    if (this.clip && !this.clip(x, y)) return
    const k = y * this.w + x
    this.c[k] = col; this.part[k] = this.cur; this.rid[k] = r ? this.rampId(r) : -1
  }
  /** Paint tone `t` of ramp `r` at a pixel. */
  tone(x: number, y: number, r: Ramp, t: number) { this.set(x, y, r[Math.max(0, Math.min(5, t))] ?? r[3], r) }
  rect(x: number, y: number, w: number, h: number, r: Ramp, t = 3) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.tone(x + i, y + j, r, t) }
  fill(box: Box, inside: (x: number, y: number) => boolean, r: Ramp, p: Paint) {
    const [x0, y0, x1, y1] = box
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(this.w - 1, Math.ceil(x1)); x++) {
      const px = x + 0.5, py = y + 0.5
      if (!inside(px, py)) continue
      let t = p.tone ?? toneOf(p.n ? p.n(px, py) : [0, 0, 1], p.bias)
      if (p.max !== undefined) t = Math.min(t, p.max)
      if (p.min !== undefined) t = Math.max(t, p.min)
      this.tone(x, y, r, t)
    }
  }
  ell(cx: number, cy: number, rx: number, ry: number, r: Ramp, p: Paint & { flat?: number } = {}) {
    this.fill([cx - rx, cy - ry, cx + rx, cy + ry], (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, r, { n: ellN(cx, cy, rx, ry, p.flat), ...p })
  }
  /** A limb: a capsule from a to b, radius ra to rb, shaded as a cylinder. */
  cap(ax: number, ay: number, bx: number, by: number, ra: number, rb: number, r: Ramp, p: Paint = {}) {
    const m = Math.max(ra, rb)
    const at = (x: number, y: number) => {
      const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1
      const t = clamp01(((x - ax) * dx + (y - ay) * dy) / L)
      const qx = ax + dx * t, qy = ay + dy * t, rad = ra + (rb - ra) * t
      return { ox: x - qx, oy: y - qy, rad }
    }
    this.fill([Math.min(ax, bx) - m, Math.min(ay, by) - m, Math.max(ax, bx) + m, Math.max(ay, by) + m], (x, y) => { const q = at(x, y); return q.ox * q.ox + q.oy * q.oy <= q.rad * q.rad }, r, {
      n: (x, y) => { const q = at(x, y), u = q.ox / q.rad, v = q.oy / q.rad; return norm(u, v, Math.sqrt(Math.max(0.05, 1 - u * u - v * v))) }, ...p,
    })
  }
  /** A polygon, bevelled at its edges and optionally curved across x like a cylinder. */
  poly(pts: [number, number][], r: Ramp, p: Paint & { bevel?: number; cyl?: [number, number]; tilt?: [number, number] } = {}) {
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1])
    const inside = (x: number, y: number) => inPoly(pts, x, y)
    const bevel = p.bevel ?? 1.6
    this.fill([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], inside, r, {
      n: (x, y) => {
        const e = nearEdge(pts, x, y)
        const s = e.d < bevel ? (1 - e.d / bevel) * 1.5 : 0
        let nx = e.ox * s + (p.tilt?.[0] ?? 0), ny = e.oy * s + (p.tilt?.[1] ?? 0)
        if (p.cyl) nx += ((x - p.cyl[0]) / p.cyl[1]) * 0.95
        return norm(nx, ny, 1)
      }, ...p,
    })
  }
  /** A thick line of one tone, for straps, staffs and rod lines. */
  line(ax: number, ay: number, bx: number, by: number, r: Ramp, t: number, w = 1) {
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2 + 1
    for (let i = 0; i <= n; i++) { const x = ax + ((bx - ax) * i) / n, y = ay + ((by - ay) * i) / n; for (let j = 0; j < w; j++) this.tone(x + (Math.abs(by - ay) > Math.abs(bx - ax) ? j : 0), y + (Math.abs(by - ay) > Math.abs(bx - ax) ? 0 : j), r, t) }
  }
}
export const ellN = (cx: number, cy: number, rx: number, ry: number, flat = 1): NFn => (x, y) => {
  const u = (x - cx) / rx, v = (y - cy) / ry
  return norm(u * flat, v * flat, Math.sqrt(Math.max(0.02, 1 - u * u - v * v)))
}
export const inPoly = (pts: [number, number][], x: number, y: number) => {
  let c = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!, [xj, yj] = pts[j]!
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
const nearEdge = (pts: [number, number][], x: number, y: number) => {
  let best = { d: 1e9, ox: 0, oy: 0 }
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, ay] = pts[j]!, [bx, by] = pts[i]!
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1
    const t = clamp01(((x - ax) * dx + (y - ay) * dy) / L)
    const qx = ax + dx * t - x, qy = ay + dy * t - y, d = Math.hypot(qx, qy)
    if (d < best.d) best = { d, ox: d ? qx / d : 0, oy: d ? qy / d : 0 }
  }
  return best
}

// ---- finishing: overlap lines, then the selective outline ----
export type Img32 = { w: number; h: number; foot: number; c: (string | undefined)[]; part: Int16Array; cls: (string | undefined)[] }
const INK = '#140b16'
export const finish32 = (r: Raster, foot = FOOT32): Img32 => {
  const { w, h } = r
  const c = r.c.slice(), part = Int16Array.from(r.part)
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : y * w + x)
  const N4 = [[0, -1], [-1, 0], [1, 0], [0, 1]] as const
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x, a = r.part[k] ?? -1, ra = r.rid[k] ?? -1
    if (a < 0 || ra < 0 || !r.parts[a]?.line) continue
    for (const [dx, dy] of N4) {
      const q = at(x + dx, y + dy)
      if (q < 0) continue
      const b = r.part[q] ?? -1, rb = r.rid[q] ?? -1
      if (b >= 0 && b < a && rb !== ra && r.ramps[rb] !== r.ramps[ra]) { c[k] = r.ramps[ra]?.[1]; break }
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x
    if (r.c[k] !== undefined) continue
    for (const [dx, dy] of N4) {
      const q = at(x + dx, y + dy)
      if (q < 0 || r.c[q] === undefined) continue
      const rb = r.rid[q] ?? -1, base = rb >= 0 ? r.ramps[rb]?.[0] ?? INK : INK
      // lit side (up and left) keeps more of the material's own dark, the shade side is near black
      c[k] = mixc(base, INK, dy > 0 || dx > 0 ? 0.3 : 0.6)
      part[k] = r.part[q] ?? -1
      break
    }
  }
  return { w, h, foot, c, part, cls: r.parts.map(p => p.cls) }
}

/** The image as a Sprite: one Part per moving class, merged rects inside each. */
export const spriteOf = (img: Img32): Sprite => {
  const groups = new Map<string, Cells>()
  for (let k = 0; k < img.c.length; k++) {
    const col = img.c[k]
    if (col === undefined) continue
    const p = img.part[k] ?? -1, cls = (p >= 0 ? img.cls[p] : undefined) ?? ''
    let g = groups.get(cls)
    if (!g) { g = new Cells(img.w, img.h); groups.set(cls, g) }
    g.put(k % img.w, Math.floor(k / img.w), col)
  }
  const parts: Part[] = [...groups].map(([cls, g]) => (cls ? { cls, rects: g.rects() } : { rects: g.rects() }))
  return { w: img.w, h: img.h, foot: img.foot, parts }
}
export const colorsOf = (img: Img32) => new Set(img.c.filter((v): v is string => v !== undefined)).size

// ---- the bodies ----
export type Look32 = { skin: string; hair: string; eyes: string; accent: string }
const LOOKS: Record<Hero32, Look32> = {
  V1: { skin: '#f2c49b', hair: '#7a4a2a', eyes: '#3a7ad8', accent: '#d0342c' },
  V8: { skin: '#e3a878', hair: '#2a2230', eyes: '#7a4a2a', accent: '#2fa8c8' },
}
/** Where gear goes on a body. */
export type Rig32 = {
  pose: Pose32; cx: number
  head: { cx: number; cy: number; rx: number; ry: number; top: number; fx: number }
  /** torso outline; chest gear paints inside it */
  torso: [number, number][]; tcx: number; tw: number; neck: number; waist: number; hem: number
  shoulderL: [number, number]; shoulderR: [number, number]; handL: [number, number]; handR: [number, number]
  hip: number
}
type BodySpec = { headRx: number; headRy: number; headCy: number; neck: number; waist: number; hem: number; half: number; flare: number; coat?: string; tunic: string; pants: string; boot: string }
const SPECS: Record<Hero32, BodySpec> = {
  V1: { headRx: 11.5, headRy: 10.5, headCy: 31, neck: 41, waist: 52, hem: 57.5, half: 8, flare: 2, tunic: '#3f6fc0', pants: '#4a3a2c', boot: '#6b4526' },
  V8: { headRx: 10.5, headRy: 9.6, headCy: 28.5, neck: 37.5, waist: 51, hem: 58.5, half: 8, flare: 2.6, tunic: '#3a4a6a', pants: '#4a3a2c', boot: '#6b4526', coat: '#3a4a6a' },
}

export type Gear32 = {
  name: string
  back?: (r: Raster, g: Rig32) => void
  /** paints over the torso (clipped to it) and may restyle sleeves */
  chest?: (r: Raster, g: Rig32) => void
  sleeve?: string
  over?: (r: Raster, g: Rig32) => void
  head?: (r: Raster, g: Rig32) => void
  /** hides hair above the hat line */
  hatLine?: number
  off?: (r: Raster, g: Rig32) => void
  weapon?: (r: Raster, g: Rig32) => void
}

const rampCache = new Map<string, Ramp>()
export const R = (c: string, o?: { cool?: number; warm?: number; k?: number; sat?: number; hs?: number }) => { const key = c + JSON.stringify(o ?? {}); let v = rampCache.get(key); if (!v) { v = ramp(c, o); rampCache.set(key, v) } return v }
/** Skin mixes toward rose shadows and warm cream lights instead of the HSL walk, which went orange. */
export const skinRamp = (c: string): Ramp => [mixc(c, '#2a0f1c', 0.78), mixc(c, '#7a2a44', 0.42), mixc(c, '#b0506a', 0.2), c, mixc(c, '#fff2dc', 0.32), mixc(c, '#ffffff', 0.58)]

export const hero32 = (id: Hero32, pose: Pose32, gear?: Gear32, look?: Look32): Img32 => {
  const lk = look ?? LOOKS[id], sp = SPECS[id]
  const r = new Raster(W32, H32)
  const sit = pose === 'sit', d = sit ? 7 : 0
  const cx = 34
  const skin = skinRamp(lk.skin), hair = R(lk.hair, { cool: 265, warm: 30, k: 0.6, hs: 0.6 }), tunic = R(sp.tunic), pants = R(sp.pants), boot = R(sp.boot), acc = R(lk.accent)
  const sleeve = gear?.sleeve ? R(gear.sleeve) : tunic
  const neck = sp.neck + d, waist = sp.waist + d, hem = sp.hem + d
  const hcx = cx + 0.5, hcy = sp.headCy + d
  const torso: [number, number][] = [[cx - sp.half + 1, neck], [cx + sp.half + 1, neck], [cx + sp.half + 2, neck + 3], [cx + sp.half + 2, waist], [cx + sp.half + 1 + sp.flare, hem], [cx - sp.half - sp.flare, hem], [cx - sp.half - 1, waist], [cx - sp.half - 1, neck + 3]]
  // arms by pose: shoulders, elbows, hands
  const sL: [number, number] = [cx - sp.half - 0.5, neck + 3], sR: [number, number] = [cx + sp.half + 1.5, neck + 3]
  let eL: [number, number], hL: [number, number], eR: [number, number], hR: [number, number]
  if (pose === 'attack') { eL = [sL[0] - 3, neck + 8]; hL = [sL[0] - 5, neck + 12]; eR = [sR[0] + 4, neck + 4]; hR = [sR[0] + 6, neck - 1] }
  else if (sit) { eL = [sL[0] - 1, neck + 8]; hL = [cx + 1, neck + 12]; eR = [sR[0] + 2, neck + 8]; hR = [cx + 7, neck + 11] }
  else { eL = [sL[0] - 1.5, neck + 7.5]; hL = [sL[0] - 2.5, neck + 13]; eR = [sR[0] + 1.5, neck + 7.5]; hR = [sR[0] + 2.5, neck + 13] }
  const rig: Rig32 = {
    pose, cx, head: { cx: hcx, cy: hcy, rx: sp.headRx, ry: sp.headRy, top: hcy - sp.headRy - 3, fx: hcx + 1.5 },
    torso, tcx: cx + 0.5, tw: sp.half * 2 + 2, neck, waist, hem, shoulderL: sL, shoulderR: sR, handL: hL, handR: hR, hip: hem - 1,
  }

  // back: cape, wings, scarf tail
  r.layer('back', false)
  gear?.back?.(r, rig)
  if (id === 'V8') scarfTail(r, rig, acc)

  // legs and boots
  // sitting cross-legged: the shins cross in front of the body (drawn after the torso), knees out, feet tucked under
  const crossLegs = () => {
    r.layer('l1'); r.cap(cx - 9, 62.5, cx + 4, 64.6, 3.1, 2.8, pants, { min: 2, max: 4 }); r.ell(cx + 5.5, 65, 3.2, 1.9, boot)
    r.layer('l2'); r.cap(cx + 10, 62.5, cx - 3, 64.2, 3.1, 2.8, pants, { min: 2, max: 4 }); r.ell(cx - 4.5, 65, 3.2, 1.9, boot)
  }
  if (!sit) {
    r.layer('l1')
    r.cap(cx - 3.5, hem - 2, cx - 4.2, 62, 2.7, 2.5, pants, { max: 4 })
    bootAt(r, cx - 4.4, 64.2, boot, 1)
    r.layer('l2')
    r.cap(cx + 4, hem - 2, cx + 5, 62, 2.7, 2.5, pants, { max: 4 })
    bootAt(r, cx + 5.2, 64.2, boot, 1)
  }

  // far arm (left on screen) sits behind the torso when it hangs; in front when it holds a shield
  const armL = () => { r.layer('cl'); r.cap(sL[0], sL[1], eL[0], eL[1], 2.6, 2.4, sleeve, { max: 4 }); r.cap(eL[0], eL[1], hL[0], hL[1], 2.4, 2.2, sleeve, { max: 4 }); r.ell(hL[0], hL[1] + 1, 2.5, 2.4, skin) }
  const armR = () => { r.layer('cr'); r.cap(sR[0], sR[1], eR[0], eR[1], 2.6, 2.4, sleeve, { max: 4 }); r.cap(eR[0], eR[1], hR[0], hR[1], 2.4, 2.2, sleeve, { max: 4 }); r.ell(hR[0], hR[1] + (pose === 'attack' ? 0 : 1), 2.5, 2.4, skin) }

  // torso
  r.layer('body')
  r.poly(torso, tunic, { cyl: [cx + 0.5, sp.half + 3], bevel: 1.2, max: 4 })
  if (id === 'V8') {
    // coat: a front split, a darker lapel and two buttons
    r.line(cx + 1.5, neck + 2, cx + 1.5, hem, tunic, 1)
    for (const yy of [neck + 6, neck + 10]) { r.tone(cx + 3, yy, R('#c8a050'), 4); r.tone(cx + 3, yy + 1, R('#c8a050'), 2) }
  }
  // belt
  const belt = R('#5a3a20'), gold = R('#f2c94c', { k: 1.2 })
  r.layer('body')
  const by = waist
  r.clip = (x, y) => inPoly(torso, x + 0.5, y + 0.5)
  r.fill([cx - 12, by, cx + 14, by + 1], () => true, belt, { n: (x) => norm((x - cx) / 12, -0.2, 1), max: 4 })
  r.clip = undefined
  r.rect(cx + 2, by, 3, 2, gold, 4); r.tone(cx + 4, by + 1, gold, 2); r.tone(cx + 3, by + 1, gold, 1)

  if (gear?.chest) { r.layer('body'); r.clip = (x, y) => inPoly(torso, x + 0.5, y + 0.5); gear.chest(r, rig); r.clip = undefined }
  if (gear?.over) { r.layer('body'); gear.over(r, rig) }
  if (sit) crossLegs()

  if (pose === 'stand' || sit) armL()
  // head
  r.layer('head')
  headAt(r, rig, skin, hair, lk, gear)
  // scarf wrap (V1 short knot, V8 thick wrap)
  r.layer('scarf')
  scarfWrap(r, rig, acc, id)
  if (pose === 'attack') armL()
  // the shield arm holds the off-hand in front; the weapon arm in front of all
  if (gear?.off && pose !== 'sit') { r.layer('off'); gear.off(r, rig) }
  armR()
  if (sit) { r.layer('wpn'); rod(r, rig) }
  else if (gear?.weapon) { r.layer('wpn'); gear.weapon(r, rig); r.layer('cr'); r.ell(hR[0], hR[1] + (pose === 'attack' ? 0 : 1), 2.5, 2.4, skin) }
  return finish32(r)
}

const bootAt = (r: Raster, x: number, y: number, boot: Ramp, dir: number) => {
  r.poly([[x - 2.6, y - 4], [x + 2.6, y - 4], [x + 2.8, y - 1.5], [x + 2.8 + dir * 1.8, y - 0.5], [x + 3.2 * dir + (dir > 0 ? 0.6 : -0.6), y + 2], [x - 2.8 * dir - (dir > 0 ? 0.4 : -0.4), y + 2], [x - 2.8, y - 1]], boot, { bevel: 1.5, cyl: [x, 4] })
  r.fill([x - 4, y + 1, x + 5, y + 2], (px, py) => py > y + 1.3 && inPoly([[x - 3.2, y], [x + 4, y], [x + 4, y + 2], [x - 3.2, y + 2]], px, py), boot, { tone: 1 })
}

const headAt = (r: Raster, g: Rig32, skin: Ramp, hair: Ramp, lk: Look32, gear?: Gear32) => {
  const { cx, cy, rx, ry, fx } = g.head
  // back hair: behind the head, down past the ears
  const hn = ellN(cx - 1, cy - 3, rx + 2, ry + 3)
  r.poly([[cx - rx - 1.5, cy - 2], [cx - rx - 1, cy + 5], [cx - rx + 3, cy + 3], [cx + rx - 2, cy + 3], [cx + rx + 1, cy + 4], [cx + rx + 1.5, cy - 2]], hair, { n: hn })
  // face and skull: an ellipse with a narrower chin
  const inHead = (x: number, y: number) => {
    const v = (y - cy) / ry
    const k = v > 0.15 ? 1 - 0.22 * ((v - 0.15) / 0.85) ** 1.6 : 1
    return ((x - cx - (v > 0.3 ? (v - 0.3) * 1.6 : 0)) / (rx * k)) ** 2 + v * v <= 1
  }
  r.fill([cx - rx, cy - ry, cx + rx + 2, cy + ry], inHead, skin, { n: ellN(cx, cy, rx, ry, 0.8), max: 4, bias: 0.12 })
  // ear on the far side
  r.ell(cx - rx + 0.3, cy + 2, 1.8, 2.6, skin, { max: 3 }); r.tone(Math.floor(cx - rx + 0.3), Math.floor(cy + 2), skin, 1)
  // face: eyes look to the right
  const ey = Math.floor(cy + 1), L = Math.floor(fx - 6.5), Rx = Math.floor(fx + 1.5)
  const ink = R('#2a1820'), white = R('#fffaf2'), iris = R(lk.eyes)
  for (const ex of [L, Rx]) {
    const outer = ex === L ? ex - 1 : ex + 3
    r.rect(ex, ey, 3, 1, ink, 3); r.tone(outer, ey, ink, 3); r.tone(outer, ey + 1, ink, 4)
    r.tone(ex, ey + 1, white, 3); r.tone(ex, ey + 2, white, 2)
    r.tone(ex + 1, ey + 1, white, 5); r.tone(ex + 2, ey + 1, iris, 1)
    r.tone(ex + 1, ey + 2, iris, 2); r.tone(ex + 2, ey + 2, ink, 3)
    r.tone(ex + 1, ey + 3, iris, 4); r.tone(ex + 2, ey + 3, iris, 3)
  }
  // brows: inner ends low, a brave look
  r.tone(L, ey - 3, hair, 1); r.rect(L + 1, ey - 2, 3, 1, hair, 1)
  r.rect(Rx - 1, ey - 2, 3, 1, hair, 1); r.tone(Rx + 2, ey - 3, hair, 1)
  r.tone(Math.floor(fx + 1), ey + 4, skin, 2); r.tone(Math.floor(fx + 1), ey + 3, skin, 4)
  const lip = R('#b04a3a')
  r.rect(Math.floor(fx - 1), ey + 6, 3, 1, lip, 2); r.tone(Math.floor(fx - 1), ey + 6, lip, 1)
  r.tone(L - 1, ey + 4, R('#f08a7a'), 4); r.tone(L, ey + 4, R('#f08a7a'), 4); r.tone(Rx + 4, ey + 4, R('#f08a7a'), 4)
  // hair: a cap down to a hairline that dips at the temples, locks swept back over the forehead, spikes on the crown
  r.layer('hair')
  const capN = ellN(cx - 1, cy - 3, rx + 3, ry + 3)
  const hat = gear?.hatLine
  const crx = rx + 1.4, cry = ry + 1.6, ccy = cy - 2.5
  const hl = (x: number) => cy - 4.5 + ((x - cx) / rx) ** 4 * 8
  const ytop = (x: number) => ccy - cry * Math.sqrt(Math.max(0, 1 - ((x - cx + 0.5) / crx) ** 2))
  const capIn = (x: number, y: number) => ((x - cx + 0.5) / crx) ** 2 + ((y - ccy) / cry) ** 2 <= 1 && y < hl(x) && (hat === undefined || y >= hat)
  r.fill([cx - crx - 1, ccy - cry - 1, cx + crx + 1, cy + 4], capIn, hair, { n: capN })
  if (hat === undefined) for (const [bx, w, dx, ht] of [[cx - 8, 5, -4, 4], [cx - 3, 6, -3.5, 6], [cx + 3, 6, -2.5, 5.5], [cx + 8, 5, -1, 3.5]] as const) {
    const y0 = ytop(bx) + 2.5
    r.poly([[bx - w / 2, y0], [bx + dx, y0 - ht], [bx + w / 2, y0]], hair, { n: capN })
  }
  const locks = [[cx - rx - 0.8, 4.5, -1.5, 5.5], [cx - rx + 3, 5, -2, 4], [cx - 2.5, 5.5, -2, 3.8], [cx + 2.2, 5, -1.5, 3.2], [cx + rx - 4, 5, 0.5, 4.5]] as const
  for (const [x0, w, dx, len] of locks) {
    const y0 = hl(x0 + w / 2) - 2
    r.poly([[x0, y0], [x0 + w, y0], [x0 + w / 2 + dx, y0 + len]], hair, { n: capN })
  }
  // strands: a darker line where locks meet, a shine band on the lit side
  for (const [x0, w] of locks.slice(1)) { const x = Math.floor(x0 + 0.5), y = Math.floor(hl(x0 + w / 2) - 2); r.tone(x, y, hair, 1); r.tone(x, y + 1, hair, 2); r.tone(x - 1, y - 1, hair, 2) }
  if (hat === undefined) for (let x = Math.floor(cx - 7); x <= cx - 1; x++) r.tone(x, Math.floor(ytop(x) + 3 + Math.abs(x - cx + 4) * 0.3), hair, 5)
  if (gear?.head) { r.layer('hat'); gear.head(r, g) }
}

const scarfWrap = (r: Raster, g: Rig32, acc: Ramp, id: Hero32) => {
  const { cx } = g.head, y = g.neck - (id === 'V8' ? 1.5 : 1)
  const w = id === 'V8' ? 9.5 : 8.5, t = id === 'V8' ? 4 : 3
  r.poly([[cx - w, y], [cx + w, y], [cx + w + 0.5, y + t], [cx - w - 0.5, y + t]], acc, { cyl: [cx, w + 2], bevel: 1.2 })
  r.line(cx - w + 1, y + t - 1, cx + w - 1, y + t - 1, acc, 2)
  // knot and short tail on the shoulder (V1); V8's tail streams behind
  if (id === 'V1') { r.ell(cx - 6, y + t, 2.2, 2, acc); r.poly([[cx - 8, y + t], [cx - 5.5, y + t + 1], [cx - 7, y + t + 7], [cx - 9.5, y + t + 6]], acc, { tilt: [-0.3, 0] }) }
}

const scarfTail = (r: Raster, g: Rig32, acc: Ramp) => {
  const { cx } = g.head, y = g.neck
  const pts: [number, number][] = []
  for (let i = 0; i <= 12; i++) { const x = cx - 4 - i * 2.3, wave = Math.sin(i * 0.9) * 1.6; pts.push([x, y - 0.5 + i * 0.75 + wave]) }
  for (let i = 12; i >= 0; i--) { const x = cx - 4 - i * 2.3, wave = Math.sin(i * 0.9) * 1.6; pts.push([x, y + 3.5 + i * 0.95 + wave - i * 0.12]) }
  r.poly(pts, acc, { bevel: 1.4, n: (x, yy) => norm(0, Math.cos((cx - x) / 2.3 * 0.9) * 0.9, 1) })
  // fringe at the end
  const ex = cx - 4 - 12 * 2.3
  for (let j = 0; j < 4; j++) r.line(ex, y + 9 + j * 1.2, ex - 2, y + 10 + j * 1.4, acc, 2)
}

const rod = (r: Raster, g: Rig32) => {
  const wood = R('#8a5a32'), lineC = R('#d8d8e0')
  const [hx, hy] = g.handR
  r.line(hx - 4, hy + 3, hx + 22, hy - 24, wood, 3); r.line(hx - 4, hy + 4, hx + 22, hy - 23, wood, 2)
  for (let y = hy - 23; y < FOOT32 - 1; y += 1) r.tone(hx + 22, y, lineC, 4)
  r.ell(hx + 22, FOOT32 - 2, 1.5, 1.5, R('#e0443a'))
}

// ---- gear at 32-bit: the eight test sets, hand-built from shared shapes ----
export type V2 = [number, number]
export const unit = (x: number, y: number): V2 => { const m = Math.hypot(x, y) || 1; return [x / m, y / m] }
/** Paint in a frame along `u` from `o`: s runs along u, t across it. */
export const local = (r: Raster, o: V2, u: V2, sMin: number, sMax: number, tMax: number, inside: (s: number, t: number) => boolean, rp: Ramp, n: (s: number, t: number) => N3) => {
  const v: V2 = [-u[1], u[0]]
  const xs: number[] = [], ys: number[] = []
  for (const s of [sMin, sMax]) for (const t of [-tMax, tMax]) { xs.push(o[0] + u[0] * s + v[0] * t); ys.push(o[1] + u[1] * s + v[1] * t) }
  r.fill([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], (x, y) => {
    const dx = x - o[0], dy = y - o[1]
    return inside(dx * u[0] + dy * u[1], dx * v[0] + dy * v[1])
  }, rp, { n: (x, y) => { const dx = x - o[0], dy = y - o[1]; return n(dx * u[0] + dy * u[1], dx * v[0] + dy * v[1]) } })
}
export const STEEL = '#c8ccd8', GOLD = '#f2c94c', WOOD = '#8a5a32', LEATHER = '#5a3a24'
export const metal = (c: string) => R(c, { k: 1.25, cool: 230, warm: 55 })

/** A blade with a guard and grip: len is the blade past the guard, w its half width, curve bends it sideways. */
export const blade = (r: Raster, g: Rig32, o: { len: number; w: number; col: string; guard: number; guardCol?: string; curve?: number; tip?: number; lean?: number; grip?: number; hand?: V2; dir?: V2; pommel?: boolean }) => {
  const hand = o.hand ?? g.handR, u = o.dir ?? unit(o.lean ?? 0.18, -1), v: V2 = [-u[1], u[0]]
  const st = metal(o.col), gd = metal(o.guardCol ?? GOLD), grip = R(LEATHER)
  const at = (s: number, t: number): V2 => [hand[0] + u[0] * s + v[0] * t, hand[1] + u[1] * s + v[1] * t]
  const gl = o.grip ?? 4
  const g0 = at(-gl, 0), g1 = at(2, 0)
  r.cap(g0[0], g0[1], g1[0], g1[1], 1.1, 1.1, grip)
  if (o.pommel !== false) { const p = at(-gl - 1, 0); r.ell(p[0], p[1], 1.5, 1.5, gd) }
  const len = o.len, w = o.w, tip = o.tip ?? w * 2.2, cv = o.curve ?? 0
  const c = (s: number) => cv * (s / len) ** 2
  const base = 2.5
  local(r, at(base, 0), u, -0.5, len + 0.5, w + Math.abs(cv) + 1, (s, t) => {
    if (s < 0 || s > len) return false
    const ww = s > len - tip ? w * ((len - s) / tip) : w
    return Math.abs(t - c(s)) <= ww + 0.15
  }, st, (s, t) => { const side = t - c(s) >= 0 ? 1 : -1; return norm(v[0] * side * 0.85, v[1] * side * 0.85, 1) })
  if (w >= 1.5) for (let s = 1; s < len - tip; s += 0.5) { const p = at(base + s, c(s) + 0.4); r.tone(p[0], p[1], st, 2) }
  for (let s = 2; s < len - 1; s += 3) { const p = at(base + s, c(s) - w + 0.3); r.tone(p[0], p[1], st, 5) }
  const q0 = at(base - 0.2, -o.guard), q1 = at(base - 0.2, o.guard)
  r.cap(q0[0], q0[1], q1[0], q1[1], 1.2, 1.2, gd)
}

/** A shaft weapon (staff, mace, mallet): a pole through the hand; returns its top and direction. */
const pole = (r: Raster, g: Rig32, up: number, down: number, col = WOOD, lean = 0.12, w = 1.2): [V2, V2] => {
  const u = unit(lean, -1), h = g.handR
  const a: V2 = [h[0] - u[0] * down, h[1] - u[1] * down], b: V2 = [h[0] + u[0] * up, h[1] + u[1] * up]
  r.cap(a[0], a[1], b[0], b[1], w, w, R(col))
  return [b, u]
}

const shieldCenter = (g: Rig32): V2 => [g.handL[0] + 1, g.handL[1] + 1]
/** A shield: the rim ramp fills the shape, the face fills it inset by `rim`, both domed a little. */
export const shieldShape = (r: Raster, inside: (x: number, y: number, inset: number) => boolean, box: Box, face: Ramp, rimR: Ramp, rim = 1.4) => {
  const cxs = (box[0] + box[2]) / 2, cys = (box[1] + box[3]) / 2, rx = (box[2] - box[0]) / 2, ry = (box[3] - box[1]) / 2
  const n = (x: number, y: number) => norm(((x - cxs) / rx) * 0.55, ((y - cys) / ry) * 0.45, 1)
  r.fill(box, (x, y) => inside(x, y, 0), rimR, { n })
  r.fill(box, (x, y) => inside(x, y, rim), face, { n, bias: 0.05 })
}
export const inRound = (cx: number, cy: number, rx: number, ry: number, k = 2) => (x: number, y: number, i: number) => Math.abs((x - cx) / (rx - i)) ** k + Math.abs((y - cy) / (ry - i)) ** k <= 1

/** A cape behind the body: shoulders to below the hem, wider at the bottom, folds and a wavy edge. */
const cape = (r: Raster, g: Rig32, col: string, o: { len?: number; spread?: number; lining?: string } = {}) => {
  const rp = R(col), top = g.neck + 1, bot = g.hem + (o.len ?? 6), sp = o.spread ?? 13
  const cx = g.tcx
  const edge = (x: number) => bot + Math.sin(x * 0.9) * 0.9 + (x < cx ? (cx - x) * 0.08 : 0)
  const half = (y: number) => 8 + ((y - top) / (bot - top)) * (sp - 8)
  const inC = (x: number, y: number) => y >= top && y <= edge(x) && x >= cx - half(y) - 2 - ((y - top) / (bot - top)) * 2 && x <= cx + half(y)
  r.fill([cx - sp - 3, top, cx + sp + 1, bot + 3], inC, rp, { n: (x) => norm(Math.sin((x - cx) * 0.75) * 0.6 + ((x - cx) / (sp + 4)) * 0.6, -0.15, 1), max: 4 })
  if (o.lining) r.fill([cx - sp - 3, top, cx + sp + 1, bot + 3], (x, y) => inC(x, y) && y > edge(x) - 1.6, R(o.lining), { tone: 3 })
}

/** Wings behind the shoulders, swept out and down: a rounded covert on top, five long feathers below it. */
const wings = (r: Raster, g: Rig32, col: string) => {
  const rp = R(col, { k: 0.75, hs: 0.5 }), cx = g.tcx, y0 = g.neck + 3
  for (const s of [-1, 1]) {
    const root: V2 = [cx + s * 6, y0]
    for (let i = 0; i < 5; i++) {
      const ang = 0.15 + i * 0.26, len = 15 - i * 1.6
      const tip: V2 = [root[0] + s * Math.cos(ang) * len, root[1] + Math.sin(ang) * len]
      r.cap(root[0], root[1], tip[0], tip[1], 2.6, 1, rp, { bias: -0.06 * i, max: 4 })
    }
    r.poly([[root[0] - s * 1, y0 - 4], [root[0] + s * 9, y0 - 7], [root[0] + s * 14, y0 - 3], [root[0] + s * 10, y0 + 2], [root[0], y0 + 3]], rp, { bevel: 2.2, bias: 0.12 })
    for (let i = 0; i < 3; i++) r.line(root[0] + s * (4 + i * 3), y0 - 2 + i * 0.5, root[0] + s * (6 + i * 3), y0 + 1 + i, rp, 2)
  }
}

export const dot = (r: Raster, x: number, y: number, rp: Ramp, t = 5) => r.tone(x, y, rp, t)
export const starAt = (r: Raster, x: number, y: number, rp: Ramp) => { dot(r, x, y, rp, 5); dot(r, x - 1, y, rp, 3); dot(r, x + 1, y, rp, 3); dot(r, x, y - 1, rp, 3); dot(r, x, y + 1, rp, 3) }

/** A dome helmet over the skull, with a rim at the brow line. */
const dome = (r: Raster, g: Rig32, col: string, o: { rim?: string; up?: number; widen?: number; brow?: number; lacquer?: boolean } = {}) => {
  const { cx, cy, rx, ry } = g.head, rp = o.lacquer ? R(col, { k: 0.85 }) : metal(col), brow = cy - (o.brow ?? 4)
  const drx = rx + (o.widen ?? 1.6), dry = ry + 1.5 + (o.up ?? 0)
  r.fill([cx - drx - 1, cy - dry - 3, cx + drx + 1, brow + 2], (x, y) => ((x - cx + 0.3) / drx) ** 2 + ((y - cy + 1.5) / dry) ** 2 <= 1 && y < brow, rp, { n: ellN(cx - 0.5, cy - 1.5, drx, dry) })
  const rim = o.rim ? metal(o.rim) : rp
  r.fill([cx - drx - 1, brow - 2, cx + drx + 1, brow + 1], (x, y) => y >= brow - 1.6 && y < brow + 0.4 && Math.abs(x - cx + 0.3) <= drx * Math.sqrt(Math.max(0, 1 - ((y - cy + 1.5) / dry) ** 2)) + 0.6, rim, { n: (x) => norm((x - cx) / drx, -0.1, 1) })
  return { brow, top: cy - 1.5 - dry, drx }
}
const fillTorso = (r: Raster, g: Rig32, rp: Ramp, o: Paint = {}) => r.fill([g.tcx - 12, g.neck, g.tcx + 12, g.hem + 1], () => true, rp, { n: (x) => norm((x - g.tcx) / 9, -0.1, 1), max: 4, ...o })
const pauldrons = (r: Raster, g: Rig32, col: string, trim: string) => {
  const st = metal(col), tr = metal(trim)
  for (const [s, p] of [[-1, g.shoulderL], [1, g.shoulderR]] as const) { r.ell(p[0] + s * 0.5, p[1] - 0.5, 4.2, 3.2, st); r.line(p[0] - 3, p[1] + 2, p[0] + 3, p[1] + 2, tr, 4) }
}

const KNIGHT: Gear32 = {
  name: 'Knight', sleeve: '#7a8296', hatLine: 999,
  back: (r, g) => cape(r, g, '#c0392b', { len: 4, lining: '#7a1a20' }),
  chest: (r, g) => {
    const st = metal('#9fb0c8')
    r.fill([g.tcx - 12, g.neck, g.tcx + 12, g.hem], () => true, st, { n: (x, y) => norm((x - g.tcx) / 9, (y - g.neck) / 30 - 0.3, 1) })
    r.line(g.tcx, g.neck + 2, g.tcx, g.waist - 1, st, 4)
    for (const y of [g.waist + 1.5, g.waist + 4]) r.line(g.tcx - 12, y, g.tcx + 12, y, st, 1)
  },
  over: (r, g) => pauldrons(r, g, '#9fb0c8', '#6a7690'),
  head: (r, g) => {
    const { cx, fx } = g.head, d = dome(r, g, '#b8c4d8', { rim: '#8a96b0' })
    const ivory = R('#e8dcc0', { k: 0.8 }), rim = metal('#8a96b0')
    for (const s of [-1, 1]) {
      const b: V2 = [cx + s * (d.drx - 1.5), d.brow - 5]
      r.cap(b[0], b[1], b[0] + s * 4, b[1] - 3, 2.2, 1.6, ivory); r.cap(b[0] + s * 4, b[1] - 3, b[0] + s * 5, b[1] - 8, 1.6, 0.6, ivory)
    }
    r.rect(Math.floor(fx), Math.floor(d.brow), 2, 4, rim, 3); r.tone(Math.floor(fx), Math.floor(d.brow), rim, 5)
    for (const x of [cx - 8, cx - 4, cx + 4, cx + 8]) dot(r, Math.floor(x), Math.floor(d.brow - 1), rim, 5)
  },
  off: (r, g) => {
    const [x, y] = shieldCenter(g)
    shieldShape(r, inRound(x - 0.5, y, 6.5, 9, 6), [x - 7, y - 9, x + 6, y + 9], R('#5a5ae0'), metal(STEEL))
    const gold = metal(GOLD)
    r.line(x - 5, y + 2, x - 0.5, y - 4, gold, 4, 2); r.line(x - 0.5, y - 4, x + 4, y + 2, gold, 4, 2); r.ell(x - 0.5, y + 4.5, 1.6, 1.6, gold)
  },
  weapon: (r, g) => blade(r, g, { len: 27, w: 2.2, col: STEEL, guard: 5, guardCol: GOLD, grip: 5 }),
}
const WIZARD: Gear32 = {
  name: 'Wizard', sleeve: '#5a6ad8', hatLine: 999,
  back: (r, g) => { cape(r, g, '#6a3ab0', { len: 8, spread: 14 }); for (const [x, y] of [[-12, 12], [-9, 18], [10, 14], [7, 20], [-6, 10]] as const) starAt(r, Math.floor(g.tcx + x), Math.floor(g.neck + y), R('#f2e05a')) },
  chest: (r, g) => {
    const robe = R('#5a6ad8'), gold = metal(GOLD)
    fillTorso(r, g, robe)
    r.line(g.tcx + 1, g.neck + 1, g.tcx + 1, g.hem, gold, 3, 2); r.line(g.tcx + 1, g.neck + 1, g.tcx + 1, g.hem, gold, 5)
    for (const [x, y] of [[-5, 4], [-4, 11], [5, 7], [6, 13]] as const) starAt(r, Math.floor(g.tcx + x), Math.floor(g.neck + y), R('#f2e05a'))
  },
  over: (r, g) => {
    const robe = R('#5a6ad8'), gold = metal(GOLD), c = g.tcx
    const bot = g.hem + (g.pose === 'sit' ? 4 : 5)
    r.poly([[c - 10, g.hem - 2], [c + 11, g.hem - 2], [c + 12.5, bot], [c - 11.5, bot]], robe, { cyl: [c, 13], max: 4 })
    r.line(c - 11, bot - 1, c + 12, bot - 1, gold, 4)
    r.line(c + 1, g.hem - 2, c + 1, bot, gold, 3, 2)
  },
  head: (r, g) => {
    const { cx, cy, rx } = g.head, hat = R('#7a4ad0'), band = metal(GOLD)
    const brim = cy - 4.5, tipX = cx - 7, tipY = cy - 26
    r.ell(cx, brim, rx + 5.5, 2.6, hat, { flat: 0.6 })
    r.poly([[cx - rx + 0.5, brim], [cx + rx - 0.5, brim], [cx + 4, brim - 9], [cx + 1, brim - 15], [tipX + 1, tipY + 1], [tipX - 3, tipY + 4], [cx - 4, brim - 12], [cx - 7, brim - 6]], hat, { cyl: [cx, rx], bevel: 1.5 })
    r.fill([cx - rx, brim - 4, cx + rx, brim - 1], (x, y) => y >= brim - 3.5 && y < brim - 1 && x > cx - rx + 1 + (brim - y) * 0.3 && x < cx + rx - 1 - (brim - y) * 0.35, band, { n: (x) => norm((x - cx) / rx, 0, 1) })
    starAt(r, Math.floor(cx - 2), Math.floor(brim - 9), R('#f2e05a')); dot(r, Math.floor(cx + 1), Math.floor(brim - 6), R('#f2e05a'))
  },
  off: (r, g) => {
    const [x, y] = shieldCenter(g), cover = R('#e8c43a'), page = R('#f4ecd8', { k: 0.5 })
    r.poly([[x - 5, y - 6], [x + 4, y - 7], [x + 5, y + 5], [x - 4, y + 6]], cover, { bevel: 1.5 })
    r.poly([[x + 4, y - 6], [x + 6, y - 6.5], [x + 6.5, y + 4.5], [x + 5, y + 5]], page, { tone: 4 })
    r.line(x - 3, y - 5, x - 2, y + 4, cover, 1); starAt(r, Math.floor(x + 0.5), Math.floor(y - 0.5), R('#7a4ad0'))
  },
  weapon: (r, g) => {
    const [top, u] = pole(r, g, 22, 8, '#7a5030', 0.08)
    const cr = R('#5ee0ea', { k: 1.2 }), c: V2 = [top[0] + u[0] * 3, top[1] + u[1] * 3]
    r.cap(top[0] - 2.5, top[1] + 1, top[0] + 2.5, top[1] + 1, 1, 1, metal(GOLD))
    r.poly([[c[0], c[1] - 5.5], [c[0] + 3.2, c[1]], [c[0], c[1] + 4], [c[0] - 3.2, c[1]]], cr, { bevel: 2.5 })
    dot(r, Math.floor(c[0] - 1), Math.floor(c[1] - 2), cr, 5)
    for (const [dx, dy] of [[-5, -4], [5, -2], [-4, 4], [4, 5]] as const) dot(r, Math.floor(c[0] + dx), Math.floor(c[1] + dy), cr, 5)
  },
}
const KING: Gear32 = {
  name: 'King', sleeve: '#a8282c',
  back: (r, g) => cape(r, g, '#a02030', { len: 9, spread: 15, lining: '#f2e8d8' }),
  chest: (r, g) => {
    const gold = metal(GOLD)
    fillTorso(r, g, R('#c8302c'))
    r.line(g.tcx - 12, g.waist, g.tcx + 12, g.waist, gold, 4, 2)
    r.rect(Math.floor(g.tcx), Math.floor(g.waist), 2, 2, R('#3a6ad8'), 4)
  },
  over: (r, g) => {
    const er = R('#f4eee4', { k: 0.6 }), c = g.tcx, y = g.neck
    r.poly([[c - 11, y - 1], [c + 12, y - 1], [c + 12.5, y + 4], [c + 6, y + 5], [c, y + 3], [c - 6, y + 5], [c - 11.5, y + 4]], er, { cyl: [c, 12], bevel: 1.5 })
    for (const x of [-8, -3, 3, 8]) { r.tone(Math.floor(c + x), Math.floor(y + 2), R('#2a2230'), 3); r.tone(Math.floor(c + x), Math.floor(y + 3), R('#2a2230'), 3) }
  },
  head: (r, g) => {
    const { cx, cy, ry } = g.head, gold = metal(GOLD), by = cy - ry + 0.5
    r.poly([[cx - 8, by + 3], [cx - 8.5, by - 2], [cx - 6, by + 0.5], [cx - 4, by - 4], [cx - 1.5, by], [cx + 0.5, by - 5], [cx + 2.5, by], [cx + 5, by - 4], [cx + 7, by + 0.5], [cx + 9, by - 2], [cx + 8.5, by + 3]], gold, { bevel: 1.2, cyl: [cx, 9] })
    r.line(cx - 8, by + 2, cx + 8, by + 2, gold, 2)
    for (const [x, c] of [[cx - 5, '#d0342c'], [cx + 0.5, '#3a6ad8'], [cx + 5.5, '#3aa060']] as const) { r.tone(Math.floor(x), Math.floor(by + 1), R(c), 4); r.tone(Math.floor(x), Math.floor(by), R(c), 5) }
    for (const x of [cx - 4, cx + 0.5, cx + 5]) dot(r, Math.floor(x), Math.floor(by - 4.5), gold, 5)
  },
  off: (r, g) => {
    const [x, y] = shieldCenter(g)
    const inH = (px: number, py: number, i: number) => py >= y - 7 + i && (py < y + 1 ? Math.abs(px - x + 0.5) <= 6.5 - i : Math.abs(px - x + 0.5) <= (6.5 - i) * (1 - Math.max(0, (py - y - 1) / (8.5 - i)) ** 1.4))
    shieldShape(r, inH, [x - 7, y - 7, x + 6, y + 9], R('#f2e05a', { k: 1.1 }), metal('#b08a3a'))
    const red = R('#c8302c'); r.rect(Math.floor(x - 1.5), Math.floor(y - 5), 2, 11, red, 3); r.rect(Math.floor(x - 5), Math.floor(y - 2), 9, 2, red, 3)
  },
  weapon: (r, g) => blade(r, g, { len: 23, w: 1.6, col: '#e8eef8', guard: 4, guardCol: GOLD }),
}
const ROGUE: Gear32 = {
  name: 'Rogue', sleeve: '#4a4a5e', hatLine: 999,
  back: (r, g) => cape(r, g, '#3a3a52', { len: 7, spread: 14 }),
  chest: (r, g) => {
    const v = R('#8a6a44'), shirt = R('#d8d0c0', { k: 0.6 })
    fillTorso(r, g, v)
    r.fill([g.tcx - 4, g.neck, g.tcx + 5, g.waist], (x, y) => Math.abs(x - g.tcx - 0.5) < (g.waist - y) * 0.28, shirt, { tone: 3 })
    for (let y = g.neck + 3; y < g.waist; y += 2) { r.tone(Math.floor(g.tcx - (g.waist - y) * 0.28), y, v, 1); r.tone(Math.floor(g.tcx + 1 + (g.waist - y) * 0.28), y, v, 1) }
    r.line(g.tcx - 8, g.neck + 1, g.tcx + 8, g.waist - 1, R(LEATHER), 2, 2)
  },
  head: (r, g) => {
    const { cx, cy, rx, ry } = g.head, hd = R('#4a8a5a')
    const hrx = rx + 2.6, hry = ry + 2.4, hcy = cy - 1
    r.fill([cx - hrx - 6, hcy - hry - 1, cx + hrx + 1, cy + ry], (x, y) => {
      const inS = ((x - cx + 0.5) / hrx) ** 2 + ((y - hcy) / hry) ** 2 <= 1
      const face = ((x - cx - 1.5) / (rx - 1.2)) ** 2 + ((y - cy - 3) / (ry - 1)) ** 2 <= 1 && y > cy - 5
      return inS && !face
    }, hd, { n: ellN(cx - 0.5, hcy, hrx, hry), max: 4 })
    r.poly([[cx - hrx + 1, hcy - 6], [cx - hrx - 6, hcy + 2], [cx - hrx + 1, hcy + 3]], hd, { tilt: [-0.4, 0.2] })
    r.fill([cx - rx, cy - 6, cx + rx + 1, cy - 3], (x, y) => y >= cy - 5 && y < cy - 4 && Math.abs(x - cx - 1.5) < rx - 2, hd, { tone: 1 })
  },
  off: (r, g) => blade(r, g, { hand: g.handL, dir: unit(-0.5, 1), len: 9, w: 1.3, col: STEEL, guard: 2.5, guardCol: '#8a96b0', grip: 3 }),
  weapon: (r, g) => blade(r, g, { len: 10, w: 1.4, col: STEEL, guard: 2.8, guardCol: '#8a96b0', grip: 3, lean: 0.6 }),
}
const SAMURAI: Gear32 = {
  name: 'Samurai', sleeve: '#3a3040', hatLine: 999,
  back: (r, g) => wings(r, g, '#2a2a3a'),
  chest: (r, g) => {
    const lac = R('#c8302c'), cord = R('#f2c94c')
    r.fill([g.tcx - 12, g.neck, g.tcx + 12, g.hem], () => true, lac, { n: (x, y) => norm((x - g.tcx) / 9, ((y - g.neck) % 3) / 3 - 0.5, 1), max: 4 })
    for (let y = g.neck + 3; y < g.hem; y += 3) for (let x = g.tcx - 10; x < g.tcx + 11; x += 3) r.tone(Math.floor(x + (y % 2)), Math.floor(y), cord, 3)
  },
  over: (r, g) => {
    const lac = R('#b02828'), cord = R('#f2c94c')
    for (const [s, p] of [[-1, g.shoulderL], [1, g.shoulderR]] as const) {
      r.poly([[p[0] - 3.5, p[1] - 2], [p[0] + 3.5, p[1] - 2], [p[0] + 3.5 + s * 1.5, p[1] + 6], [p[0] - 3.5 + s * 1.5, p[1] + 6]], lac, { bevel: 1.2 })
      for (const dy of [1, 3.5]) r.line(p[0] - 3 + s, p[1] + dy, p[0] + 3 + s, p[1] + dy, cord, 3)
    }
  },
  head: (r, g) => {
    const { cx, fx } = g.head, d = dome(r, g, '#b03030', { rim: '#2a2230', brow: 4.5, lacquer: true })
    const gold = metal(GOLD), lac = R('#b03030')
    for (const s of [-1, 1]) r.poly([[cx + s * (d.drx - 1), d.brow - 2], [cx + s * (d.drx + 2.5), d.brow + 4], [cx + s * (d.drx - 0.5), d.brow + 6]], lac, { bevel: 1.2 })
    const b: V2 = [fx, d.brow - 2]
    for (const s of [-1, 1]) { r.cap(b[0], b[1], b[0] + s * 3.5, b[1] - 6, 1.3, 0.9, gold); r.cap(b[0] + s * 3.5, b[1] - 6, b[0] + s * 5, b[1] - 11, 0.9, 0.4, gold) }
    r.ell(b[0], b[1], 1.6, 1.4, gold)
  },
  off: (r, g) => {
    const [x, y] = shieldCenter(g), paper = R('#ff8a1f', { k: 1.1 }), cap = R('#2a2230')
    r.line(x, y - 9, x, y - 5, R('#5a4030'), 3)
    r.ell(x, y, 4.6, 5.2, paper, { bias: 0.25 })
    for (const dy of [-2, 1]) r.line(x - 4, y + dy, x + 4, y + dy, paper, 2)
    r.rect(Math.floor(x - 2.5), Math.floor(y - 6), 5, 1, cap, 3); r.rect(Math.floor(x - 2.5), Math.floor(y + 5), 5, 1, cap, 3)
    dot(r, Math.floor(x - 1), Math.floor(y - 1), paper, 5)
  },
  weapon: (r, g) => blade(r, g, { len: 24, w: 1.2, col: '#e8eef8', guard: 2.2, guardCol: '#2a2230', curve: -2.5, tip: 3, grip: 6, pommel: false }),
}
const PIRATE: Gear32 = {
  name: 'Pirate', sleeve: '#2f5aa8', hatLine: 999,
  back: (r, g) => cape(r, g, '#7a2030', { len: 9, spread: 11 }),
  chest: (r, g) => {
    const shirt = R('#ece4d0', { k: 0.6 }), gold = metal(GOLD)
    fillTorso(r, g, R('#2f5aa8'))
    r.fill([g.tcx - 4, g.neck, g.tcx + 5, g.waist], (x, y) => Math.abs(x - g.tcx - 0.5) < (g.waist - y) * 0.3 + 0.5, shirt, { tone: 3 })
    for (const s of [-1, 1]) for (const dy of [3, 7, 11]) { const y = g.neck + dy; if (y < g.hem - 1) { dot(r, Math.floor(g.tcx + 0.5 + s * 5), Math.floor(y), gold, 4); dot(r, Math.floor(g.tcx + 0.5 + s * 5), Math.floor(y) + 1, gold, 2) } }
  },
  over: (r, g) => {
    const coat = R('#2f5aa8'), gold = metal(GOLD), c = g.tcx, bot = g.hem + (g.pose === 'sit' ? 3 : 5)
    for (const s of [-1, 1]) r.poly([[c + s * 2, g.hem - 2], [c + s * 10.5, g.hem - 2], [c + s * 12, bot], [c + s * 3, bot - 1]], coat, { bevel: 1.4, max: 4 })
    r.line(c - 12, bot - 1, c - 3, bot - 1, gold, 3); r.line(c + 3, bot - 2, c + 12, bot - 1, gold, 3)
  },
  head: (r, g) => {
    const { cx, cy, rx, ry } = g.head, bd = R('#c8302c'), brow = cy - 4.5
    const drx = rx + 1.7, dry = ry + 1.7
    r.fill([cx - drx - 1, cy - dry - 3, cx + drx + 1, brow + 1], (x, y) => ((x - cx + 0.3) / drx) ** 2 + ((y - cy + 1.5) / dry) ** 2 <= 1 && y < brow + Math.max(0, cx - x) * 0.1, bd, { n: ellN(cx, cy - 1.5, drx, dry) })
    for (const [x, y] of [[-6, -9], [-1, -12], [4, -9], [-5, -5], [1, -6], [6, -5], [-9, -7]] as const) dot(r, Math.floor(cx + x), Math.floor(cy + y), R('#f4eee4'), 4)
    const k: V2 = [cx - rx - 1, brow - 1]
    r.ell(k[0], k[1], 2, 2, bd); r.cap(k[0] - 1, k[1] + 1, k[0] - 5, k[1] + 5, 1.6, 1, bd); r.cap(k[0], k[1] + 1, k[0] - 2, k[1] + 7, 1.6, 1, bd)
  },
  off: (r, g) => {
    const [x, y] = shieldCenter(g), brass = metal('#d0a040'), glass = R('#e8f0f0', { k: 0.4 })
    r.ell(x, y, 5, 5, brass); r.ell(x - 0.3, y - 0.3, 3.4, 3.4, glass, { bias: 0.3 })
    r.line(x, y, x + 2, y - 2, R('#c0392b'), 3); r.line(x, y, x - 1.5, y + 1.5, R('#2a2230'), 3)
    r.ell(x, y - 6, 1.2, 1, brass)
  },
  weapon: (r, g) => blade(r, g, { len: 20, w: 1.9, col: STEEL, guard: 3.5, guardCol: GOLD, curve: 3, tip: 5, lean: 0.25 }),
}
const DEV: Gear32 = {
  name: 'Dev', sleeve: '#4d8dff', hatLine: 999,
  back: (r, g) => {
    const pk = R('#e0902a'), c = g.tcx, y = g.neck + 1
    r.poly([[c - 11, y], [c + 11, y], [c + 12, y + 15], [c - 12, y + 15]], pk, { bevel: 2.5 })
    r.rect(Math.floor(c - 12), Math.floor(y + 9), 3, 3, pk, 2); r.rect(Math.floor(c + 10), Math.floor(y + 9), 3, 3, pk, 2)
  },
  chest: (r, g) => {
    const ink = R('#f4f4f8', { k: 0.4 })
    fillTorso(r, g, R('#4d8dff'))
    const x = Math.floor(g.tcx - 2), y = Math.floor(g.neck + 4)
    for (const [dx, dy] of [[1, 0], [0, 1], [0, 2], [-1, 3], [0, 4], [0, 5], [1, 6], [4, 0], [5, 1], [5, 2], [6, 3], [5, 4], [5, 5], [4, 6]] as const) r.tone(x + dx, y + dy, ink, 4)
  },
  over: (r, g) => {
    const strap = R('#a86418')
    r.line(g.shoulderL[0] + 2, g.neck, g.shoulderL[0] + 2.5, g.neck + 8, strap, 3, 2)
    r.line(g.shoulderR[0] - 3, g.neck, g.shoulderR[0] - 3.5, g.neck + 8, strap, 3, 2)
  },
  head: (r, g) => {
    const { cx, cy } = g.head, wh = R('#ffffff', { k: 0.6 }), brow = cy - 5
    r.poly([[cx - 9, brow + 1], [cx + 9.5, brow + 1], [cx + 9, brow - 4], [cx - 8.5, brow - 4]], wh, { cyl: [cx, 10], bevel: 1, bias: 0.05 })
    for (const [x, y, rr] of [[-6, -9, 5], [1, -11, 6], [7, -8, 4.5]] as const) r.ell(cx + x, brow + y, rr, rr * 0.9, wh, { bias: 0.1 })
    for (const x of [-4, 1, 6]) r.line(cx + x, brow - 3, cx + x, brow, wh, 2)
  },
  off: (r, g) => {
    const [x, y] = shieldCenter(g), duck = R('#ffe45e', { k: 0.9 }), beak = R('#ff8a1f')
    shieldShape(r, inRound(x, y, 6.5, 6.5), [x - 7, y - 7, x + 7, y + 7], duck, R('#e0a020'))
    r.ell(x + 1, y - 1, 3.2, 3, duck, { bias: 0.15 })
    r.rect(Math.floor(x + 3), Math.floor(y - 1), 3, 2, beak, 3); r.tone(Math.floor(x + 1), Math.floor(y - 2), R('#2a2230'), 3)
  },
  weapon: (r, g) => {
    const [top, u] = pole(r, g, 13, 4, '#d8c8a8', 0.1, 1)
    const hd = R('#e0443a', { k: 0.9 }), v: V2 = [-u[1], u[0]]
    r.cap(top[0] - v[0] * 5, top[1] - v[1] * 5, top[0] + v[0] * 5, top[1] + v[1] * 5, 3.4, 3.4, hd)
  },
}
const CLERIC: Gear32 = {
  name: 'Cleric', sleeve: '#b8bccc', hatLine: 999,
  back: (r, g) => wings(r, g, '#f8f8ff'),
  chest: (r, g) => {
    const st = metal('#d8dce8'), gold = metal(GOLD)
    r.fill([g.tcx - 12, g.neck, g.tcx + 12, g.hem], () => true, st, { n: (x, y) => norm((x - g.tcx) / 9, (y - g.neck) / 30 - 0.3, 1) })
    const x = Math.floor(g.tcx), y = Math.floor(g.neck + 4)
    r.rect(x, y, 2, 8, gold, 4); r.rect(x - 2, y + 2, 6, 2, gold, 4); r.tone(x, y, gold, 5)
    r.line(g.tcx - 12, g.waist, g.tcx + 12, g.waist, gold, 3)
  },
  over: (r, g) => pauldrons(r, g, '#d8dce8', GOLD),
  head: (r, g) => {
    const { cx, cy } = g.head, m = R('#f2e05a', { k: 0.9 }), wh = R('#ffffff', { k: 0.5 }), brow = cy - 4.5
    r.poly([[cx - 8.5, brow + 1], [cx + 9, brow + 1], [cx + 8, brow - 9], [cx + 1, brow - 17], [cx - 7, brow - 9]], m, { cyl: [cx, 9], bevel: 1.4 })
    r.line(cx + 0.5, brow - 15, cx + 0.5, brow, wh, 3, 2)
    r.line(cx - 8, brow, cx + 8.5, brow, metal(GOLD), 4, 2)
    r.rect(Math.floor(cx - 1), Math.floor(brow - 10), 4, 1, R('#c8302c'), 3)
  },
  off: (r, g) => {
    const [x, y] = shieldCenter(g)
    const inHeart = (px: number, py: number, i: number) => {
      const u = (px - x) / (7.5 - i), v = (y - py) / (7.5 - i) + 0.25
      return (u * u + v * v - 0.5) ** 3 - u * u * v * v * v <= 0
    }
    shieldShape(r, inHeart, [x - 8, y - 8, x + 8, y + 8], R('#e0443a'), metal(GOLD))
    dot(r, Math.floor(x - 3), Math.floor(y - 3), R('#e0443a'), 5)
  },
  weapon: (r, g) => {
    const [top, u] = pole(r, g, 13, 4, '#7a5030', 0.12, 1.1)
    const gold = metal(GOLD), c: V2 = [top[0] + u[0] * 2, top[1] + u[1] * 2]
    r.ell(c[0], c[1], 3.6, 3.6, gold)
    for (const [dx, dy] of [[0, -4.5], [4.5, 0], [-4.5, 0], [3.2, -3.2], [-3.2, -3.2]] as const) r.ell(c[0] + dx, c[1] + dy, 1.3, 1.3, gold)
  },
}
export const GEAR32: Gear32[] = [KNIGHT, WIZARD, KING, ROGUE, SAMURAI, PIRATE, DEV, CLERIC]
