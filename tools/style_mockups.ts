// Whole-game style exploration (task-22, hero swap task-23): seven complete frames (fight and boss) drawn as the SVG the mod would emit,
// same composition and content in every style, then shot to PNG with headless Microsoft Edge. Not imported by the game.
//
//   npx --no-install tsx tools/style_mockups.ts            all directions, PNGs and SVGs into docs/art/styles
//   npx --no-install tsx tools/style_mockups.ts D3 D4      only those directions (D1 and D2 are rejected history: named on purpose or left alone)
//   npx --no-install tsx tools/style_mockups.ts --perf     rasterize cost per direction (one Edge page, one process)
//   npx --no-install tsx tools/style_mockups.ts --measure  head and body height of the hero per direction (DOM boxes in Edge)
//   Default run (task-23): the open directions D3 to D7, their PNGs, all-fights, all-fights-1x and hero-closeups.
//
// Needs Edge (EDGE=<path to msedge.exe> to override). Animations are paused at a fixed time so reruns match.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, 'docs', 'art', 'styles')
export const W = 960
export const H = 150
/** The line the feet stand on in every direction, so the compositions line up. */
export const GY = 112

/** The content every direction draws, so the comparison is about style and nothing else. */
export const C = {
  act: 'Act II · Peer Dependency Palace',
  who: 'Lv 14 Refactor Paladin',
  task: 'Debugging 5 Hardcoded Phantom Packages',
  foe: 'Hardcoded Phantom Package',
  rare: 'Fast Vampiric Hardcoded Phantom Package',
  boss: 'Mephisto the Monorepo',
  bossTask: 'Fighting Mephisto the Monorepo',
  loot: 'Signet of Signing',
  hit: ['18', '17', '142!'],
  xp: 0.63,
  heroHp: 0.62,
  foeHp: 0.56,
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
export const r1 = (n: number) => Math.round(n * 10) / 10
export const svgOf = (body: string, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"${extra}>${body}</svg>`

// ---- pixel grids: shaded ellipses and boxes, an outline pass, runs merged into one path per color ----
export type Grid = { w: number; h: number; c: (string | null)[] }
export const grid = (w: number, h: number): Grid => ({ w, h, c: new Array(w * h).fill(null) })
export const put = (g: Grid, x: number, y: number, c: string | null) => { if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.c[y * g.w + x] = c }
const at = (g: Grid, x: number, y: number) => (x >= 0 && y >= 0 && x < g.w && y < g.h ? g.c[y * g.w + x] ?? null : null)
/** A sphere-shaded ellipse: ramp runs dark to light, the light comes from the upper left. */
export const ell = (g: Grid, cx: number, cy: number, rx: number, ry: number, ramp: string[], light = [-0.45, -0.6, 0.66]) => {
  const n = Math.hypot(...light)
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy
    if (d > 1) continue
    const z = Math.sqrt(1 - d)
    const v = (dx * light[0]! + dy * light[1]! + z * light[2]!) / n
    const i = v < -0.05 ? 0 : v < 0.3 ? 1 : v < 0.68 ? 2 : 3
    put(g, x, y, ramp[Math.min(ramp.length - 1, ramp.length === 3 ? Math.max(0, i - 1) : i)]!)
  }
}
/** A box with a lit top and left edge and a dark bottom and right edge. */
export const box = (g: Grid, x0: number, y0: number, w: number, h: number, ramp: string[]) => {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const lit = y === y0 || x === x0, dark = y === y0 + h - 1 || x === x0 + w - 1
    put(g, x, y, lit && !dark ? ramp[3]! : dark && !lit ? ramp[0]! : ramp[(ramp.length > 2 ? 2 : 1) - (y > y0 + h * 0.6 ? 1 : 0)]!)
  }
}
export const line = (g: Grid, x0: number, y0: number, x1: number, y1: number, c: string, t = 1) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= n; i++) { const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n); for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) put(g, x + a, y + b, c) }
}
export const outline = (g: Grid, c: string): Grid => {
  const o = grid(g.w + 2, g.h + 2)
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const v = at(g, x, y); if (v) put(o, x + 1, y + 1, v) }
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (!at(o, x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => at(o, x + a!, y + b!) && at(o, x + a!, y + b!) !== c)) put(o, x, y, c)
  return o
}
/** One path per color, runs merged across a row, then across rows of the same span. */
export const draw = (g: Grid, x: number, y: number, s: number, opts: { flip?: boolean; opacity?: number } = {}): string => {
  const byColor = new Map<string, string[]>()
  const rows: Map<string, { x: number; y: number; w: number; h: number }[]> = new Map()
  for (let j = 0; j < g.h; j++) {
    let i = 0
    while (i < g.w) {
      const v = g.c[j * g.w + i] ?? null
      if (!v) { i++; continue }
      let k = i
      while (k + 1 < g.w && g.c[j * g.w + k + 1] === v) k++
      const list = rows.get(v) ?? []
      const prev = list.find(r => r.x === i && r.w === k - i + 1 && r.y + r.h === j)
      if (prev) prev.h++; else list.push({ x: i, y: j, w: k - i + 1, h: 1 })
      rows.set(v, list)
      i = k + 1
    }
  }
  for (const [c, list] of rows) byColor.set(c, list.map(r => `M${opts.flip ? g.w - r.x - r.w : r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`))
  const paths = [...byColor].map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('')
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"${opts.opacity != null ? ` opacity="${opts.opacity}"` : ''} shape-rendering="crispEdges">${paths}</g>`
}

// ---- directions register themselves below ----
export type Frame = (boss: boolean) => string
export type Direction = { id: string; name: string; font: string; frame: Frame }
export const DIRECTIONS: Direction[] = []

// ======================= shared drawing helpers =======================
export const SERIF = "Georgia,'Times New Roman',serif"
export const MONO = 'Consolas,ui-monospace,Menlo,monospace'
export const label = (s: string, x: number, y: number, size: number, fill: string, o: { anchor?: string; font?: string; weight?: string; stroke?: string; sw?: number; ls?: number; style?: string } = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${fill}" font-family="${o.font ?? MONO}" font-weight="${o.weight ?? 'normal'}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 2}" stroke-linejoin="round" paint-order="stroke"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.style ? ` ${o.style}` : ''}>${esc(s)}</text>`

// ======================= D1. Dark ARPG pixel =======================
const D1 = {
  ink: '#120a12',
  red: ['#4a1620', '#962f33', '#dd5a3a', '#ff9a62'],
  steel: ['#252b42', '#4d5a7a', '#8c9bbd', '#d6e2f5'],
  gold: ['#5a3b0f', '#a8741a', '#e6b23a', '#fff0a0'],
  card: ['#34241d', '#6a4d36', '#97714b', '#c49a68'],
  ghost: ['#3d3270', '#5e4fa0', '#8d7ad2', '#c3b6ee'],
}
const d1Crab = (): Grid => {
  const g = grid(26, 19)
  const R = D1.red
  for (const [x0, y0, x1, y1] of [[6, 13, 3, 17], [9, 14, 7, 18], [12, 15, 11, 18], [20, 13, 23, 17], [17, 14, 19, 18], [14, 15, 15, 18]] as const) line(g, x0, y0, x1, y1, R[0]!)
  ell(g, 13, 11, 8.2, 5, R)
  line(g, 6, 10, 4, 8, R[1]!, 2); line(g, 20, 10, 22, 8, R[1]!, 2)
  ell(g, 3.4, 6.2, 3.2, 2.8, R); ell(g, 22.6, 6.8, 3.2, 2.8, R)
  put(g, 3, 4, null); put(g, 4, 4, null); put(g, 2, 3, null)
  line(g, 10, 7, 10, 4, R[1]!); line(g, 16, 7, 16, 4, R[1]!)
  ell(g, 13, 7, 3.4, 2.4, D1.steel)
  put(g, 13, 4, D1.gold[2]!); put(g, 13, 5, D1.gold[2]!); put(g, 12, 6, D1.gold[1]!); put(g, 14, 6, D1.gold[1]!)
  ell(g, 10, 3, 2, 2, ['#cfd2e0', '#e8eaf2', '#f6f7fb']); ell(g, 16, 3, 2, 2, ['#cfd2e0', '#e8eaf2', '#f6f7fb'])
  put(g, 11, 3, '#1a1230'); put(g, 11, 4, '#1a1230'); put(g, 17, 3, '#1a1230'); put(g, 17, 4, '#1a1230')
  ell(g, 13, 12, 4.2, 2.8, D1.steel)
  put(g, 13, 10, D1.gold[2]!); put(g, 13, 11, D1.gold[2]!); put(g, 13, 12, D1.gold[2]!); put(g, 12, 11, D1.gold[2]!); put(g, 14, 11, D1.gold[2]!)
  return outline(g, D1.ink)
}
const d1Pkg = (rare = false, boss = false): Grid => {
  const g = grid(boss ? 30 : 16, boss ? 24 : 18)
  const card = rare ? ['#5a4310', '#a8841c', '#e6c44a', '#fff2a8'] : D1.card
  const eye = rare ? '#ff5a4a' : '#7dffb0'
  if (!boss) {
    ell(g, 8, 13, 5, 3, D1.ghost); ell(g, 8, 15.4, 3.2, 2.2, D1.ghost); ell(g, 5.6, 16.8, 1.6, 1.2, D1.ghost); ell(g, 10.6, 16.9, 1.4, 1, D1.ghost); put(g, 3, 14, null)
    box(g, 2, 2, 12, 10, card)
    for (let y = 2; y < 12; y++) { put(g, 7, y, '#e0c898'); put(g, 8, y, '#c8a874') }
    box(g, 10, 8, 3, 3, ['#8a8a8a', '#bdbdbd', '#e6e6e6', '#ffffff'])
    put(g, 1, 1, card[2]!); put(g, 0, 0, card[3]!); put(g, 14, 1, card[2]!); put(g, 15, 0, card[3]!)
    for (const x of [4, 10]) { put(g, x, 5, eye); put(g, x + 1, 5, eye); put(g, x, 6, eye); put(g, x + 1, 6, eye) }
    put(g, 3, 4, '#14100e'); put(g, 4, 4, '#14100e'); put(g, 11, 4, '#14100e'); put(g, 12, 4, '#14100e')
    for (let x = 4; x <= 11; x++) put(g, x, 9, '#14100e')
    for (const x of [5, 7, 9]) put(g, x, 9, '#e8e0c8')
    if (rare) { for (const x of [4, 6, 8, 10]) put(g, x, 0, D1.gold[3]!); for (let x = 4; x <= 10; x++) put(g, x, 1, D1.gold[2]!); put(g, 6, 1, '#ff5a8a'); put(g, 8, 1, '#5ad1ff') }
  } else {
    ell(g, 15, 20, 12, 3.6, D1.ghost); ell(g, 15, 22.2, 7, 1.8, D1.ghost); put(g, 4, 21, null); put(g, 25, 22, null)
    box(g, 3, 9, 24, 9, card)
    for (let y = 9; y < 18; y++) { put(g, 14, y, '#e0c898'); put(g, 15, y, '#c8a874') }
    for (let x = 3; x < 27; x += 4) { put(g, x, 16, '#14100e'); put(g, x + 1, 17, '#14100e') }
    box(g, 9, 3, 12, 7, card)
    for (let y = 3; y < 10; y++) { put(g, 14, y, '#e0c898'); put(g, 15, y, '#c8a874') }
    line(g, 9, 4, 6, 2, '#e8e0c8', 2); line(g, 6, 2, 7, 0, '#e8e0c8'); line(g, 21, 4, 24, 2, '#e8e0c8', 2); line(g, 24, 2, 23, 0, '#e8e0c8')
    for (const x of [11, 17]) { put(g, x, 5, '#ff4a4a'); put(g, x + 1, 5, '#ff4a4a'); put(g, x, 6, '#ffb0a0'); put(g, x + 1, 6, '#ff4a4a') }
    for (let x = 11; x <= 19; x++) put(g, x, 8, '#14100e')
    for (const x of [12, 14, 16, 18]) put(g, x, 8, '#e8e0c8')
    line(g, 3, 12, 0, 16, D1.card[2]!, 2); line(g, 27, 12, 29, 16, D1.card[2]!, 2)
    for (const [x, y] of [[0, 16], [29, 16]] as const) { ell(g, x, y, 1.6, 1.6, D1.card) }
  }
  return outline(g, D1.ink)
}
const d1Frame = (boss: boolean): string => {
  const o: string[] = []
  o.push(`<defs><linearGradient id="d1b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06050e"/><stop offset="1" stop-color="#1d1533"/></linearGradient>
<radialGradient id="d1p"><stop offset="0" stop-color="#ffb347" stop-opacity=".6"/><stop offset=".5" stop-color="#ff8a2a" stop-opacity=".22"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
<radialGradient id="d1c"><stop offset="0" stop-color="#7fd0ff" stop-opacity=".5"/><stop offset="1" stop-color="#7fd0ff" stop-opacity="0"/></radialGradient>
<linearGradient id="d1l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe27a" stop-opacity=".85"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></linearGradient>
<pattern id="d1k" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#0c0919"/><rect x="1" y="1" width="18" height="8" fill="#141029"/><rect x="21" y="1" width="18" height="8" fill="#120e25"/><rect x="-9" y="11" width="18" height="8" fill="#120e25"/><rect x="11" y="11" width="18" height="8" fill="#151129"/><rect x="31" y="11" width="18" height="8" fill="#141029"/></pattern>
<pattern id="d1s" width="72" height="26" patternUnits="userSpaceOnUse"><rect width="72" height="26" fill="#150f26"/><rect x="1" y="1" width="34" height="11" fill="#1b1431"/><rect x="37" y="1" width="34" height="11" fill="#191330"/><rect x="-17" y="14" width="34" height="11" fill="#19122e"/><rect x="19" y="14" width="34" height="11" fill="#1c1533"/><rect x="55" y="14" width="34" height="11" fill="#1a1330"/></pattern>
<style>.d1fl{transform-box:fill-box;transform-origin:50% 100%;animation:d1fl .5s steps(1) infinite}@keyframes d1fl{50%{transform:translateY(-1px) scaleX(.9)}}
.d1sw{animation:d1sw .84s ease-in-out infinite}@keyframes d1sw{0%,100%{transform:rotate(-38deg)}50%{transform:rotate(62deg)}}
.d1tw{animation:d1tw 1s steps(1) infinite}@keyframes d1tw{50%{opacity:.25}}
.d1fo{animation:d1fo 1.2s ease-in-out infinite}@keyframes d1fo{50%{transform:translateY(-3px)}}</style></defs>`)
  o.push(`<rect width="${W}" height="${H}" fill="url(#d1b)"/><rect y="0" width="${W}" height="${GY}" fill="url(#d1k)" opacity=".9"/>`)
  // arches and pillars
  for (const x of [130, 470, 810]) o.push(`<path d="M${x - 60} ${GY} V52 Q${x - 60} 16 ${x} 16 Q${x + 60} 16 ${x + 60} 52 V${GY}Z" fill="#05040b" opacity=".75"/>`)
  for (const x of [38, 340, 690, 930]) o.push(`<rect x="${x - 15}" y="0" width="30" height="${GY}" fill="#1c1630"/><rect x="${x - 15}" y="0" width="6" height="${GY}" fill="#2b2246"/><rect x="${x + 9}" y="0" width="6" height="${GY}" fill="#0e0a1c"/><rect x="${x - 19}" y="${GY - 10}" width="38" height="10" fill="#241c3c"/><rect x="${x - 19}" y="0" width="38" height="8" fill="#241c3c"/>`)
  // torch light pools on the wall and the floor (the radial gradients are the one soft effect here)
  for (const x of [340, 690, 930]) o.push(`<ellipse cx="${x}" cy="46" rx="130" ry="80" fill="url(#d1p)" opacity=".8"/>`)
  o.push(`<rect y="${GY}" width="${W}" height="${H - GY}" fill="url(#d1s)"/><rect y="${GY}" width="${W}" height="2" fill="#3a2d5c"/><rect y="${GY + 2}" width="${W}" height="2" fill="#0a0716" opacity=".6"/>`)
  for (const x of [340, 690, 930]) o.push(`<ellipse cx="${x}" cy="${GY + 14}" rx="170" ry="22" fill="url(#d1p)"/>`)
  // torches
  const flame = (x: number) => { const f = grid(6, 9); ell(f, 3, 6, 2.6, 3, ['#ff5a1a', '#ff8a2a', '#ffc24a', '#fff2a0']); line(f, 3, 0, 3, 2, '#ff8a2a'); put(f, 2, 2, '#ff5a1a'); put(f, 4, 3, '#ff5a1a'); return `<g class="d1fl">${draw(f, x - 9, 22, 3)}</g><rect x="${x - 4}" y="46" width="8" height="14" fill="#3a2a1a"/><rect x="${x - 7}" y="42" width="14" height="5" fill="#4a3a2a"/>` }
  for (const x of [340, 690, 930]) o.push(flame(x))
  // the hero's cool light
  const hx = 150
  o.push(`<ellipse cx="${hx + 8}" cy="${GY - 24}" rx="120" ry="60" fill="url(#d1c)" opacity=".7"/>`)
  const shadow = (cx: number, y: number, rx: number) => `<ellipse cx="${r1(cx)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(rx * 0.18)}" fill="#000" opacity=".55"/>`
  const foot = GY + 6
  // the loot: a beam, the ring, a glint, its name
  const lx = 408
  o.push(`<rect x="${lx - 9}" y="${GY - 58}" width="18" height="64" fill="url(#d1l)" opacity=".55"/><ellipse cx="${lx}" cy="${foot - 2}" rx="26" ry="6" fill="#ffd23f" opacity=".3"/>`)
  const ring = grid(9, 9); ell(ring, 4.5, 4.5, 4, 4, D1.gold); ell(ring, 4.5, 4.8, 2, 2, ['#1a1230', '#1a1230', '#1a1230']); put(ring, 4, 0, '#6fe0ff'); put(ring, 5, 0, '#bff4ff')
  o.push(`<g class="d1fo">${draw(outline(ring, D1.ink), lx - 15, foot - 36, 3)}</g>`)
  const star = (x: number, y: number, s: number) => `<g class="d1tw"><path d="M${x} ${y - 9 * s}l${1.6 * s} ${7.4 * s} ${7.4 * s} ${1.6 * s} ${-7.4 * s} ${1.6 * s} ${-1.6 * s} ${7.4 * s} ${-1.6 * s} ${-7.4 * s} ${-7.4 * s} ${-1.6 * s} ${7.4 * s} ${-1.6 * s}z" fill="#fff6c0"/></g>`
  o.push(star(lx + 12, foot - 38, 1.1), star(lx - 14, foot - 22, 0.7))
  o.push(label(C.loot, lx, foot - 54, 11, '#f2e05a', { anchor: 'middle', font: SERIF, stroke: '#000', sw: 3, weight: 'bold' }))
  // hero
  const crab = d1Crab()
  o.push(shadow(hx, foot, 40))
  const cx0 = hx - (crab.w * 3) / 2, cy0 = foot - crab.h * 3 + 3
  o.push(draw(crab, cx0, cy0, 3))
  // the hammer pivots at the right claw
  const px = cx0 + 23.5 * 3, py = cy0 + 8 * 3
  o.push(`<g transform="translate(${r1(px)} ${r1(py)})"><g class="d1sw"><rect x="-2" y="-34" width="4" height="36" fill="#6a4a2a"/><rect x="-2" y="-34" width="1.5" height="36" fill="#8a6a42"/><circle cx="0" cy="-40" r="19" fill="url(#d1c)"/><rect x="-11" y="-50" width="22" height="16" fill="#4d5a7a"/><rect x="-11" y="-50" width="22" height="4" fill="#d6e2f5"/><rect x="-11" y="-38" width="22" height="4" fill="#252b42"/><rect x="-7" y="-46" width="14" height="8" fill="#8fe0ff"/><rect x="-5" y="-45" width="4" height="3" fill="#fff"/></g></g>`)
  // the swing's arc and the hit sparks at the nearest foe
  const arc = (rr: number, op: number, w: number) => `<path d="M${r1(px + rr * Math.cos(-0.7))} ${r1(py + rr * Math.sin(-0.7))} A${rr} ${rr} 0 0 1 ${r1(px + rr * Math.cos(0.9))} ${r1(py + rr * Math.sin(0.9))}" fill="none" stroke="#bfeaff" stroke-width="${w}" stroke-linecap="square" opacity="${op}"/>`
  o.push(arc(52, 0.9, 3), arc(46, 0.5, 2), arc(58, 0.4, 2))
  // HUD: hero bar, top lines, task
  const bar = (x: number, y: number, w: number, hgt: number, f: number, col: string) => `<rect x="${x - 1}" y="${y - 1}" width="${w + 2}" height="${hgt + 2}" fill="#0a0612" stroke="#5a4a2a"/><rect x="${x}" y="${y}" width="${w * f}" height="${hgt}" fill="${col}"/><rect x="${x}" y="${y}" width="${w * f}" height="${hgt / 3}" fill="#fff" opacity=".25"/>`
  o.push(bar(hx - 34, 46, 68, 6, C.heroHp, '#3fb04a'))
  o.push(label(C.act, 12, 17, 13, '#c8a864', { font: SERIF, stroke: '#000', sw: 3, style: 'font-style="italic"' }))
  o.push(label(C.who, W - 12, 17, 13, '#e8dcc0', { anchor: 'end', font: SERIF, stroke: '#000', sw: 3 }))
  o.push(`<rect y="${H - 22}" width="${W}" height="22" fill="#000" opacity=".5"/>`)
  o.push(label(boss ? C.bossTask : C.task, 12, H - 8, 13, '#e8e0d0', { stroke: '#000', sw: 3 }))
  o.push(`<rect y="${H - 3}" width="${W}" height="3" fill="#0a0612"/><rect y="${H - 3}" width="${W * C.xp}" height="3" fill="#d4a02a"/>`)
  // foes
  const hurt = (x: number, y: number) => `<g><path d="M${x - 9} ${y}h18M${x} ${y - 9}v18M${x - 6} ${y - 6}l12 12M${x + 6} ${y - 6}l-12 12" stroke="#fff6c0" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="#fff"/></g>`
  if (!boss) {
    const normal = d1Pkg(), rare = d1Pkg(true)
    const xs = [545, 635, 725]
    xs.forEach((x, i) => {
      o.push(shadow(x, foot + (i % 2), 28))
      o.push(`<g class="d1fo" style="animation-delay:-${i * 0.3}s">${draw(normal, x - (normal.w * 3) / 2, foot + (i % 2) - normal.h * 3, 3)}</g>`)
      o.push(bar(x - 18, foot - normal.h * 3 - 8 + (i % 2), 36, 4, [0.56, 0.8, 0.35][i]!, '#b8322c'))
    })
    const rx = 850
    o.push(`<ellipse cx="${rx}" cy="${foot - 30}" rx="52" ry="46" fill="#ffd23f" opacity=".13"/>`, shadow(rx, foot, 44))
    o.push(`<g class="d1fo">${draw(rare, rx - (rare.w * 4) / 2, foot - rare.h * 4, 4)}</g>`)
    o.push(label(C.rare, W - 12, 31, 12, '#f2e05a', { anchor: 'end', font: SERIF, stroke: '#000', sw: 3, weight: 'bold' }))
    o.push(bar(W - 12 - 270, 35, 270, 7, C.foeHp, '#c0392b'))
    o.push(hurt(515, foot - 40), hurt(850 - 38, foot - 34))
    o.push(label(C.hit[0]!, 548, foot - 62, 17, '#fff', { anchor: 'middle', font: MONO, weight: 'bold', stroke: '#000', sw: 4 }), label(C.hit[1]!, 640, foot - 70, 14, '#d8d0c0', { anchor: 'middle', weight: 'bold', stroke: '#000', sw: 4 }), label(C.hit[2]!, 772, foot - 44, 26, '#ffd23f', { anchor: 'middle', weight: 'bold', stroke: '#000', sw: 5 }))
  } else {
    const b = d1Pkg(false, true)
    const bx = 750, s = 3
    o.push(`<ellipse cx="${bx}" cy="${foot - 36}" rx="100" ry="56" fill="#ff2a2a" opacity=".14"/>`, shadow(bx, foot, 78))
    o.push(`<g class="d1fo">${draw(b, bx - (b.w * s) / 2, foot - b.h * s, s)}</g>`)
    o.push(label(`Lv 18  ${C.boss}`, W - 12, 31, 13, '#ff6a5a', { anchor: 'end', font: SERIF, stroke: '#000', sw: 3, weight: 'bold' }))
    o.push(bar(W - 12 - 400, 35, 400, 8, C.foeHp, '#c0392b'))
    o.push(hurt(690, foot - 30))
    o.push(label(C.hit[0]!, 668, foot - 40, 17, '#fff', { anchor: 'middle', weight: 'bold', stroke: '#000', sw: 4 }), label(C.hit[2]!, 862, foot - 56, 28, '#ffd23f', { anchor: 'middle', weight: 'bold', stroke: '#000', sw: 5 }))
  }
  return svgOf(o.join(''))
}
DIRECTIONS.push({ id: 'D1', name: 'Dark ARPG pixel', font: 'Georgia, Consolas', frame: d1Frame })

