// Pixel art whole frame (task-24): three complete frames (fight and boss), same content and layout as task-22 and task-23, drawn as
// the SVG the mod would emit. Sprites and world layers are pixel art shown crisp (image-rendering: pixelated, whole-number scale);
// light, haze, glow and the HUD are vector. Not imported by the game.
//
//   npx --no-install tsx tools/pixel_mockups.ts            P1 to P3: PNGs, SVGs, pixel-fights, pixel-hero-closeups, edge crops
//   npx --no-install tsx tools/pixel_mockups.ts P1         only that direction (PNG and SVGs)
//   npx --no-install tsx tools/pixel_mockups.ts --perf     rasterize cost per direction (one Edge page)
//   npx --no-install tsx tools/pixel_mockups.ts --stats    bytes, colors and build time per direction
//
// P1 HD-2D: hi-res pixels (1 art pixel = 1 screen pixel at 1x) over a layered, lit, hazy diorama.
// P2 cozy pixel: chunky pixels (2 screen pixels per art pixel), outlined world, warm and bright.
// P3 blend: the cozy palette and creatures with the HD-2D light and depth.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { C, GY, H, W, esc, label, r1, rng } from './style_mockups'
import { Cv, mixc, ramp } from './pixel_kit'
import { COZY, HD, hero, trail } from './pixel_hero'
import type { Look } from './pixel_hero'
import { foe } from './pixel_foes'
import { blades, burst, bush, cloud, dapple, fence, ground, mountains, pine, roundTree, rock, signet, sun } from './pixel_world'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, 'docs', 'art', 'styles')
const FOOT = GY + 6

type Id = 'P1' | 'P2' | 'P3'
type Dir = { id: Id; name: string; S: 1 | 2; font: string; frame: (boss: boolean) => string }
export const DIRS: Dir[] = []
const SERIF = "Georgia,'Times New Roman',serif"
const SANS = "'Trebuchet MS','Segoe UI',Verdana,sans-serif"

// ---------- layout (task-22 and task-23 positions) ----------
const HX = 150, LX = 410
const PACK = [540, 632, 724], RARE_X = 852, BOSS_X = 800

// ---------- shared pieces ----------
const snap = (v: number, S: number) => Math.round(v / S) * S
/** place a sprite canvas so its anchor (feet centre) lands on (fx, fy), on the pixel grid */
const place = (cv: Cv, fx: number, fy: number, S: number) => ({ x: snap(fx - cv.ox * S, S), y: snap(fy - cv.oy * S, S) })
const img = (cv: Cv, fx: number, fy: number, S: number, attrs = '') => { const p = place(cv, fx, fy, S); return cv.image(p.x, p.y, S, attrs) }

type Cfg = {
  id: Id; name: string; S: 1 | 2; look: Look; font: string
  sky: [number, string][]; horizon: string
  sunX: number; sunY: number; sunCol: string
  hd2d: boolean
}
const mixHex = mixc

// A frame is built once per direction: layers are cached because they are the same for the fight and the boss frame.
type Layers = { far: string; mid: string; ground: string; props: string; near?: string; stats: { name: string; bytes: number; colors: number }[] }

