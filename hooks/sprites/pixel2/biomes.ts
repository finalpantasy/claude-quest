// task-13: a biome for every place. A biome is a day palette, a far skyline, a mid layer and a weather; dusk and night are made from the day palette.
import { P, Px, darkOf, nightOf, rng } from './core'

export type Far = 'peaks' | 'dunes' | 'mesas' | 'spires' | 'domes' | 'towers' | 'pyramids'
export type Mid = 'crowns' | 'pines' | 'cacti' | 'crystals' | 'ruins' | 'racks' | 'mushrooms' | 'graves' | 'reeds'
export type Weather = 'rain' | 'snow' | 'embers' | 'fog' | 'fireflies' | 'spores' | 'leaves' | 'sand' | 'aurora'
export type Pal = {
  sky: [number, string][]
  cloud: [string, string, string]
  far: [string, string]
  mid: [string, string, string]
  grass: [string, string]
  path: [string, string, string]
  near: [string, string]
  trunk: [string, string]
  canopy: [string, string, string, string]
  flower: [string, string]
  /** no framing tree on the left */
  bare?: boolean
  /** under a roof: no sun, moon, clouds or stars */
  indoor?: boolean
  /** stars by day too */
  stars?: boolean
}

const MEADOW: Pal = {
  sky: [[0, P.sky], [14, P.ice]], cloud: [P.mist, P.cloud, P.skin], far: [P.mist, P.cloud], mid: [P.fern, P.sage, P.lichen],
  grass: [P.leaf, P.spring], path: [P.clay, P.sand, P.hay], near: [P.green, P.leaf], trunk: [P.umber, P.olive],
  canopy: [P.pine, P.green, P.leaf, P.spring], flower: [P.skin, P.gold],
}
export const PALS = {
  meadow: MEADOW,
  autumn: { ...MEADOW, mid: [P.rust, P.copper, P.tan], grass: [P.olive, P.moss], near: [P.umber, P.olive], canopy: [P.rust, P.copper, P.tan, P.straw], flower: [P.gold, P.coral] },
  desert: { ...MEADOW, sky: [[0, P.sky], [12, P.ice], [24, P.cream]], far: [P.copper, P.tan], mid: [P.pine, P.green, P.leaf], grass: [P.tan, P.straw], path: [P.clay, P.sand, P.hay], near: [P.copper, P.tan], flower: [P.coral, P.rose], bare: true },
  swamp: { ...MEADOW, sky: [[0, P.sage], [14, P.lichen]], cloud: [P.sage, P.lichen, P.hay], far: [P.fern, P.sage], mid: [P.slate, P.fern, P.olive], grass: [P.olive, P.moss], path: [P.umber, P.olive, P.moss], near: [P.fern, P.sage], trunk: [P.slate, P.fern], canopy: [P.fern, P.olive, P.moss, P.sprout], flower: [P.lime, P.mint] },
  jungle: { ...MEADOW, sky: [[0, P.teal], [14, P.aqua]], cloud: [P.aqua, P.mint, P.foam], far: [P.sage, P.lichen], mid: [P.pine, P.green, P.spring], grass: [P.green, P.leaf], path: [P.umber, P.olive, P.moss], near: [P.pine, P.green], flower: [P.hot, P.gold] },
  snow: { ...MEADOW, sky: [[0, P.blue], [12, P.sky], [24, P.ice]], cloud: [P.mist, P.cloud, P.white], far: [P.mist, P.cloud], mid: [P.fern, P.sage, P.cloud], grass: [P.cloud, P.white], path: [P.mauve, P.mist, P.cloud], near: [P.mist, P.cloud], canopy: [P.fern, P.sage, P.cloud, P.white], flower: [P.ice, P.white] },
  volcanic: { ...MEADOW, sky: [[0, P.ink], [10, P.grape], [20, P.blood], [28, P.red]], cloud: [P.night, P.dusk, P.mauve], far: [P.night, P.plum], mid: [P.night, P.plum, P.scarlet], grass: [P.dusk, P.mauve], path: [P.red, P.scarlet, P.amber], near: [P.night, P.dusk], trunk: [P.ink, P.night], canopy: [P.ink, P.night, P.dusk, P.plum], flower: [P.amber, P.gold] },
  crystal: { ...MEADOW, sky: [[0, P.violet], [12, P.purple], [24, P.lilac]], cloud: [P.purple, P.lilac, P.blush], far: [P.indigo, P.blue], mid: [P.deep, P.teal, P.mint], grass: [P.violet, P.purple], path: [P.grape, P.violet, P.lilac], near: [P.grape, P.violet], flower: [P.mint, P.foam], bare: true },
  cavern: { ...MEADOW, sky: [[0, P.ink], [14, P.night], [26, P.plum]], cloud: [P.ink, P.night, P.plum], far: [P.night, P.dusk], mid: [P.ink, P.plum, P.mauve], grass: [P.plum, P.clay], path: [P.night, P.plum, P.clay], near: [P.night, P.plum], flower: [P.mint, P.foam], bare: true, indoor: true },
  city: { ...MEADOW, sky: [[0, P.navy], [12, P.indigo], [24, P.blue]], cloud: [P.indigo, P.blue, P.sky], far: [P.night, P.indigo], mid: [P.slate, P.night, P.mint], grass: [P.dusk, P.mauve], path: [P.night, P.dusk, P.mist], near: [P.slate, P.night], flower: [P.mint, P.hot], bare: true },
  graveyard: { ...MEADOW, sky: [[0, P.indigo], [12, P.purple], [24, P.mauve]], cloud: [P.purple, P.mauve, P.mist], far: [P.plum, P.mauve], mid: [P.dusk, P.mauve, P.mist], grass: [P.fern, P.sage], path: [P.plum, P.mauve, P.mist], near: [P.slate, P.fern], trunk: [P.ink, P.night], canopy: [P.ink, P.night, P.dusk, P.plum], flower: [P.lilac, P.blush] },
  coast: { ...MEADOW, grass: [P.sand, P.hay], path: [P.deep, P.teal, P.aqua], near: [P.clay, P.sand], mid: [P.pine, P.green, P.leaf], flower: [P.foam, P.white] },
  void: { ...MEADOW, sky: [[0, P.ink], [16, P.grape], [28, P.violet]], cloud: [P.grape, P.violet, P.purple], far: [P.ink, P.grape], mid: [P.ink, P.grape, P.magenta], grass: [P.night, P.grape], path: [P.ink, P.night, P.violet], near: [P.ink, P.night], flower: [P.hot, P.magenta], bare: true, stars: true },
  ruins: { ...MEADOW, far: [P.sand, P.hay], mid: [P.clay, P.sand, P.hay], grass: [P.olive, P.moss], near: [P.umber, P.olive], flower: [P.coral, P.gold] },
} satisfies Record<string, Pal>
export type PalKey = keyof typeof PALS
export type Biome = { pal: PalKey; far: Far; mid: Mid; wx?: Weather }

