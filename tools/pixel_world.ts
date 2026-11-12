// Pixel world pieces for the task-24 mockups: mountains, tree lines, trees, ground, path, fence, clouds, flowers, stars.
// Every piece paints into a Cv in screen units (design = screen pixels at 1x); the canvas decides how chunky it ends up.
import { Cv, ellipseM, polyM, ramp, mixc, rectM, union, capsuleM } from './pixel_kit'
import type { Mask, Pt, Ramp } from './pixel_kit'
import { rng } from './style_mockups'

/** Smooth value noise in one or two dimensions, seeded. */
export const noise1 = (seed: number) => {
  const r = rng(seed), t = Array.from({ length: 256 }, () => r())
  const at = (i: number) => t[((i % 256) + 256) % 256]!
  return (x: number) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return at(i) * (1 - u) + at(i + 1) * u }
}
export const noise2 = (seed: number) => {
  const r = rng(seed), t = Array.from({ length: 1024 }, () => r())
  const at = (x: number, y: number) => t[(((x * 7 + y * 13) % 1024) + 1024) % 1024]!
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1)
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy
  }
}
export const fbm1 = (seed: number, oct = 3) => { const ns = Array.from({ length: oct }, (_, i) => noise1(seed + i * 17)); return (x: number) => { let v = 0, a = 1, n = 0; for (let i = 0; i < oct; i++) { v += ns[i]!(x * 2 ** i) * a; n += a; a /= 2 } return v / n } }

/** A mountain range: a ridge line, lit crest, bands of haze, rock facets. Fills from the ridge to the bottom of the canvas. */
export const mountains = (cv: Cv, o: { seed: number; base: number; amp: number; freq: number; col: string; lit: string; haze: string; hazeAmt: number; crestW?: number; peaks?: number[] }) => {
  const f = fbm1(o.seed, 4), fac = noise2(o.seed + 5)
  const ridge = (x: number) => o.base - o.amp * (f(x * o.freq) - 0.35) * 1.6 - (o.peaks ?? []).reduce((s, p, i) => s + (i % 2 ? 0 : 1) * 0, 0)
  const rp = ramp(o.col, { cool: 250, warm: 40 })
  for (let i = 0; i < cv.w; i++) {
    const sx = (i + 0.5) / cv.res
    const top = ridge(sx), tpx = Math.ceil(cv.py(top))
    for (let j = tpx; j < cv.h; j++) {
      const sy = (j + 0.5 - cv.oy) / cv.res
      const d = sy - top
      const n = fac(sx * 0.07, sy * 0.16)
      // light from the upper right: the right-facing slope of each ridge is lit
      const slope = ridge(sx + 3) - ridge(sx - 3)
      let c = n > 0.62 ? rp[4] : n < 0.34 ? rp[2] : rp[3]
      if (slope < -1.2 && d < 22) c = rp[4]
      if (slope > 1.4) c = rp[2]
      if (d < (o.crestW ?? 2.2) / cv.res * cv.res) c = mixc(rp[5], o.lit, 0.55)
      const hz = Math.min(1, Math.max(0, (sy - (o.base - o.amp)) / (o.amp * 2.4)) * 0.8 + o.hazeAmt)
      cv.set(i, j, mixc(c, o.haze, Math.min(0.92, hz)))
    }
  }
  return ridge
}

export type TreeStyle = { leaf: string; trunk: string; rim?: string; tall?: boolean; stipple?: boolean }
/** A round tree: trunk, then 5 to 8 leaf clumps painted back to front so each clump keeps its own light. */
export const roundTree = (cv: Cv, x: number, foot: number, h: number, st: TreeStyle, seed: number, light: Pt = [-0.55, -0.83]) => {
  const r = rng(seed)
  const lp = ramp(st.leaf, { cool: 250, warm: 52, k: 1.15 }), tp = ramp(st.trunk, { cool: 270, warm: 40 })
  const tw = Math.max(3, h * 0.11), trunkH = h * 0.42
  cv.paint(rectM(x - tw / 2, foot - trunkH, x + tw / 2, foot), tp, { light, max: 4 })
  const cy = foot - h * 0.62, rx = h * 0.36, ry = h * 0.34
  const clumps: [number, number, number][] = []
  const n = 5 + Math.floor(r() * 3)
  for (let i = 0; i < n; i++) clumps.push([x + (r() - 0.5) * rx * 1.15, cy + (r() - 0.45) * ry * 1.05, rx * (0.46 + r() * 0.2)])
  clumps.sort((a, b) => b[1] - a[1] + (a[0] - b[0]) * 0.01)
  clumps.unshift([x, cy + ry * 0.2, rx * 0.8])
  for (const [cx, cyy, cr] of clumps) cv.paint(ellipseM(cx, cyy, cr, cr * 0.92), lp, { light, hl: true, bias: -0.05 })
  if (st.stipple !== false) {
    const rr = rng(seed + 9)
    const ids = new Set<number>()
    void ids
    for (let k = 0; k < h * 0.5; k++) {
      const px = Math.round(cv.px(x + (rr() - 0.5) * rx * 2)), py = Math.round(cv.py(cy + (rr() - 0.5) * ry * 2))
      const v = cv.get(px, py)
      if (v) cv.set(px, py, mixc(v, rr() > 0.5 ? lp[4] : lp[2], 0.6))
    }
  }
}

