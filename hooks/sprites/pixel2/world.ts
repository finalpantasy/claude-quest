// The meadow (task-25), parameterized by canvas size for the band, strip and pane.
import { type Biome, PALS, paintFar, paintMid, paintNear, palAt, shadeOf } from './biomes'
import { P, Px, blade, clumps, darkOf, despeckle, nightOf, outline, rng, spr, wave } from './core'

// ======================= world =======================
/** V1 warm afternoon, V2 golden dusk (R1 and R2 of task-25), V3 a night made from V1 (task-27). */
export type Variant = 'V1' | 'V2' | 'V3'
export type Look = {
  sky: [number, string][] // rows where each sky band starts, top to bottom
  cloud: [string, string, string] // shade, body, lit
  far: [string, string] // mountains: shadow face, lit face
  mid: [string, string, string] // tree line: shadow, body, lit rim
  grass: [string, string] // meadow, its lit edge
  path: [string, string, string] // shadow edge, body, lit
  near: [string, string] // foreground grass, its lit top
  trunk: [string, string]
  canopy: [string, string, string, string] // dark, mid, light, highlight
  shade: (c: string) => string // color under a cast shadow
  sun?: { x: number; y: number; inner?: string; outer?: string }
  stars?: boolean
  flower?: [string, string]
  bare?: boolean
  indoor?: boolean
}
export const shadeMap = (pairs: [string, string][]) => { const m = new Map(pairs); return (c: string) => m.get(c) ?? c }

const V1_SHADE: [string, string][] = [[P.sand, P.clay], [P.hay, P.sand], [P.clay, P.plum], [P.spring, P.leaf], [P.leaf, P.green], [P.green, P.pine]]

export const LOOKS = {
  V1: {
    sky: [[0, P.sky], [14, P.ice]],
    cloud: [P.mist, P.cloud, P.skin], // warm lit tops: pure white is kept for sparkles
    far: [P.mist, P.cloud],
    mid: [P.fern, P.sage, P.lichen],
    grass: [P.leaf, P.spring],
    path: [P.clay, P.sand, P.hay],
    near: [P.green, P.leaf],
    trunk: [P.umber, P.olive],
    canopy: [P.pine, P.green, P.leaf, P.spring],
    shade: shadeMap(V1_SHADE),
  },
  V2: {
    sky: [[0, P.violet], [8, P.mulberry], [16, P.pink], [23, P.salmon], [29, P.apricot]],
    cloud: [P.mulberry, P.salmon, P.apricot],
    far: [P.mulberry, P.pink],
    mid: [P.grape, P.berry, P.coral],
    grass: [P.olive, P.moss],
    path: [P.rust, P.copper, P.tan],
    near: [P.umber, P.olive],
    trunk: [P.grape, P.wine],
    canopy: [P.grape, P.fern, P.olive, P.moss],
    shade: shadeMap([[P.copper, P.rust], [P.tan, P.copper], [P.rust, P.wine], [P.moss, P.olive], [P.olive, P.umber], [P.umber, P.slate]]),
    sun: { x: 236, y: 21 },
  },
} as Record<Variant, Look>

const dim = <T extends string | string[]>(x: T): T => (Array.isArray(x) ? x.map(nightOf) : nightOf(x as string)) as T
const day = LOOKS.V1
/** Night: the day's colors dimmed and bluer, a deep sky with stars and a pale moon. */
LOOKS.V3 = {
  sky: [[0, P.ink], [8, P.navy], [18, P.indigo], [28, P.blue]],
  cloud: [P.night, P.dusk, P.mauve],
  far: dim(day.far) as [string, string], mid: dim(day.mid) as [string, string, string], grass: dim(day.grass) as [string, string],
  path: dim(day.path) as [string, string, string], near: dim(day.near) as [string, string], trunk: dim(day.trunk) as [string, string],
  canopy: dim(day.canopy) as [string, string, string, string],
  shade: shadeMap(V1_SHADE.map(([a, b]) => [nightOf(a), nightOf(b)] as [string, string])),
  sun: { x: 420, y: 18, inner: P.cloud, outer: P.mist },
  stars: true,
}