const b = (pal: PalKey, far: Far, mid: Mid, wx?: Weather): Biome => (wx ? { pal, far, mid, wx } : { pal, far, mid })
/** One biome per place: the five acts' zones, then the Atlas maps. Unknown places fall back to a mix picked from the name. */
export const BIOMES: Record<string, Biome> = {
  'The Repo Root': b('meadow', 'peaks', 'crowns'),
  'Cellar of node_modules': b('cavern', 'spires', 'mushrooms', 'spores'),
  'The Forgotten Branches': b('autumn', 'domes', 'crowns', 'leaves'),
  'Cathedral of Config': b('ruins', 'spires', 'ruins'),
  'The Lint Fields': b('meadow', 'domes', 'reeds', 'fireflies'),
  'Desert of Deprecation': b('desert', 'dunes', 'cacti', 'sand'),
  'Lockfile Oasis': b('coast', 'dunes', 'reeds'),
  'Tomb of Left-Pad': b('cavern', 'mesas', 'ruins', 'spores'),
  'The Version Pyramids': b('desert', 'pyramids', 'ruins', 'sand'),
  'Peer Dependency Palace': b('ruins', 'towers', 'ruins'),
  'The Rebase Swamps': b('swamp', 'domes', 'reeds', 'fog'),
  'Conflict Marshes': b('swamp', 'dunes', 'mushrooms', 'rain'),
  'Temple of the Detached HEAD': b('jungle', 'pyramids', 'ruins', 'fireflies'),
  'Cherry-Pick Jungle': b('jungle', 'domes', 'crowns', 'rain'),
  'The Force-Push Cliffs': b('meadow', 'mesas', 'pines', 'leaves'),
  'The Staging Gates': b('city', 'towers', 'racks'),
  'Plains of Hotfix': b('autumn', 'dunes', 'crowns', 'embers'),
  'River of Logs': b('coast', 'peaks', 'pines', 'rain'),
  'The Pager Spire': b('city', 'spires', 'racks', 'rain'),
  'The 3AM Sanctum': b('void', 'spires', 'crystals', 'fireflies'),
  'The COBOL Peaks': b('snow', 'peaks', 'pines', 'snow'),
  'Mainframe Halls': b('city', 'towers', 'racks'),
  'The Frozen Monolith': b('snow', 'mesas', 'crystals', 'aurora'),
  'Worldstone Server Room': b('crystal', 'towers', 'racks', 'spores'),
  "The Ancients' Datacenter": b('void', 'towers', 'racks', 'embers'),
  'Monorepo Map': b('meadow', 'mesas', 'crowns'),
  'Microservice Maze': b('city', 'towers', 'ruins'),
  'Serverless Void': b('void', 'domes', 'crystals', 'spores'),
  'Kubernetes Cluster': b('crystal', 'domes', 'crystals'),
  'Legacy Vault': b('cavern', 'mesas', 'ruins'),
  'Data Lake': b('coast', 'peaks', 'reeds', 'rain'),
  'Spaghetti Labyrinth': b('autumn', 'domes', 'mushrooms', 'leaves'),
  'Sprint Graveyard': b('graveyard', 'domes', 'graves', 'fog'),
  'Hackathon Ruins': b('ruins', 'mesas', 'ruins', 'embers'),
  'Staging Mirror': b('crystal', 'spires', 'crystals'),
  'Incident Bridge': b('volcanic', 'spires', 'ruins', 'embers'),
  "The Shaper's Repo": b('void', 'pyramids', 'crystals', 'fireflies'),
  'Feature Flag Forest': b('jungle', 'peaks', 'pines', 'fireflies'),
  'Webhook Wastes': b('desert', 'mesas', 'graves', 'sand'),
  'Regex Catacombs': b('cavern', 'spires', 'graves', 'fog'),
  'Dotfile Barrens': b('graveyard', 'dunes', 'cacti', 'sand'),
  'The Changelog Archive': b('ruins', 'towers', 'ruins', 'leaves'),
  'Cron Clocktower': b('city', 'spires', 'ruins', 'rain'),
  'Sandbox Dunes': b('desert', 'dunes', 'cacti'),
  'Firewall Ramparts': b('volcanic', 'mesas', 'ruins', 'embers'),
  'Shard Abyss': b('crystal', 'spires', 'crystals', 'aurora'),
  'The Retro Board': b('autumn', 'domes', 'mushrooms', 'leaves'),
  'Release Train Yard': b('city', 'mesas', 'racks'),
  'Rollback Rapids': b('coast', 'peaks', 'pines', 'rain'),
  'Frozen Branch': b('snow', 'peaks', 'pines', 'snow'),
  'Tech Debt Bog': b('swamp', 'domes', 'reeds', 'fog'),
  'Zombie Process Crypt': b('graveyard', 'towers', 'graves', 'spores'),
  'Memory Leak Caldera': b('volcanic', 'peaks', 'crystals', 'embers'),
  'Dependency Jungle': b('jungle', 'mesas', 'mushrooms', 'rain'),
  'Cold Storage Tundra': b('snow', 'dunes', 'crystals', 'aurora'),
  'Race Condition Raceway': b('desert', 'pyramids', 'ruins', 'sand'),
  'Deadlock Glacier': b('snow', 'spires', 'crystals', 'snow'),
  'Off-by-One Orchard': b('autumn', 'peaks', 'crowns', 'leaves'),
  'Null Pointer Swamp': b('swamp', 'pyramids', 'mushrooms', 'fireflies'),
  'Throttled Highlands': b('meadow', 'peaks', 'pines', 'rain'),
  'Hotfix Hellmouth': b('volcanic', 'towers', 'graves', 'embers'),
}
const FARS: Far[] = ['peaks', 'dunes', 'mesas', 'spires', 'domes', 'towers', 'pyramids']
const MIDS: Mid[] = ['crowns', 'pines', 'cacti', 'crystals', 'ruins', 'racks', 'mushrooms', 'graves', 'reeds']
const WXS: (Weather | undefined)[] = [undefined, 'rain', 'snow', 'embers', 'fog', 'fireflies', 'spores', 'leaves', 'sand', 'aurora']
export const biomeOf = (place: string): Biome => {
  const hit = BIOMES[place]
  if (hit) return hit
  let h = 2166136261
  for (let i = 0; i < place.length; i++) h = Math.imul(h ^ place.charCodeAt(i), 16777619) >>> 0
  const pals = Object.keys(PALS) as PalKey[]
  return { pal: pals[h % pals.length]!, far: FARS[(h >>> 4) % FARS.length]!, mid: MIDS[(h >>> 8) % MIDS.length]!, ...(WXS[(h >>> 12) % WXS.length] ? { wx: WXS[(h >>> 12) % WXS.length]! } : {}) }
}

