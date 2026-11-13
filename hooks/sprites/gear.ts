// Placing gear on the crab: each registry shape drawn in the item's color at its anchor.
import { Cells, mix, pick, shade, tame } from './core'
import { CRAB, CX, CW, CH, shellAt } from './crab'
import { gearPal } from './gearpal'
import type { Shape } from './gearpal'
import { CHESTS, chestEmblem, inStyle } from './chest'
import { OFFHANDS, TOOLS, WEAPONS } from './hands'
import { HATS, MASKS } from './hats'
import { putBack as paintBack } from './backs'
import { MATERIALS, WEAPON_MATERIALS, decorBack, decorChest, decorHead, decorOff, weaponRows } from './variants'

export type Look = { id: number; color: string }

const rowsOf = (s: Shape) => s.r.split('/')
const widthOf = (s: Shape) => (rowsOf(s)[0] ?? '').length

/** A hat: left half mirrored about the center line, last row on y 9. */
const merge = (c: Cells, t: Cells) => { for (const [k, v] of t.m) c.m.set(k, v) }
export const putHat = (c: Cells, id: number, color: string, by = 0, v = 0) => {
  const s = pick(HATS, id)
  const rows = rowsOf(s)
  const t = new Cells(CW, CH)
  t.paint(s.r, gearPal(color), CX - widthOf(s), 8 + by - rows.length, 1)
  decorHead(t, v)
  merge(c, t)
}
/** A mask: left half mirrored, first row on y 6, painted behind the eyes and the shell (crab first), so it frames the eyes. */
export const putMask = (c: Cells, id: number, color: string, by = 0, v = 0) => {
  const s = pick(MASKS, id)
  const t = new Cells(CW, CH)
  t.paint(s.r.split('/').map(r => '.' + r.slice(0, -1)).join('/'), gearPal(color), CX - widthOf(s), 7 + by, 1)
  decorHead(t, v)
  merge(c, t)
}
/**
 * A chest piece, crab first: the drawing (and its emblem) is cut to its style's small region of the shell (a sash, belt, apron,
 * lower plate, pauldrons or collar), darkened where it meets bare orange, and the shell's outline takes a dark tint of the item.
 */
export const putChest = (c: Cells, id: number, color: string, by = 0, v = 0) => {
  const s = pick(CHESTS, id)
  const p = gearPal(color)
  const shell = shellAt(by)
  const top = 10 + by
  const t = new Cells(CW, CH)
  t.paint(s.r, p, CX - widthOf(s), top + (s.y ?? 0), 1)
  const e = chestEmblem(s)
  if (e && (s.st === 'sash' || s.st === 'pauldrons')) {
    // one emblem on the strap, or one on each shoulder
    const em = new Cells(CW, CH).paint(e, p, s.st === 'sash' ? 10 : 9, top + (s.st === 'sash' ? 5 : 2))
    for (const [k, col] of em.m) { t.m.set(k, col); if (s.st === 'pauldrons') { const x = k % CW; t.m.set(k - x + CW - 1 - x, col) } }
  } else if (e) t.paint(e, p, CX - 3, top + (s.st === 'collar' ? 1 : 8), 1)
  const orange = (k: number) => { const ch = shell.get(k); return ch !== undefined && ch !== 'o' }
  const u = new Cells(CW, CH)
  for (const k of shell.keys()) if (orange(k) && inStyle(s.st, k % CW, Math.floor(k / CW) - top)) u.m.set(k, t.m.get(k) ?? p.M ?? color)
  decorChest(u, v)
  // a shadow along the bottom edge, where the piece sits on bare orange
  const edge = [...u.m.keys()].filter(k => orange(k + CW) && !u.m.has(k + CW))
  for (const k of edge) u.m.set(k, shade(u.m.get(k) ?? color, -0.35))
  const rim = mix(CRAB.o, color, 0.45)
  for (const [k, ch] of shell) if (ch === 'o') u.m.set(k, rim)
  merge(c, u)
}
/** The widest a back piece may reach: the shell (x 7..22) plus 2 cells a side. */
export const BACK_X0 = 5
/**
 * A cape, wings or pack behind the crab, framing it: a piece wider than the shell plus 2 cells a side keeps its outer edge and
 * loses its inner columns (they sit behind the body anyway), and every pixel is tamed darker and greyer than the orange.
 */