// ======================= D2. Glowing silhouettes =======================
/** A glow without a filter: the same shape stroked three times, wide and faint to narrow and bright. */
const glow = (d: string, color: string, w = 2.4, fill = 'none', extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${w * 4}" opacity=".12" stroke-linejoin="round" ${extra}/><path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${w * 2}" opacity=".3" stroke-linejoin="round" ${extra}/><path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" ${extra}/>`
const D2K = '#07030c'
const PINCER = 'M0 13 C-12 10 -14 -4 -6 -14 C-4 -8 -2 -3 0 -1 C2 -3 4 -8 6 -14 C14 -4 12 10 0 13Z'
const d2Frame = (boss: boolean): string => {
  const o: string[] = []
  const rnd = rng(22)
  o.push(`<defs><linearGradient id="d2s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0a3a"/><stop offset=".3" stop-color="#5c1a7c"/><stop offset=".52" stop-color="#d02f7c"/><stop offset=".72" stop-color="#ff7a45"/><stop offset=".9" stop-color="#ffc45a"/><stop offset="1" stop-color="#fff2b8"/></linearGradient>
<radialGradient id="d2u"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffe27a" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
<radialGradient id="d2h"><stop offset="0" stop-color="#fff7c0" stop-opacity=".95"/><stop offset="1" stop-color="#fff7c0" stop-opacity="0"/></radialGradient>
<radialGradient id="d2r"><stop offset="0" stop-color="#ff2a4a" stop-opacity=".55"/><stop offset="1" stop-color="#ff2a4a" stop-opacity="0"/></radialGradient>
<g id="d2b"><path d="M-20 -48 L-14 -54 L14 -54 L20 -48 L20 -22 L-20 -22Z M-20 -48 L-31 -60 L-17 -53Z M20 -48 L31 -60 L17 -53Z M-18 -22 Q-21 -12 -12 -8 Q-10 -2 -4 0 Q0 -6 4 0 Q10 -2 12 -8 Q21 -12 18 -22Z"/></g>
<g id="d2e"><circle cx="-9" cy="-38" r="11" fill="url(#d2h)"/><circle cx="9" cy="-38" r="11" fill="url(#d2h)"/><ellipse cx="-9" cy="-38" rx="5" ry="3.2" transform="rotate(18 -9 -38)" fill="#fffbe0"/><ellipse cx="9" cy="-38" rx="5" ry="3.2" transform="rotate(-18 9 -38)" fill="#fffbe0"/><path d="M-13 -29 l3.4 4 3.3 -4 3.4 4 3.3 -4 3.4 4 3.3 -4 3.4 4 3.3 -4" fill="none" stroke="#fffbe0" stroke-width="1.6"/><rect x="-2.5" y="-54" width="5" height="32" fill="#1c0e2c"/></g>
<style>.d2sw{animation:d2sw .84s ease-in-out infinite}@keyframes d2sw{0%,100%{transform:rotate(-35deg)}50%{transform:rotate(62deg)}}
.d2fl{animation:d2fl 1.2s ease-in-out infinite}@keyframes d2fl{50%{transform:translateY(-3px)}}
.d2tw{transform-box:fill-box;transform-origin:50% 50%;animation:d2tw 1s ease-in-out infinite}@keyframes d2tw{50%{transform:scale(.7) rotate(20deg)}}</style></defs>`)
  o.push(`<rect width="${W}" height="${GY + 6}" fill="url(#d2s)"/>`)
  // sun, behind the pack, with a few streaks of cloud across it
  const sx = boss ? 760 : 740
  for (const [x, y, w, op] of [[40, 22, 260, 0.2], [380, 14, 330, 0.16], [700, 24, 240, 0.2], [210, 52, 200, 0.22], [560, 58, 260, 0.2], [20, 74, 150, 0.2], [880, 62, 120, 0.22]] as const) o.push(`<rect x="${x}" y="${y}" width="${w}" height="3.5" rx="1.8" fill="#ffd0e8" opacity="${op}"/>`)
  for (let i = 0; i < 14; i++) o.push(`<circle cx="${r1(rnd() * W)}" cy="${r1(rnd() * 44)}" r="${r1(0.5 + rnd())}" fill="#fff" opacity="${r1(0.4 + rnd() * 0.5)}"/>`)
  // layers of silhouette: far ridge, the palace, the near hill
  o.push(`<path d="M0 ${GY} L0 78 L60 62 L130 80 L210 56 L300 76 L380 66 L470 82 L560 60 L650 78 L760 64 L850 80 L930 58 L${W} 70 L${W} ${GY}Z" fill="#7a2a86" opacity=".55"/>`)
  const tower = (x: number, w: number, h: number, roof: number) => `<path d="M${x - w / 2} ${GY} V${GY - h} L${x} ${GY - h - roof} L${x + w / 2} ${GY - h} V${GY}Z" fill="#3b0f56"/>`
  o.push(`<g opacity=".85">${[[330, 18, 44, 22], [352, 26, 62, 30], [380, 16, 36, 18], [410, 22, 52, 24], [440, 14, 30, 14]].map(([x, w, h, r]) => tower(x!, w!, h!, r!)).join('')}<rect x="318" y="${GY - 30}" width="136" height="30" fill="#3b0f56"/></g>`)
  o.push(`<circle cx="${sx}" cy="${GY - 4}" r="98" fill="url(#d2u)"/><circle cx="${sx}" cy="${GY - 6}" r="40" fill="#fffbe6" opacity=".92"/>`)
  o.push(`<path d="M0 ${GY} V96 Q110 78 250 98 T470 106 T700 110 L${W} 110 V${GY}Z" fill="#2a0a40"/>`)
  // the ground is one black shape with grass and rocks on its edge
  let edge = `M0 ${GY + 4}`
  for (let x = 0; x < W; x += 9) edge += ` L${x + 3} ${GY + 4 - (rnd() < 0.35 ? 3 + rnd() * 6 : 1)} L${x + 9} ${GY + 4}`
  o.push(`<path d="${edge} V${H} H0Z" fill="${D2K}"/>`)
  o.push(`<rect y="${GY + 2}" width="${W}" height="1.5" fill="#ff9a8a" opacity=".5"/>`)
  const foot = GY + 3
  // loot: a black ring in a gold halo with a lens flare
  const lx = 410
  o.push(`<circle cx="${lx}" cy="${foot - 14}" r="34" fill="url(#d2h)"/><path d="M${lx} ${foot - 70} V${foot - 4}" stroke="#fffbe0" stroke-width="3" opacity=".5"/>`)
  o.push(glow(`M${lx - 9} ${foot - 12} a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M${lx - 4} ${foot - 12} a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0`, '#ffe14a', 1.6, D2K, 'fill-rule="evenodd"'))
  o.push(`<g class="d2tw"><path d="M${lx + 12} ${foot - 36} l2.4 8.6 8.6 2.4 -8.6 2.4 -2.4 8.6 -2.4 -8.6 -8.6 -2.4 8.6 -2.4z" fill="#fff"/></g><path d="M${lx - 30} ${foot - 22} H${lx + 30}" stroke="#fffbe0" stroke-width="1.5" opacity=".7"/>`)
  o.push(label(C.loot, lx, foot - 52, 11, '#fffbe0', { anchor: 'middle', font: SERIF, weight: 'bold', stroke: '#3a0a40', sw: 3.5 }))
  // hero: a black crab, a plume, a neon hammer
  const hx = 150
  const sil = `<g transform="translate(${hx} ${foot}) scale(1.2)" fill="${D2K}" stroke="${D2K}" stroke-linecap="round" stroke-linejoin="round">
<path d="M-12 -9 L-25 -1 L-29 4 M-7 -7 L-12 3 L-15 6 M7 -7 L12 3 L15 6 M12 -9 L25 -1 L29 4" fill="none" stroke-width="3"/>
<ellipse cx="0" cy="-18" rx="24" ry="14" stroke="none"/>
<path d="M-8 -28 V-41 M8 -28 V-41" fill="none" stroke-width="3"/><circle cx="-8" cy="-43" r="4.4" stroke="none"/><circle cx="8" cy="-43" r="4.4" stroke="none"/>
<ellipse cx="0" cy="-32" rx="9" ry="6" stroke="none"/><path d="M3 -37 Q17 -54 27 -40 Q16 -44 8 -32Z" stroke="none"/>
<path d="M-18 -24 L-33 -40" fill="none" stroke-width="5"/><path d="${PINCER}" transform="translate(-37 -49) rotate(-25) scale(1.35)" stroke="none"/>
<path d="M18 -24 L31 -34" fill="none" stroke-width="5"/><path d="${PINCER}" transform="translate(35 -43) rotate(30) scale(1.3)" stroke="none"/></g>`
  o.push(`<ellipse cx="${hx}" cy="${foot - 30}" rx="90" ry="46" fill="url(#d2u)" opacity=".35"/>`, sil)
  o.push(`<circle cx="${hx - 8.4}" cy="${foot - 52.8}" r="2" fill="#6ff0ff"/><circle cx="${hx + 10.8}" cy="${foot - 52.8}" r="2" fill="#6ff0ff"/>`)
  const px = hx + 35 * 1.2, py = foot - 43 * 1.2
  o.push(`<g transform="translate(${px} ${py})"><g class="d2sw"><path d="M0 8 V-36" stroke="${D2K}" stroke-width="3.4" stroke-linecap="round"/>${glow('M-11 -50 H11 V-34 H-11Z', '#35f0ff', 1.8, D2K)}<rect x="-6" y="-46" width="12" height="8" fill="#b6fbff"/><circle cx="0" cy="-42" r="22" fill="url(#d2h)" opacity=".55"/></g></g>`)
  const arc = (rr: number, c: string, w: number) => `<path d="M${r1(px + rr * Math.cos(-0.75))} ${r1(py + rr * Math.sin(-0.75))} A${rr} ${rr} 0 0 1 ${r1(px + rr * Math.cos(0.8))} ${r1(py + rr * Math.sin(0.8))}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`
  o.push(`<g opacity=".25">${arc(54, '#35f0ff', 9)}</g>${arc(54, '#fff', 2.4)}${arc(48, '#ff4adc', 2)}${arc(60, '#35f0ff', 1.6)}`)
  // HUD: neon bars and white type
  const bar = (x: number, y: number, w: number, hgt: number, f: number, c: string) => `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${hgt / 2}" fill="${D2K}" opacity=".75"/><rect x="${x}" y="${y}" width="${r1(w * f)}" height="${hgt}" rx="${hgt / 2}" fill="${c}"/><rect x="${x}" y="${y - 2}" width="${r1(w * f)}" height="${hgt + 4}" rx="${hgt / 2 + 2}" fill="${c}" opacity=".25"/>`
  o.push(bar(hx - 32, 36, 64, 5, C.heroHp, '#5af0a0'))
  o.push(label(C.act, 12, 17, 13, '#fff0f8', { font: SERIF, stroke: '#3a0a50', sw: 3.5, style: 'font-style="italic"' }), label(C.who, W - 12, 17, 13, '#fff0f8', { anchor: 'end', font: SERIF, stroke: '#3a0a50', sw: 3.5 }))
  o.push(label(boss ? C.bossTask : C.task, 12, H - 8, 13, '#ffe9f4', { stroke: D2K, sw: 3 }))
  o.push(`<rect y="${H - 3}" width="${W}" height="3" fill="#2a0a40"/><rect y="${H - 3}" width="${r1(W * C.xp)}" height="3" fill="#35f0ff"/>`)
  // foes
  const spark = (x: number, y: number, s = 1) => `<path d="M${x} ${y - 14 * s}L${x + 3 * s} ${y - 3 * s}L${x + 14 * s} ${y}L${x + 3 * s} ${y + 3 * s}L${x} ${y + 14 * s}L${x - 3 * s} ${y + 3 * s}L${x - 14 * s} ${y}L${x - 3 * s} ${y - 3 * s}Z" fill="#fff" stroke="#ff4adc" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="${12 * s}" fill="url(#d2h)"/>`
  const dmg = (t: string, x: number, y: number, size: number, c: string) => label(t, x, y, size, c, { anchor: 'middle', weight: 'bold', stroke: '#3a0a50', sw: size / 4 + 1.5 })
  if (!boss) {
    ;[[540, 1.15], [632, 1.15], [724, 1.15]].forEach(([x, s], i) => {
      o.push(`<g class="d2fl" style="animation-delay:-${i * 0.35}s"><g transform="translate(${x} ${foot + (i % 2)}) scale(${s})"><use href="#d2b" fill="${D2K}"/><use href="#d2e"/></g></g>`)
      o.push(bar(x! - 18, foot - 76 + (i % 2), 36, 3.5, [0.56, 0.8, 0.35][i]!, '#ff5a7a'))
    })
    const rx = 852, rs = 1.3
    o.push(`<circle cx="${rx}" cy="${foot - 38}" r="82" fill="url(#d2r)"/>`)
    o.push(`<g class="d2fl"><g transform="translate(${rx} ${foot}) scale(${rs})"><use href="#d2b" fill="none" stroke="#ff2a4a" stroke-width="7" opacity=".16" stroke-linejoin="round"/><use href="#d2b" fill="none" stroke="#ff2a4a" stroke-width="4" opacity=".35" stroke-linejoin="round"/><use href="#d2b" fill="${D2K}" stroke="#ff4a6a" stroke-width="1.6" stroke-linejoin="round"/><use href="#d2e"/></g></g>`)
    o.push(label(C.rare, W - 12, 31, 12, '#fff3a0', { anchor: 'end', font: SERIF, weight: 'bold', stroke: '#3a0a50', sw: 3.5 }), bar(W - 12 - 270, 35, 270, 6, C.foeHp, '#ff4a6a'))
    o.push(spark(512, foot - 36), spark(rx - 40, foot - 50, 0.8))
    o.push(dmg(C.hit[0]!, 548, foot - 64, 17, '#fff'), dmg(C.hit[1]!, 640, foot - 72, 14, '#ffe9f4'), dmg(C.hit[2]!, 770, foot - 48, 26, '#ffe14a'))
  } else {
    const bxs = 750, bs = 1.4
    o.push(`<circle cx="${bxs}" cy="${foot - 50}" r="120" fill="url(#d2r)"/>`)
    o.push(`<g class="d2fl"><g transform="translate(${bxs} ${foot}) scale(${bs})"><use href="#d2b" fill="none" stroke="#ff2a4a" stroke-width="7" opacity=".16" stroke-linejoin="round"/><use href="#d2b" fill="none" stroke="#ff2a4a" stroke-width="3.5" opacity=".4" stroke-linejoin="round"/><use href="#d2b" fill="${D2K}" stroke="#ff4a6a" stroke-width="1.4" stroke-linejoin="round"/><use href="#d2e"/><path d="M-20 -48 L-34 -66 L-24 -56 L-26 -74 L-14 -56Z M20 -48 L34 -66 L24 -56 L26 -74 L14 -56Z" fill="${D2K}" stroke="#ff4a6a" stroke-width="1"/></g></g>`)
    o.push(label(`Lv 18  ${C.boss}`, W - 12, 31, 13, '#ff9ab0', { anchor: 'end', font: SERIF, weight: 'bold', stroke: '#3a0a50', sw: 3.5 }), bar(W - 12 - 400, 35, 400, 7, C.foeHp, '#ff4a6a'))
    o.push(spark(690, foot - 30), dmg(C.hit[0]!, 668, foot - 40, 17, '#fff'), dmg(C.hit[2]!, 862, foot - 56, 28, '#ffe14a'))
  }
  return svgOf(o.join(''))
}
DIRECTIONS.push({ id: 'D2', name: 'Glowing silhouettes', font: 'Georgia, Consolas', frame: d2Frame })

// ======================= shared human adventurer (task-23, D3 to D7) =======================
/**
 * One original adventurer for D3 to D7, so the owner compares the style and not five different people.
 * Unit space: feet on y 0, x 0 on the centre line, front view, the shield on the viewer's left and the sword arm on the right.
 * The hair top is HUM.top (81.8 units); the head runs from the hair top to the chin (HUM.chin), 18.5 percent of the height.
 * D4 to D7 paint these paths; D3 sets the same figure in text rows. The sword hangs from the hand and each style swings it with its own CSS clock.
 */
export const HUM = {
  top: -81.8, chin: -66.7,
  cape: 'M-11.5 -62 Q0 -66 11.5 -62 L18.5 -22 Q14 -18 10.5 -22 Q6 -17 1.5 -21 Q-3 -17 -7.5 -21.5 Q-12 -18 -18.8 -22Z',
  tunic: 'M-12.5 -62.5 Q0 -65.5 12.5 -62.5 L11 -52 L9.6 -41 L11.4 -31.5 Q0 -28.5 -11.4 -31.5 L-9.6 -41 L-11 -52Z',
  collar: 'M-4.2 -64.4 L0 -58.4 L4.2 -64.4',
  hem: 'M-11.2 -33.2 Q0 -30.2 11.2 -33.2',
  belt: 'M-9.8 -42 H9.8 V-38.6 H-9.8Z', buckle: 'M-2.2 -42.4 H2.2 V-38.2 H-2.2Z',
  legL: 'M-9.4 -32 H-1.6 V-9 H-9.2Z', legR: 'M1.6 -32 H9.4 L9.2 -9 H1.6Z',
  bootL: 'M-9.6 -11 H-1.4 V-3.2 Q-1.4 0 -3 0 H-11 Q-13.2 0 -12.4 -2.4 L-10 -4Z', bootR: 'M9.6 -11 H1.4 V-3.2 Q1.4 0 3 0 H11 Q13.2 0 12.4 -2.4 L10 -4Z',
  cuffL: 'M-9.8 -11.2 H-1.2 V-9 H-9.8Z', cuffR: 'M9.8 -11.2 H1.2 V-9 H9.8Z',
  neck: 'M-2.3 -67 H2.3 V-62.5 H-2.3Z',
  head: { cx: 0, cy: -73.6, rx: 6.1, ry: 6.9 },
  hair: 'M-6.4 -72 C-8 -80.5 -2.4 -81.8 0 -81.8 C2.4 -81.8 8 -80.5 6.4 -72 C5.4 -76.4 3 -77.6 0 -77.6 C-3 -77.6 -5.4 -76.4 -6.4 -72Z',
  eyeY: -73.4, eyeX: 2.6, mouth: 'M-1.7 -69.9 Q0 -68.5 1.7 -69.9',
  shieldArm: 'M-12 -60 L-17.5 -51', swordArm: 'M12 -60.5 L24.5 -57.5 L28 -66.8',
  shield: { cx: -18.5, cy: -48, r: 9 }, hand: { x: 28, y: -68.3, r: 2.9 },
  // the sword in its own space, hung from the hand, blade straight up: the swing clock rotates it about the hand (62 degrees at the paused frame)
  grip: 'M-1.2 4 V-3 H1.2 V4Z', guard: 'M-5.4 -3 H5.4 V-5.4 H-5.4Z', blade: 'M-2.4 -5.4 L-2 -36 L0 -41 L2 -36 L2.4 -5.4Z', fuller: 'M0 -8 V-33',
  bladeLen: 41,
}
/** The swing trail: arcs about the hand, behind the blade tip, in absolute frame coordinates (hero at hx, foot). */
const humTrail = (hx: number, foot: number, s: number, draw: (d: string, w: number, op: number) => string) => {
  const ax = hx + HUM.hand.x * s, ay = foot + HUM.hand.y * s
  const arc = (rr: number, a0: number, a1: number) => `M${r1(ax + rr * Math.cos(a0))} ${r1(ay + rr * Math.sin(a0))} A${rr} ${rr} 0 0 1 ${r1(ax + rr * Math.cos(a1))} ${r1(ay + rr * Math.sin(a1))}`
  return draw(arc(46 * s, -1.0, -0.36), 5.2, 1) + draw(arc(37 * s, -0.95, -0.4), 3, 0.8)
}

// ======================= D3. Terminal ASCII =======================
const d3Frame = (boss: boolean): string => {
  const COLS = 120, ROWS = 10, cw = 8, ch = 15
  type Cell = { c: string; f: string; b: boolean }
  const g: (Cell | null)[][] = Array.from({ length: ROWS }, () => new Array<Cell | null>(COLS).fill(null))
  type Col = string | ((c: string, i: number) => string)
  const set = (r: number, c0: number, s: string, f: Col, b = false) => {
    for (let i = 0; i < s.length; i++) {
      const col = c0 + i, ch1 = s[i]!
      if (ch1 === ' ' || r < 0 || r >= ROWS || col < 0 || col >= COLS) continue
      g[r]![col] = { c: ch1, f: typeof f === 'string' ? f : f(ch1, i), b }
    }
  }
  const rnd = rng(33)
  // sky, hills, trees and ground: dim glyphs the sprites paint over
  for (let r = 2; r <= 5; r++) for (let c = 0; c < COLS; c++) if (rnd() < 0.035) set(r, c, rnd() < 0.3 ? '*' : '.', '#4a5878')
  set(2, 112, 'C', '#e8e0b0', true)
  const hill = (c: number) => Math.round(1.6 + 1.4 * Math.sin(c * 0.11 + 1) + 0.8 * Math.sin(c * 0.37))
  for (let c = 0; c < COLS; c++) {
    const h = hill(c), top = 7 - h
    const nx = hill(c + 1), pv = hill(c - 1)
    set(top, c, nx > h ? '/' : pv > h ? '\\' : nx < h ? '\\' : '_', '#2a3a58')
  }
  for (const c of [4, 36, 60, 66, 116]) { set(7, c, 'T', '#2f7a3a'); set(6, c, '^', '#2f7a3a') }
  for (let c = 0; c < COLS; c++) {
    set(8, c, ['.', ',', "'", '"', '.', ';'][Math.floor(rnd() * 6)]!, rnd() < 0.5 ? '#3a5a34' : '#5a4a30')
    if (rnd() < 0.12) set(7, c, '"', '#3a6a34')
  }
  const bar = (n: number, f: number, color: string, r: number, c0: number) => {
    const full = Math.round(n * f)
    set(r, c0, '[', '#7a8aa0'); set(r, c0 + 1, '#'.repeat(full), color, true); set(r, c0 + 1 + full, '-'.repeat(n - full), '#3a4558'); set(r, c0 + n + 1, ']', '#7a8aa0')
  }
  // header
  set(0, 1, C.act, '#c0a060'); set(0, COLS - 1 - C.who.length, C.who, '#e6e6e6', true)
  // hero: a person set in text, seven rows at a 12 px pitch (the head is one row), two straight legs, a shield and a raised sword
  for (let r = 1; r <= 7; r++) for (let c = 10; c <= 33; c++) g[r]![c] = null
  bar(8, C.heroHp, '#4ad060', 1, 14)
  const heroRuns: string[] = []
  const hset = (k: number, c0: number, s: string, f: string, b = true, dy = 0) => heroRuns.push(`<text x="${c0 * cw}" y="${117 - 12 * (6 - k) + dy}" textLength="${s.length * cw}" lengthAdjust="spacing" fill="${f}"${b ? ' font-weight="bold"' : ''}>${esc(s)}</text>`)
  const HAIR = '#b07a3a', SKIN = '#f2c694', EYE = '#7ad8ff', TUN = '#4a86f0', GOLD = '#ffe14a', CAPE = '#e0503a', STEEL = '#cfd8f0', TRS = '#8a78c8', BOOT = '#b0703a'
  // no parentheses, angle brackets or V anywhere on the hero; the cape hangs as straight columns behind the body
  hset(0, 17, '.===.', HAIR, true, -8)
  hset(0, 17, '|', SKIN); hset(0, 18, 'o', EYE); hset(0, 19, '.', SKIN); hset(0, 20, 'o', EYE); hset(0, 21, '|', SKIN)
  hset(0, 27, '/', '#ffffff')
  hset(1, 16, ".-'", TUN); hset(1, 19, '|', SKIN); hset(1, 20, "'-.", TUN); hset(1, 23, '-', TUN); hset(1, 26, '/', STEEL)
  hset(2, 12, '[O]', STEEL); hset(2, 15, '|', CAPE); hset(2, 16, '|#####|', TUN); hset(2, 23, '=-', TUN); hset(2, 25, 'o', SKIN); hset(2, 26, '+', GOLD)
  hset(3, 12, '[_]', STEEL); hset(3, 15, '|', CAPE); hset(3, 16, '[==#==]', '#a07a52'); hset(3, 19, '#', GOLD); hset(3, 23, '|', CAPE)
  hset(4, 15, '|', CAPE); hset(4, 16, '|#|', TRS); hset(4, 20, '|#|', TRS); hset(4, 23, '|', CAPE)
  hset(5, 15, '|', CAPE); hset(5, 16, '|#|', TRS); hset(5, 20, '|#|', TRS); hset(5, 23, '|', CAPE)
  hset(6, 16, '__|', BOOT); hset(6, 20, '|__', BOOT)
  hset(0, 29, "'", '#bff4ff'); hset(1, 29, ':', '#35c8e0'); hset(1, 30, '.', '#bff4ff'); hset(2, 29, "'", '#35c8e0', false)
  // loot: = is a ring
  set(4, 50 - Math.floor(C.loot.length / 2), C.loot, '#f2e05a', true)
  set(5, 50, '|', '#8a7a30'); set(6, 50, '|', '#b8a040'); set(7, 50, '=', '#ffe14a', true); set(6, 48, '*', '#fff6c0', true); set(6, 52, '+', '#fff6c0', true); set(7, 48, '.', '#ffe14a'); set(7, 52, '.', '#ffe14a')
  const pkg = (c0: number, rare: boolean) => {
    const wood = rare ? '#e6c44a' : '#a07a52'
    if (rare) { set(4, c0, '\\W/', '#fff2a8', true); set(3, c0 + 1, '*', '#f2e05a') }
    set(5, c0, ' ___ ', wood)
    set(6, c0, '[', wood, true); set(6, c0 + 1, 'o_o', (x) => (x === 'o' ? (rare ? '#ff5a4a' : '#7dffb0') : wood), true); set(6, c0 + 4, ']', wood, true)
    set(7, c0, ' ~~~ ', '#7a66c8')
  }
  const sparkle = (r: number, c0: number) => { set(r, c0, '*', '#fff', true); set(r - 1, c0 - 1, '\\', '#ffe14a'); set(r + 1, c0 - 1, '/', '#ffe14a') }
  if (!boss) {
    ;[70, 82, 94].forEach((c0, i) => { pkg(c0, false); bar(3, [0.56, 0.8, 0.35][i]!, '#d04040', 4, c0) })
    pkg(108, true)
    set(1, COLS - 1 - C.rare.length, C.rare, '#f2e05a', true); bar(36, C.foeHp, '#d04040', 2, COLS - 38)
    sparkle(6, 66); sparkle(6, 104)
    set(3, 71, C.hit[0]!, '#ffffff', true); set(3, 83, C.hit[1]!, '#9aa0a8'); set(3, 98, '*' + C.hit[2]! + '*', '#ffe14a', true)
  } else {
    const art: [string, number][] = [[' /|       |\\ ', 2], ['/ |_______| \\', 3], ['[ (O)   (O) ]', 4], ['[ \\VVVVVVV/ ]', 5], ['[===========]', 6], [' ~~~~~~~~~~~ ', 7]]
    const c0 = 84
    for (const [s, r] of art) set(r, c0, s, (x) => (x === 'O' ? '#ff4a4a' : x === '/' || x === '\\' || x === '|' ? (r < 4 ? '#e8e0c8' : '#a07a52') : x === '~' ? '#7a66c8' : x === 'V' ? '#e8e0c8' : '#a07a52'), true)
    const nm = `Lv 18 ${C.boss}`
    set(1, COLS - 1 - 40 - nm.length, nm, '#ff6a5a', true); bar(36, C.foeHp, '#d04040', 1, COLS - 38)
    sparkle(6, 78)
    set(4, 76, C.hit[0]!, '#ffffff', true); set(3, 100, '*' + C.hit[2]! + '*', '#ffe14a', true)
  }
  // the task line and the xp bar, on a dim strip
  set(9, 1, boss ? C.bossTask : C.task, '#e6e6e6')
  set(9, COLS - 46, 'XP', '#7a8aa0'); bar(30, C.xp, '#e6b23a', 9, COLS - 43); set(9, COLS - 11, `${Math.round(C.xp * 100)}%`, '#e6e6e6')
  const rows: string[] = []
  for (let r = 0; r < ROWS; r++) {
    let c = 0
    while (c < COLS) {
      const cell = g[r]![c]
      if (!cell) { c++; continue }
      let k = c
      while (k + 1 < COLS && g[r]![k + 1] && g[r]![k + 1]!.f === cell.f && g[r]![k + 1]!.b === cell.b) k++
      const run = g[r]!.slice(c, k + 1).map(x => x!.c).join('')
      rows.push(`<text x="${c * cw}" y="${r * ch + 12}" textLength="${(k - c + 1) * cw}" lengthAdjust="spacing" fill="${cell.f}"${cell.b ? ' font-weight="bold"' : ''}>${esc(run)}</text>`)
      c = k + 1
    }
  }
  const strip = `<rect y="${9 * ch - 1}" width="${W}" height="${ch + 1}" fill="#18202e"/>`
  const scan = `<pattern id="d3l" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000"/></pattern>`
  const style = `<style>.d3b{animation:d3b 1s steps(1) infinite}@keyframes d3b{50%{opacity:.35}}</style>`
  return svgOf(`<defs>${scan}${style}</defs><rect width="${W}" height="${H}" fill="#0b0e14"/><g font-family="${MONO}" font-size="14.6">${strip}${rows.join('')}${heroRuns.join('')}</g><rect width="${W}" height="${H}" fill="url(#d3l)" opacity=".16"/>`)
}
DIRECTIONS.push({ id: 'D3', name: 'Terminal ASCII', font: 'Consolas (monospace)', frame: d3Frame })

// ======================= D4. Smooth vector cartoon =======================
const INK = '#2b1a3c'
const ROUND = "'Arial Rounded MT Bold','Trebuchet MS','Segoe UI',Arial,sans-serif"
const d4Box = (rare: boolean) => {
  const body = rare ? '#ffd84a' : '#dca25c', shade = rare ? '#e0a928' : '#b8823f', flap = rare ? '#ffe680' : '#eab874', tape = rare ? '#fff6c0' : '#f4e0a8'
  const eye = rare ? '#ff4a4a' : '#2a1a3a'
  return `<path d="M-17 -22 Q-20 -10 -12 -6 Q-8 2 -2 -2 Q4 4 9 -3 Q18 -8 17 -22Z" fill="#b7a4ff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M-20 -52 L-31 -63 L-13 -59 L-6 -52Z M20 -52 L31 -63 L13 -59 L6 -52Z" fill="${flap}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<rect x="-20" y="-52" width="40" height="32" rx="5" fill="${body}" stroke="${INK}" stroke-width="3.2"/>
<path d="M-18 -26 H18 V-23 Q18 -21 16 -21 H-16 Q-18 -21 -18 -23Z" fill="${shade}"/><rect x="-4" y="-51" width="8" height="30" fill="${tape}"/><path d="M-4 -51 V-21 M4 -51 V-21" stroke="${INK}" stroke-width="1.2" opacity=".35"/>
<ellipse cx="-10" cy="-39" rx="6" ry="7" fill="#fff" stroke="${INK}" stroke-width="2.4"/><ellipse cx="10" cy="-39" rx="6" ry="7" fill="#fff" stroke="${INK}" stroke-width="2.4"/>
<circle cx="-8.2" cy="-38" r="3.4" fill="${eye}"/><circle cx="8.2" cy="-38" r="3.4" fill="${eye}"/><circle cx="-7.2" cy="-39.2" r="1.1" fill="#fff"/><circle cx="9.2" cy="-39.2" r="1.1" fill="#fff"/>
<path d="M-17 -50 L-5 -44 M17 -50 L5 -44" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M-10 -28 Q0 -22 10 -28 Q0 -31 -10 -28Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M-6 -28.6 l2.2 3 2.2 -3Z M2 -28.6 l2.2 3 2.2 -3Z" fill="#fff"/>
${rare ? `<path d="M-13 -62 L-16 -78 L-7 -70 L0 -82 L7 -70 L16 -78 L13 -62Z" fill="#ff9a2a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="0" cy="-70" r="2.6" fill="#ff4a8a"/><circle cx="-8" cy="-67" r="1.8" fill="#5ad1ff"/><circle cx="8" cy="-67" r="1.8" fill="#6aff9a"/>` : ''}`
}
const d4Cloud = (x: number, y: number, s: number) => {
  const cs: [number, number, number][] = [[0, 0, 14], [16, -6, 17], [34, 0, 14], [16, 6, 14]]
  const c = (ex: number, f: string, st: string) => cs.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r + ex}" fill="${f}" stroke="${st}"/>`).join('')
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity=".95">${c(2.2, INK, 'none')}${c(0, '#fff', 'none')}</g>`
}
const d4Frame = (boss: boolean): string => {
  const o: string[] = []
  const pill = (x: number, y: number, w: number, hgt: number, f: number, c: string) => `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${hgt / 2}" fill="#4a3260" stroke="${INK}" stroke-width="2.4"/><rect x="${x + 1.2}" y="${y + 1.2}" width="${r1(Math.max(hgt - 2.4, (w - 2.4) * f))}" height="${hgt - 2.4}" rx="${(hgt - 2.4) / 2}" fill="${c}"/><rect x="${x + 4}" y="${y + 2}" width="${r1(Math.max(2, (w - 2.4) * f - 6))}" height="${r1(hgt / 4)}" rx="${hgt / 8}" fill="#fff" opacity=".45"/>`
  const txt = (s: string, x: number, y: number, size: number, fill: string, anchor = 'start', sw = size / 3.4) => label(s, x, y, size, fill, { anchor, font: ROUND, weight: 'bold', stroke: INK, sw })
  o.push(`<defs><linearGradient id="d4s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cc6ff"/><stop offset="1" stop-color="#cdefff"/></linearGradient>
<g id="d4n">${d4Box(false)}</g><g id="d4r">${d4Box(true)}</g>
<style>.d4sw{animation:d4sw .84s ease-in-out infinite}@keyframes d4sw{0%,100%{transform:rotate(-35deg)}50%{transform:rotate(62deg)}}
.d4b{animation:d4b 1s ease-in-out infinite}@keyframes d4b{50%{transform:translateY(-4px)}}
.d4p{transform-box:fill-box;transform-origin:50% 50%;animation:d4p .8s ease-in-out infinite}@keyframes d4p{50%{transform:scale(1.12)}}</style></defs>`)
  o.push(`<rect width="${W}" height="${GY + 8}" fill="url(#d4s)"/>`)
  o.push(d4Cloud(260, 30, 1.1), d4Cloud(560, 20, 0.9), d4Cloud(880, 38, 1.2), d4Cloud(40, 70, 0.7))
  o.push(`<circle cx="470" cy="34" r="17" fill="#ffe14a" stroke="${INK}" stroke-width="3.2"/>`)
  // hills, a tree, the ground
  o.push(`<path d="M-10 ${GY + 4} V86 Q80 54 190 80 T400 84 T620 70 T820 82 T${W + 10} 72 V${GY + 4}Z" fill="#7fdc7a" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>`)
  o.push(`<path d="M-10 ${GY + 4} V98 Q120 80 250 98 T520 96 T780 98 T${W + 10} 94 V${GY + 4}Z" fill="#57c765" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>`)
  const tree = (x: number, s: number) => `<g transform="translate(${x} ${GY - 2}) scale(${s})"><rect x="-4" y="-20" width="8" height="22" rx="2" fill="#a56a3a" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-34" r="17" fill="#3fb85a" stroke="${INK}" stroke-width="3.2"/><circle cx="-6" cy="-39" r="5" fill="#7fe08a"/></g>`
  o.push(tree(300, 1), tree(470, 0.8), tree(940, 1.1))
  o.push(`<rect y="${GY}" width="${W}" height="${H - GY}" fill="#8be06a"/><path d="M0 ${GY} H${W}" stroke="${INK}" stroke-width="3.2"/><rect y="${GY + 8}" width="${W}" height="${H - GY - 8}" fill="#e8c27a"/><path d="M0 ${GY + 8} H${W}" stroke="${INK}" stroke-width="2.4" opacity=".5"/>`)
  const rnd = rng(44)
  for (let i = 0; i < 16; i++) { const x = rnd() * W, y = GY + 12 + rnd() * 6; o.push(`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(5 + rnd() * 5)}" ry="2" fill="#d4a85e"/>`) }
  for (let i = 0; i < 12; i++) { const x = 20 + rnd() * 920; o.push(`<circle cx="${r1(x)}" cy="${GY - 3}" r="2.6" fill="${['#fff', '#ff8ab0', '#ffe14a'][i % 3]}" stroke="${INK}" stroke-width="1.2"/>`) }
  const foot = GY + 6
  const sh = (x: number, rx: number) => `<ellipse cx="${x}" cy="${foot + 1}" rx="${rx}" ry="${r1(rx * 0.2)}" fill="#2b1a3c" opacity=".28"/>`
  // loot
  const lx = 410
  o.push(sh(lx, 18))
  o.push(`<g class="d4b"><g transform="translate(${lx} ${foot - 16})">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 -17 V-24" transform="rotate(${a})" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`).join('')}<circle r="10" fill="none" stroke="${INK}" stroke-width="9"/><circle r="10" fill="none" stroke="#ffd23f" stroke-width="5"/><path d="M-4 -8 Q0 -11 4 -8" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M0 -17 l3 -6 -3 -2 -3 2z" fill="#5ad1ff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></g></g>`)
  o.push(`<path d="M${lx + 17} ${foot - 42} l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" class="d4p" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`)
  o.push(`<rect x="${lx - 52}" y="${foot - 62}" width="104" height="18" rx="9" fill="#ffe680" stroke="${INK}" stroke-width="2.6"/>`, label(C.loot, lx, foot - 49, 11, INK, { anchor: 'middle', font: ROUND, weight: 'bold' }))
  // the hero: the shared adventurer, clean rounded shapes with a bold ink outline
  const hx = 150
  const st = (d: string, f: string, w = 2.6) => `<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`
  const limb = (d: string, w: number, f: string) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 3.2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${f}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
  const hv = HUM.hand, hd = HUM.head, sd = HUM.shield
  o.push(sh(hx, 26))
  o.push(`<g transform="translate(${hx} ${foot})">
${st(HUM.cape, '#ff5a5a')}<path d="M-9 -60 Q-14 -40 -16 -24 M9 -60 Q14 -40 16 -24" stroke="#c93a4a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>
${st(HUM.legL, '#7a6ad0')}${st(HUM.legR, '#7a6ad0')}<path d="M-6 -30 V-12" stroke="#a79af0" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
${st(HUM.bootL, '#b8743a')}${st(HUM.bootR, '#b8743a')}${st(HUM.cuffL, '#ffe680', 2)}${st(HUM.cuffR, '#ffe680', 2)}
${st(HUM.tunic, '#4a86f0')}<path d="M3 -61 L9.6 -41 L11.4 -31.5 Q6 -29.6 2 -30.2Z" fill="#2e5fc8" opacity=".45"/><path d="${HUM.collar}" fill="none" stroke="#fff6d6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${HUM.hem}" fill="none" stroke="#fff6d6" stroke-width="2" stroke-linecap="round"/><path d="M-8 -56 Q-9 -50 -8.4 -45" stroke="#9cc0ff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
${st(HUM.belt, '#8a5a2a', 2)}${st(HUM.buckle, '#ffd23f', 1.8)}
${limb(HUM.shieldArm, 5.4, '#4a86f0')}
<circle cx="${sd.cx}" cy="${sd.cy}" r="${sd.r}" fill="#cfd8f0" stroke="${INK}" stroke-width="2.8"/><circle cx="${sd.cx}" cy="${sd.cy}" r="${sd.r - 2.4}" fill="none" stroke="#ffd23f" stroke-width="2"/><circle cx="${sd.cx}" cy="${sd.cy}" r="3.4" fill="#ff5a5a" stroke="${INK}" stroke-width="1.8"/><path d="M-24.5 -53 Q-22 -55.4 -19 -55.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
${st(HUM.neck, '#ffcf9f', 2)}
<g id="hh4"><ellipse cx="${hd.cx}" cy="${hd.cy}" rx="${hd.rx}" ry="${hd.ry}" fill="#ffcf9f" stroke="${INK}" stroke-width="2.6"/>${st(HUM.hair, '#7a4a2a', 2.2)}</g>
<ellipse cx="-2.6" cy="${HUM.eyeY}" rx="1.5" ry="1.8" fill="#fff"/><ellipse cx="2.6" cy="${HUM.eyeY}" rx="1.5" ry="1.8" fill="#fff"/><circle cx="-2.4" cy="${HUM.eyeY + 0.2}" r="1" fill="${INK}"/><circle cx="2.8" cy="${HUM.eyeY + 0.2}" r="1" fill="${INK}"/><path d="${HUM.mouth}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/><circle cx="-4.2" cy="-70.6" r="1.1" fill="#ff8aa0" opacity=".7"/><circle cx="4.2" cy="-70.6" r="1.1" fill="#ff8aa0" opacity=".7"/>
${limb(HUM.swordArm, 5.4, '#4a86f0')}<circle cx="${hv.x}" cy="${hv.y}" r="${hv.r}" fill="#ffcf9f" stroke="${INK}" stroke-width="2.2"/>
<g transform="translate(${hv.x} ${hv.y})"><g class="d4sw">${st(HUM.grip, '#8a5a2a', 2)}${st(HUM.blade, '#eef4ff', 2.4)}<path d="${HUM.fuller}" stroke="#a8b8e0" stroke-width="1.2" fill="none"/>${st(HUM.guard, '#ffd23f', 2)}<circle cx="0" cy="5.4" r="1.9" fill="#ffd23f" stroke="${INK}" stroke-width="1.6"/></g></g></g>`)
  o.push(humTrail(hx, foot, 1, (d, w) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 3.2}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round"/>`))
  // HUD
  o.push(pill(hx - 34, 28, 68, 8, C.heroHp, '#54e06a'))
  o.push(`<rect x="8" y="5" width="${C.act.length * 7.8 + 22}" height="22" rx="11" fill="#fff6d6" stroke="${INK}" stroke-width="2.6"/>`, label(C.act, 19, 20.5, 13, INK, { font: ROUND, weight: 'bold' }))
  const task = boss ? C.bossTask : C.task
  o.push(`<rect x="8" y="${H - 29}" width="${task.length * 7.6 + 24}" height="22" rx="11" fill="#fff6d6" stroke="${INK}" stroke-width="2.6"/>`, label(task, 20, H - 13.5, 13, INK, { font: ROUND, weight: 'bold' }))
  const wl = C.who.length * 7.8 + 22
  o.push(`<rect x="${W - 8 - 190 - 12 - wl}" y="${H - 29}" width="${wl}" height="22" rx="11" fill="#fff6d6" stroke="${INK}" stroke-width="2.6"/>`, label(C.who, W - 8 - 190 - 12 - wl / 2, H - 13.5, 13, INK, { anchor: 'middle', font: ROUND, weight: 'bold' }))
  o.push(pill(W - 8 - 160, H - 25, 160, 12, C.xp, '#5ad1ff'), label(`${Math.round(C.xp * 100)}%`, W - 8 - 166, H - 14, 11, '#fff', { anchor: 'end', font: ROUND, weight: 'bold', stroke: INK, sw: 3 }))
  const pow = (x: number, y: number, s: number) => `<path d="M${x} ${y - 16 * s} L${x + 5 * s} ${y - 6 * s} L${x + 16 * s} ${y - 9 * s} L${x + 9 * s} ${y} L${x + 17 * s} ${y + 8 * s} L${x + 6 * s} ${y + 8 * s} L${x + 2 * s} ${y + 17 * s} L${x - 4 * s} ${y + 8 * s} L${x - 15 * s} ${y + 12 * s} L${x - 9 * s} ${y + 2 * s} L${x - 17 * s} ${y - 6 * s} L${x - 6 * s} ${y - 7 * s}Z" fill="#ffe14a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
  if (!boss) {
    ;[540, 632, 724].forEach((x, i) => {
      o.push(sh(x, 24))
      o.push(`<g class="d4b" style="animation-delay:-${i * 0.3}s"><g transform="translate(${x} ${foot + (i % 2)}) scale(1.0)"><use href="#d4n"/></g></g>`)
      o.push(pill(x - 20, foot - 78 + (i % 2), 40, 7, [0.56, 0.8, 0.35][i]!, '#ff5a5a'))
    })
    const rx = 852
    o.push(sh(rx, 28))
    o.push(`<g class="d4b"><g transform="translate(${rx} ${foot}) scale(0.95)"><use href="#d4r"/></g></g>`)
    o.push(txt(C.rare, W - 12, 21, 13, '#ffe680', 'end'), pill(W - 12 - 270, 27, 270, 10, C.foeHp, '#ff5a5a'))
    o.push(pow(512, foot - 44, 1.2), pow(rx - 44, foot - 60, 0.9))
    o.push(txt(C.hit[0]!, 548, foot - 66, 18, '#fff'), txt(C.hit[1]!, 646, foot - 74, 15, '#fff'), txt(C.hit[2]!, 772, foot - 44, 28, '#ffe14a'))
  } else {
    const bx = 800
    o.push(sh(bx, 62))
    o.push(`<g class="d4b"><g transform="translate(${bx} ${foot}) scale(1.4)"><use href="#d4n"/><path d="M-19 -55 Q-34 -62 -30 -78 Q-24 -66 -14 -60Z M19 -55 Q34 -62 30 -78 Q24 -66 14 -60Z" fill="#fff6d6" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></g></g>`)
    o.push(txt(`Lv 18  ${C.boss}`, 690, 21, 13, '#ff9a9a', 'end'), pill(450, 27, 240, 10, C.foeHp, '#ff5a5a'))
    o.push(pow(724, foot - 34, 1.2), txt(C.hit[0]!, 700, foot - 46, 18, '#fff'), txt(C.hit[2]!, 900, foot - 62, 28, '#ffe14a'))
  }
  return svgOf(o.join(''))
}
DIRECTIONS.push({ id: 'D4', name: 'Smooth vector cartoon', font: 'Arial Rounded MT Bold', frame: d4Frame })

// ======================= D5. Painterly =======================
/** A hand-painted blob: a closed smooth path round an ellipse, its radius jittered. */
const blob = (cx: number, cy: number, rx: number, ry: number, rnd: () => number, n = 9, j = 0.22) => {
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (rnd() - 0.5) * 2 * j; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]) }
  const mid = (a: [number, number], b: [number, number]) => `${r1((a[0] + b[0]) / 2)} ${r1((a[1] + b[1]) / 2)}`
  let d = `M${mid(pts[n - 1]!, pts[0]!)}`
  for (let i = 0; i < n; i++) d += `Q${r1(pts[i]![0])} ${r1(pts[i]![1])} ${mid(pts[i]!, pts[(i + 1) % n]!)}`
  return d + 'Z'
}
/** A brush streak: a thin lens from (x,y) along an angle. */
const streak = (x: number, y: number, len: number, ang: number, w: number) => {
  const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len, nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w
  return `M${r1(x)} ${r1(y)}Q${r1(x + dx / 2 + nx)} ${r1(y + dy / 2 + ny)} ${r1(x + dx)} ${r1(y + dy)}Q${r1(x + dx / 2 - nx)} ${r1(y + dy / 2 - ny)} ${r1(x)} ${r1(y)}Z`
}
const d5Frame = (boss: boolean): string => {
  const o: string[] = []
  const rnd = rng(55)
  const stop = (off: number, c: string, op = 1) => `<stop offset="${off}" stop-color="${c}" stop-opacity="${op}"/>`
  o.push(`<defs>
<linearGradient id="d5a" x1="0" y1="0" x2="1" y2="1">${stop(0, '#f8c9a0')}${stop(0.45, '#d9b0c8')}${stop(1, '#8a98d0')}</linearGradient>
<radialGradient id="d5u">${stop(0, '#fff3d0')}${stop(0.25, '#ffd9a0', 0.8)}${stop(1, '#ffc080', 0)}</radialGradient>
<radialGradient id="d5w">${stop(0, '#fff', 0.85)}${stop(1, '#fff', 0)}</radialGradient>
<linearGradient id="d5h" x1="0" y1="0" x2="0" y2="1">${stop(0, '#e8d0e8', 0)}${stop(1, '#ffe8c8', 0.85)}</linearGradient>
<linearGradient id="d5m1" x1="0" y1="0" x2="0" y2="1">${stop(0, '#a99ac8')}${stop(1, '#d8bcd0')}</linearGradient>
<linearGradient id="d5m2" x1="0" y1="0" x2="0" y2="1">${stop(0, '#7f7cb4')}${stop(1, '#b6a0c4')}</linearGradient>
<linearGradient id="d5m3" x1="0" y1="0" x2="0" y2="1">${stop(0, '#58649a')}${stop(1, '#8a86b0')}</linearGradient>
<linearGradient id="d5f" x1="0" y1="0" x2="0" y2="1">${stop(0, '#3f6a5a')}${stop(1, '#2c4a4a')}</linearGradient>
<linearGradient id="d5g" x1="0" y1="0" x2="0" y2="1">${stop(0, '#c8cf6a')}${stop(0.5, '#8fae52')}${stop(1, '#5c8044')}</linearGradient>
<linearGradient id="d5t" x1="0" y1="0" x2="0" y2="1">${stop(0, '#d8b888')}${stop(1, '#a88458')}</linearGradient>
<radialGradient id="d5c" cx=".35" cy=".28" r=".85">${stop(0, '#ffc9a2')}${stop(0.4, '#f2704a')}${stop(1, '#9a3434')}</radialGradient>
<radialGradient id="d5s" cx=".3" cy=".25" r=".9">${stop(0, '#f4f8ff')}${stop(0.5, '#a8b6d8')}${stop(1, '#5a6890')}</radialGradient>
<linearGradient id="d5d" x1="0" y1="0" x2="1" y2="0">${stop(0, '#c89a5c')}${stop(1, '#8a5e34')}</linearGradient>
<linearGradient id="d5hc" x1="0" y1="0" x2="0" y2="1">${stop(0, '#f0705a')}${stop(1, '#8a2a40')}</linearGradient>
<linearGradient id="d5tu" x1="0" y1="0" x2="1" y2="1">${stop(0, '#7aa4f0')}${stop(1, '#3050a8')}</linearGradient>
<linearGradient id="d5tr" x1="0" y1="0" x2="1" y2="0">${stop(0, '#7a6a98')}${stop(1, '#3a3256')}</linearGradient>
<linearGradient id="d5bt" x1="0" y1="0" x2="1" y2="1">${stop(0, '#c08a54')}${stop(1, '#5a3a24')}</linearGradient>
<radialGradient id="d5sk" cx=".35" cy=".3" r=".85">${stop(0, '#ffe2c0')}${stop(1, '#d99a6a')}</radialGradient>
<linearGradient id="d5ha" x1="0" y1="0" x2="1" y2="1">${stop(0, '#a8703a')}${stop(1, '#4a2814')}</linearGradient>
<linearGradient id="d5bl" x1="0" y1="0" x2="1" y2="0">${stop(0, '#ffffff')}${stop(1, '#aebcdc')}</linearGradient>
<linearGradient id="d5bx" x1="0" y1="0" x2="1" y2="1">${stop(0, '#f0c890')}${stop(0.55, '#c98e52')}${stop(1, '#8a5a34')}</linearGradient>
<linearGradient id="d5bg" x1="0" y1="0" x2="1" y2="1">${stop(0, '#fff0a0')}${stop(0.55, '#f0b830')}${stop(1, '#b8741c')}</linearGradient>
<linearGradient id="d5gt" x1="0" y1="0" x2="0" y2="1">${stop(0, '#c8b8ff', 0.95)}${stop(0.7, '#9a88e0', 0.45)}${stop(1, '#8a78d8', 0)}</linearGradient>
<radialGradient id="d5eg">${stop(0, '#e8ffd8')}${stop(0.35, '#7dffb0', 0.8)}${stop(1, '#7dffb0', 0)}</radialGradient>
<radialGradient id="d5er">${stop(0, '#fff0e0')}${stop(0.35, '#ff6a50', 0.85)}${stop(1, '#ff6a50', 0)}</radialGradient>
<radialGradient id="d5ga">${stop(0, '#ffe27a', 0.7)}${stop(1, '#ffe27a', 0)}</radialGradient>
<radialGradient id="d5ra">${stop(0, '#ff5a40', 0.5)}${stop(1, '#ff5a40', 0)}</radialGradient>
<linearGradient id="d5l" x1="0" y1="1" x2="0" y2="0">${stop(0, '#fff0b0', 0.8)}${stop(1, '#fff0b0', 0)}</linearGradient>
<radialGradient id="d5v" cx=".5" cy=".5" r=".75">${stop(0.6, '#2a1a3a', 0)}${stop(1, '#2a1a3a', 0.5)}</radialGradient>
<g id="d5n"><path d="M-20 -24 Q-24 -10 -14 -6 Q-9 4 -2 -1 Q5 5 10 -3 Q22 -8 20 -24Z" fill="url(#d5gt)"/>
<path d="M-23 -52 L-35 -62 L-14 -60Z M23 -52 L35 -62 L14 -60Z" fill="#e0aa68" opacity=".95"/>
<path d="M-22 -50 Q-22 -54 -18 -54 H18 Q22 -54 22 -50 V-27 Q22 -23 18 -23 H-18 Q-22 -23 -22 -27Z" fill="url(#d5bx)"/>
<path d="M-6 -54 H6 V-23 H-6Z" fill="#f4e0b0" opacity=".7"/><path d="M12 -52 H22 V-24 H12Z" fill="#5a3a22" opacity=".28"/><path d="M-22 -30 H22 V-23 H-22Z" fill="#5a3a22" opacity=".25"/>
<circle cx="-11" cy="-40" r="12" fill="url(#d5eg)"/><circle cx="11" cy="-40" r="12" fill="url(#d5eg)"/><ellipse cx="-11" cy="-40" rx="4.6" ry="3.2" transform="rotate(18 -11 -40)" fill="#f4ffe0"/><ellipse cx="11" cy="-40" rx="4.6" ry="3.2" transform="rotate(-18 11 -40)" fill="#f4ffe0"/>
<path d="M-13 -30 Q0 -23 13 -30 Q0 -34 -13 -30Z" fill="#2a1a24" opacity=".85"/></g>
<style>.d5sw{animation:d5sw .84s ease-in-out infinite}@keyframes d5sw{0%,100%{transform:rotate(-35deg)}50%{transform:rotate(62deg)}}
.d5b{animation:d5b 1.4s ease-in-out infinite}@keyframes d5b{50%{transform:translateY(-3px)}}
.d5m{animation:d5m 6s ease-in-out infinite}@keyframes d5m{50%{transform:translate(6px,-8px)}}</style></defs>`)
  o.push(`<rect width="${W}" height="${H}" fill="url(#d5a)"/>`)
  o.push(`<circle cx="70" cy="42" r="170" fill="url(#d5u)"/><circle cx="70" cy="42" r="26" fill="#fff8e0" opacity=".9"/>`)
  // clouds: stacks of soft blobs
  for (const [x, y, s] of [[240, 26, 1], [520, 14, 1.3], [800, 30, 1], [380, 60, 0.8]] as const) for (let i = 0; i < 5; i++) o.push(`<ellipse cx="${r1(x + (rnd() - 0.4) * 90 * s)}" cy="${r1(y + (rnd() - 0.5) * 8)}" rx="${r1(30 * s + rnd() * 30)}" ry="${r1(6 + rnd() * 6)}" fill="url(#d5w)" opacity="${r1(0.35 + rnd() * 0.3)}"/>`)
  // god rays from the sun
  for (const [a, w] of [[0.18, 0.1], [0.4, 0.07], [0.62, 0.09]] as const) o.push(`<path d="M70 42 L${r1(70 + Math.cos(a) * 1100)} ${r1(42 + Math.sin(a) * 1100)} L${r1(70 + Math.cos(a + w) * 1100)} ${r1(42 + Math.sin(a + w) * 1100)}Z" fill="#fff2c8" opacity=".12"/>`)
  // mountains in three washes with haze between
  const range = (ys: number, amp: number, k: number, fill: string, op = 1) => { let d = `M-10 ${GY + 6} L-10 ${ys}`; for (let x = 0; x <= W + 40; x += 40) d += ` Q${x + 20} ${r1(ys - amp * (0.4 + rnd() * 0.9))} ${x + 40} ${r1(ys - (rnd() - 0.4) * amp * k)}`; return `<path d="${d} V${GY + 6}Z" fill="${fill}" opacity="${op}"/>` }
  o.push(range(76, 26, 0.5, 'url(#d5m1)'), `<rect y="60" width="${W}" height="${GY - 60}" fill="url(#d5h)" opacity=".5"/>`, range(88, 22, 0.4, 'url(#d5m2)'), `<rect y="72" width="${W}" height="${GY - 72}" fill="url(#d5h)" opacity=".45"/>`, range(98, 16, 0.4, 'url(#d5m3)'))
  // forest masses made of dabs
  const forest = (x0: number, x1: number, base: number, hgt: number, n: number) => { let s = ''; for (let i = 0; i < n; i++) { const x = x0 + rnd() * (x1 - x0), y = base - rnd() * hgt, c = ['#2c5a4c', '#356a54', '#3f7a5a', '#244a42', '#4f8a62'][Math.floor(rnd() * 5)]!; s += `<path d="${blob(x, y, 8 + rnd() * 12, 6 + rnd() * 8, rnd, 7, 0.3)}" fill="${c}" opacity="${r1(0.55 + rnd() * 0.4)}"/>` } return s }
  o.push(forest(-10, 120, GY + 2, 34, 22), forest(260, 560, GY + 2, 22, 30), forest(780, 980, GY + 2, 40, 28))
  o.push(`<rect y="${GY - 14}" width="${W}" height="30" fill="url(#d5h)" opacity=".5"/>`)
  // the meadow and the trail, laid in brush strokes
  o.push(`<rect y="${GY}" width="${W}" height="${H - GY}" fill="url(#d5g)"/>`)
  for (let i = 0; i < 36; i++) o.push(`<path d="${streak(rnd() * W, GY + 2 + rnd() * 30, 40 + rnd() * 90, (rnd() - 0.5) * 0.12, 1.6 + rnd() * 2.4)}" fill="${['#d8e07a', '#6e9a48', '#a8c460', '#4e7a3c'][i % 4]}" opacity="${r1(0.22 + rnd() * 0.3)}"/>`)
  o.push(`<path d="M-10 ${GY + 14} Q300 ${GY + 8} 600 ${GY + 14} T${W + 10} ${GY + 12} V${GY + 36} Q600 ${GY + 38} 300 ${GY + 34} T-10 ${GY + 38}Z" fill="url(#d5t)" opacity=".85"/>`)
  for (let i = 0; i < 18; i++) o.push(`<path d="${streak(rnd() * W, GY + 16 + rnd() * 18, 30 + rnd() * 60, (rnd() - 0.5) * 0.1, 1.2 + rnd() * 1.8)}" fill="${['#f0d8a8', '#8a6a44'][i % 2]}" opacity="${r1(0.25 + rnd() * 0.3)}"/>`)
  const foot = GY + 8
  const shadow = (x: number, rx: number) => `<ellipse cx="${x + rx * 0.2}" cy="${foot + 2}" rx="${rx}" ry="${r1(rx * 0.17)}" fill="#2a1a3a" opacity=".32"/>`
  // loot: a pool of light, a soft column, a ring, a flare
  const lx = 410
  o.push(`<ellipse cx="${lx}" cy="${foot - 2}" rx="46" ry="9" fill="url(#d5ga)"/><rect x="${lx - 10}" y="${foot - 70}" width="20" height="70" fill="url(#d5l)" opacity=".7"/><circle cx="${lx}" cy="${foot - 16}" r="34" fill="url(#d5ga)"/>`)
  o.push(`<g class="d5b"><circle cx="${lx}" cy="${foot - 16}" r="9.5" fill="none" stroke="#9a6a1c" stroke-width="6.4" opacity=".6"/><circle cx="${lx}" cy="${foot - 16}" r="9.5" fill="none" stroke="#ffd860" stroke-width="4.4"/><circle cx="${lx - 3}" cy="${foot - 22}" r="2.2" fill="#fff"/><circle cx="${lx + 9}" cy="${foot - 25}" r="3.4" fill="#7fe6ff"/></g>`)
  o.push(`<path d="${streak(lx - 28, foot - 22, 56, 0, 1.6)}" fill="#fff" opacity=".8"/><path d="${streak(lx + 12, foot - 46, 24, Math.PI / 2, 1.6)}" fill="#fff" opacity=".9"/>`)
  o.push(label(C.loot, lx, foot - 56, 11, '#fff2c0', { anchor: 'middle', font: SERIF, weight: 'bold', stroke: '#4a2a1a', sw: 3.4, style: 'stroke-opacity=".7"' }))
  // the hero: the shared adventurer, painted without outlines: gradients, a soft shade side and a few dry-brush highlights
  const hx = 150
  const hv = HUM.hand, hd = HUM.head, sd = HUM.shield
  const lim = (d: string, w: number, c1: string, c2: string) => `<path d="${d}" fill="none" stroke="${c1}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c2}" stroke-width="${r1(w * 0.5)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(-.7 -.8)" opacity=".8"/>`
  const shade = (d: string, op = 0.28) => `<path d="${d}" fill="#2a1030" opacity="${op}"/>`
  o.push(shadow(hx, 26))
  o.push(`<circle cx="${hx}" cy="${foot - 40}" r="62" fill="url(#d5ga)" opacity=".5"/>`)
  o.push(`<g transform="translate(${hx} ${foot})">
<path d="${HUM.cape}" fill="url(#d5hc)"/>${shade('M0 -62 L11.5 -62 L18.5 -22 Q14 -18 10.5 -22 Q6 -17 1.5 -21Z')}<path d="${streak(-15, -38, 18, 1.45, 1.8)}" fill="#ffc0a8" opacity=".4"/>
<path d="${HUM.legL}" fill="url(#d5tr)"/><path d="${HUM.legR}" fill="url(#d5tr)"/>${shade('M1.6 -32 H9.4 L9.2 -9 H1.6Z', 0.2)}<path d="${streak(-7.5, -30, 20, Math.PI / 2, 1.6)}" fill="#c0b0e0" opacity=".35"/>
<path d="${HUM.bootL}" fill="url(#d5bt)"/><path d="${HUM.bootR}" fill="url(#d5bt)"/><path d="${HUM.cuffL}" fill="#f0c860"/><path d="${HUM.cuffR}" fill="#f0c860"/>
<path d="${HUM.tunic}" fill="url(#d5tu)"/>${shade('M3 -63 L11 -52 L9.6 -41 L11.4 -31.5 Q6 -29.6 2 -30.2Z', 0.3)}<path d="${HUM.collar}" fill="none" stroke="#f6e8c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="${HUM.hem}" fill="none" stroke="#f6e8c0" stroke-width="1.8" stroke-linecap="round" opacity=".9"/><path d="${streak(-9, -60, 16, 1.5, 1.8)}" fill="#cfe0ff" opacity=".5"/>
<path d="${HUM.belt}" fill="#7a4e28"/><path d="${HUM.buckle}" fill="#f6cf48"/>
${lim(HUM.shieldArm, 5.4, '#2e4a9a', '#6a96e0')}
<circle cx="${sd.cx}" cy="${sd.cy}" r="${sd.r}" fill="url(#d5s)"/><circle cx="${sd.cx}" cy="${sd.cy}" r="${sd.r - 1.4}" fill="none" stroke="#e8b840" stroke-width="2.2" opacity=".95"/><circle cx="${sd.cx}" cy="${sd.cy}" r="3.2" fill="#e05a4a"/><circle cx="${sd.cx - 1}" cy="${sd.cy - 1}" r="1.2" fill="#ffd0c0"/>
<path d="${HUM.neck}" fill="#e8b088"/>
<g id="hh5"><ellipse cx="${hd.cx}" cy="${hd.cy}" rx="${hd.rx}" ry="${hd.ry}" fill="url(#d5sk)"/><path d="${HUM.hair}" fill="url(#d5ha)"/></g><path d="M3.4 -78 Q6.6 -76 6.2 -71 Q4.6 -74 3.4 -78Z" fill="#2a1030" opacity=".25"/>
<ellipse cx="-2.6" cy="${HUM.eyeY}" rx="1.5" ry="1.7" fill="#fff6e8"/><ellipse cx="2.6" cy="${HUM.eyeY}" rx="1.5" ry="1.7" fill="#fff6e8"/><circle cx="-2.4" cy="${HUM.eyeY + 0.2}" r="1" fill="#3a2230"/><circle cx="2.8" cy="${HUM.eyeY + 0.2}" r="1" fill="#3a2230"/><path d="${HUM.mouth}" fill="none" stroke="#9a4a3a" stroke-width="1" stroke-linecap="round"/><ellipse cx="-4.3" cy="-70.4" rx="1.5" ry="1" fill="#ff8a7a" opacity=".45"/><ellipse cx="4.3" cy="-70.4" rx="1.5" ry="1" fill="#ff8a7a" opacity=".45"/>
${lim(HUM.swordArm, 5.4, '#2e4a9a', '#6a96e0')}<circle cx="${hv.x}" cy="${hv.y}" r="${hv.r}" fill="url(#d5sk)"/>
<g transform="translate(${hv.x} ${hv.y})"><g class="d5sw"><circle cx="0" cy="-22" r="26" fill="url(#d5ga)" opacity=".7"/><path d="${HUM.grip}" fill="url(#d5d)"/><path d="${HUM.blade}" fill="url(#d5bl)"/><path d="${HUM.fuller}" stroke="#8a98c0" stroke-width="1" fill="none" opacity=".6"/><path d="${HUM.guard}" fill="#f0c04a"/><circle cx="0" cy="5.4" r="1.8" fill="#f0c04a"/></g></g></g>`)
  o.push(humTrail(hx, foot, 1, (d, w, op) => `<path d="${d}" fill="none" stroke="#fff2c8" stroke-width="${w * 3}" stroke-linecap="round" opacity="${r1(op * 0.14)}"/><path d="${d}" fill="none" stroke="#fff2c8" stroke-width="${w * 1.5}" stroke-linecap="round" opacity="${r1(op * 0.25)}"/><path d="${d}" fill="none" stroke="#fffaf0" stroke-width="${r1(w * 0.45)}" stroke-linecap="round" opacity="${r1(op * 0.8)}"/>`))
  // HUD
  const bar = (x: number, y: number, w: number, hgt: number, f: number, c1: string, c2: string) => `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${hgt / 2}" fill="#2a1a3a" opacity=".55"/><rect x="${x}" y="${y}" width="${r1(w * f)}" height="${hgt}" rx="${hgt / 2}" fill="${c1}" opacity=".9"/><rect x="${x + 1}" y="${y + 1}" width="${r1(Math.max(2, w * f - 2))}" height="${r1(hgt * 0.35)}" rx="${hgt / 5}" fill="${c2}" opacity=".6"/>`
  const T = (s: string, x: number, y: number, size: number, fill: string, anchor = 'start', font = SERIF, wt = 'bold') => label(s, x, y, size, fill, { anchor, font, weight: wt, stroke: '#2a1030', sw: 2.2, style: 'stroke-opacity=".8"' })
  o.push(bar(hx - 34, 29, 68, 6, C.heroHp, '#6cc060', '#d8ffc0'))
  o.push(T(C.act, 14, 18, 13, '#fffdf2', 'start', SERIF, 'bold').replace('<text', '<text font-style="italic"'), T(C.who, W - 14, 18, 13, '#fffdf2', 'end'))
  o.push(`<rect y="${H - 24}" width="${W}" height="24" fill="#2a1a3a" opacity=".42"/>`, T(boss ? C.bossTask : C.task, 14, H - 8, 13, '#fff4dc', 'start', MONO))
  o.push(`<rect y="${H - 3}" width="${W}" height="3" fill="#2a1a3a" opacity=".5"/><rect y="${H - 3}" width="${r1(W * C.xp)}" height="3" fill="#ffd860"/>`)
  const flash = (x: number, y: number, s: number) => `<circle cx="${x}" cy="${y}" r="${22 * s}" fill="url(#d5w)"/><path d="${streak(x - 20 * s, y, 40 * s, 0, 2.4 * s)}" fill="#fff"/><path d="${streak(x, y - 18 * s, 36 * s, Math.PI / 2, 2.2 * s)}" fill="#fff"/><path d="${streak(x - 12 * s, y - 12 * s, 24 * s, Math.PI / 4, 1.6 * s)}" fill="#ffe6a0"/>`
  const dm = (t: string, x: number, y: number, size: number, c: string) => label(t, x, y, size, c, { anchor: 'middle', font: SERIF, weight: 'bold', stroke: '#5a2a14', sw: size / 4 + 1.5, style: 'stroke-opacity=".75"' })
  if (!boss) {
    ;[540, 632, 724].forEach((x, i) => {
      o.push(shadow(x, 26))
      o.push(`<g class="d5b" style="animation-delay:-${i * 0.4}s"><g transform="translate(${x} ${foot + (i % 2)})"><use href="#d5n"/></g></g>`)
      o.push(bar(x - 18, foot - 68 + (i % 2), 36, 4, [0.56, 0.8, 0.35][i]!, '#e05a4a', '#ffd0c0'))
    })
    const rx = 852
    o.push(`<circle cx="${rx}" cy="${foot - 36}" r="74" fill="url(#d5ga)"/>`, shadow(rx, 34))
    o.push(`<g class="d5b"><g transform="translate(${rx} ${foot}) scale(1.22)"><g><use href="#d5n"/></g><path d="M-22 -52 Q-22 -54 -18 -54 H18 Q22 -54 22 -50 V-24 Q22 -23 18 -23 H-18 Q-22 -23 -22 -27Z" fill="url(#d5bg)" opacity=".85"/><circle cx="-11" cy="-40" r="11" fill="url(#d5er)"/><circle cx="11" cy="-40" r="11" fill="url(#d5er)"/><ellipse cx="-11" cy="-40" rx="4" ry="3" fill="#fff0e0"/><ellipse cx="11" cy="-40" rx="4" ry="3" fill="#fff0e0"/><path d="M-13 -62 L-16 -78 L-7 -70 L0 -82 L7 -70 L16 -78 L13 -62Z" fill="url(#d5bg)"/><circle cx="0" cy="-70" r="2.6" fill="#ff6aa0"/></g></g>`)
    o.push(T(C.rare, W - 14, 33, 12, '#ffe890', 'end', SERIF, 'bold'), bar(W - 14 - 270, 38, 270, 7, C.foeHp, '#e05a4a', '#ffd0c0'))
    o.push(flash(512, foot - 40, 1), flash(rx - 40, foot - 52, 0.8))
    o.push(dm(C.hit[0]!, 548, foot - 66, 17, '#fff6e0'), dm(C.hit[1]!, 642, foot - 74, 14, '#fff6e0'), `<circle cx="772" cy="${foot - 50}" r="36" fill="url(#d5ga)"/>`, dm(C.hit[2]!, 772, foot - 44, 28, '#ffd860'))
  } else {
    const bx = 790
    o.push(`<circle cx="${bx}" cy="${foot - 48}" r="110" fill="url(#d5ra)"/>`, shadow(bx, 60))
    o.push(`<g class="d5b"><g transform="translate(${bx} ${foot}) scale(1.4)"><use href="#d5n"/><circle cx="-11" cy="-40" r="12" fill="url(#d5er)"/><circle cx="11" cy="-40" r="12" fill="url(#d5er)"/><ellipse cx="-11" cy="-40" rx="4" ry="3" fill="#fff0e0"/><ellipse cx="11" cy="-40" rx="4" ry="3" fill="#fff0e0"/><path d="M-20 -54 Q-36 -62 -30 -80 Q-26 -66 -14 -60Z M20 -54 Q36 -62 30 -80 Q26 -66 14 -60Z" fill="#f4ead0"/></g></g>`)
    o.push(T(`Lv 18  ${C.boss}`, 700, 33, 13, '#ffb0a0', 'end', SERIF, 'bold'), bar(460, 38, 240, 8, C.foeHp, '#e05a4a', '#ffd0c0'))
    o.push(flash(724, foot - 34, 1.1), dm(C.hit[0]!, 700, foot - 46, 17, '#fff6e0'), `<circle cx="900" cy="${foot - 56}" r="36" fill="url(#d5ga)"/>`, dm(C.hit[2]!, 900, foot - 50, 28, '#ffd860'))
  }
  // light motes and a soft vignette
  for (let i = 0; i < 14; i++) o.push(`<circle class="d5m" style="animation-delay:-${(i * 0.7).toFixed(1)}s" cx="${r1(rnd() * W)}" cy="${r1(20 + rnd() * 90)}" r="${r1(0.8 + rnd() * 1.6)}" fill="#fff6d0" opacity="${r1(0.3 + rnd() * 0.4)}"/>`)
  o.push(`<rect width="${W}" height="${H}" fill="url(#d5v)"/>`)
  return svgOf(o.join(''))
}
DIRECTIONS.push({ id: 'D5', name: 'Painterly', font: 'Georgia, Consolas', frame: d5Frame })