/** Dusk keeps the biome's ground and warms the sky; night dims everything and adds stars and the moon. */
export const palAt = (pal: Pal, time: 'day' | 'dusk' | 'night'): Pal => {
  if (time === 'day') return pal
  if (time === 'dusk') return pal.indoor ? pal : { ...pal, sky: [[0, P.violet], [8, P.mulberry], [16, P.pink], [23, P.salmon], [29, P.apricot]], cloud: [P.mulberry, P.salmon, P.apricot] }
  const d = <T extends string[]>(x: T) => x.map(nightOf) as T
  return {
    ...pal, sky: pal.indoor ? pal.sky.map(([y, c]) => [y, nightOf(c)] as [number, string]) : [[0, P.ink], [8, P.navy], [18, P.indigo], [28, P.blue]],
    cloud: [P.night, P.dusk, P.mauve], far: d(pal.far), mid: d(pal.mid), grass: d(pal.grass), path: d(pal.path), near: d(pal.near), trunk: d(pal.trunk), canopy: d(pal.canopy),
    flower: pal.flower, stars: !pal.indoor,
  }
}
/** The color under a cast shadow: one step down the palette's own ramps. */
export const shadeOf = (pal: Pal) => {
  const m = new Map<string, string>([[pal.grass[1], pal.grass[0]], [pal.grass[0], pal.near[0]], [pal.path[2], pal.path[1]], [pal.path[1], pal.path[0]], [pal.near[1], pal.near[0]]])
  return (c: string) => m.get(c) ?? (c === pal.path[0] || c === pal.near[0] ? darkOf(c) : c)
}

