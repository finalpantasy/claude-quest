// A tiny drawing language for creatures: ellipses, rects, lines and triangles on a 16 by 16 grid, mirrored about x 8, then outlined and shaded.
// Ops separated by `;`, fields by `,`, an optional last field is the color letter (b base, a accent, d dark, w white, k black, e eye).
//   E cy,rx,ry     ellipse centered on the middle        e cx,cy,rx,ry   ellipse on the left, mirrored
//   R x,y,w,h      rect on the left, mirrored            C y,w,h         rect centered (w even)
//   L x0,y0,x1,y1  line on the left, mirrored            T x0,y0,x1,y1,x2,y2   triangle on the left, mirrored
//   Y x,y          pixel, mirrored                       y x,y   single pixel   M y,w   centered mouth row
import { Cells } from './core'
import type { Pal, Rect } from './core'

export type Grid = string[][]
export const grid = (n = 16): Grid => Array.from({ length: n }, () => Array<string>(n).fill(''))

const put = (g: Grid, x: number, y: number, c: string) => { const r = g[y]; if (r && x >= 0 && x < r.length) r[x] = c }
const both = (g: Grid, x: number, y: number, c: string) => { put(g, x, y, c); put(g, g.length - 1 - x, y, c) }

/** Run ops onto the grid, shifted by (ox, oy): left side ops move by ox, their mirrors by -ox. */
export const run = (g: Grid, ops: string, ox = 0, oy = 0) => {
  const n = g.length, mid = n / 2
  for (const op of ops.split(';')) {
    const k = op[0]
    if (!k) continue
    const f = op.slice(1).split(',')
    const last = f[f.length - 1] ?? ''
    const col = /^[a-zA-Z]$/.test(last) ? last : 'b'
    const v = f.map(Number)
    const a = v[0] ?? 0, b = v[1] ?? 0, c = v[2] ?? 0, d = v[3] ?? 0, e = v[4] ?? 0, h = v[5] ?? 0
    if (k === 'E') {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (((x + 0.5 - mid) / b) ** 2 + ((y + 0.5 - (a + oy)) / c) ** 2 <= 1) put(g, x, y, col)
    } else if (k === 'e') {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (((x + 0.5 - (a + ox)) / c) ** 2 + ((y + 0.5 - (b + oy)) / d) ** 2 <= 1) both(g, x, y, col)
    } else if (k === 'R') {
      for (let j = 0; j < d; j++) for (let i = 0; i < c; i++) both(g, a + ox + i, b + oy + j, col)
    } else if (k === 'C') {
      for (let j = 0; j < c; j++) for (let i = 0; i < b; i++) put(g, mid - b / 2 + i, a + oy + j, col)
    } else if (k === 'L') {
      const x0 = a + ox, y0 = b + oy, x1 = c + ox, y1 = d + oy
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
      for (let s = 0; s <= steps; s++) both(g, Math.round(x0 + ((x1 - x0) * s) / steps), Math.round(y0 + ((y1 - y0) * s) / steps), col)
    } else if (k === 'T') {
      const ax = a + ox, ay = b + oy, bx = c + ox, by = d + oy, cx = e + ox, cy = h + oy
      const dd = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
      if (dd === 0) continue
      for (let y = Math.min(ay, by, cy); y <= Math.max(ay, by, cy); y++) for (let x = Math.min(ax, bx, cx); x <= Math.max(ax, bx, cx); x++) {
        const px = x + 0.5, py = y + 0.5
        const l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / dd
        const l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / dd
        if (l1 >= -0.001 && l2 >= -0.001 && 1 - l1 - l2 >= -0.001) both(g, x, y, col)
      }
    } else if (k === 'Y') both(g, a + ox, b + oy, col === 'b' && f.length < 3 ? 'e' : col)
    else if (k === 'y') put(g, a + ox, b + oy, col === 'b' && f.length < 3 ? 'e' : col)
    else if (k === 'M') for (let i = 0; i < b; i++) put(g, mid - b / 2 + i, a + oy, col === 'b' ? 'k' : col)
  }
  return g
}

export const bounds = (g: Grid) => {
  let top = g.length, bot = -1, left = g.length
  g.forEach((r, y) => r.forEach((c, x) => { if (c && c !== 'o') { top = Math.min(top, y); bot = Math.max(bot, y); left = Math.min(left, x) } }))
  return { top, bot, left }
}
/** The leftmost filled column on a row, or the grid's middle if the row is empty. */
export const edge = (g: Grid, y: number) => { const x = g[y]?.findIndex(c => c) ?? -1; return x < 0 ? g.length / 2 : x }

const SHADE: Record<string, [string, string]> = { b: ['l', 'd'], a: ['A', 'z'] }
/** Outline every body cell, light the cells whose upper left is open (within `depth` pixels) and darken those whose lower right is open; then color. */
export const finish = (g: Grid, pal: Pal, outline = true, depth = 1): Rect[] => {
  const n = g.length
  const at = (x: number, y: number) => g[y]?.[x] ?? ''
  const cells = new Cells(n, n)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const c = g[y]?.[x] ?? ''
    if (c) {
      let o = c
      const s = SHADE[c]
      if (s) {
        let up = false, dn = false
        for (let k = 1; k <= depth; k++) {
          if (at(x, y - k) === '' || at(x - k, y) === '') up = true
          if (at(x, y + k) === '' || at(x + k, y) === '') dn = true
        }
        o = up && !dn ? s[0] : dn && !up ? s[1] : c
      }
      cells.put(x, y, pal[o] ?? pal[c] ?? pal.b)
    } else if (outline && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) {
      cells.put(x, y, pal.o)
    }
  }
  return cells.rects()
}