// ======================= P1. HD-2D =======================
const layerCv = (S: number, y0: number, y1: number) => new Cv(W / S, Math.ceil((y1 - y0) / S), 1 / S, 0, -y0 / S)
const p1Layers = (S: 1 | 2): Layers => {
  const stats: Layers['stats'] = []
  const L: [number, number] = [0.5, -0.85]
  // far: two mountain ranges, drawn at half resolution (they are blurred anyway), hazed
  const far = layerCv(2, 36, 114)
  mountains(far, { seed: 3, base: 76, amp: 30, freq: 0.0045, col: '#8c8cc0', lit: '#ffe0aa', haze: '#d8b8c0', hazeAmt: 0.3, crestW: 2 })
  mountains(far, { seed: 11, base: 90, amp: 20, freq: 0.007, col: '#6a78b0', lit: '#ffd498', haze: '#c8aebc', hazeAmt: 0.2, crestW: 2 })
  stats.push({ name: 'far', bytes: far.bytes(), colors: far.colors() })
  // mid: tree line, deep teal green, a warm rim on the sun side
  const mid = layerCv(2, 62, 118) // half resolution: it sits behind a blur, so 2 px blocks read as soft depth
  const rr = rng(21)
  for (let x = -10; x < W + 20; x += 9 + rr() * 9) {
    const h = 28 + rr() * 20, f = 108 + rr() * 3
    if (rr() > 0.62) pine(mid, x, f, h * 1.15, { leaf: '#2b5a58', trunk: '#3e2a2a' }, x, L); else roundTree(mid, x, f, h, { leaf: rr() > 0.5 ? '#33664f' : '#2b5a50', trunk: '#3e2a2a', stipple: false }, Math.floor(x * 7), L)
  }
  mid.rim('#ffc98a', [1, -1], 0.38)
  stats.push({ name: 'mid', bytes: mid.bytes(), colors: mid.colors() })
  // ground with warm sun pools and cool tree shadows
  const gr = layerCv(S, 104, 150)
  ground(gr, 106, { grass: '#6a9a48', grassLit: '#a4bf52', grassDark: '#2f5a3e', dirt: '#c49a62', flower: ['#f4e6c0', '#f0a8b8', '#ffd860'], pebble: '#a89a8a' }, 5, { pathTop: 124, tufts: 70 })
  dapple(gr, 106, 122, 15, { dark: '#1e3a4a', light: '#ffe49a', nDark: 10, nLight: 9 })
  stats.push({ name: 'ground', bytes: gr.bytes(), colors: gr.colors() })
  // props: feature trees and rocks on the ground line
  const pr = layerCv(S, 14, 124)
  const big = { leaf: '#3d7a48', trunk: '#5a3a2a' }
  roundTree(pr, 300, FOOT - 2, 78, big, 77, L); roundTree(pr, 470, FOOT - 2, 56, big, 78, L); roundTree(pr, 940, FOOT - 2, 96, big, 79, L); roundTree(pr, 20, FOOT - 2, 60, big, 80, L)
  rock(pr, 370, FOOT + 2, 12, '#8a8296', L); rock(pr, 606, FOOT + 3, 9, '#8a8296', L)
  pr.rim('#ffc98a', [1, -1], 0.42)
  stats.push({ name: 'props', bytes: pr.bytes(), colors: pr.colors() })
  // near plane: dark blurred grass at the bottom edge
  const nr = layerCv(S, 108, 150)
  blades(nr, 340, 160, 62, '#16382e', 31, L, 4); blades(nr, 420, 164, 78, '#16382e', 32, L, 4); blades(nr, 500, 162, 66, '#16382e', 33, L, 4); blades(nr, 550, 164, 58, '#16382e', 34, L, 4)
  nr.rim('#ffc98a', [1, -1], 0.3)
  stats.push({ name: 'near', bytes: nr.bytes(), colors: nr.colors() })
  return { far: far.image(0, 36, 2), mid: mid.image(0, 62, 2), ground: gr.image(0, 104, S), props: pr.image(0, 14, S), near: nr.image(0, 108, S), stats }
}

