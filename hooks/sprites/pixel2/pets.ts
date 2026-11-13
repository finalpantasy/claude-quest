// Hatched pets in the D30 look: the pet line's own sprite, its colors snapped to Resurrect 64. Pure, no I/O.
import { PETS, petSprite, type Pet } from '../pets'
import { nearest, Px } from './core'

const hex = (c: string): [number, number, number] => {
  const s = c.length === 4 ? c.slice(1).split('').map(d => d + d).join('') : c.slice(1, 7)
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}
/** The pet of a line at a stage, or the line's last stage when it has fewer. */
export const petOf = (line: number, stage: number): Pet => {
  const all = PETS.filter(p => p.line === line)
  return all.find(p => p.stage === stage) ?? all[all.length - 1]!
}
/** How many stages a line has (2 or 3). */
export const stagesOf = (line: number) => PETS.filter(p => p.line === line).length
const cache = new Map<string, Px>()
/** A pet as a pixel buffer, facing right like the hero's companions. */
export const petPx = (line: number, stage: number): Px => {
  const k = `${line}:${stage}`
  let v = cache.get(k)
  if (v) return v
  const s = petSprite(petOf(line, stage))
  v = new Px(s.w, s.h)
  for (const part of s.parts) for (const [x, y, w, h, c] of part.rects) {
    if (!c.startsWith('#')) continue
    const [r, g, b] = hex(c)
    v.rect(x, y, w, h, nearest(r, g, b))
  }
  cache.set(k, v)
  return v
}