/** The far skyline's top row at each column. */
export const farTops = (far: Far, AW: number, base: number, seed: number): number[] => {
  const r = rng(seed), tops = new Array<number>(AW).fill(99)
  const span = (x0: number, x1: number, f: (x: number) => number) => { for (let x = Math.max(0, Math.floor(x0)); x < Math.min(AW, Math.ceil(x1)); x++) tops[x] = Math.min(tops[x]!, Math.round(f(x))) }
  if (far === 'dunes') for (let x = 0; x < AW; x++) tops[x] = Math.round(base + 6 + Math.sin(x * 0.035 + seed) * 4 + Math.sin(x * 0.09 + seed * 2) * 2)
  else if (far === 'mesas') for (let x = -10; x < AW;) { const w = 24 + r() * 40, top = base + r() * 8, s = 4 + r() * 4; span(x, x + w, xx => Math.max(top, base + 14 - Math.min(xx - x, x + w - xx) * (14 / s))); x += w + r() * 20 }
  else if (far === 'spires') for (let x = -4; x < AW; x += 7 + r() * 16) { const h = 10 + r() * 16, k = 2.2 + r() * 1.5, x0 = x; span(x0 - 8, x0 + 8, xx => base + 18 - h + Math.abs(xx - x0) * k) }
  else if (far === 'domes') for (let x = -20; x < AW + 20; x += 26 + r() * 30) { const rad = 14 + r() * 14, x0 = x; span(x0 - rad, x0 + rad, xx => base + 18 - Math.sqrt(Math.max(0, rad * rad - (xx - x0) ** 2)) * 0.8) }
  else if (far === 'towers') for (let x = -4; x < AW;) { const w = 6 + r() * 12, h = 6 + r() * 18; span(x, x + w, () => base + 18 - h); x += w + 1 + r() * 4 }
  else if (far === 'pyramids') for (let x = 10 + r() * 30; x < AW + 30; x += 50 + r() * 50) { const h = 12 + r() * 10, x0 = x; span(x0 - h, x0 + h, xx => base + 18 - h + Math.abs(xx - x0)) }
  else {
    const peaks: [number, number, number][] = []
    for (let x = -20; x < AW + 40; x += 34 + Math.floor(r() * 30)) peaks.push([x, base + Math.floor(r() * 10), 0.55 + r() * 0.25])
    for (let x = 0; x < AW; x++) tops[x] = Math.round(Math.min(...peaks.map(([x0, y0, k]) => y0 + Math.abs(x - x0) * k)))
  }
  return tops.map(t => Math.min(t, base + 20))
}

