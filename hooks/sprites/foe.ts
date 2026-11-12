// Monsters: a body template, part families, whole-body marks, a palette from an element, drawn into rects.
import { Cells, mix, pick, ramp, shade } from './core'
import type { Pal, Part, Sprite } from './core'
import { BODIES } from './bodies'
import { FAMILIES, MARKS } from './parts'
import type { At } from './parts'
import { RANK_LOOK } from './palettes'
import type { Palette } from './palettes'
import { bounds, edge, finish, grid, run } from './shape'
import type { Grid } from './shape'

export type Look = { body?: string; top?: number; side?: number; face?: number; bottom?: number; back?: number; mark?: number }

export const foePal = (p: Palette, outline?: string): Pal => ({
  ...ramp(p.base), a: p.accent, A: shade(p.accent, 0.3), z: shade(p.accent, -0.3), w: '#f2eee2', k: '#14121c', e: p.glow, r: '#e0443a',
  o: outline ?? shade(mix(p.base, '#000000', 0.5), -0.5),
})

/** Every part variant by anchor, flattened: index into these from a Look. */
export const PARTS: Record<At, { n: string; ops: string }[]> = { top: [], side: [], face: [], bottom: [], back: [] }
for (const f of FAMILIES) f.v.forEach((ops, i) => PARTS[f.at].push({ n: `${f.n}${i}`, ops }))
export const BODY_NAMES = BODIES.map(b => b[0])
const BODY = new Map(BODIES)

/** Scale an op string's numbers by k, so one part drawing serves bigger or smaller canvases. */
export const scaleOps = (ops: string, k: number) => {
  if (k === 1) return ops
  const sc = (v: number) => (v === 0 ? 0 : Math.sign(v) * Math.max(1, Math.round(Math.abs(v) * k)))
  return ops.split(';').map(op => {
    if (!op) return op
    const f = op.slice(1).split(',')
    return op[0] + f.map(x => (/^-?\d+$/.test(x) ? String(sc(Number(x))) : x)).join(',')
  }).join(';')
}

/** Lay out one creature: back parts, body, marks, then the parts that attach to it. `base` is the body's own grid (16 for monsters, 24 for bosses), `k` scales it,
 * `partK` scales the parts. The grid has a margin of a quarter of the body on every side, so hats, horns and wings never clip. */
export const compose = (base: number, bodyOps: string, look: Look, k = 1, partK = k): { g: Grid; foot: number } => {
  const size = Math.round(base * k)
  const off = Math.round(size / 4)
  const g = grid(size + 2 * off)
  const S = (o: string) => scaleOps(o, partK)
  if (look.back !== undefined) run(g, S(pick(PARTS.back, look.back).ops), off, off)
  run(g, scaleOps(bodyOps, k), off, off)
  const b = bounds(g)
  const mid = Math.round((b.top + b.bot) / 2)
  if (look.mark !== undefined) {
    const m = pick(MARKS, look.mark)
    const seed = look.mark
    const w = g.length
    g.forEach((r, y) => r.forEach((c, x) => { if (c === 'b' || c === 'a') { const v = m(Math.min(x, w - 1 - x) - off, y - off, seed, size); if (v) r[x] = v } }))
  }
  const eyeRow = g.findIndex(r => r.includes('e'))
  const face = eyeRow < 0 ? b.top + Math.round(partK * 3) : eyeRow
  if (look.bottom !== undefined) run(g, S(pick(PARTS.bottom, look.bottom).ops), off, b.bot)
  if (look.side !== undefined) run(g, S(pick(PARTS.side, look.side).ops), edge(g, mid), mid)
  if (look.top !== undefined) run(g, S(pick(PARTS.top, look.top).ops), off, b.top)
  if (look.face !== undefined) run(g, S(pick(PARTS.face, look.face).ops), off, face)
  return { g, foot: b.bot }
}

/** The aura of a ranked monster: the silhouette grown two pixels, drawn faint under the body so a ring of color shows round it. */
export const ring = (g: Grid, color: string, px = 1, op = 0.5): Part => {
  const n = g.length
  const dil = (src: boolean[][]): boolean[][] => src.map((r, y) => r.map((v, x) => v || [-1, 0, 1].some(dy => [-1, 0, 1].some(dx => !!src[y + dy]?.[x + dx]))))
  let d: boolean[][] = g.map(r => r.map(c => !!c))
  for (let i = 0; i <= px; i++) d = dil(d)
  const c = new Cells(n, n)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (d[y]?.[x]) c.put(x, y, color)
  return { cls: 'aura', op, rects: c.rects() }
}

/** Wrap finished parts into a sprite cropped to what they cover; `foot` is the body's bottom row, to stand it on the ground. */
export const cropped = (parts: Part[], foot: number): Sprite => {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
  for (const p of parts) for (const [x, y, w, h] of p.rects) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h) }
  return { w: x1 - x0, h: y1 - y0, foot: foot - y0, parts: parts.map(p => ({ ...p, rects: p.rects.map(([x, y, w, h, c]) => [x - x0, y - y0, w, h, c]) })) }
}

export type FoeOpts = { pal: Palette; rank?: string }
export const foe = (look: Look, o: FoeOpts, ops?: string): Sprite => {
  const rk = o.rank ? RANK_LOOK[o.rank] : undefined
  const pal = foePal(rk ? { ...o.pal, glow: rk.glow } : o.pal)
  const { g, foot } = compose(16, ops ?? BODY.get(look.body ?? '') ?? pick(BODIES, 0)[1], look)
  const parts: Part[] = []
  if (rk) parts.push(ring(g, rk.ring, 1, 0.55))
  parts.push({ rects: finish(g, pal) })
  return cropped(parts, foot)
}