// ======================= D6. Paper cutout storybook =======================
const PAPER = '#fff8ea'
const PSH = '#3a2418'
/** A paper piece: a soft shadow offset below, then the shape with a cream die-cut edge. */
const cut = (d: string, fill: string, sh = 2.4, edge = 3.2, extra = '') =>
  `<path d="${d}" fill="${PSH}" opacity=".26" transform="translate(${sh * 0.8} ${sh * 1.2})"/><path d="${d}" fill="${fill}" stroke="${PAPER}" stroke-width="${edge * 2}" stroke-linejoin="round" paint-order="stroke" ${extra}/>`
const ellp = (cx: number, cy: number, rx: number, ry: number) => `M${r1(cx - rx)} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`
const rrect = (x: number, y: number, w: number, hh: number, r: number) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + hh - r}Q${x + w} ${y + hh} ${x + w - r} ${y + hh}H${x + r}Q${x} ${y + hh} ${x} ${y + hh - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`
const scallop = (x0: number, x1: number, y: number, r: number) => { let d = `M${x0} ${y}`; for (let x = x0; x < x1; x += r * 2) d += `a${r} ${r} 0 0 1 ${r * 2} 0`; return d }
const d6Box = (rare: boolean) => {
  const kraft = rare ? '#f6d24a' : '#d9a86a', dark = rare ? '#d9a82a' : '#b8844a', tape = rare ? '#fff2b0' : '#f0d9a0'
  return `${cut(`M-17 -22 Q-20 -8 -11 -6 Q-8 2 -2 -3 Q4 3 9 -4 Q19 -8 17 -22Z`, '#bdaae8')}
${cut('M-21 -52 L-33 -63 L-14 -59 L-7 -52Z', dark, 1.6, 2.6)}${cut('M21 -52 L33 -63 L14 -59 L7 -52Z', dark, 1.6, 2.6)}
${cut(rrect(-21, -52, 42, 30, 3), kraft)}<path d="M-5 -52 H5 V-22 H-5Z" fill="${tape}"/><path d="M-21 -29 H21 V-22 H-21Z" fill="${dark}" opacity=".5"/><path d="M-19 -50 H19" stroke="${PAPER}" stroke-width="1" stroke-dasharray="3 2.4" opacity=".7"/>
<circle cx="-10" cy="-39" r="6.4" fill="#fff"/><circle cx="10" cy="-39" r="6.4" fill="#fff"/><circle cx="-8.4" cy="-38" r="3.3" fill="${rare ? '#d83a3a' : '#2a1a24'}"/><circle cx="8.4" cy="-38" r="3.3" fill="${rare ? '#d83a3a' : '#2a1a24'}"/>
<path d="M-17 -49 L-5 -44 M17 -49 L5 -44" stroke="#3a2418" stroke-width="3" stroke-linecap="round"/><path d="M-10 -28 L-6 -24.6 L-2 -28 L2 -24.6 L6 -24.6 L10 -28Z" fill="#3a2418"/>
${rare ? `${cut('M-13 -62 L-16 -78 L-7 -70 L0 -82 L7 -70 L16 -78 L13 -62Z', '#ff9a3a', 1.6, 2.4)}<circle cx="0" cy="-70" r="2.6" fill="#ff4a8a"/><circle cx="-8" cy="-67" r="1.8" fill="#5ad1ff"/><circle cx="8" cy="-67" r="1.8" fill="#6aff9a"/>` : ''}`
}
const d6Frame = (boss: boolean): string => {
  const o: string[] = []
  const rnd = rng(66)
  o.push(`<defs><pattern id="d6g" width="23" height="19" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".7" fill="#5a3a20"/><circle cx="14" cy="9" r=".6" fill="#5a3a20"/><circle cx="8" cy="16" r=".8" fill="#fff"/><circle cx="19" cy="2" r=".5" fill="#fff"/><path d="M2 11 q3 -1 5 1" stroke="#5a3a20" stroke-width=".4" fill="none"/></pattern>
<g id="d6n">${d6Box(false)}</g><g id="d6r">${d6Box(true)}</g>
<style>.d6sw{animation:d6sw .84s ease-in-out infinite}@keyframes d6sw{0%,100%{transform:rotate(-35deg)}50%{transform:rotate(62deg)}}
.d6b{animation:d6b 1.1s steps(2) infinite}@keyframes d6b{50%{transform:translateY(-3px) rotate(-1.5deg)}}
.d6t{transform-box:fill-box;transform-origin:50% 50%;animation:d6t 1s steps(2) infinite}@keyframes d6t{50%{transform:rotate(18deg) scale(.85)}}</style></defs>`)
  o.push(`<rect width="${W}" height="${H}" fill="#8fcfc4"/>`)
  // the sun, stars and clouds, each cut from its own sheet
  o.push(cut(ellp(470, 36, 24, 24), '#ffe08a', 2, 2.6), `<path d="${ellp(470, 36, 14, 14)}" fill="#ffc94a"/>`)
  for (const [x, y, s] of [[110, 28, 1], [300, 20, 1.3], [640, 30, 1.1], [860, 24, 1.2]] as const) o.push(cut(`M${x - 34 * s} ${y + 10 * s} ${scallop(x - 34 * s, x + 34 * s, y + 10 * s, 8.5 * s)} Z`, PAPER, 2, 0.1))
  for (const [x, y] of [[40, 56], [200, 62], [380, 44], [560, 62], [760, 52], [930, 66]] as const) o.push(`<path d="M${x} ${y - 6}l1.8 4.2 4.6 .4 -3.5 3 1.1 4.5 -4 -2.4 -4 2.4 1.1 -4.5 -3.5 -3 4.6 -.4z" fill="#fff4b8" opacity=".9"/>`)
  // layers of hills with scalloped edges, stitched
  const hill = (base: number, amp: number, fill: string, seed: number, stitch = true) => {
    const r2 = rng(seed); let d = `M-10 ${GY + 8} L-10 ${base}`
    for (let x = -10; x < W + 20; x += 60) d += ` Q${x + 30} ${r1(base - amp * (0.5 + r2() * 0.8))} ${x + 60} ${r1(base + (r2() - 0.5) * 8)}`
    const edge = d.replace(`M-10 ${GY + 8} L-10 ${base}`, `M-10 ${base}`)
    return cut(`${d} V${GY + 8}Z`, fill, 3, 0.1) + (stitch ? `<path d="${edge}" fill="none" stroke="${PAPER}" stroke-width="1.4" stroke-dasharray="4 3.2" opacity=".8" transform="translate(0 5)"/>` : '')
  }
  o.push(hill(78, 24, '#a9d6a0', 1), hill(92, 18, '#7fbf8a', 2), hill(102, 12, '#4f9a78', 3))
  // pine trees, three paper triangles each
  const pine = (x: number, s: number) => `<g transform="translate(${x} ${GY + 2}) scale(${s})">${cut('M-3 0V-12H3V0Z', '#9a6a3a', 1.4, 1.6)}${cut('M-16 -8L0 -30L16 -8Z', '#2f7a6a', 2, 2.4)}${cut('M-13 -22L0 -42L13 -22Z', '#3a8a74', 2, 2.4)}${cut('M-10 -36L0 -54L10 -36Z', '#4a9a80', 2, 2.4)}</g>`
  for (const [x, s] of [[24, 1.1], [64, 0.9], [296, 1], [330, 0.8], [468, 0.85], [925, 1.1], [945, 0.8]] as const) o.push(pine(x, s))
  // the ground: kraft paper with a torn, grassy top edge
  let tear = `M-10 ${GY + 2}`
  for (let x = -10; x < W + 20; x += 8) tear += ` L${x + 4} ${r1(GY - 1 - rnd() * 4)} L${x + 8} ${r1(GY + 2)}`
  o.push(cut(`${tear} V${H + 4} H-10Z`, '#6ab04c', 2.6, 0.1))
  o.push(cut(`M-10 ${GY + 12} Q300 ${GY + 8} 600 ${GY + 12} T${W + 10} ${GY + 10} V${H + 4} H-10Z`, '#d2a06a', 3, 0.1), `<path d="M-10 ${GY + 17} Q300 ${GY + 13} 600 ${GY + 17} T${W + 10} ${GY + 15}" fill="none" stroke="${PAPER}" stroke-width="1.4" stroke-dasharray="5 3.4" opacity=".8"/>`)
  const foot = GY + 8
  const sh = (x: number, rx: number) => `<ellipse cx="${x + 3}" cy="${foot + 2}" rx="${rx}" ry="${r1(rx * 0.16)}" fill="${PSH}" opacity=".25"/>`
  // loot: a gold foil ring on a little paper starburst
  const lx = 410
  o.push(sh(lx, 18))
  o.push(`<g class="d6b">${cut(`M${lx - 22} ${foot - 16}L${lx - 14} ${foot - 22}L${lx - 12} ${foot - 32}L${lx - 3} ${foot - 28}L${lx + 6} ${foot - 34}L${lx + 10} ${foot - 25}L${lx + 20} ${foot - 22}L${lx + 14} ${foot - 14}L${lx + 18} ${foot - 4}L${lx + 7} ${foot - 6}L${lx} ${foot + 2}L${lx - 7} ${foot - 6}L${lx - 18} ${foot - 5}Z`, '#ffe680', 2.2, 2.4)}<path d="${ellp(lx, foot - 16, 9.5, 9.5)}M${lx + 4.4} ${foot - 16}a4.4 4.4 0 1 0 -8.8 0a4.4 4.4 0 1 0 8.8 0Z" fill="#f0a020" fill-rule="evenodd" stroke="#a8641c" stroke-width="1.2"/><circle cx="${lx + 8}" cy="${foot - 23}" r="2.6" fill="#5ad1ff"/></g>`)
  o.push(`<g class="d6t"><path d="M${lx + 20} ${foot - 40}l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#fff" stroke="#e8b050" stroke-width="1.2"/></g>`)
  const ribbon = (x: number, y: number, w: number, hh: number, fill: string) => cut(`M${x} ${y}H${x + w}l-6 ${hh / 2}l6 ${hh / 2}H${x}l6 ${-hh / 2}Z`, fill, 2, 0.1)
  const T = (s: string, x: number, y: number, size: number, fill: string, anchor = 'start', wt = 'normal', font = SERIF) => label(s, x, y, size, fill, { anchor, font, weight: wt })
  o.push(ribbon(lx - 56, foot - 64, 112, 18, '#ffe6a0'), T(C.loot, lx, foot - 51, 11, '#5a3a20', 'middle', 'bold'))
  // the hero: the shared adventurer, each piece cut separately from its own sheet
  const hx = 150
  const hv = HUM.hand, hd = HUM.head, sd = HUM.shield
  const strip = (x0: number, y0: number, x1: number, y1: number, w: number, fill: string) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = (-dy / l) * w / 2, ny = (dx / l) * w / 2; return cut(`M${r1(x0 + nx)} ${r1(y0 + ny)}L${r1(x1 + nx)} ${r1(y1 + ny)}L${r1(x1 - nx)} ${r1(y1 - ny)}L${r1(x0 - nx)} ${r1(y0 - ny)}Z`, fill, 1.2, 1.4) }
  const stitch = (d: string) => `<path d="${d}" fill="none" stroke="${PAPER}" stroke-width="1" stroke-dasharray="2.6 2" opacity=".85"/>`
  o.push(sh(hx, 26))
  o.push(`<g transform="translate(${hx} ${foot})">
${cut(HUM.cape, '#d8503e', 1.6, 1.6)}${stitch('M-9 -58 L-15 -26 M9 -58 L15 -26')}
${cut(HUM.legL, '#5a4a7a', 1.2, 1.4)}${cut(HUM.legR, '#5a4a7a', 1.2, 1.4)}
${cut(HUM.bootL, '#8a5a34', 1.2, 1.4)}${cut(HUM.bootR, '#8a5a34', 1.2, 1.4)}${cut(HUM.cuffL, '#e8c070', 0.8, 1)}${cut(HUM.cuffR, '#e8c070', 0.8, 1)}
${cut(HUM.tunic, '#4a7ac8', 1.6, 1.6)}<path d="M3 -63 L11 -52 L9.6 -41 L11.4 -31.5 Q6 -29.6 2 -30.2Z" fill="#2c4a98" opacity=".3"/>${stitch(HUM.hem)}<path d="${HUM.collar}" fill="none" stroke="${PAPER}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
${cut(HUM.belt, '#7a4a22', 0.8, 1)}${cut(HUM.buckle, '#f2b82a', 0.6, 0.8)}
${strip(-12, -60, -17.5, -51, 5.4, '#4a7ac8')}
${cut(`M${sd.cx - sd.r} ${sd.cy}a${sd.r} ${sd.r} 0 1 0 ${sd.r * 2} 0a${sd.r} ${sd.r} 0 1 0 ${-sd.r * 2} 0Z`, '#d2dcee', 1.6, 1.6)}<circle cx="${sd.cx}" cy="${sd.cy}" r="${sd.r - 2.4}" fill="none" stroke="#f2b82a" stroke-width="1.8" stroke-dasharray="3 2.2"/><circle cx="${sd.cx}" cy="${sd.cy}" r="3" fill="#e8584a" stroke="${PAPER}" stroke-width="1"/>
${cut(HUM.neck, '#e8b088', 0.5, 0.6)}
<g id="hh6">${cut(`M${hd.cx - hd.rx} ${hd.cy}a${hd.rx} ${hd.ry} 0 1 0 ${hd.rx * 2} 0a${hd.rx} ${hd.ry} 0 1 0 ${-hd.rx * 2} 0Z`, '#f6c9a0', 1.2, 1.4)}${cut(HUM.hair, '#6a3a1e', 0.8, 1)}</g>
<ellipse cx="-2.6" cy="${HUM.eyeY}" rx="1.5" ry="1.7" fill="#fff"/><ellipse cx="2.6" cy="${HUM.eyeY}" rx="1.5" ry="1.7" fill="#fff"/><circle cx="-2.4" cy="${HUM.eyeY + 0.2}" r="1" fill="#2a1a24"/><circle cx="2.8" cy="${HUM.eyeY + 0.2}" r="1" fill="#2a1a24"/><path d="${HUM.mouth}" fill="none" stroke="#7a3a2a" stroke-width="1" stroke-linecap="round"/><circle cx="-4.3" cy="-70.4" r="1.1" fill="#ee8a7a" opacity=".6"/><circle cx="4.3" cy="-70.4" r="1.1" fill="#ee8a7a" opacity=".6"/>
${strip(12, -60.5, 24.5, -57.5, 5.4, '#4a7ac8')}${strip(24.5, -57.5, 28, -66.8, 5.4, '#4a7ac8')}${cut(`M${hv.x - hv.r} ${hv.y}a${hv.r} ${hv.r} 0 1 0 ${hv.r * 2} 0a${hv.r} ${hv.r} 0 1 0 ${-hv.r * 2} 0Z`, '#f6c9a0', 0.8, 1)}
<g transform="translate(${hv.x} ${hv.y})"><g class="d6sw">${cut(HUM.grip, '#7a4a22', 0.8, 1)}${cut(HUM.blade, '#e8eef8', 1.4, 1.4)}<path d="${HUM.fuller}" stroke="#a8b8d8" stroke-width="1" fill="none"/>${cut(HUM.guard, '#f2b82a', 0.8, 1)}</g></g></g>`)
  o.push(humTrail(hx, foot, 1, (d, w) => `<path d="${d}" fill="none" stroke="${PSH}" stroke-opacity=".22" stroke-width="${w + 1}" stroke-linecap="round" transform="translate(1.4 2)"/><path d="${d}" fill="none" stroke="#fffdf2" stroke-width="${w}" stroke-linecap="round"/>`))
  // HUD: paper strips and ribbons
  const bar = (x: number, y: number, w: number, hh: number, f: number, c: string) => `${cut(rrect(x, y, w, hh, 2), '#6a4a34', 1.6, 1.4)}<path d="${rrect(x + 1, y + 1, r1(Math.max(4, (w - 2) * f)), hh - 2, 1.5)}" fill="${c}"/><path d="M${x + 3} ${y + hh / 2}H${r1(x + (w - 2) * f - 2)}" stroke="${PAPER}" stroke-width="1" stroke-dasharray="3 2.4" opacity=".8"/>`
  o.push(bar(hx - 34, 29, 68, 8, C.heroHp, '#7cc86a'))
  o.push(ribbon(8, 6, C.act.length * 7.6 + 30, 22, '#ffe6a0'), T(C.act, 22, 21, 13, '#5a3a20', 'start', 'normal').replace('<text', '<text font-style="italic"'))
  const task = boss ? C.bossTask : C.task
  o.push(ribbon(8, H - 30, task.length * 7.4 + 30, 22, '#ffe6a0'), T(task, 22, H - 14.5, 13, '#5a3a20', 'start', 'normal', MONO))
  const wl = C.who.length * 7.6 + 30
  o.push(ribbon(W - 8 - 190 - 12 - wl, H - 30, wl, 22, '#cfe8c8'), T(C.who, W - 8 - 190 - 12 - wl / 2, H - 14.5, 13, '#3a5a30', 'middle'))
  o.push(bar(W - 8 - 160, H - 27, 160, 12, C.xp, '#5ab0e8'), T(`${Math.round(C.xp * 100)}%`, W - 8 - 168, H - 16, 11, '#fff8ea', 'end', 'bold'))
  const burst = (x: number, y: number, s: number) => { let d = ''; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = (i % 2 ? 9 : 19) * s; d += `${i ? 'L' : 'M'}${r1(x + Math.cos(a) * r)} ${r1(y + Math.sin(a) * r)}` } return cut(d + 'Z', '#ffd84a', 1.6, 2) }
  const dm = (t: string, x: number, y: number, size: number, c: string) => `<g transform="translate(${x} ${y})">${label(t, 2, 2.5, size, PSH, { anchor: 'middle', font: SERIF, weight: 'bold', style: 'opacity=".3"' })}${label(t, 0, 0, size, c, { anchor: 'middle', font: SERIF, weight: 'bold', stroke: PAPER, sw: size / 3.2 })}</g>`
  if (!boss) {
    ;[540, 632, 724].forEach((x, i) => {
      o.push(sh(x, 26))
      o.push(`<g class="d6b" style="animation-delay:-${i * 0.3}s"><g transform="translate(${x} ${foot + (i % 2)})"><use href="#d6n"/></g></g>`)
      o.push(bar(x - 20, foot - 80 + (i % 2), 40, 7, [0.56, 0.8, 0.35][i]!, '#e8584a'))
    })
    const rx = 852
    o.push(sh(rx, 30))
    o.push(`<g class="d6b"><g transform="translate(${rx} ${foot}) scale(.98)"><use href="#d6r"/></g></g>`)
    o.push(ribbon(W - 14 - 330, 8, 330, 20, '#fff0b0'), T(C.rare, W - 14 - 165, 22.5, 12, '#6a4010', 'middle', 'bold'), bar(W - 14 - 270, 32, 270, 9, C.foeHp, '#e8584a'))
    o.push(burst(512, foot - 42, 1), burst(rx - 44, foot - 56, 0.8))
    o.push(dm(C.hit[0]!, 548, foot - 66, 18, '#d8403a'), dm(C.hit[1]!, 646, foot - 74, 15, '#5a7ac8'), dm(C.hit[2]!, 772, foot - 44, 28, '#ff8a1a'))
  } else {
    const bx = 800
    o.push(sh(bx, 62))
    o.push(`<g class="d6b"><g transform="translate(${bx} ${foot}) scale(1.4)"><use href="#d6n"/>${cut('M-20 -54 Q-36 -62 -30 -80 Q-26 -66 -14 -60Z', '#fff2d4', 1.6, 2)}${cut('M20 -54 Q36 -62 30 -80 Q26 -66 14 -60Z', '#fff2d4', 1.6, 2)}</g></g>`)
    o.push(ribbon(450, 8, 250, 20, '#ffd0c0'), T(`Lv 18  ${C.boss}`, 575, 22.5, 12, '#7a2a20', 'middle', 'bold'), bar(450, 32, 240, 9, C.foeHp, '#e8584a'))
    o.push(burst(724, foot - 34, 1.1), dm(C.hit[0]!, 700, foot - 46, 18, '#d8403a'), dm(C.hit[2]!, 900, foot - 62, 28, '#ff8a1a'))
  }
  o.push(`<rect width="${W}" height="${H}" fill="url(#d6g)" opacity=".16"/>`)
  return svgOf(o.join(''))
}
DIRECTIONS.push({ id: 'D6', name: 'Paper cutout storybook', font: 'Georgia, Consolas', frame: d6Frame })

// ======================= D7. Woodblock print (wildcard) =======================
const K7 = '#1b1a26', IND = '#234a78', IND2 = '#3f78a8', IND3 = '#9cc4d8', CRM = '#f3e8d0', VRM = '#d6402c', OCH = '#d9a441', SND = '#ebd6a4'
/** Flat color with a bold ink edge: the stroke is laid down first and the fill covers its inner half. */
const ink = (d: string, fill: string, w = 4.4, extra = '') => `<path d="${d}" fill="${fill}" stroke="${K7}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke" ${extra}/>`
const d7Box = (kind: 'n' | 'r') => {
  const box = kind === 'r' ? OCH : '#e2bf86', tape = kind === 'r' ? VRM : IND
  return `${ink('M-18 -24 Q-22 -10 -13 -6 L-9 4 L-3 -4 L2 6 L7 -4 L14 -6 Q22 -10 18 -24Z', CRM, 4)}<path d="M-12 -12 q3 -3 6 0 M2 -12 q3 -3 6 0" stroke="${IND2}" stroke-width="1.2" fill="none"/>
${ink('M-21 -52 L-33 -64 L-14 -59 L-7 -52Z', box, 3.6)}${ink('M21 -52 L33 -64 L14 -59 L7 -52Z', box, 3.6)}
${ink(rrect(-21, -52, 42, 30, 3), box, 4.4)}<path d="M-5 -52 H5 V-22 H-5Z" fill="${tape}"/><path d="M-21 -30 H21" stroke="${K7}" stroke-width="1" opacity=".35"/><path d="M-17 -46 l5 5 M-17 -41 l5 5 M12 -30 l5 5 M12 -35 l5 5" stroke="${K7}" stroke-width="1" opacity=".3"/>
<ellipse cx="-11" cy="-39" rx="6.4" ry="4" transform="rotate(14 -11 -39)" fill="${kind === 'r' ? '#fff' : '#ffe27a'}" stroke="${K7}" stroke-width="1.8"/><ellipse cx="11" cy="-39" rx="6.4" ry="4" transform="rotate(-14 11 -39)" fill="${kind === 'r' ? '#fff' : '#ffe27a'}" stroke="${K7}" stroke-width="1.8"/>
<path d="M-11 -42 v6 M11 -42 v6" stroke="${K7}" stroke-width="2.4" stroke-linecap="round"/><path d="M-17 -49 L-5 -45 M17 -49 L5 -45" stroke="${K7}" stroke-width="3.2" stroke-linecap="round"/>
<path d="M-11 -30 Q0 -24 11 -30 L8 -26 L5 -29 L0 -25 L-5 -29 L-8 -26Z" fill="${K7}" stroke="${K7}" stroke-width="1.6" stroke-linejoin="round"/>
${kind === 'r' ? `${ink('M-12 -62 Q-26 -66 -26 -82 Q-18 -70 -8 -66Z M12 -62 Q26 -66 26 -82 Q18 -70 8 -66Z', VRM, 3.2)}${ink('M-9 -62 L0 -72 L9 -62Z', OCH, 3)}` : ''}`
}
const d7Frame = (boss: boolean): string => {
  const o: string[] = []
  const rnd = rng(77)
  o.push(`<defs><linearGradient id="d7s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${IND}"/><stop offset=".4" stop-color="#7aa6c4"/><stop offset=".78" stop-color="#d8dcc8"/><stop offset="1" stop-color="${CRM}"/></linearGradient>
<pattern id="d7w" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="${IND}"/>
${[[0, 10], [40, 10], [20, 20]].map(([x, y]) => [20, 15, 10, 5].map((r, i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? IND : IND2}" stroke="${CRM}" stroke-opacity=".55" stroke-width="1.1"/>`).join('')).join('')}</pattern>
<pattern id="d7g" width="26" height="22" patternUnits="userSpaceOnUse"><path d="M0 5 q6 -3 12 0 t12 0 M3 16 q6 -3 12 0 t12 0" stroke="#7a5a30" stroke-width=".8" fill="none" opacity=".35"/><circle cx="6" cy="11" r=".7" fill="#7a5a30" opacity=".4"/></pattern>
<pattern id="d7p" width="19" height="17" patternUnits="userSpaceOnUse"><circle cx="4" cy="3" r=".6" fill="#5a3a20"/><circle cx="13" cy="9" r=".5" fill="#5a3a20"/><circle cx="8" cy="14" r=".7" fill="#fff"/></pattern>
<g id="d7n">${d7Box('n')}</g><g id="d7r">${d7Box('r')}</g>
<style>.d7sw{animation:d7sw .84s ease-in-out infinite}@keyframes d7sw{0%,100%{transform:rotate(-35deg)}50%{transform:rotate(62deg)}}
.d7b{animation:d7b 1.2s steps(2) infinite}@keyframes d7b{50%{transform:translateY(-3px)}}
.d7t{transform-box:fill-box;transform-origin:50% 50%;animation:d7t 1s steps(2) infinite}@keyframes d7t{50%{transform:scale(.75)}}</style></defs>`)
  o.push(`<rect width="${W}" height="${GY + 4}" fill="url(#d7s)"/>`)
  for (let i = 0; i < 7; i++) o.push(`<path d="M-10 ${r1(6 + i * 9 + rnd() * 6)} q250 ${r1(-4 + rnd() * 8)} 500 0 t480 0" stroke="#fff" stroke-width=".8" fill="none" opacity=".16"/>`)
  // the sun, cloud bands with curled ends, a snow-capped peak
  const sx = boss ? 760 : 740
  o.push(`<circle cx="${sx}" cy="76" r="34" fill="${VRM}"/>`)
  const cloud = (x: number, y: number, w: number) => `<path d="M${x} ${y} q${w / 4} -7 ${w / 2} -2 q${w / 4} -6 ${w / 2 - 6} 1 q8 -4 8 3 q-2 5 -8 2 q-${w / 4} 5 -${w / 2} 0 q-${w / 4} 4 -${w / 2} -2z" fill="${CRM}" stroke="${K7}" stroke-width="1.6" stroke-linejoin="round" opacity=".95"/>`
  o.push(cloud(90, 36, 130), cloud(300, 24, 150), cloud(580, 38, 120), cloud(840, 26, 100), cloud(20, 62, 90))
  o.push(ink('M330 82 L430 36 L460 36 L560 82Z', IND2, 3.2), `<path d="M418 41 L430 36 L460 36 L472 44 L458 40 L452 47 L444 41 L436 48 L428 41Z" fill="${CRM}" stroke="${K7}" stroke-width="1.6" stroke-linejoin="round"/>`)
  // the sea in seigaiha scales, a hard ink horizon, the sand
  o.push(`<rect y="80" width="${W}" height="${GY - 80 + 2}" fill="url(#d7w)"/><path d="M0 80.5 H${W}" stroke="${K7}" stroke-width="2.4"/>`)
  o.push(`<rect y="${GY}" width="${W}" height="${H - GY}" fill="${SND}"/><rect y="${GY}" width="${W}" height="${H - GY}" fill="url(#d7g)"/><path d="M0 ${GY} q40 -5 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="${K7}" stroke-width="2.6"/><path d="M0 ${GY + 5} q40 -5 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="${CRM}" stroke-width="3" opacity=".9"/>`)
  const foot = GY + 8
  const sh = (x: number, rx: number) => `<ellipse cx="${x}" cy="${foot + 1}" rx="${rx}" ry="${r1(rx * 0.16)}" fill="${K7}" opacity=".28"/>`
  // loot: a gold coin with a square hole, rays like a rising sun
  const lx = 410
  o.push(sh(lx, 18))
  o.push(`<g class="d7b"><g transform="translate(${lx} ${foot - 18})">${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<path d="M0 -16V-${a % 90 ? 22 : 27}" transform="rotate(${a})" stroke="${K7}" stroke-width="3.4" stroke-linecap="round"/><path d="M0 -16V-${a % 90 ? 22 : 27}" transform="rotate(${a})" stroke="${OCH}" stroke-width="1.6" stroke-linecap="round"/>`).join('')}${ink(`M-11 0a11 11 0 1 0 22 0a11 11 0 1 0 -22 0Z M-4 -4H4V4H-4Z`, OCH, 4, 'fill-rule="evenodd"')}<path d="M-7 -6 Q-4 -9 0 -9.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></g>`)
  o.push(`<g class="d7t"><path d="M${lx + 20} ${foot - 46}l2.4 7 7 2.4 -7 2.4 -2.4 7 -2.4 -7 -7 -2.4 7 -2.4z" fill="#fff" stroke="${K7}" stroke-width="1.6" stroke-linejoin="round"/></g>`)
  const cart = (x: number, y: number, w: number, hh: number, fill = CRM) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${fill}" stroke="${K7}" stroke-width="2.4"/><rect x="${x + 2.5}" y="${y + 2.5}" width="${w - 5}" height="${hh - 5}" fill="none" stroke="${VRM}" stroke-width="1"/>`
  const T = (s: string, x: number, y: number, size: number, fill = K7, anchor = 'start', wt = 'normal', font = SERIF) => label(s, x, y, size, fill, { anchor, font, weight: wt })
  o.push(cart(lx - 58, foot - 66, 116, 17), T(C.loot, lx, foot - 53.5, 11, K7, 'middle', 'bold'))
  // the hero: the shared adventurer in flat blocks of color, a bold ink edge and a few cut hatching lines
  const hx = 150
  const hv = HUM.hand, hd = HUM.head, sd = HUM.shield
  const limb = (d: string, w: number, f: string) => `<path d="${d}" fill="none" stroke="${K7}" stroke-width="${w + 3.4}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${f}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
  const hatch = (d: string) => `<path d="${d}" stroke="${K7}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>`
  const TRS7 = '#3a3550', BOOT7 = '#5a3a26'
  o.push(sh(hx, 26))
  o.push(`<g transform="translate(${hx} ${foot})">
${ink(HUM.cape, VRM, 3.4)}${hatch('M-9 -58 L-15 -26 M-5 -56 L-9 -24 M9 -58 L15 -26 M5 -56 L9 -24')}
${ink(HUM.legL, TRS7, 3.2)}${ink(HUM.legR, TRS7, 3.2)}${hatch('M5 -30 V-12 M7.5 -30 V-12')}
${ink(HUM.bootL, BOOT7, 3.2)}${ink(HUM.bootR, BOOT7, 3.2)}${ink(HUM.cuffL, OCH, 2.4)}${ink(HUM.cuffR, OCH, 2.4)}
${ink(HUM.tunic, IND, 3.4)}${hatch('M4 -56 L8 -44 M6 -58 L10 -46 M4 -44 L6 -34')}<path d="${HUM.collar}" fill="none" stroke="${CRM}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="${HUM.hem}" fill="none" stroke="${CRM}" stroke-width="1.8" stroke-linecap="round"/>
${ink(HUM.belt, OCH, 2.4)}${ink(HUM.buckle, VRM, 2)}
${limb(HUM.shieldArm, 5.4, IND)}
<circle cx="${sd.cx}" cy="${sd.cy}" r="${sd.r}" fill="${IND2}" stroke="${K7}" stroke-width="3.2"/><circle cx="${sd.cx}" cy="${sd.cy}" r="${sd.r - 1.6}" fill="none" stroke="${OCH}" stroke-width="1.8"/><path d="M${sd.cx - 6} ${sd.cy + 3} a3 3 0 0 1 6 0 a3 3 0 0 1 6 0 M${sd.cx - 3} ${sd.cy + 6.4} a3 3 0 0 1 6 0" stroke="${CRM}" stroke-width="1" fill="none"/><circle cx="${sd.cx}" cy="${sd.cy - 2.4}" r="2.8" fill="${VRM}" stroke="${K7}" stroke-width="1.6"/>
${ink(HUM.neck, SND, 2)}
<g id="hh7">${ink(`M${hd.cx - hd.rx} ${hd.cy}a${hd.rx} ${hd.ry} 0 1 0 ${hd.rx * 2} 0a${hd.rx} ${hd.ry} 0 1 0 ${-hd.rx * 2} 0Z`, SND, 3)}${ink(HUM.hair, K7, 2.2)}</g>
<ellipse cx="-2.6" cy="${HUM.eyeY}" rx="1.25" ry="1.5" fill="${K7}"/><ellipse cx="2.6" cy="${HUM.eyeY}" rx="1.25" ry="1.5" fill="${K7}"/><circle cx="-2.2" cy="${HUM.eyeY - 0.6}" r=".45" fill="${CRM}"/><circle cx="3" cy="${HUM.eyeY - 0.6}" r=".45" fill="${CRM}"/><path d="${HUM.mouth}" fill="none" stroke="${K7}" stroke-width="1" stroke-linecap="round"/>
${limb(HUM.swordArm, 5.4, IND)}<circle cx="${hv.x}" cy="${hv.y}" r="${hv.r}" fill="${SND}" stroke="${K7}" stroke-width="2"/>
<g transform="translate(${hv.x} ${hv.y})"><g class="d7sw">${ink(HUM.grip, BOOT7, 2.2)}${ink(HUM.blade, CRM, 3)}<path d="${HUM.fuller}" stroke="${IND3}" stroke-width="1.1" fill="none"/>${ink(HUM.guard, OCH, 2.4)}<circle cx="0" cy="5.4" r="1.8" fill="${OCH}" stroke="${K7}" stroke-width="1.5"/></g></g></g>`)
  o.push(humTrail(hx, foot, 1, (d, w) => `<path d="${d}" fill="none" stroke="${K7}" stroke-width="${w + 3.4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${CRM}" stroke-width="${w}" stroke-linecap="round"/>`))
  // HUD: cartouches, a red seal for the level, ink bars
  const bar = (x: number, y: number, w: number, hh: number, f: number, c: string) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${IND}" stroke="${K7}" stroke-width="2"/><rect x="${x + 1}" y="${y + 1}" width="${r1(Math.max(3, (w - 2) * f))}" height="${hh - 2}" fill="${c}"/><path d="M${x + 4} ${y + hh / 2}H${r1(x + (w - 2) * f - 3)}" stroke="#fff" stroke-width="1" opacity=".5"/>`
  const seal = (x: number, y: number, s: string) => `<rect x="${x}" y="${y}" width="28" height="28" fill="${VRM}" stroke="${K7}" stroke-width="2"/><rect x="${x + 2.5}" y="${y + 2.5}" width="23" height="23" fill="none" stroke="${CRM}" stroke-width="1.2"/>${label(s, x + 14, y + 12.5, 9, CRM, { anchor: 'middle', font: SERIF, weight: 'bold' })}${label('14', x + 14, y + 23.5, 12, CRM, { anchor: 'middle', font: SERIF, weight: 'bold' })}`
  o.push(bar(hx - 34, 30, 68, 7, C.heroHp, '#5a9a4a'))
  o.push(cart(8, 6, C.act.length * 7.6 + 24, 22), T(C.act, 20, 21, 13, K7, 'start').replace('<text', '<text font-style="italic"'))
  const task = boss ? C.bossTask : C.task
  o.push(cart(8, H - 31, task.length * 7.4 + 24, 22), T(task, 20, H - 15.5, 13, K7, 'start', 'normal', MONO))
  const wl = (C.who.length - 6) * 7.6 + 18
  o.push(seal(W - 8 - 160 - 14 - wl - 32, H - 34, 'Lv'), cart(W - 8 - 160 - 14 - wl, H - 31, wl, 22), T(C.who.slice(6), W - 8 - 160 - 14 - wl / 2, H - 15.5, 13, K7, 'middle'))
  o.push(bar(W - 8 - 160, H - 27, 160, 13, C.xp, OCH), T(`${Math.round(C.xp * 100)}%`, W - 14, H - 16, 11, CRM, 'end', 'bold'))
  const star = (x: number, y: number, s: number) => { let d = ''; for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2, r = (i % 2 ? 7 : 20) * s; d += `${i ? 'L' : 'M'}${r1(x + Math.cos(a) * r)} ${r1(y + Math.sin(a) * r)}` } return `<path d="${d}Z" fill="${CRM}" stroke="${K7}" stroke-width="2.4" stroke-linejoin="round"/>` }
  const dm = (t: string, x: number, y: number, size: number, c: string) => label(t, x, y, size, c, { anchor: 'middle', font: SERIF, weight: 'bold', stroke: CRM, sw: size / 2.6 }).replace('<text', `<text style="paint-order:stroke"`)
  if (!boss) {
    ;[540, 632, 724].forEach((x, i) => {
      o.push(sh(x, 26))
      o.push(`<g class="d7b" style="animation-delay:-${i * 0.3}s"><g transform="translate(${x} ${foot + (i % 2)})"><use href="#d7n"/></g></g>`)
      o.push(bar(x - 20, foot - 80 + (i % 2), 40, 7, [0.56, 0.8, 0.35][i]!, VRM))
    })
    const rx = 852
    o.push(sh(rx, 30))
    o.push(`<g class="d7b"><g transform="translate(${rx} ${foot}) scale(.98)"><use href="#d7r"/></g></g>`)
    o.push(cart(W - 14 - 330, 8, 330, 20, '#f8e8b8'), T(C.rare, W - 14 - 165, 22.5, 12, K7, 'middle', 'bold'), bar(W - 14 - 270, 32, 270, 9, C.foeHp, VRM))
    o.push(star(512, foot - 42, 1), star(rx - 44, foot - 56, 0.8))
    o.push(dm(C.hit[0]!, 548, foot - 66, 18, K7), dm(C.hit[1]!, 646, foot - 74, 15, IND), dm(C.hit[2]!, 772, foot - 44, 28, VRM))
  } else {
    const bx = 800
    o.push(sh(bx, 62))
    o.push(`<g class="d7b"><g transform="translate(${bx} ${foot}) scale(1.4)"><use href="#d7n"/>${ink('M-20 -54 Q-36 -62 -30 -82 Q-26 -66 -14 -60Z M20 -54 Q36 -62 30 -82 Q26 -66 14 -60Z', CRM, 3)}<path d="M-21 -52 H21 V-22 H-21Z" fill="${VRM}" opacity=".35"/></g></g>`)
    o.push(cart(450, 8, 250, 20, '#ffd9c8'), T(`Lv 18  ${C.boss}`, 575, 22.5, 12, K7, 'middle', 'bold'), bar(450, 32, 240, 9, C.foeHp, VRM))
    o.push(star(724, foot - 34, 1.1), dm(C.hit[0]!, 700, foot - 46, 18, K7), dm(C.hit[2]!, 900, foot - 62, 28, VRM))
  }
  o.push(`<rect width="${W}" height="${H}" fill="url(#d7p)" opacity=".13"/>`)
  return svgOf(o.join(''))
}
DIRECTIONS.push({ id: 'D7', name: 'Woodblock print', font: 'Georgia, Consolas', frame: d7Frame })

// @@DIRECTIONS

// ---- rendering ----
const EDGE = process.env.EDGE ?? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => existsSync(p))
/** Both animation clocks are paused at the same time so the swing and the glints sit where the drawing meant them. */
const AT = 420
const page = (frames: string[]) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000;width:${W}px;height:${H * frames.length}px;overflow:hidden}svg{display:block}</style></head><body>${frames.join('')}
<script>for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${AT} }</script></body></html>`
const shoot = (html: string, png: string, h: number, work: string, scale: number) => {
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE to msedge.exe')
  const file = join(work, `${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(file, html)
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${join(work, 'profile')}`,
    `--force-device-scale-factor=${scale}`, `--window-size=${W},${h}`, '--virtual-time-budget=800', `--screenshot=${png}`, pathToFileURL(file).href], { stdio: 'ignore', timeout: 120_000 })
}


/** D5 again with the one filter a painter would reach for: turbulence-displaced edges over the whole scene (measured, not shipped). */
const withBrushFilter = (svg: string) => svg.replace(/^(<svg[^>]*>)/, '$1<defs><filter id="brush" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter></defs><g filter="url(#brush)">').replace(/<\/svg>$/, '</g></svg>')

/** Rasterize cost: each SVG drawn 40 times onto a 1920 by 300 canvas inside one Edge page; prints the mean ms per draw. */
const perf = (dirs: Direction[], work: string) => {
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE to msedge.exe')
  const items = dirs.map(d => ({ id: d.id, svg: d.frame(false) }))
  const d5 = dirs.find(d => d.id === 'D5')
  if (d5) items.push({ id: 'D5+filter', svg: withBrushFilter(d5.frame(false)) })
  writeFileSync(join(OUT, 'src', 'D5-filter-fight.svg'), items[items.length - 1]!.svg)
  const html = `<!doctype html><meta charset="utf-8"><body><pre id="out">running</pre><script>
const items = ${JSON.stringify(items)}
const run = async () => {
  const c = document.createElement('canvas'); c.width = 1920; c.height = 300; const x = c.getContext('2d')
  const res = {}
  for (const it of items) {
    const img = new Image(); img.src = URL.createObjectURL(new Blob([it.svg], { type: 'image/svg+xml' })); await img.decode()
    x.drawImage(img, 0, 0, 1920, 300)
    const t0 = performance.now()
    for (let i = 0; i < 40; i++) { x.clearRect(0, 0, 1920, 300); x.drawImage(img, 0, 0, 1920, 300); x.getImageData(0, 0, 1, 1) }
    res[it.id] = +((performance.now() - t0) / 40).toFixed(2)
  }
  document.getElementById('out').textContent = JSON.stringify(res)
}
run()
</script>`
  const file = join(work, 'perf.html')
  writeFileSync(file, html)
  const out = execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${join(work, 'profile')}`, '--virtual-time-budget=60000', '--dump-dom', pathToFileURL(file).href], { encoding: 'utf8', timeout: 240_000 })
  const m = out.match(/<pre id="out">(.*?)<\/pre>/s)
  console.log(`rasterize ms per 1920x300 draw: ${m?.[1] ?? out.slice(0, 300)}`)
  if (d5) shoot(page([items[items.length - 1]!.svg]), join(OUT, 'src', 'D5-filter-fight.png'), H, work, 2)
}