/** Paints the far skyline: lit on the side facing the light, windows on towers. */
export const paintFar = (px: Px, far: Far, pal: Pal, AW: number, AH: number, base: number, seed: number) => {
  const tops = farTops(far, AW, base, seed)
  // a face is lit while the skyline climbs to the right; flat runs keep the last face, so smooth shapes do not stripe
  let face = false
  for (let x = 0; x < AW; x++) {
    const top = tops[x]!, a = tops[x - 2] ?? top, c = tops[x + 2] ?? top
    if (a > c) face = true
    else if (a < c) face = false
    const lit = far === 'towers' ? (tops[x - 1] ?? 99) > top : face
    for (let y = Math.max(top, 0); y < AH; y++) px.set(x, y, lit && y < top + 14 ? pal.far[1] : pal.far[0])
  }
  if (far === 'towers') { const r = rng(seed + 1); for (let i = 0; i < AW / 5; i++) { const x = Math.floor(r() * AW), y = tops[x]! + 2 + Math.floor(r() * 10); if (y < base + 18 && px.get(x, y) === pal.far[0]) px.set(x, y, pal.flower[0]) } }
}

/** Paints the mid layer along the horizon at `y0` (the row the meadow starts), seeded so each place keeps its own layout. */
export const paintMid = (px: Px, mid: Mid, pal: Pal, AW: number, y0: number, seed: number, avoid = 0) => {
  const r = rng(seed * 7 + 3), [d, m, l] = pal.mid
  const put = (x: number, y: number, c: string) => { if (x >= avoid && x >= 0 && x < AW) px.set(x, y, c) }
  const rect = (x: number, y: number, w: number, h: number, c: string) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c) }
  for (let x = -6; x < AW + 6;) {
    const gx = Math.round(x)
    if (mid === 'pines') { const h = 9 + Math.floor(r() * 9); for (let j = 0; j < h; j++) { const half = Math.floor(j / 2.2); for (let i = -half; i <= half; i++) put(gx + i, y0 - h + j, i < 0 ? l : j > h - 3 ? d : m) } rect(gx, y0, 1, 1, pal.trunk[0]); x += 5 + r() * 6 }
    else if (mid === 'cacti') { const h = 6 + Math.floor(r() * 7); rect(gx, y0 - h, 2, h, m); rect(gx, y0 - h, 1, h, l); if (r() < 0.8) { const ay = y0 - h + 2 + Math.floor(r() * 3); rect(gx - 2, ay, 2, 1, m); rect(gx - 2, ay - 3, 1, 3, l) } if (r() < 0.6) { const ay = y0 - h + 3 + Math.floor(r() * 2); rect(gx + 2, ay, 2, 1, m); rect(gx + 3, ay - 2, 1, 2, m) } x += 14 + r() * 26 }
    else if (mid === 'crystals') { const h = 6 + Math.floor(r() * 12), w = 2 + Math.floor(r() * 2); for (let j = 0; j < h; j++) { const half = Math.min(w, Math.floor((h - j) / 2), j + 1); for (let i = -half; i < half; i++) put(gx + i, y0 - h + j, i < 0 ? l : m) } put(gx - 1, y0 - h + 1, P.white); x += 6 + r() * 14 }
    else if (mid === 'ruins') { const h = 5 + Math.floor(r() * 12); rect(gx, y0 - h, 3, h, m); rect(gx, y0 - h, 1, h, l); if (r() < 0.6) rect(gx - 1, y0 - h - 1, 5, 1, l); else put(gx + 2, y0 - h - 1, m); if (r() < 0.35) { rect(gx + 3, y0 - h, 7, 1, m); rect(gx + 9, y0 - h, 3, h, m) ; x += 10 } x += 9 + r() * 16 }
    else if (mid === 'racks') { const h = 8 + Math.floor(r() * 7), w = 6 + Math.floor(r() * 4); rect(gx, y0 - h, w, h, d); rect(gx, y0 - h, w, 1, m); for (let j = 2; j < h - 1; j += 2) { rect(gx + 1, y0 - h + j, w - 2, 1, m); put(gx + w - 2, y0 - h + j, r() < 0.7 ? l : P.hot) } x += w + 2 + r() * 10 }
    else if (mid === 'mushrooms') { const h = 4 + Math.floor(r() * 8), cw = 3 + Math.floor(h / 2); rect(gx, y0 - h, 2, h, l); for (let j = 0; j < 3; j++) { const half = cw - (2 - j); rect(gx + 1 - half, y0 - h - 3 + j, half * 2, 1, j === 0 ? pal.flower[0] : j === 2 ? d : pal.flower[1]) } put(gx - 1, y0 - h - 2, pal.flower[0]); put(gx + 2, y0 - h - 1, pal.flower[0]); x += 8 + r() * 14 }
    else if (mid === 'graves') { if (r() < 0.3) { rect(gx + 1, y0 - 9, 1, 9, m); rect(gx - 1, y0 - 7, 5, 1, m) } else { const h = 4 + Math.floor(r() * 4); rect(gx, y0 - h, 4, h, m); rect(gx, y0 - h, 1, h, l); rect(gx + 1, y0 - h - 1, 2, 1, m) } x += 7 + r() * 12 }
    else if (mid === 'reeds') { const n = 3 + Math.floor(r() * 5); for (let i = 0; i < n; i++) { const h = 3 + Math.floor(r() * 7); rect(gx + i * 2, y0 - h, 1, h, i % 2 ? m : l); if (r() < 0.3) put(gx + i * 2, y0 - h - 1, pal.trunk[0]) } x += n * 2 + 6 + r() * 16 }
    else x += AW
  }
}

