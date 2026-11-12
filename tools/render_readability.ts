// The crab readability sheet: the same 24 random gear combos drawn by an older copy of hooks (before, on top)
// and by this tree (after, below), each at 3x and at 1x on the fight scene's colors.
//   git archive <commit> hooks | tar -x -C <dir>
//   npx --no-install tsx tools/render_readability.ts --before <dir>/hooks [--out file]
// Without --before only the after rows are drawn.
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Canvas } from './sheet'
import type { Rect, Sprite } from '../hooks/sprites/core'

const ROOT = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const arg = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const OUT = resolve(arg('--out') ?? join(ROOT, 'docs', 'art', 'samples', 'readability-before-after.png'))
const before = arg('--before')

type Lib = { crabSprite: (o: object) => Sprite; HEADS: unknown[]; CHESTS: unknown[]; BACKS: unknown[]; WEAPONS: unknown[]; OFFHANDS: unknown[]; VARIANTS: Record<string, number>; BACK_VARIANTS: number }
const load = async (hooks: string) => (await import(pathToFileURL(join(hooks, 'sprites.ts')).href)) as Lib

// The same 24 combos for both: drawing ids and variants are taken modulo each library's own counts.
const RAR = ['#c8c8c8', '#8080ff', '#f2e05a', '#ff8a1f', '#2fd05a']
const TRIM = ['#4aa3ff', '#e0443a', '#46c466', '#a65ee0', '#f2c94c']
let seed = 1714
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
const n = (k: number) => Math.floor(rnd() * k)
const combos = Array.from({ length: 24 }, (_, i) => ({ pose: (['stand', 'attack', 'walk'] as const)[i % 3], trim: TRIM[n(5)], r: Array.from({ length: 15 }, () => n(1 << 20)) }))
const look = (L: Lib, c: (typeof combos)[number]) => {
  const g = (k: number, len: number, vs: number) => ({ id: c.r[k]! % len, color: RAR[c.r[k + 1]! % 5], v: c.r[k + 2]! % vs })
  return { pose: c.pose, trim: c.trim, head: g(0, L.HEADS.length, L.VARIANTS.head ?? 1), chest: g(3, L.CHESTS.length, L.VARIANTS.chest ?? 1), back: g(6, L.BACKS.length, L.BACK_VARIANTS), weapon: g(9, L.WEAPONS.length, L.VARIANTS.weapon ?? 1), offhand: g(12, L.OFFHANDS.length, L.VARIANTS.offhand ?? 1) }
}

// Fight scene colors (docs/images/fight.png): a dark sky and a dirt ground under the feet.
const SKY = '#33261a', GROUND = '#7a5632', BG = '#16121e'
const Y0 = -16, Y1 = 30, X0 = -2, X1 = 32
const grid = (L: Lib, s: number, cols: number) => ({ w: (X1 - X0) * s + 8, h: (Y1 - Y0) * s + 8, cols, s, L })
const drawGrid = (cv: Canvas, top: number, r: ReturnType<typeof grid>) => {
  combos.forEach((c, i) => {
    const cx = (i % r.cols) * r.w, cy = top + Math.floor(i / r.cols) * r.h
    cv.fill(cx + 2, cy + 2, r.w - 4, r.h - 4, SKY)
    cv.fill(cx + 2, cy + 4 + (23 - Y0) * r.s, r.w - 4, r.h - 6 - (23 - Y0) * r.s, GROUND)
    const sp = r.L.crabSprite(look(r.L, c))
    for (const p of sp.parts) cv.rects(p.rects as Rect[], cx + 4 - X0 * r.s, cy + 4 - Y0 * r.s, r.s, p.op ?? 1)
  })
  return Math.ceil(combos.length / r.cols) * r.h
}
const big = (L: Lib) => grid(L, 3, 12)
const small = (L: Lib) => grid(L, 1, 24)
const main = async () => {
  const after = await load(join(ROOT, 'hooks'))
  const old = before ? await load(resolve(before)) : undefined
  const sets = [...(old ? [['BEFORE', old] as const] : []), ['AFTER', after] as const]
  const W = Math.max(big(after).w * 12, small(after).w * 24)
  const H = sets.length * (16 + 2 * big(after).h + 4 + 14 + small(after).h + 10) + 8
  const cv = new Canvas(W, H, BG)
  let y = 6
  for (const [name, L] of sets) {
    cv.text(`${name}: 24 RANDOM FULL-GEAR COMBOS AT 3X`, 6, y, 2, name === 'AFTER' ? '#6ee07a' : '#ffd23f'); y += 16
    y += drawGrid(cv, y, big(L)) + 4
    cv.text('THE SAME AT 1X', 6, y, 2, '#9a90b0'); y += 14
    y += drawGrid(cv, y, small(L)) + 10
  }
  cv.save(OUT)
  console.log(`wrote ${OUT}`)
}
void main()