// ======================= P2 / P3 world (cozy) =======================
const cozyLayers = (S: 1 | 2, blend: boolean): Layers => {
  const stats: Layers['stats'] = []
  const treeInk = '#1d4f3a'
  const L: [number, number] = blend ? [0.5, -0.85] : [-0.55, -0.83]
  // far: pixel clouds and soft hills
  const far = layerCv(S, 8, 114)
  if (blend) {
    mountains(far, { seed: 13, base: 74, amp: 24, freq: 0.0045, col: '#86a8d8', lit: '#fff0c8', haze: '#e0ccd4', hazeAmt: 0.35, crestW: 2 })
    mountains(far, { seed: 17, base: 92, amp: 16, freq: 0.007, col: '#6c9ccc', lit: '#ffe8b8', haze: '#d8c6d0', hazeAmt: 0.25, crestW: 2 })
  } else {
    mountains(far, { seed: 31, base: 84, amp: 18, freq: 0.005, col: '#7fcfb0', lit: '#e8ffd0', haze: '#cdf0e8', hazeAmt: 0.25, crestW: 2 })
    mountains(far, { seed: 33, base: 96, amp: 12, freq: 0.008, col: '#62c07a', lit: '#e0ffb0', haze: '#c8f0d0', hazeAmt: 0.15, crestW: 2 })
  }
  const cl: [number, number, number][] = [[250, 22, 70], [600, 14, 56], [840, 28, 80], [20, 52, 44], [700, 58, 40]]
  for (const [x, y, w] of cl) cloud(far, x, y, w, blend ? { top: '#fff6e6', under: '#e6c8c8' } : { top: '#ffffff', under: '#a8d4f4' })
  stats.push({ name: 'far', bytes: far.bytes(), colors: far.colors() })
  // mid: tree line of round clumps and a few pines with a soft dark outline
  const mid = layerCv(S, 56, 118)
  const rr = rng(41)
  const leafs = blend ? ['#3a9a5a', '#2f8a50', '#46a45a'] : ['#3cc25f', '#34b258', '#4cd06a']
  for (let x = -6; x < W + 20; x += 12 + rr() * 10) {
    const h = 32 + rr() * 20, f = 108 + rr() * 4
    if (rr() > 0.7) pine(mid, x, f, h * 1.1, { leaf: '#27965a', trunk: '#6a4028' }, x, L); else roundTree(mid, x, f, h, { leaf: leafs[Math.floor(rr() * 3)]!, trunk: '#6a4028' }, Math.floor(x * 5), L)
  }
  if (blend) mid.rim('#ffe6a8', [1, -1], 0.3)
  mid.outline(treeInk, 0.72, [-L[0], -L[1]], 0.6)
  stats.push({ name: 'mid', bytes: mid.bytes(), colors: mid.colors() })
  // ground
  const gr = layerCv(S, 104, 150)
  ground(gr, 106, { grass: blend ? '#78c850' : '#7fd64f', grassLit: '#b8f060', grassDark: '#2f8a4a', dirt: '#e8c27a', flower: ['#ffffff', '#ff8ab0', '#ffe14a', '#8ad8ff'], pebble: '#b8a8a0' }, 5, { pathTop: 124, tufts: 110, light: L })
  if (blend) dapple(gr, 106, 122, 15, { dark: '#1e5a4a', light: '#fff0a8', nDark: 8, nLight: 9 })
  for (let i = 0; i < gr.w; i++) for (let j = 0; j < gr.h; j++) if (gr.get(i, j)) { gr.set(i, j, mixc(gr.get(i, j)!, treeInk, 0.55)); break }
  stats.push({ name: 'ground', bytes: gr.bytes(), colors: gr.colors() })
  // props: feature trees, a fence, rocks, bushes with flowers
  const pr = layerCv(S, 14, 124)
  const big = { leaf: blend ? '#3a9a5a' : '#37bb5c', trunk: '#8a5230' }
  roundTree(pr, 300, FOOT - 2, 80, big, 77, L); roundTree(pr, 470, FOOT - 2, 58, big, 78, L); roundTree(pr, 940, FOOT - 2, 98, big, 79, L); roundTree(pr, 20, FOOT - 2, 62, big, 80, L)
  fence(pr, 330, 436, FOOT - 6, 15, '#b8793a', L); fence(pr, 586, 700, FOOT - 6, 15, '#b8793a', L)
  rock(pr, 368, FOOT + 3, 12, '#9aa0b8', L); rock(pr, 606, FOOT + 4, 9, '#9aa0b8', L)
  bush(pr, 252, FOOT + 3, 26, '#2fae58', ['#ff8ab0', '#ffffff', '#ffe14a'], 51, L); bush(pr, 700, FOOT + 4, 24, '#2fae58', ['#ff8ab0', '#ffffff', '#ffe14a'], 52, L); bush(pr, 905, FOOT + 4, 30, '#2fae58', ['#ff8ab0', '#ffffff', '#ffe14a'], 53, L)
  blades(pr, 520, FOOT + 3, 10, '#4cc058', 3, L); blades(pr, 800, FOOT + 4, 10, '#4cc058', 4, L)
  if (blend) pr.rim('#ffe6a8', [1, -1], 0.3)
  pr.outline(treeInk, 0.74, [-L[0], -L[1]], 0.62)
  stats.push({ name: 'props', bytes: pr.bytes(), colors: pr.colors() })
  let near = ''
  if (blend) {
    const nr = layerCv(S, 108, 150)
    blades(nr, 340, 160, 62, '#238040', 31, L, 4); blades(nr, 420, 164, 78, '#238040', 32, L, 4); blades(nr, 500, 162, 66, '#238040', 33, L, 4); blades(nr, 550, 164, 58, '#238040', 34, L, 4)
    nr.rim('#ffe6a8', [1, -1], 0.3)
    stats.push({ name: 'near', bytes: nr.bytes(), colors: nr.colors() })
    near = nr.image(0, 108, S)
  }
  return { far: far.image(0, 8, S), mid: mid.image(0, 56, S), ground: gr.image(0, 104, S), props: pr.image(0, 14, S), near, stats }
}