/** Near ground detail: small stamps on the meadow row, picked per palette. Letters: a and b the palette's flower pair, l the mid layer's lit color, d its dark, w white, k the near ground's dark. */
const STAMPS = {
  bone: ['w...w', '.www.', 'w...w'], shell: ['.aa.', 'abba', 'bbbb'], shard: ['.a.', 'aba', 'bbb'], cable: ['k..k...', '.kk.kak'],
  crack: ['.aa..a.', 'a..ab.a'], mound: ['.ww.', 'wwww'], puddle: ['.bbbb.', 'bbabbb'], leaves: ['.ab.', 'abba'], rubble: ['..l', '.ld', 'ldd'],
  shroom: ['aba', '.l.'], sprout: ['a.a', '.l.'], tile: ['llll', 'dddd'],
} satisfies Record<string, string[]>
const NEAR: Record<PalKey, (keyof typeof STAMPS)[]> = {
  meadow: ['sprout', 'rubble'], autumn: ['leaves', 'shroom'], desert: ['bone', 'rubble'], swamp: ['puddle', 'shroom'], jungle: ['sprout', 'shroom'],
  snow: ['mound', 'shard'], volcanic: ['crack', 'rubble'], crystal: ['shard', 'shard'], cavern: ['shroom', 'rubble'], city: ['cable', 'tile'],
  graveyard: ['bone', 'rubble'], coast: ['shell', 'puddle'], void: ['shard', 'crack'], ruins: ['tile', 'rubble'],
}
export const paintNear = (px: Px, key: PalKey, pal: Pal, AW: number, dy: number, seed: number) => {
  const keys = { a: pal.flower[0], b: pal.flower[1], l: pal.mid[2], d: pal.mid[0], w: P.cloud, k: pal.near[0] }
  const r = rng(seed * 13 + 5), list = NEAR[key]
  for (const x0 of [64, 112, 196, 262, 318, 410, 492, 574, 626, 700]) {
    if (x0 > AW - 8) break
    const rows = STAMPS[list[Math.floor(r() * list.length)]!], x = x0 + Math.floor(r() * 10), y = 50 + dy + Math.floor(r() * 3)
    rows.forEach((row, j) => [...row].forEach((ch, i) => { const c = keys[ch as keyof typeof keys]; if (c) px.set(x + i, y + j, c) }))
  }
}