/** A pine: stacked boughs, each lit on its own. */
export const pine = (cv: Cv, x: number, foot: number, h: number, st: TreeStyle, seed: number, light: Pt = [-0.55, -0.83]) => {
  const lp = ramp(st.leaf, { cool: 250, warm: 52, k: 1.1 }), tp = ramp(st.trunk, { cool: 270, warm: 40 })
  cv.paint(rectM(x - 1.4, foot - h * 0.25, x + 1.4, foot), tp, { light, max: 4 })
  const tiers = Math.max(3, Math.round(h / 12))
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers, y1 = foot - h * 0.2 - t * h * 0.78, wd = h * (0.34 - t * 0.22) * (1 + 0.1 * Math.sin(seed + i))
    cv.paint(polyM([[x - wd, y1], [x + wd, y1], [x + wd * 0.35, y1 - h * 0.2], [x, y1 - h * 0.26], [x - wd * 0.35, y1 - h * 0.2]]), lp, { light, hl: true })
  }
}

/** A flat-topped cloud made of overlapping puffs, lit on top, tinted underneath. */
export const cloud = (cv: Cv, x: number, y: number, w: number, o: { top: string; under: string; light?: Pt } = { top: '#ffffff', under: '#bfd8f0' }) => {
  const rp = ramp(o.top, { cool: 235, warm: 55, k: 0.8 })
  const puffs: [number, number, number][] = [[0, 0, w * 0.2], [w * 0.2, -w * 0.07, w * 0.25], [w * 0.5, -w * 0.02, w * 0.22], [w * 0.74, 0.01, w * 0.17], [w * 0.38, w * 0.03, w * 0.2]]
  const m = union(...puffs.map(([dx, dy, r]) => ellipseM(x + dx, y + dy, r, r * 0.72)), rectM(x, y + w * 0.03, x + w * 0.9, y + w * 0.14))
  const pid = cv.paint(m, rp, { light: o.light ?? [-0.3, -0.95], hl: true, bias: 0.22, max: 5 })
  void pid
  // underside tint
  for (let j = 0; j < cv.h; j++) for (let i = 0; i < cv.w; i++) {
    const v = cv.get(i, j)
    if (v && m(cv.dx(i), cv.dy(j)) && !m(cv.dx(i), cv.dy(j + 2)) === false && !m(cv.dx(i), cv.dy(j + 1))) cv.set(i, j, mixc(v, o.under, 0.55))
  }
}