// ---------- HUD ----------
type Hud = {
  panel: (x: number, y: number, w: number, h: number) => string
  bar: (x: number, y: number, w: number, h: number, f: number, c: string) => string
  text: (s: string, x: number, y: number, size: number, o?: { anchor?: string; fill?: string; strong?: boolean }) => string
  hit: (s: string, x: number, y: number, size: number, hot: boolean) => string
  fam: string; cw: number
}
const hudP1 = (): Hud => ({
  fam: SERIF, cw: 6.9,
  panel: (x, y, w, h) => `<g shape-rendering="crispEdges"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0c1226" fill-opacity=".74"/><rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" fill="none" stroke="#e8d6a0" stroke-opacity=".8"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="none" stroke="#e8d6a0" stroke-opacity=".22"/></g>`,
  bar: (x, y, w, h, f, c) => `<g shape-rendering="crispEdges"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0a0f20" fill-opacity=".82"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#e8d6a0" stroke-opacity=".75"/><rect x="${x + 1}" y="${y + 1}" width="${Math.max(1, Math.round((w - 2) * f))}" height="${h - 2}" fill="${c}"/><rect x="${x + 1}" y="${y + 1}" width="${Math.max(1, Math.round((w - 2) * f))}" height="1" fill="#fff" fill-opacity=".55"/></g>`,
  text: (s, x, y, size, o = {}) => label(s, x, y, size, o.fill ?? '#f6ecd0', { anchor: o.anchor, font: SERIF, weight: o.strong ? 'bold' : 'normal', stroke: '#0a0f20', sw: 2.4 }),
  hit: (s, x, y, size, hot) => label(s, x, y, size, hot ? '#ffe27a' : '#fffaf0', { font: SERIF, weight: 'bold', stroke: '#2a1408', sw: size / 3.4 }),
})
const hudP2 = (): Hud => ({
  fam: SANS, cw: 7.3,
  // stepped corners on a 2 px grid: dark rim, wood, parchment
  panel: (x, y, w, h) => {
    const r = (a: number, b: number, c: number, d: number, f: string) => `<rect x="${x + a}" y="${y + b}" width="${w - c}" height="${h - d}" fill="${f}"/>`
    return `<g shape-rendering="crispEdges">${r(2, 0, 4, 0, '#4a2410')}${r(0, 2, 0, 4, '#4a2410')}${r(2, 2, 4, 4, '#b8702e')}${r(4, 4, 8, 8, '#f8e2a8')}<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="2" fill="#fff6d8"/><rect x="${x + 4}" y="${y + h - 6}" width="${w - 8}" height="2" fill="#e0b870"/></g>`
  },
  bar: (x, y, w, h, f, c) => `<g shape-rendering="crispEdges"><rect x="${x + 2}" y="${y}" width="${w - 4}" height="${h}" fill="#4a2410"/><rect x="${x}" y="${y + 2}" width="${w}" height="${h - 4}" fill="#4a2410"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="#7a4a2a"/><rect x="${x + 2}" y="${y + 2}" width="${Math.max(2, Math.round(((w - 4) * f) / 2) * 2)}" height="${h - 4}" fill="${c}"/><rect x="${x + 2}" y="${y + 2}" width="${Math.max(2, Math.round(((w - 4) * f) / 2) * 2)}" height="2" fill="#fff" fill-opacity=".5"/></g>`,
  text: (s, x, y, size, o = {}) => label(s, x, y, size, o.fill ?? '#4a2410', { anchor: o.anchor, font: SANS, weight: 'bold', ...(o.fill ? { stroke: '#4a2410', sw: 3 } : {}) }),
  hit: (s, x, y, size, hot) => label(s, x, y, size, hot ? '#ffe14a' : '#ffffff', { font: SANS, weight: 'bold', stroke: '#4a2410', sw: size / 3 }),
})
const hudP3 = (): Hud => ({
  fam: SANS, cw: 7.3,
  panel: (x, y, w, h) => `<g shape-rendering="crispEdges"><rect x="${x + 2}" y="${y}" width="${w - 4}" height="${h}" fill="#2a160c" fill-opacity=".72"/><rect x="${x}" y="${y + 2}" width="${w}" height="${h - 4}" fill="#2a160c" fill-opacity=".72"/><rect x="${x + 2}" y="${y + 1}" width="${w - 4}" height="1" fill="#ffd98a" fill-opacity=".85"/><rect x="${x + 2}" y="${y + h - 2}" width="${w - 4}" height="1" fill="#ffd98a" fill-opacity=".55"/><rect x="${x + 1}" y="${y + 2}" width="1" height="${h - 4}" fill="#ffd98a" fill-opacity=".7"/><rect x="${x + w - 2}" y="${y + 2}" width="1" height="${h - 4}" fill="#ffd98a" fill-opacity=".7"/></g>`,
  bar: (x, y, w, h, f, c) => `<g shape-rendering="crispEdges"><rect x="${x + 2}" y="${y}" width="${w - 4}" height="${h}" fill="#2a160c" fill-opacity=".85"/><rect x="${x}" y="${y + 2}" width="${w}" height="${h - 4}" fill="#2a160c" fill-opacity=".85"/><rect x="${x + 2}" y="${y + 2}" width="${Math.max(2, Math.round(((w - 4) * f) / 2) * 2)}" height="${h - 4}" fill="${c}"/><rect x="${x + 2}" y="${y + 2}" width="${Math.max(2, Math.round(((w - 4) * f) / 2) * 2)}" height="2" fill="#fff" fill-opacity=".5"/></g>`,
  text: (s, x, y, size, o = {}) => label(s, x, y, size, o.fill ?? '#fff2cc', { anchor: o.anchor, font: SANS, weight: 'bold', stroke: '#2a160c', sw: 2.6 }),
  hit: (s, x, y, size, hot) => label(s, x, y, size, hot ? '#ffe14a' : '#ffffff', { font: SANS, weight: 'bold', stroke: '#3a1c0c', sw: size / 3 }),
})

const hudOf = (id: Id) => (id === 'P1' ? hudP1() : id === 'P2' ? hudP2() : hudP3())

// ---------- the frame ----------
const layerCache = new Map<Id, Layers>()
const spriteCache = new Map<string, Cv>()
const cached = (k: string, f: () => Cv) => { let v = spriteCache.get(k); if (!v) { v = f(); spriteCache.set(k, v) } return v }