export const putBack = (c: Cells, id: number, color: string, by = 0, v = 0) => {
  const t = new Cells(CW, CH)
  paintBack(t, id, color, by)
  decorBack(t, v)
  let x0 = CX
  for (const k of t.m.keys()) x0 = Math.min(x0, k % CW)
  const shift = Math.max(0, BACK_X0 - x0)
  const u = new Cells(CW, CH)
  for (const [k, col] of t.m) {
    const x = k % CW, y = (k - x) / CW
    if (x >= CX || x + shift >= CX) continue
    const tc = tame(col)
    u.put(x + shift, y, tc)
    u.put(CW - 1 - x - shift, y, tc)
  }
  merge(c, u)
}
const anchor = (s: Shape) => {
  const rows = rowsOf(s)
  for (let y = 0; y < rows.length; y++) { const x = (rows[y] ?? '').indexOf('@'); if (x >= 0) return [x, y] as const }
  return [0, 0] as const
}
/** A shield or off-hand piece, its `@` pixel on the left claw's grip. */
export const putOff = (c: Cells, id: number, color: string, grip: readonly [number, number], v = 0) => {
  const s = pick(OFFHANDS, id)
  const [ax, ay] = anchor(s)
  const t = new Cells(CW, CH)
  t.paint(s.r, { ...gearPal(color), '@': '#f2c94c' }, grip[0] - ax, grip[1] - ay)
  decorOff(t, v)
  merge(c, t)
}
/** Stretch a grid: every cell becomes kx by ky cells, so a 1 pixel blade reads at band size. */
const grow = (rows: string, kx: number, ky: number) => rows.split('/').flatMap(r => Array<string>(ky).fill([...r].map(ch => ch.repeat(kx)).join(''))).join('/')
/** The blade's outline by material: 0 plain, 1 wide (a dark edge on the right), 2 serrated (teeth on the left), 3 tipped (a longer point). */
const SHAPE_OF = [0, 1, 2, 0, 3, 1, 2, 3, 0, 1]
const shapeRows = (rows: string, shape: number) => {
  if (!shape) return rows
  const g = rows.split('/').map(r => [...r])
  const w = Math.max(...g.map(r => r.length)) + 1
  for (const r of g) while (r.length < w) r.push('.')
  const blade = (ch: string | undefined) => ch === 'S' || ch === 'M'
  if (shape === 1) g.forEach(r => { for (let x = r.length - 1; x > 0; x--) if (blade(r[x - 1]) && r[x] === '.') r[x] = 's' })
  else if (shape === 2) g.forEach((r, y) => { if (y % 3 === 0) for (let x = 0; x < r.length; x++) if (blade(r[x]) && (r[x - 1] ?? '.') === '.') { r[x] = '.'; break } })
  else {
    const top = g.findIndex(r => r.some(blade))
    if (top >= 0) g.unshift(g[top]!.map(ch => (blade(ch) ? ch : '.')))
  }
  return g.map(r => r.join('')).join('/')
}
/** A weapon, its `@` pixel on the right claw's grip. Drawn twice as wide as its sheet so it reads next to the crab, and twice as tall when it is short. */
export const putWeapon = (c: Cells, id: number, color: string, grip: readonly [number, number], v = 0) => {
  const s = pick(WEAPONS, id)
  const ky = s.r.split('/').length <= 10 ? 2 : 1
  const m = v % WEAPON_MATERIALS
  const rows = shapeRows(grow(weaponRows(s.r, Math.floor(v / WEAPON_MATERIALS)), 2, ky), SHAPE_OF[m] ?? 0)
  const [ax, by] = anchor({ ...s, r: rows })
  c.paint(rows, { ...gearPal(color), ...pick(MATERIALS, m), '@': pick(MATERIALS, m).W }, grip[0] - ax, grip[1] - by)
}
/** A camp tool in the right claw. */
export const putTool = (c: Cells, kind: 'rod' | 'pick' | 'shovel', grip: readonly [number, number]) => {
  const s = TOOLS.find(t => t.n === kind) ?? pick(TOOLS, 0)
  const rows = grow(s.r, 2, kind === 'rod' ? 1 : 2)
  const [ax, ay] = anchor({ ...s, r: rows })
  c.paint(rows, gearPal('#94603a'), grip[0] - ax, grip[1] - ay)
}
