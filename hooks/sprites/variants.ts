// Variants: one base drawing times trims, plumes, gems and materials gives thousands of distinct pieces.
// A piece is painted on a scratch canvas, a decor changes or adds pixels using the piece's own bounds, and the result is merged.
// Variant 0 is always the plain drawing; every other number picks a decor and a colorway (head, robe, back, off-hand) or a material and a decor (weapon).
import { Cells } from './core'
import { CW } from './crab'

const WAYS: [string, string, string][] = [['#f2c94c', '#e0443a', '#a47e1c'], ['#5ee0ea', '#4d8dff', '#2e8a92'], ['#46c466', '#a65ee0', '#2a7a40']]
const BONE = '#efe6cf'
/** How many variants each kind of piece has: 1 plain plus (decors - 1) decors in 3 colorways. */
export const DECORS = { head: 7, chest: 5, back: 5, offhand: 6 } as const
export const variantCount = (kind: keyof typeof DECORS) => 1 + 3 * (DECORS[kind] - 1)
export const WEAPON_MATERIALS = 10
export const WEAPON_DECORS = 5
export const WEAPON_VARIANTS = WEAPON_MATERIALS * WEAPON_DECORS

const decode = (v: number, kind: keyof typeof DECORS) => {
  if (v <= 0) return { d: 0, a1: WAYS[0]![0], a2: WAYS[0]![1], dk: WAYS[0]![2] }
  const n = DECORS[kind] - 1
  const w = WAYS[Math.floor((v - 1) / n) % 3]!
  return { d: 1 + ((v - 1) % n), a1: w[0], a2: w[1], dk: w[2] }
}

type Box = { x0: number; y0: number; x1: number; y1: number }
const box = (t: Cells): Box => {
  const b = { x0: 99, y0: 99, x1: -1, y1: -1 }
  for (const k of t.m.keys()) { const x = k % t.w, y = Math.floor(k / t.w); b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y) }
  return b
}
const cells = (t: Cells) => [...t.m.keys()].map(k => [k % t.w, Math.floor(k / t.w)] as const)
const edges = (t: Cells) => cells(t).filter(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !t.m.has((y + (dy ?? 0)) * t.w + x + (dx ?? 0))))
const fold = (x: number) => Math.min(x, CW - 1 - x)
const CX = CW / 2

/** Plumes, gems, stars, flames, horns and bands for hats and masks. */
export const decorHead = (t: Cells, v: number) => {
  const { d, a1, a2 } = decode(v, 'head')
  if (!d) return
  const b = box(t)
  if (d === 1) { t.rect(CX - 1, b.y0 - 3, 2, 1, a1); t.rect(CX - 1, b.y0 - 2, 2, 2, a2); t.rect(CX, b.y0 - 4, 1, 1, a1) }
  else if (d === 2) { t.rect(CX - 1, b.y1, 2, 1, a2); t.rect(CX - 2, b.y1, 1, 1, a1); t.rect(CX + 1, b.y1, 1, 1, a1) }
  else if (d === 3) { t.rect(CX - 1, b.y0 - 3, 2, 1, a1); t.rect(CX - 2, b.y0 - 2, 4, 1, a1); t.rect(CX - 1, b.y0 - 1, 2, 1, a1) }
  else if (d === 4) { t.rect(CX - 2, b.y0 - 2, 1, 2, a2); t.rect(CX - 1, b.y0 - 4, 2, 4, a2); t.rect(CX + 1, b.y0 - 2, 1, 2, a2); t.rect(CX - 1, b.y0 - 2, 2, 2, a1) }
  else if (d === 5) { for (const [x, s] of [[b.x0, -1], [b.x1, 1]] as const) { t.rect(x, b.y0 - 2, 1, 2, BONE); t.put(x + s, b.y0 - 3, BONE) } }
  else for (const [x, y] of cells(t)) if (y >= b.y1 - 1) t.put(x, y, a1)
}

/** Hem, belt, studs and chevrons for robes: they recolor the cloth that is already there. */
export const decorChest = (t: Cells, v: number) => {
  const { d, a1, a2 } = decode(v, 'chest')
  if (!d) return
  const b = box(t)
  const belt = b.y0 + Math.round((b.y1 - b.y0) * 0.55)
  for (const [x, y] of cells(t)) {
    if (d === 1 && y >= b.y1 - 1) t.put(x, y, a1)
    else if (d === 2 && y === belt) t.put(x, y, a1)
    else if (d === 3 && fold(x) % 3 === 0 && y % 3 === 0) t.put(x, y, a2)
    else if (d === 4 && (fold(x) + y) % 5 === 0) t.put(x, y, a2)
  }
}