const frameOf = (cfg: Cfg, boss: boolean): string => {
  const { id, S, look } = cfg
  const hd = id === 'P1', blend = id === 'P3'
  const res = (S === 1 ? 1 : 0.5) as 1 | 0.5
  let lay = layerCache.get(id)
  if (!lay) { lay = id === 'P1' ? p1Layers(S) : cozyLayers(S, blend); layerCache.set(id, lay) }
  const hud = hudOf(id)
  const o: string[] = []
  const hs = cached(`${id}-hero`, () => hero(look, res).cv), ht = cached(`${id}-trail`, () => trail(look, res))
  const fN = cached(`${id}-norm`, () => foe(look, res, 'norm').cv), fR = cached(`${id}-rare`, () => foe(look, res, 'rare').cv), fB = cached(`${id}-boss`, () => foe(look, res, 'boss').cv)
  const loot = cached(`${id}-loot`, () => signet(res, look.ink, hd ? '#e6b94a' : '#ffd23f', hd ? '#6ac8ff' : '#5ad1ff'))
  const bz = (n: number) => `${S}px`
  void bz
  // defs: sky, light, motion
  const gsky = cfg.sky.map(([t, c]) => `<stop offset="${t}" stop-color="${c}"/>`).join('')
  o.push(`<defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1">${gsky}</linearGradient>
<radialGradient id="${id}sun" cx="${cfg.sunX}" cy="${cfg.sunY}" r="210" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${cfg.sunCol}" stop-opacity=".95"/><stop offset=".25" stop-color="${cfg.sunCol}" stop-opacity=".5"/><stop offset="1" stop-color="${cfg.sunCol}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}vig" cx="480" cy="62" r="560" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#150a22" stop-opacity="0"/><stop offset="1" stop-color="#150a22" stop-opacity="${hd ? 0.62 : 0.4}"/></radialGradient>
<linearGradient id="${id}shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c0" stop-opacity=".34"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/></linearGradient>
<linearGradient id="${id}haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cfg.horizon}" stop-opacity="0"/><stop offset="1" stop-color="${cfg.horizon}" stop-opacity=".62"/></linearGradient>
<radialGradient id="${id}grade" cx="${cfg.sunX}" cy="${cfg.sunY + 40}" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff9a40" stop-opacity=".26"/><stop offset=".6" stop-color="#ff9a40" stop-opacity=".08"/><stop offset="1" stop-color="#3a2a6a" stop-opacity=".16"/></radialGradient>
<radialGradient id="${id}glow"><stop offset="0" stop-color="#fff2c0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd070" stop-opacity="0"/></radialGradient>
${cfg.hd2d ? `<filter id="${id}blur" x="-2%" y="-5%" width="104%" height="110%"><feGaussianBlur stdDeviation="${hd ? 1.5 : 1.2}"/></filter><filter id="${id}blurN" x="-2%" y="-10%" width="104%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter><filter id="${id}blur2" x="-2%" y="-5%" width="104%" height="110%"><feGaussianBlur stdDeviation="${hd ? 1 : 0.7}"/></filter>` : ''}
<style>.${id}b{animation:${id}b 1s steps(1,end) infinite}@keyframes ${id}b{50%{transform:translateY(-${S * 2}px)}}
.${id}f{animation:${id}f 1.6s steps(1,end) infinite}@keyframes ${id}f{50%{transform:translateY(-${S}px)}}
.${id}t{animation:${id}t .8s steps(1,end) infinite}@keyframes ${id}t{50%{opacity:.2}}
.${id}m{animation:${id}m 5s linear infinite}@keyframes ${id}m{to{transform:translateY(-14px)}}</style></defs>`)
  // sky and sun
  o.push(`<rect width="${W}" height="${GY + 8}" fill="url(#${id}sky)"/>`)
  if (cfg.hd2d) o.push(`<rect width="${W}" height="${GY + 8}" fill="url(#${id}sun)"/>`)
  else { const sc = cached(`${id}-sun`, () => sun(res, 15, look.ink)); o.push(img(sc, cfg.sunX, cfg.sunY, S)) }
  // far (blurred when HD-2D), haze, mid, ground, props
  o.push(cfg.hd2d ? `<g filter="url(#${id}blur)">${lay.far}</g>` : lay.far)
  if (cfg.hd2d) o.push(`<rect y="60" width="${W}" height="56" fill="url(#${id}haze)"/>`)
  o.push(cfg.hd2d ? `<g filter="url(#${id}blur2)">${lay.mid}</g>` : lay.mid)
  o.push(lay.ground)
  o.push(lay.props)
  // light shafts through the trees (HD-2D)
  if (cfg.hd2d) {
    const sh = (x0: number, w: number, dx: number) => `<polygon points="${x0},14 ${x0 + w},14 ${x0 + w + dx},${GY + 10} ${x0 + dx - w * 0.3},${GY + 10}" fill="url(#${id}shaft)"/>`
    o.push(`<g>${sh(cfg.sunX - 60, 26, -120)}${sh(cfg.sunX - 10, 18, -90)}${sh(cfg.sunX + 40, 30, -70)}${sh(cfg.sunX + 110, 16, -40)}</g>`)
  }
  // ground shadows: crisp ellipses
  const sdw = (x: number, rx: number) => `<ellipse cx="${x}" cy="${FOOT + 1}" rx="${rx}" ry="${r1(rx * 0.17)}" fill="${hd ? '#0e1a24' : '#1d4f3a'}" opacity="${hd ? 0.45 : 0.32}"/>`
  // loot
  o.push(sdw(LX, 15))
  if (cfg.hd2d) o.push(`<circle cx="${LX}" cy="${FOOT - 20}" r="40" fill="url(#${id}glow)" opacity=".7"/>`)
  o.push(`<g class="${id}b">${img(loot, LX, FOOT - 14, S)}</g>`)
  const star = (x: number, y: number, s: number) => `<g class="${id}t" shape-rendering="crispEdges"><rect x="${x - s}" y="${y - s * 3}" width="${s * 2}" height="${s * 6}" fill="#fffbe8"/><rect x="${x - s * 3}" y="${y - s}" width="${s * 6}" height="${s * 2}" fill="#fffbe8"/></g>`
  o.push(star(LX + 20, FOOT - 36, S === 1 ? 1 : 2))
  // loot label
  const lw = Math.round(C.loot.length * hud.cw + 22)
  o.push(hud.panel(LX - lw / 2, FOOT - 62, lw, 20), hud.text(C.loot, LX, FOOT - 48, 11, { anchor: 'middle' }))
  // the hero
  o.push(sdw(HX, 26))
  o.push(img(ht, HX, FOOT, S))
  o.push(img(hs, HX, FOOT, S))
  // foes
  const bob = (x: number, i: number, k: Cv, extra = '') => `<g class="${id}b" style="animation-delay:-${i * 0.3}s">${img(k, x, FOOT, S)}${extra}</g>`
  const pow = (x: number, y: number, size: number) => { const b = burst(res, size, hd ? '#f6c84a' : '#ffe14a', look.ink, '#fff6c0'); return img(b, x, y + b.oy * S - b.oy * S, S) }
  void pow
  if (!boss) {
    PACK.forEach((x, i) => { o.push(sdw(x, 24)); o.push(bob(x, i, fN)) })
    PACK.forEach((x, i) => o.push(hud.bar(x - 20, FOOT - 82 + (i % 2), 40, 7, [0.56, 0.8, 0.35][i]!, '#e8584a')))
    o.push(sdw(RARE_X, 26)); o.push(bob(RARE_X, 3, fR))
    o.push(hud.text(C.rare, W - 12, 21, 13, { anchor: 'end', fill: '#ffe68a', strong: true }), hud.bar(W - 12 - 270, 27, 270, 10, C.foeHp, '#e8584a'))
    const b1 = burst(res, 30, hd ? '#f6c84a' : '#ffe14a', look.ink, '#fff6c0'), b2 = burst(res, 22, hd ? '#f6c84a' : '#ffe14a', look.ink, '#fff6c0')
    o.push(img(b1, 512, FOOT - 44 + b1.oy * 0, S), img(b2, RARE_X - 56, FOOT - 24, S))
    o.push(hud.hit(C.hit[0]!, 548, FOOT - 66, 18, false), hud.hit(C.hit[1]!, 646, FOOT - 74, 15, false), hud.hit(C.hit[2]!, 772, FOOT - 44, 28, true))
  } else {
    o.push(sdw(BOSS_X, 60)); o.push(bob(BOSS_X, 0, fB))
    o.push(hud.text(`Lv 18  ${C.boss}`, 690, 21, 13, { anchor: 'end', fill: '#ffb0a0', strong: true }), hud.bar(450, 27, 240, 10, C.foeHp, '#e8584a'))
    const b1 = burst(res, 30, hd ? '#f6c84a' : '#ffe14a', look.ink, '#fff6c0')
    o.push(img(b1, 724, FOOT - 34, S))
    o.push(hud.hit(C.hit[0]!, 700, FOOT - 46, 18, false), hud.hit(C.hit[2]!, 900, FOOT - 62, 28, true))
  }
  // HD-2D light on top of everything in the world: bloom on the sword and loot, motes, vignette, tilt-shift fade
  if (cfg.hd2d) {
    if (lay.near) o.push(`<g filter="url(#${id}blurN)">${lay.near}</g>`)
    o.push(`<rect width="${W}" height="${H}" fill="url(#${id}grade)"/>`)
    o.push(`<circle cx="${HX + 28 + 36}" cy="${FOOT - 68 - 18}" r="22" fill="url(#${id}glow)" opacity=".55"/>`)
    const r = rng(7), motes: string[] = []
    for (let i = 0; i < 12; i++) motes.push(`<rect class="${id}m" x="${Math.round(r() * W / S) * S}" y="${Math.round((30 + r() * 90) / S) * S}" width="${S}" height="${S}" fill="${r() > 0.5 ? '#fff0b0' : '#ffd890'}" opacity="${(0.5 + r() * 0.5).toFixed(2)}" style="animation-delay:-${(r() * 5).toFixed(1)}s" shape-rendering="crispEdges"/>`)
    o.push(`<g>${motes.join('')}</g>`)
    o.push(`<rect width="${W}" height="${H}" fill="url(#${id}vig)"/>`)
  }
  // HUD
  const hw = 68
  o.push(hud.bar(HX - hw / 2, 26, hw, 8, C.heroHp, '#5ad472'))
  const aw = Math.round(C.act.length * hud.cw + 22)
  o.push(hud.panel(8, 4, aw, 20), hud.text(C.act, 19, 18.5, 12))
  const task = boss ? C.bossTask : C.task
  const tw = Math.round(task.length * hud.cw + 24)
  o.push(hud.panel(8, H - 29, tw, 22), hud.text(task, 20, H - 14, 12))
  const wl = Math.round(C.who.length * hud.cw + 22)
  o.push(hud.panel(W - 8 - 190 - 12 - wl, H - 29, wl, 22), hud.text(C.who, W - 8 - 190 - 12 - wl / 2, H - 14, 12, { anchor: 'middle' }))
  o.push(hud.bar(W - 8 - 160, H - 25, 160, 12, C.xp, '#5ab8ff'), hud.text(`${Math.round(C.xp * 100)}%`, W - 8 - 166, H - 14, 11, { anchor: 'end', fill: '#ffffff', strong: true }))
  const body = o.join('').replace(/ stroke-linejoin="round" paint-order="stroke"/g, '').replace(/ font-family="[^"]*"/g, '')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${hud.fam.replace(/"/g, "'")}" stroke-linejoin="round" paint-order="stroke">${body}</svg>`
}

const CFG: Record<Id, Cfg> = {
  P1: { id: 'P1', name: 'HD-2D', S: 1, look: HD, font: 'Georgia', sky: [[0, '#2f5088'], [0.5, '#8aa6c6'], [1, '#ffd9a0']], horizon: '#f0c09a', sunX: 560, sunY: 62, sunCol: '#ffd88a', hd2d: true },
  P2: { id: 'P2', name: 'Cozy pixel', S: 2, look: COZY, font: 'Trebuchet MS', sky: [[0, '#4db6f2'], [1, '#c4ecff']], horizon: '#d8f2ff', sunX: 392, sunY: 36, sunCol: '#ffe14a', hd2d: false },
  P3: { id: 'P3', name: 'Blend', S: 2, look: { ...COZY, rim: 0.4, rimCol: '#ffeab0' }, font: 'Trebuchet MS', sky: [[0, '#4faee8'], [0.55, '#9ed4f0'], [1, '#ffe2b0']], horizon: '#ffd6a6', sunX: 560, sunY: 62, sunCol: '#ffd88a', hd2d: true },
}
for (const id of ['P1', 'P2', 'P3'] as Id[]) DIRS.push({ id, name: CFG[id].name, S: CFG[id].S, font: CFG[id].font, frame: b => frameOf(CFG[id], b) })

// ---------- rendering ----------
const EDGE = process.env.EDGE ?? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => existsSync(p))
const AT = 420
const page = (frames: string[], w = W) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000;width:${w}px;height:${H * frames.length}px;overflow:hidden}svg{display:block}</style></head><body>${frames.join('')}
<script>for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${AT} }</script></body></html>`
const shoot = (html: string, png: string, w: number, h: number, work: string, scale: number) => {
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE to msedge.exe')
  const file = join(work, `${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(file, html)
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${join(work, 'profile')}`,
    `--force-device-scale-factor=${scale}`, `--window-size=${w},${h}`, '--virtual-time-budget=800', `--screenshot=${png}`, pathToFileURL(file).href], { stdio: 'ignore', timeout: 120_000 })
}

/** The SVG scaled by its width and height, so art pixels stay crisp and vectors stay sharp. */
const scaled = (svg: string, z: number) => svg.replace(`width="${W}" height="${H}"`, `width="${W * z}" height="${H * z}"`)

/** pixel-fights.png: the three fight frames stacked at 2x, then again at 1x, labeled. */
const fightsPage = (dirs: Dir[], work: string, png: string) => {
  const fights = dirs.map(d => ({ d, svg: readFileSync(join(OUT, 'src', `${d.id}-fight.svg`), 'utf8') }))
  const block = (z: number) => fights.map(({ d, svg }) => `<figure><figcaption><b>${d.id}</b> ${esc(d.name)} at ${z}x</figcaption>${scaled(svg, z)}</figure>`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#17131f;color:#eee;font:18px Segoe UI,Arial,sans-serif}figure{margin:0 0 10px}figcaption{padding:8px 10px}svg{display:block}.s{padding:6px 10px 2px;font-size:22px;color:#9fd}</style></head><body>
<div class="s">2x</div>${block(2)}<div class="s">1x (the band's real size)</div>${block(1)}
<script>for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${AT} }</script></body></html>`
  shoot(html, png, W * 2, 40 + (H * 2 + 52) * dirs.length + 40 + (H + 52) * dirs.length + 30, work, 1)
}