const looks = new Map<string, Look>()
/** The look of a biome at a time of day: its own palette, the dusk sun or the night moon unless it is under a roof. Without a biome, the meadow. */
export const worldLook = (v: Variant, bio?: Biome): Look => {
  if (!bio) return LOOKS[v]
  const key = `${v}:${bio.pal}`
  let L = looks.get(key)
  if (!L) {
    const pal = palAt(PALS[bio.pal], v === 'V1' ? 'day' : v === 'V2' ? 'dusk' : 'night')
    L = { ...pal, shade: shadeOf(pal), ...(pal.indoor || v === 'V1' ? {} : { sun: LOOKS[v].sun }) }
    looks.set(key, L)
  }
  return L
}

/** The meadow scene. Width, height and `dy` (rows the ground and trees sit lower than in the 75 row frame, 0 for round 7) let the band layout reuse it. */
export const world = (v: Variant, AW = 480, AH = 75, dy = 0, pd = 0, clear?: { x: number; y: number }, bio?: Biome, seed = 0, moon = 4) => {
  const L = worldLook(v, bio), px = new Px(AW, AH), r = rng(bio ? seed : v === 'V2' ? 11 : 7)
  // sky: flat bands with one checker row at each seam (the only dither in the frame)
  for (let y = 0; y < AH; y++) {
    let c = L.sky[0]![1]
    for (const [y0, col] of L.sky) if (y >= y0) c = col
    px.rect(0, y, AW, 1, c)
    const next = L.sky.find(([y0]) => y0 === y + 1)
    if (next) for (let x = y & 1; x < AW; x += 2) px.set(x, y, next[1])
  }
  // dusk sun: a low disc in the two lightest warm colors, half behind the mountains
  // with a text `clear` zone the disc sits lower, half behind the hills, under the text rows
  // the wide night moon sits at the far right, past the end of the text rows, so it can stay high
  const sunDy = clear && L.sun && !(v === 'V3' && AW >= 260) ? Math.max(0, clear.y + 8 - L.sun.y) : dy >> 1
  // at night the moon wears the real phase, `moon` in eighths of the month (0 new, 4 full): the unlit side is a faint disc, a crescent lit to its rim
  const k = Math.cos(moon * Math.PI / 4), waxing = moon < 4
  const unlit = (x: number, y: number) => { if (v !== 'V3') return false; const w = Math.sqrt(Math.max(0, 1 - (y / 9.5) ** 2)), nx = x / 9.5; return waxing ? nx <= w * k : nx >= -w * k }
  if (L.sun) for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { const d = x * x + y * y; if (d <= 81) px.set(Math.round(AW * L.sun.x / 480) + x, L.sun.y + sunDy + y, unlit(x, y) ? (d <= 72 ? P.night : P.dusk) : d <= (v === 'V3' && moon % 6 === 1 ? 64 : 36) ? (L.sun.inner ?? P.cream) : (L.sun.outer ?? P.straw)) }
  if (L.stars) { const sr = rng(5); for (let i = 0; i < Math.round(AW / 14); i++) { const x = Math.floor(sr() * AW), y = Math.floor(sr() * AH * 0.36); if (clear && bio && y < clear.y && x > clear.x - 6) continue; px.set(x, y, i % 4 === 0 ? P.white : P.cloud); if (i % 7 === 0) { px.set(x - 1, y, P.mist); px.set(x + 1, y, P.mist); px.set(x, y - 1, P.mist); px.set(x, y + 1, P.mist) } } }
  // clouds: a few flat clumps with a lit top and a straight shaded base
  const clouds = (L.indoor ? [] : v !== 'V2' ? [[70, 15, 18], [262, 9, 12], [366, 12, 16], [520, 11, 17], [650, 16, 13]] : [[120, 19, 20], [360, 12, 14], [560, 17, 18]]).filter(c => c[0]! < AW + 10)
    // clouds stay out of the text rows: drop any whose top reaches the zone, except a sliver at the far right
    .filter(([cx, cy, w]) => !clear || !(cx! + w! > clear.x && cy! - w! * 0.4 < clear.y && cx! - w! < AW * 0.82))
  for (const [cx, cy, w] of clouds as [number, number, number][]) {
    const bumps: [number, number, number][] = [[cx - w * 0.5, cy, w * 0.32], [cx, cy - 2, w * 0.42], [cx + w * 0.45, cy, w * 0.3]]
    for (let y = cy - w; y <= cy + 2; y++) for (let x = cx - w; x <= cx + w; x++) {
      let inside = false, top = false
      for (const [bx, by, br] of bumps) { const dx = x + 0.5 - bx, dy = (y + 0.5 - by) * 1.6; if (dx * dx + dy * dy <= br * br) { inside = true; const ty = dy + 2.4; top = top || dx * dx + ty * ty > br * br } }
      if (inside) px.set(x, y, y >= cy + 1 ? L.cloud[0] : top ? L.cloud[2] : L.cloud[1])
    }
  }
  // layer 1, far mountains: peaks from a few triangles, faces turned to the light are lit
  if (bio) paintFar(px, bio.far, L as Look & { flower: [string, string] }, AW, AH, 22 + (dy >> 1), seed)
  const peaks: [number, number, number][] = []
  if (!bio) for (let x = -20; x < AW + 40; x += 34 + Math.floor(r() * 30)) peaks.push([x, 22 + (dy >> 1) + Math.floor(r() * 10), 0.55 + r() * 0.25])
  const hAt = (x: number) => Math.min(...peaks.map(([x0, y0, k]) => y0 + Math.abs(x - x0) * k))
  if (!bio) for (let x = 0; x < AW; x++) {
    const peak = peaks.some(([x0]) => Math.abs(x + 0.5 - x0) < 1.5), top = Math.round(hAt(x)) + (peak ? 1 : 0), lit = hAt(x - 1) > hAt(x + 1)
    for (let y = Math.max(top, 0); y < AH; y++) px.set(x, y, lit && y < top + 14 ? L.far[1] : L.far[0])
  }
  // layer 2, tree line: groups of round crowns and a few pines, darker than the mountains
  const crowns: [number, number, number][] = []
  const round = !bio || bio.mid === 'crowns'
  if (round) for (let x = -4; x < AW + 8;) {
    const n = 2 + Math.floor(r() * 4)
    for (let i = 0; i < n; i++) { const cr = 3 + Math.floor(r() * 7); crowns.push([x, 45 + dy - cr * 0.8 - Math.floor(r() * 5), cr]); x += cr * 1.1 + 1 }
    x += 6 + Math.floor(r() * 18)
  }
  if (!round) { px.rect(0, 46 + dy, AW, AH - 46 - dy, L.mid[0]); paintMid(px, bio!.mid, L as Look & { flower: [string, string] }, AW, 47 + dy, seed) }
  if (round) for (let x = 0; x < AW; x++) for (let y = 30 + dy; y < AH; y++) {
    let inside = y >= 44 + dy, lit = false
    for (const [cx, cy, cr0] of crowns) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, cr = cr0 * (1 + 0.12 * Math.cos(Math.atan2(dy, dx) * 6 + cx)); if (dx * dx + dy * dy <= cr * cr) { inside = true; const lx = dx + 1.5, ly = dy + 1.5; if (lx * lx + ly * ly > cr * cr && dx < 0.5 && dy < 0.5) lit = true } }
    if (inside) px.set(x, y, lit ? L.mid[2] : y >= 47 + dy ? L.mid[0] : L.mid[1])
  }
  // layer 3, the ground: meadow, path, near grass
  const pathTop = 56 + dy + pd, pathBot = 68 + dy + pd
  for (let x = 0; x < AW; x++) {
    const e0 = blade(x, 1)
    for (let y = 49 + dy - e0; y < AH; y++) px.set(x, y, y === 49 + dy - e0 && e0 > 0 ? L.grass[1] : L.grass[0])
    const pt = pathTop + Math.round(wave(x, 4, 0.03) * 1.2), pb = pathBot + Math.round(wave(x, 7, 0.025) * 1.2)
    // grass edges in short blade clusters, not a ruler line
    const e1 = blade(x, 3), e2 = blade(x, 8)
    for (let y = pt; y < pb; y++) px.set(x, y, y < pt + e1 ? L.grass[0] : y === pt + e1 ? L.path[2] : y >= pb - 1 - e2 ? L.path[0] : L.path[1])
    for (let y = pb - e2; y < AH; y++) px.set(x, y, y <= pb - e2 ? L.near[1] : L.near[0])
  }
  // a few grass tufts and pebbles, hand stamps placed on purpose
  const tuft = spr(['.g..', 'g.g.', 'ggg.'], { g: L.grass[1] })
  const ntuft = spr(['g...g', '.g.g.', 'ggggg'], { g: L.near[1] })
  for (const x of [52, 150, 236, 356, 446, 520, 610, 680].filter(x => x < AW - 6)) px.blit(tuft, x, pathTop - 2)
  for (const x of [120, 290, 404, 560, 650].filter(x => x < AW - 6)) px.blit(ntuft, x, pathBot - 2)
  for (const [x, y] of [[176, 62], [334, 65], [452, 60], [540, 63], [700, 66]].filter(([x]) => x! < AW - 3).map(([x, y]) => [x!, y! + dy]) as [number, number][]) { px.set(x, y, L.path[0]); px.set(x + 1, y, L.path[0]); px.set(x, y - 1, L.path[2]) }
  const mark = spr(['g.g', '.g.'], { g: L.grass[1] }), nmark = spr(['g.g', '.g.'], { g: L.near[1] })
  for (let x = 6; x < AW; x += 23) { px.blit(mark, x + ((x * 3) % 7), 51 + dy + ((x >> 2) % 3)); px.blit(nmark, x + 11, 71 + dy + ((x >> 3) % 2)) }
  // meadow flowers, two-pixel clusters
  for (const [x, y, c] of ([[30, 51, P.skin], [96, 53, P.gold], [170, 51, P.skin], [312, 52, P.gold], [380, 51, P.skin], [470, 53, P.gold], [560, 52, P.skin], [640, 51, P.gold]] as [number, number, string][]).filter(([x]) => x < AW - 4).map(([x, y, c]) => [x, y + dy, c] as [number, number, string])) { const f = L.flower ? (c === P.skin ? L.flower[0] : L.flower[1]) : c; px.set(x, y, f); px.set(x + 1, y, f); px.set(x, y + 1, L.grass[1]) }
  // prop: one framing tree on the left edge, trunk with roots, canopy of lit clumps
  if (bio) paintNear(px, bio.pal, L as Look & { flower: [string, string] }, AW, dy, seed)
  if (L.bare) return rock(px, dy)
  const t = new Px(60, 70)
  for (let y = 24; y < 70; y++) { const half = 3 + (y > 62 ? Math.floor((y - 62) * 0.8) : 0); for (let x = 22 - half; x < 22 + half; x++) t.set(x, y, x < 21 ? L.trunk[1] : L.trunk[0]) }
  clumps(t, [[34, 22, 9], [10, 20, 9], [24, 10, 10], [8, 30, 8], [30, 30, 8], [18, 24, 9], [40, 12, 7]], L.canopy)
  // with a `clear` zone the tree stands further left, so the hero has open sky behind his head
  const tx = clear ? -36 : -10
  px.blit(outline(despeckle(t), () => L.canopy[0]), tx, -1 + (dy >> 1))
  // the tree's shadow pool on the meadow and path
  for (let y = 49 + dy; y < 62 + dy; y++) for (let x = 0; x < 52; x++) { const ex = (x - 18 - tx - 10) / 34, ey = (y - 55 - dy) / 6.5; if (ex * ex + ey * ey <= 1) { const c = px.get(x, y); if (c) px.set(x, y, L.shade(c)) } }
  return rock(px, dy)
}
/** A rock between the hero and the loot. */
const rock = (px: Px, dy: number) => { px.blit(outline(spr(['..hhH..', '.hHHHhs', 'hHHhhss', 'hhhhsss'], { H: P.cloud, h: P.mist, s: P.dusk }), darkOf), 150, 61 + dy); return px }

/** A flat cast shadow: the ground colors under an ellipse, each one step darker. */
export const castShadow = (px: Px, cx: number, y: number, w: number, look: Look, floating = false) => {
  const rows = floating ? [[0, w - 1]] : [[-1, w - 2], [0, w], [1, w - 2]]
  for (const [j, half] of rows as [number, number][]) for (let i = -half; i <= half; i++) { const c = px.get(cx + i, y + j); if (c) px.set(cx + i, y + j, look.shade(c)) }
}