/** Grass with tufts, ground texture, a worn dirt path, pebbles and flowers on one canvas. */
export type GroundTheme = { grass: string; grassLit: string; grassDark: string; dirt: string; flower: string[]; pebble: string; outline?: string }
export const ground = (cv: Cv, top: number, th: GroundTheme, seed: number, o: { pathTop: number; light?: Pt; tufts?: number; fine?: boolean } ) => {
  const r = rng(seed), nz = noise2(seed), g = ramp(th.grass, { cool: 250, warm: 52 }), d = ramp(th.dirt, { cool: 280, warm: 45 })
  const pathY = (x: number) => o.pathTop + Math.sin(x * 0.011 + 1) * 3 + Math.sin(x * 0.037) * 1.2
  for (let i = 0; i < cv.w; i++) {
    const sx = (i + 0.5) / cv.res
    for (let j = 0; j < cv.h; j++) {
      const sy = (j + 0.5 - cv.oy) / cv.res
      if (sy < top) continue
      const n = nz(sx * 0.09, sy * 0.35), m2 = nz(sx * 0.4 + 9, sy * 0.9)
      let c = n > 0.66 ? g[4] : n < 0.3 ? g[2] : g[3]
      if (m2 > 0.8) c = mixc(c, th.grassLit, 0.5)
      if (sy > pathY(sx)) {
        const e = sy - pathY(sx)
        const dn = nz(sx * 0.05 + 3, sy * 0.12)
        c = dn > 0.8 ? d[4] : dn < 0.16 ? d[2] : d[3]
        if (e < 5) c = d[4]
        if (e < 1.6 / cv.res * cv.res) c = d[1]
        if (e < 3.2 && ((i + j) & 1) === 0) c = mixc(c, g[2], 0.35)
      }
      cv.set(i, j, c)
    }
  }
  // tufts: little v-shaped blades, lit on the left
  const tufts = o.tufts ?? 90
  for (let k = 0; k < tufts; k++) {
    const sx = r() * (cv.w / cv.res), sy = top + 2 + r() * (o.pathTop - top - 2)
    if (sy > pathY(sx) - 2) continue
    const i = cv.px(sx), j = cv.py(sy)
    cv.set(i, j, g[1]); cv.set(i - 1, j - 1, g[4]); cv.set(i + 1, j - 1, g[2]); cv.set(i, j - 1, g[4]); cv.set(i, j - 2, g[5])
  }
  // flowers, pebbles
  for (let k = 0; k < 26; k++) {
    const sx = r() * (cv.w / cv.res), sy = top + 3 + r() * (o.pathTop - top - 3)
    if (sy > pathY(sx) - 2) continue
    const i = cv.px(sx), j = cv.py(sy), col = th.flower[k % th.flower.length]!
    cv.set(i, j, col); cv.set(i, j + 1, g[1])
    if (cv.res === 1) { cv.set(i - 1, j, mixc(col, '#ffffff', 0.4)); cv.set(i + 1, j, col) }
  }
  for (let k = 0; k < 12; k++) {
    const sx = r() * (cv.w / cv.res), sy = pathY(sx) + 3 + r() * 12
    const i = cv.px(sx), j = cv.py(sy)
    const pp = ramp(th.pebble, { cool: 270 })
    cv.set(i, j, pp[3]); cv.set(i + 1, j, pp[2]); cv.set(i, j - 1, pp[4])
  }
  return pathY
}

/** A wooden fence: posts with caps, two rails, drawn in screen units. */
export const fence = (cv: Cv, x0: number, x1: number, foot: number, h: number, wood: string, light: Pt = [-0.55, -0.83]) => {
  const wp = ramp(wood, { cool: 270, warm: 45 })
  const step = h * 1.5
  cv.paint(rectM(x0, foot - h * 0.72, x1, foot - h * 0.6), wp, { light, max: 4 })
  cv.paint(rectM(x0, foot - h * 0.42, x1, foot - h * 0.3), wp, { light, max: 4 })
  for (let x = x0; x <= x1; x += step) {
    cv.paint(rectM(x - h * 0.09, foot - h, x + h * 0.09, foot), wp, { light })
    cv.paint(polyM([[x - h * 0.1, foot - h], [x, foot - h * 1.12], [x + h * 0.1, foot - h]]), wp, { light, max: 5 })
  }
}

/** A few blades of tall grass or a fern, used in the foreground. */
export const blades = (cv: Cv, x: number, foot: number, h: number, col: string, seed: number, light: Pt = [-0.55, -0.83], wd = 1.4) => {
  const r = rng(seed), gp = ramp(col, { cool: 250, warm: 52, k: 1.1 })
  for (let k = 0; k < 7; k++) {
    const a = (r() - 0.5) * 0.9, hh = h * (0.5 + r() * 0.5), bx = x + (r() - 0.5) * h * 0.7
    cv.paint(polyM([[bx - wd, foot], [bx + wd, foot], [bx + Math.sin(a) * hh * 0.7 + 0.4, foot - hh]]), gp, { light, hl: true })
  }
}

/** A mossy rock. */
export const rock = (cv: Cv, x: number, foot: number, w: number, col: string, light: Pt = [-0.55, -0.83]) => {
  const rp = ramp(col, { cool: 260, warm: 48 })
  cv.paint(union(ellipseM(x, foot - w * 0.28, w * 0.5, w * 0.3), ellipseM(x + w * 0.2, foot - w * 0.2, w * 0.36, w * 0.24)), rp, { light, hl: true })
}