const kb = (s: string) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`

/** The directions the owner has not rejected; D1 and D2 stay in the file as history and are not re-rendered. */
const OPEN = ['D3', 'D4', 'D5', 'D6', 'D7']

/** The hero alone from each direction at 4x, side by side and labeled: a crop of the fight frame, the svg itself scaled so the vectors stay sharp. */
const CROP = { x: 96, y: 28, w: 156, h: 100 }
const closeups = (dirs: Direction[], png: string, work: string) => {
  const Z = 4
  const figs = dirs.map(d => {
    const svg = d.frame(false).replace(`width="${W}" height="${H}"`, `width="${W * Z}" height="${H * Z}"`)
    return `<figure><div class="v"><div class="s">${svg}</div></div><figcaption><b>${d.id}</b> ${esc(d.name)}</figcaption></figure>`
  })
  const w = CROP.w * Z, h = CROP.h * Z
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#16131c;font:20px Segoe UI,Arial,sans-serif;color:#eee}
body{display:flex;gap:12px;padding:12px;width:${dirs.length * (w + 12) + 12}px}figure{margin:0}.v{width:${w}px;height:${h}px;overflow:hidden;position:relative;background:#000}.s{position:absolute;left:${-CROP.x * Z}px;top:${-CROP.y * Z}px}svg{display:block}figcaption{padding:8px 2px}</style></head><body>${figs.join('')}
<script>for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${AT} }</script></body></html>`
  const file = join(work, 'closeups.html')
  writeFileSync(file, html)
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE to msedge.exe')
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${join(work, 'profile')}`,
    '--force-device-scale-factor=1', `--window-size=${dirs.length * (w + 12) + 12},${h + 12 + 12 + 44}`, '--virtual-time-budget=1500', `--screenshot=${png}`, pathToFileURL(file).href], { stdio: 'ignore', timeout: 180_000 })
}

/** Head and body height of the hero from the DOM boxes of the head group (hair top to chin) and the feet line, in svg units. */
const measure = (dirs: Direction[], work: string) => {
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE to msedge.exe')
  const ids = dirs.filter(d => /id="hh\d"/.test(d.frame(false))).map(d => ({ id: d.id, svg: d.frame(false), head: `hh${d.id.slice(1)}` }))
  const html = `<!doctype html><meta charset="utf-8"><body><pre id="out">running</pre><div id="host"></div><script>
