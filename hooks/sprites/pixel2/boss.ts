// Mephisto the Monorepo (task-25): the horned sorcerer boss.
import { P, Px, darkOf, despeckle, outline, spr } from './core'
import { RAMPS } from './foes'

export const stroke = (px: Px, pts: [number, number][], r0: number, r1: number, col: (side: number, t: number) => string) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]!, [bx, by] = pts[i + 1]!
    const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 3))
    for (let k = 0; k <= n; k++) {
      const t = (i + k / n) / (pts.length - 1), r = r0 + (r1 - r0) * t
      const x = ax + (bx - ax) * (k / n), y = ay + (by - ay) * (k / n)
      const nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1
      for (let j = Math.floor(y - r - 1); j <= y + r + 1; j++) for (let q = Math.floor(x - r - 1); q <= x + r + 1; q++) {
        const dx = q + 0.5 - x, dy = j + 0.5 - y
        if (dx * dx + dy * dy <= r * r) px.set(q, j, col((dx * nx + dy * ny) / nl / Math.max(r, 0.5), t))
      }
    }
  }
}

/** Mephisto the Monorepo: a tall horned demon sorcerer in a robe, a flame raised toward the hero, a staff in the other hand. */
export const bossSprite = () => {
  const px = new Px(50, 58), c = 27, top = 12
  // staff behind the right side: a dark shaft with a violet gem in a gold cradle
  for (let y = top + 2; y < 58; y++) { px.set(c + 15, y, P.wine); px.set(c + 16, y, P.grape) }
  const gem = spr(['.g.g.', 'gLlvg', 'glvvg', '.gvg.', '..g..'], { g: P.amber, L: P.blush, l: P.lilac, v: P.purple })
  px.blit(gem, c + 13, top - 3)
  // robe: shoulders at top + 15, a flared hem; lit band on the left, two folds, dark right side
  for (let y = top + 15; y < 58; y++) {
    const t = (y - top - 15) / (57 - top - 15), half = Math.round(10 + t * 9 + (t > 0.85 ? (t - 0.85) * 18 : 0))
    for (let x = c - half; x < c + half; x++) {
      const u = (x - (c - half)) / (half * 2)
      let col: string = u < 0.12 ? P.lilac : u < 0.26 ? P.purple : u < 0.68 ? P.violet : P.grape
      const fold1 = Math.round(c - 5 - t * 4), fold2 = Math.round(c + 4 + t * 5)
      if (x === fold1 || x === fold2) col = P.grape
      if (x === fold1 - 1 && t > 0.15) col = P.purple
      px.set(x, y, col)
    }
  }
  // center opening with gold trim down to the hem
  for (let y = top + 19; y < 58; y++) { const w = 1 + Math.floor((y - top - 19) / 9); for (let x = c - w; x < c + w; x++) px.set(x, y, P.berry); px.set(c - w - 1, y, P.gold); px.set(c + w, y, P.amber) }
  // sash with a clasp, hem trim
  for (let x = c - 12; x < c + 12; x++) if (px.get(x, top + 22)) { px.set(x, top + 22, x < c ? P.gold : P.amber); px.set(x, top + 23, P.rust) }
  px.rect(c - 1, top + 21, 3, 4, P.gold); px.set(c + 1, top + 24, P.amber); px.set(c - 1, top + 21, P.cream)
  for (let x = 0; x < 50; x++) if (px.get(x, 57) && px.get(x, 57) !== P.wine && px.get(x, 57) !== P.grape) px.set(x, 57, x < c ? P.gold : P.amber)
  // high collar behind the head
  for (let y = top; y < top + 16; y++) for (let x = c - 10; x <= c + 10; x++) { const dx = x + 0.5 - c, dy = y - top - 16; if (dx * dx / 100 + dy * dy / 196 <= 1) px.set(x, y, dx < -6 ? P.purple : dx < 0 ? P.violet : P.grape) }
  // pauldrons with gold rims
  for (const sx of [-1, 1]) for (let y = top + 10; y < top + 19; y++) for (let x = c + sx * 10 - 6; x < c + sx * 10 + 6; x++) {
    const dx = x + 0.5 - (c + sx * 10), dy = y + 0.5 - (top + 16)
    if (dx * dx + dy * dy * 1.7 <= 30 && dy < 2.5) px.set(x, y, dy < -2.6 ? (sx < 0 && dx < 1 ? P.gold : P.amber) : dx < -1.5 ? P.purple : sx < 0 ? P.violet : P.grape)
  }
  // head: lit from the left, heavy brow, glowing eyes, fangs, a dark pointed beard
  const head = spr([
    '..KKKkkkj..',
    '.KKKkkkkkj.',
    'KKKkkkkkkjj',
    'KKkkkkkkkjJ',
    'Kkoookooojj',
    'kkyYkkkyYjJ',
    'kkkkkkkkkjJ',
    'Kkkkk.kkkjj',
    'kkoooooookJ',
    'kkfkkkkfkjJ',
    '.kkkkkkkjJ.',
    '..bbbbbbb..',
    '...bbbbb...',
    '....bbb....',
    '.....b.....',
  ], { K: P.scarlet, k: P.red, j: P.blood, J: P.wine, o: P.blood, y: P.gold, Y: P.cream, f: P.cloud, b: P.grape })
  head.set(5, 7, P.blood)
  px.blit(head, c - 5, top + 2)
  // horns: from the top of the head up and out, curling down at the tips
  for (const sx of [-1, 1]) {
    const pts: [number, number][] = [[c + sx * 3.5, top + 3], [c + sx * 7, top - 2], [c + sx * 10.5, top - 5], [c + sx * 14.5, top - 5.5], [c + sx * 17, top - 3], [c + sx * 17.5, top]]
    stroke(px, pts, 2.8, 0.7, (side, t) => { const lit = side * sx < 0; return t > 0.86 ? P.cloud : lit ? (side * sx < -0.45 ? P.cloud : P.sand) : side * sx > 0.45 ? P.plum : P.clay })
  }
  // raised arm toward the hero: a wide bell sleeve with gold cuff, a red hand, a flame above it
  stroke(px, [[c - 10, top + 15], [c - 15, top + 10], [c - 18, top + 5]], 3.2, 2.4, side => (side > 0.25 ? P.grape : side < -0.45 ? P.lilac : P.purple))
  for (let i = -2; i <= 2; i++) px.set(c - 18 + i, top + 3 + Math.round(i * 0.4), i < 0 ? P.gold : P.amber)
  px.rect(c - 20, top - 1, 4, 4, P.red); px.set(c - 20, top - 1, P.scarlet); px.set(c - 19, top - 1, P.scarlet); px.set(c - 17, top + 2, P.blood)
  const flame = spr([
    '...rfr.rr.',
    '..rffrrfr.',
    '..rfyffrr.',
    '.rffyYffr.',
    '.rfyYYyfr.',
    'rffyYYyffr',
    'rfyYYYYyfr',
    '.rfyYYyfr.',
    '..rffffr..',
  ], { r: P.orange, f: P.amber, y: P.gold, Y: P.cream })
  px.blit(flame, c - 23, top - 10) // the flame's two tip rows are trimmed so the boss fits the 60 row band
  return outline(despeckle(px), darkOf)
}

const bossCache = new Map<string, Px>()
/** The boss, its robe swapped to another ramp (the native one is purple). */
export const bossPx = (ramp?: string): Px => {
  const key = ramp ?? ''
  let p = bossCache.get(key)
  if (!p) {
    const base = bossSprite(), to = ramp ? RAMPS[ramp] : undefined
    if (to) { const m = new Map(RAMPS.purple!.map((c, i) => [c, to[i]!])); m.set(P.berry, to[3]!); p = base.map(c => m.get(c) ?? c) } else p = base
    bossCache.set(key, p)
  }
  return p
}
