// Gear drawing conventions shared by every hat, robe, cape, shield and weapon grid.
// Letters: M main (the item's rarity color) H light M, D dark M; K outline; S steel, s dark steel; A gold, a dark gold;
// W wood, w dark wood; F white, R red, G green, B blue, P purple, C cyan, Y yellow, O orange, E grey, N black, Q pink.
import { shade } from './core'
import type { Pal } from './core'

export const gearPal = (tint: string): Pal => ({
  M: tint, H: shade(tint, 0.38), D: shade(tint, -0.38), K: '#1a1220',
  S: '#bcc5d3', s: '#76808f', A: '#f2c94c', a: '#a47e1c', W: '#94603a', w: '#5e3a1e',
  F: '#ffffff', R: '#e0443a', G: '#46c466', B: '#4d8dff', P: '#a65ee0', C: '#5ee0ea', Y: '#ffe45e', O: '#ff8a2a', E: '#8a8a9c', N: '#2a2433', Q: '#ff8ac8',
  '@': '#94603a',
})

/** A gear drawing: name, rows (`/` between), and how to place it. */
export type Shape = { n: string; r: string; y?: number }
export const shapes = (rows: [string, string, number?][]): Shape[] => rows.map(([n, r, y]) => ({ n, r, y }))

/** Every row of a shape must be one width, or it is a typo. Returns the bad names. */
export const ragged = (list: Shape[]) => list.filter(s => new Set(s.r.split('/').map(x => x.length)).size > 1).map(s => s.n)