/** Edging, spots, stripes and a hem band for capes and wings. */
export const decorBack = (t: Cells, v: number) => {
  const { d, a1, a2 } = decode(v, 'back')
  if (!d) return
  const b = box(t)
  if (d === 1) { for (const [x, y] of edges(t)) t.put(x, y, a1); return }
  for (const [x, y] of cells(t)) {
    if (d === 2 && (fold(x) * 3 + y * 5) % 9 === 0) t.put(x, y, a2)
    else if (d === 3 && fold(x) % 4 === 1) t.put(x, y, a1)
    else if (d === 4 && y >= b.y1 - 1) t.put(x, y, a1)
  }
}

/** Rims, crosses, diagonals, dots and chevrons for shields and off-hands. */
export const decorOff = (t: Cells, v: number) => {
  const { d, a1, a2 } = decode(v, 'offhand')
  if (!d) return
  const b = box(t)
  const cx = Math.round((b.x0 + b.x1) / 2), cy = Math.round((b.y0 + b.y1) / 2)
  if (d === 1) { for (const [x, y] of edges(t)) t.put(x, y, a1); return }
  for (const [x, y] of cells(t)) {
    if (d === 2 && (x === cx || y === cy)) t.put(x, y, a2)
    else if (d === 3 && (x + y) % 4 === 0) t.put(x, y, a1)
    else if (d === 4 && x % 2 === 0 && y % 2 === 0) t.put(x, y, a2)
    else if (d === 5 && Math.abs(x - cx) === y - b.y0) t.put(x, y, a1)
  }
}

/** Weapon materials: steel and handle colors and the gold trim swap together. */
export const MATERIALS: { S: string; s: string; A: string; a: string; W: string; w: string }[] = [
  { S: '#bcc5d3', s: '#76808f', A: '#f2c94c', a: '#a47e1c', W: '#94603a', w: '#5e3a1e' },
  { S: '#7f8794', s: '#434a56', A: '#c0c8d8', a: '#7a8294', W: '#5a4a3a', w: '#2e241a' },
  { S: '#f2c94c', s: '#a47e1c', A: '#fff3b0', a: '#c8a030', W: '#b04030', w: '#6a2018' },
  { S: '#efe6cf', s: '#b0a58a', A: '#a47e1c', a: '#6a5410', W: '#cfc5ad', w: '#8a806a' },
  { S: '#9eeaf2', s: '#4aa6b8', A: '#e0f8ff', a: '#7ac0d0', W: '#5a6a8a', w: '#303a52' },
  { S: '#4b3f66', s: '#241c36', A: '#a060e0', a: '#5a2a90', W: '#2a2236', w: '#120e1c' },
  { S: '#d98a54', s: '#8a4a28', A: '#ffd0a0', a: '#b87a48', W: '#7a3a1e', w: '#401c0c' },
  { S: '#d4f1ff', s: '#7fb4d8', A: '#e8f8ff', a: '#9ac4e0', W: '#6a8aa8', w: '#38506a' },
  { S: '#8be0a8', s: '#3a8a5c', A: '#f0e090', a: '#b8a050', W: '#4a7a5a', w: '#26402e' },
  { S: '#ff9a4a', s: '#b8381f', A: '#ffd060', a: '#c08a20', W: '#8a2a1e', w: '#4a140c' },
]
/** Row rules that change a weapon's own pixels: runes, gilded edges, gems and flames. */
export const weaponRows = (rows: string, decor: number) => {
  if (!decor) return rows
  return rows.split('/').map((row, y) => [...row].map((ch, x) => {
    const edge = !'SMHs'.includes(row[x - 1] ?? '.') || !'SMHs'.includes(row[x + 1] ?? '.')
    if (decor === 1) return 'SHMWs'.includes(ch) && (x + y) % 3 === 0 ? 'C' : ch
    if (decor === 2) return 'SM'.includes(ch) && edge ? 'A' : ch === 'W' && y % 2 === 0 ? 'w' : ch
    if (decor === 3) return ch === 'A' ? 'R' : 'SMWH'.includes(ch) && (x * 3 + y) % 5 === 0 ? 'R' : ch
    return 'SMWH'.includes(ch) && y % 2 === 0 && (x + y) % 3 === 0 ? 'O' : 'SM'.includes(ch) && y % 2 === 1 && x % 3 === 0 ? 'Y' : ch
  }).join('')).join('/')
}