/** A crop of each direction's fight frame scaled up: the hero alone (4x) or one sprite edge (10x), labeled. */
const clipPage = (dirs: Dir[], work: string, png: string, r: { x: number; y: number; w: number; h: number }, z: number, note: (d: Dir) => string) => {
  const w = r.w * z, h = r.h * z
  const figs = dirs.map(d => `<figure><div class="v"><div class="s">${scaled(readFileSync(join(OUT, 'src', `${d.id}-fight.svg`), 'utf8'), z)}</div></div><figcaption><b>${d.id}</b> ${esc(d.name)}${note(d)}</figcaption></figure>`)
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#17131f;font:20px Segoe UI,Arial,sans-serif;color:#eee}
body{display:flex;gap:12px;padding:12px;width:${dirs.length * (w + 12) + 12}px}figure{margin:0}.v{width:${w}px;height:${h}px;overflow:hidden;position:relative;background:#000}.s{position:absolute;left:${-r.x * z}px;top:${-r.y * z}px}svg{display:block}figcaption{padding:8px 2px}</style></head><body>${figs.join('')}
<script>for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${AT} }</script></body></html>`
  shoot(html, png, dirs.length * (w + 12) + 12, h + 12 + 12 + 70, work, 1)
}

/** Head and body height of the hero in art pixels, counted from the painted part pixels (outline excluded). */
const heroPixels = (id: Id) => {
  const cfg = CFG[id], res = (cfg.S === 1 ? 1 : 0.5) as 1 | 0.5
  const h = hero(cfg.look, res), cv = h.cv
  const cols = [Math.round(cv.ox - 3 * res), Math.round(cv.ox), Math.round(cv.ox + 3 * res)]
  let top = -1, bottom = -1
  for (let j = 0; j < cv.h; j++) if (cols.some(i => cv.id[j * cv.w + i]! >= 0)) { if (top < 0) top = j; bottom = j }
  const chin = cv.py(h.head.chin) - 1
  return { head: chin - top + 1, body: bottom - top + 1, S: cfg.S, w: cv.w, h: cv.h, colors: cv.colors(), bytes: cv.bytes() }
}

/** Rasterize cost: each SVG drawn 40 times onto a 1920 by 300 canvas inside one Edge page; prints the mean ms per draw. */
const perf = (dirs: Dir[], work: string) => {
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE to msedge.exe')
  const items = [...dirs.map(d => ({ id: d.id, svg: d.frame(false) })), ...dirs.map(d => ({ id: d.id + '-boss', svg: d.frame(true) }))]
  const html = `<!doctype html><meta charset="utf-8"><body><pre id="out">running</pre><script>
const items = ${JSON.stringify(items).replace(/</g, '\\u003c')}
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
}