const items = ${JSON.stringify(ids)}
const res = {}
for (const it of items) { const h = document.getElementById('host'); h.innerHTML = it.svg; const b = document.getElementById(it.head).getBBox(); res[it.id] = { head: +b.height.toFixed(2), body: +(-b.y).toFixed(2), ratio: +(b.height / -b.y).toFixed(3) }; h.innerHTML = '' }
document.getElementById('out').textContent = JSON.stringify(res)
</script>`
  const file = join(work, 'measure.html')
  writeFileSync(file, html)
  const out = execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${join(work, 'profile')}`, '--virtual-time-budget=5000', '--dump-dom', pathToFileURL(file).href], { encoding: 'utf8', timeout: 120_000 })
  console.log(`hero head and body height (svg units, feet at 0): ${out.match(/<pre id="out">(.*?)<\/pre>/s)?.[1] ?? out.slice(0, 300)}`)
}

const main = () => {
  const args = process.argv.slice(2)
  const want = args.filter(a => /^D\d$/.test(a))
  const dirs = DIRECTIONS.filter(d => (want.length ? want.includes(d.id) : OPEN.includes(d.id)))
  mkdirSync(join(OUT, 'src'), { recursive: true })
  const work = mkdtempSync(join(tmpdir(), 'quest-styles-'))
  const rows: string[] = []
  try {
    if (args.includes('--perf')) { perf(dirs, work); return }
    if (args.includes('--measure')) { measure(dirs, work); return }
    for (const d of dirs) {
      const t0 = performance.now()
      let fight = '', boss = ''
      for (let i = 0; i < 20; i++) { fight = d.frame(false); boss = d.frame(true) }
      const ms = (performance.now() - t0) / 40
      writeFileSync(join(OUT, 'src', `${d.id}-fight.svg`), fight)
      writeFileSync(join(OUT, 'src', `${d.id}-boss.svg`), boss)
      shoot(page([fight, boss]), join(OUT, `${d.id}.png`), H * 2, work, 2)
      const feat = (re: RegExp, s: string) => (s.match(re) ?? []).length
      rows.push(`${d.id} ${d.name.padEnd(24)} fight ${kb(fight)}  boss ${kb(boss)}  build ${ms.toFixed(2)} ms  filters ${feat(/<filter/g, fight)}  gradients ${feat(/<(linear|radial)Gradient/g, fight)}  elements ${feat(/<[a-z]/g, fight)}  text ${feat(/<text/g, fight)}`)
      console.log(rows[rows.length - 1])
    }
    if (!want.length) {
      const fights = dirs.map(d => readFileSync(join(OUT, 'src', `${d.id}-fight.svg`), 'utf8'))
      shoot(page(fights), join(OUT, 'all-fights.png'), H * fights.length, work, 2)
      shoot(page(fights), join(OUT, 'all-fights-1x.png'), H * fights.length, work, 1)
      closeups(dirs, join(OUT, 'hero-closeups.png'), work)
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
  void rows
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main()