/** A stepped-corner pixel star burst (the hit flash): returns a small canvas. */
export const burst = (res: 1 | 0.5, size: number, fill: string, inkCol: string, hot: string): Cv => {
  const half = Math.ceil(size * 0.62), cv = new Cv(Math.ceil(half * 2 * res) + 2, Math.ceil(half * 2 * res) + 2, res, half * res + 1, half * res + 1)
  const pts: Pt[] = []
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, rr = i % 2 === 0 ? size * 0.62 : size * 0.3; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]) }
  const rp = ramp(fill, { cool: 20, warm: 40, k: 0.8 })
  cv.paint(polyM(pts), rp, { flat: 4 })
  cv.paint(polyM(pts.map(([x, y]) => [x * 0.55, y * 0.55] as Pt)), rp, { flat: 5 })
  cv.paint(polyM(pts.map(([x, y]) => [x * 0.22, y * 0.22] as Pt)), [hot, hot, hot, hot, hot, hot] as unknown as Ramp, { flat: 3 })
  cv.outline(inkCol, 0.85)
  return cv
}

/** The loot: a signet ring with a gem, bobbing above the ground. */
export const signet = (res: 1 | 0.5, ink: string, gold: string, gem: string): Cv => {
  const cv = new Cv(Math.ceil(30 * res), Math.ceil(34 * res), res, 15 * res, 24 * res)
  const gp = ramp(gold, { cool: 20, warm: 50, k: 1.1 }), ge = ramp(gem, { cool: 230, warm: 170 })
  const ring = (x: number, y: number) => { const d = Math.hypot(x, y + 8); return d <= 10 && d >= 5.6 }
  cv.paint(ring, gp, { hl: true, light: [-0.55, -0.83] })
  cv.paint(polyM([[-3.6, -17], [3.6, -17], [4.4, -21], [0, -25.5], [-4.4, -21]]), ge, { hl: true })
  cv.outline(ink, 0.8)
  return cv
}
void capsuleM

/** Warm and dark dapples on the grass: crisp shapes that mix the existing pixels toward light or shadow. */
export const dapple = (cv: Cv, top: number, bottom: number, seed: number, o: { dark: string; light: string; nDark: number; nLight: number; xs?: [number, number] }) => {
  const r = rng(seed)
  const patch = (cx: number, cy: number, rx: number, ry: number, col: string, amt: number) => {
    for (let j = 0; j < cv.h; j++) for (let i = 0; i < cv.w; i++) {
      const x = cv.dx(i), y = cv.dy(j)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1) continue
      const v = cv.get(i, j)
      if (v) cv.set(i, j, mixc(v, col, amt))
    }
  }
  for (let k = 0; k < o.nDark; k++) { const x = o.xs ? o.xs[0] + r() * (o.xs[1] - o.xs[0]) : r() * (cv.w / cv.res); patch(x, top + 2 + r() * (bottom - top - 4), 14 + r() * 22, 2 + r() * 3, o.dark, 0.38) }
  for (let k = 0; k < o.nLight; k++) { const x = o.xs ? o.xs[0] + r() * (o.xs[1] - o.xs[0]) : r() * (cv.w / cv.res); patch(x, top + 2 + r() * (bottom - top - 4), 10 + r() * 16, 2 + r() * 3, o.light, 0.34) }
}

/** A leafy bush with a few flowers. */
export const bush = (cv: Cv, x: number, foot: number, w: number, leaf: string, flowers: string[], seed: number, light: Pt = [-0.55, -0.83]) => {
  const r = rng(seed), lp = ramp(leaf, { cool: 250, warm: 52, k: 1.15 })
  const parts: [number, number, number][] = [[-0.28, 0.5, 0.34], [0.26, 0.52, 0.32], [0, 0.34, 0.4]]
  for (const [dx, dy, rr] of parts) cv.paint(ellipseM(x + dx * w, foot - dy * w * 0.8, rr * w, rr * w * 0.82), lp, { light, hl: true })
  for (let k = 0; k < 5; k++) { const i = cv.px(x + (r() - 0.5) * w * 0.8), j = cv.py(foot - 0.2 * w - r() * w * 0.5); cv.set(i, j, flowers[k % flowers.length]!); cv.set(i + 1, j, mixc(flowers[k % flowers.length]!, '#ffffff', 0.3)) }
}

/** A pixel sun disc with a bright core. */
export const sun = (res: 1 | 0.5, r: number, ink: string): Cv => {
  const cv = new Cv(Math.ceil((r * 2 + 4) * res), Math.ceil((r * 2 + 4) * res), res, (r + 2) * res, (r + 2) * res)
  cv.paint(ellipseM(0, 0, r, r), ramp('#ffd83a', { cool: 25, warm: 50, k: 0.9 }), { hl: true, light: [-0.4, -0.7] })
  cv.outline(ink, 0.55)
  return cv
}