const main = () => {
  const args = process.argv.slice(2)
  const want = args.filter(a => /^P\d$/.test(a))
  const dirs = DIRS.filter(d => (want.length ? want.includes(d.id) : true))
  mkdirSync(join(OUT, 'src'), { recursive: true })
  const work = mkdtempSync(join(tmpdir(), 'quest-pixel-'))
  try {
    if (args.includes('--perf')) { perf(dirs, work); return }
    if (args.includes('--measure')) {
      for (const d of dirs) { const m = heroPixels(d.id); console.log(`${d.id} hero: head ${m.head} px, body ${m.body} px, ratio ${(m.head / m.body).toFixed(3)}, ${m.w}x${m.h} canvas, ${m.colors} colors, ${(m.bytes / 1024).toFixed(2)} KB png, ${m.S} screen px per art px`) }
      return
    }
    for (const d of dirs) {
      layerCache.clear(); spriteCache.clear(); Cv.log.length = 0
      const t0 = performance.now()
      const fight = d.frame(false)
      const cold = performance.now() - t0
      const png = Cv.log.reduce((a, l) => ({ b: a.b + l.b, z: a.z + l.z }), { b: 0, z: 0 })
      const t1 = performance.now()
      const boss = d.frame(true)
      const bossMs = performance.now() - t1
      writeFileSync(join(OUT, 'src', `${d.id}-fight.svg`), fight)
      writeFileSync(join(OUT, 'src', `${d.id}-boss.svg`), boss)
      shoot(page([fight, boss]), join(OUT, `${d.id}.png`), W, H * 2, work, 2)
      const fz = Buffer.byteLength(fight) - Math.round((png.b * 4) / 3) + Math.round((png.z * 4) / 3)
      const lay = layerCache.get(d.id)!
      console.log(`${d.id} ${d.name}  fight ${(Buffer.byteLength(fight) / 1024).toFixed(1)} KB  boss ${(Buffer.byteLength(boss) / 1024).toFixed(1)} KB  cold build (world, sprites, svg) ${cold.toFixed(0)} ms  boss frame with caches ${bossMs.toFixed(1)} ms`)
      console.log(`  PNG share of the fight SVG: ${(png.b / 1024).toFixed(1)} KB with hooks/png.ts, ${(png.z / 1024).toFixed(1)} KB with a dynamic-Huffman deflate (fight SVG would be ${(fz / 1024).toFixed(1)} KB)`)
      console.log('  layers: ' + lay.stats.map(s => `${s.name} ${(s.bytes / 1024).toFixed(1)}KB/${s.colors}c`).join('  '))
    }
    if (!want.length) {
      fightsPage(dirs, work, join(OUT, 'pixel-fights.png'))
      clipPage(dirs, work, join(OUT, 'pixel-hero-closeups.png'), { x: 100, y: 20, w: 140, h: 100 }, 4, d => { const m = heroPixels(d.id); return ` (head ${m.head} of ${m.body} art px, ${m.S} screen px each)` })
      clipPage(dirs, work, join(OUT, 'pixel-edge-crops.png'), { x: 170, y: 36, w: 50, h: 40 }, 10, () => ' (10x edge crop)')
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}
void esc; void mixHex; void ramp; void mixc; void pathToFileURL; void blades
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main()
