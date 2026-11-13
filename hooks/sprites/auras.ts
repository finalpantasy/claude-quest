// Auras around the crab: cheap shapes with CSS motion classes (see SPRITE_CSS). Drawn on the crab's 30 by 26 canvas, centered at (15, 14).
// 41 of them: rarity (4), relic sites (6), legendary powers (25), ancient, primal, three upgrade tiers, and the active glow.
import { Cells, hash, rng } from './core'
import type { Part, Rect } from './core'
import { CH, CW, CX } from './crab'

export type AuraKind = 'glow' | 'ring' | 'orbit' | 'rise' | 'rays' | 'flame' | 'bolt' | 'snow' | 'runes' | 'bubbles' | 'embers'
export type AuraSpec = { id: string; name: string; kind: AuraKind; c: string; c2?: string; n?: number; r?: number; m?: number }

const A = (id: string, name: string, kind: AuraKind, c: string, c2?: string, n?: number): AuraSpec => ({ id, name, kind, c, c2, n })
export const AURAS: AuraSpec[] = [
  A('magic', 'Magic glow', 'glow', '#8080ff'), A('rare', 'Rare glow', 'glow', '#f2e05a'), A('unique', 'Unique glow', 'rise', '#ff8a1f', '#ffd23f', 7), A('set', 'Set glow', 'orbit', '#2fd05a', '#a0ffb0', 6),
  A('relic-barrow', 'First Commit Barrow', 'runes', '#d8c080', '#fff0b0', 6), A('relic-leftpad', 'Ruins of Left-Pad', 'rise', '#9ab890', '#e0ffe0', 8), A('relic-merge', 'Merge Graveyard', 'rise', '#6adfa0', '#ffffff', 6),
  A('relic-crater', 'Incident Crater', 'embers', '#ff7a2a', '#ffd23f', 9), A('relic-mainframe', 'Mainframe Necropolis', 'bolt', '#5ae0f0', '#ffffff', 3), A('relic-atlas', 'Atlas Strata', 'orbit', '#a070ff', '#e0c0ff', 7),
  A('duck', 'The Rubber Duck', 'bubbles', '#ffe45e', '#ffffff', 5), A('so', 'Accepted Answer', 'rise', '#ff8a2a', '#ffe0a0', 8), A('vim', 'Escape Key of Vim', 'runes', '#46c466', '#c0ffc0', 5),
  A('regex', 'The Regex That Works', 'orbit', '#a65ee0', '#f0d0ff', 5), A('coffee', 'Bottomless Mug', 'rise', '#c89060', '#ffffff', 6), A('prod', 'Friday Deploy', 'flame', '#e0443a', '#ffd23f', 7),
  A('tests', 'Ward of 100% Coverage', 'ring', '#46c466', '#e0ffe0'), A('cache', 'Ring of Warm Cache', 'orbit', '#f2c94c', '#fff3b0', 6), A('senior', "Senior Dev's Hoodie", 'glow', '#4d8dff'),
  A('monad', 'Monad of Understanding', 'orbit', '#5ee0ea', '#ffffff', 4), A('fork', 'Fork Bomb Gauntlets', 'rays', '#ff8ac8', '#ffffff', 7), A('gc', 'Belt of Garbage Collection', 'rise', '#46c466', '#ffffff', 7),
  A('nonblock', 'Non-Blocking Boots', 'rays', '#ffffff', '#bcc5d3', 5), A('root', 'Signet of Root', 'runes', '#e0443a', '#ffb0a0', 5), A('immut', 'Immutable Greaves', 'ring', '#bcc5d3', '#ffffff'),
  A('yubi', 'Key of Hardware Trust', 'orbit', '#5ee0ea', '#e0ffff', 3), A('lambda', 'Lambda Staff', 'orbit', '#c070f0', '#f0d0ff', 5), A('kanban', 'Cloak of the Kanban', 'orbit', '#4d8dff', '#d0e0ff', 4),
  A('precommit', 'Pre-Commit Hook', 'ring', '#f2c94c', '#fff3b0'), A('pair', 'Pair Programmer Locket', 'orbit', '#ff8ac8', '#ffffff', 2), A('oncall', 'Pager of the On-Call', 'bolt', '#ff7a2a', '#ffd23f', 3),
  A('bisect', 'Blade of Git Bisect', 'rays', '#5ae0f0', '#ffffff', 6), A('darkmode', 'Visor of Dark Mode', 'glow', '#6a4a90'), A('eventloop', 'Ring of the Event Loop', 'orbit', '#46c466', '#c0ffc0', 8),
  A('standup', 'Treads of the Short Standup', 'rise', '#bcc5d3', '#ffffff', 5),
  A('ancient', 'Ancient shimmer', 'rise', '#f2b84a', '#fff0b0', 9), A('primal', 'Primal flame', 'flame', '#ff4a3a', '#ffb02a', 9),
  A('up7', 'Upgrade +7', 'rise', '#6ab8ff', '#ffffff', 7), A('up10', 'Upgrade +10', 'orbit', '#b070ff', '#f0d0ff', 8), A('up15', 'Upgrade +15', 'rays', '#ffd23f', '#ffffff', 9),
  A('active', 'Active glow', 'glow', '#ffd23f'),
]
/** The generated family: 11 shapes x 12 elements x 5 rarities x 4 motions = 2,640 auras. A rarity makes it bigger and denser; a motion changes how it moves. */
export const AURA_SHAPES: AuraKind[] = ['glow', 'ring', 'orbit', 'rise', 'rays', 'flame', 'bolt', 'snow', 'runes', 'bubbles', 'embers']
export const AURA_ELEMENTS: [string, [string, string]][] = [
  ['ember', ['#ff7a2a', '#ffd23f']], ['tide', ['#3a9ae8', '#bfe8ff']], ['leaf', ['#46c466', '#f0ffb0']], ['spark', ['#f2d83a', '#ffffff']], ['frost', ['#8ad8f0', '#ffffff']], ['stone', ['#b09a70', '#fff0c0']],
  ['spirit', ['#a88ae0', '#e8e0ff']], ['gloom', ['#6a4a90', '#ff6a8a']], ['light', ['#fff0b0', '#ffffff']], ['toxin', ['#9ac83a', '#d070e0']], ['steel', ['#a8b4c4', '#ffffff']], ['gale', ['#9ae0d0', '#ffffff']],
]
export const AURA_RARITIES = ['plain', 'magic', 'rare', 'unique', 'primal']
export const AURA_MOTIONS = ['steady', 'quick', 'reverse', 'slow']
export const AURA_VARIANTS = AURA_SHAPES.length * AURA_ELEMENTS.length * AURA_RARITIES.length * AURA_MOTIONS.length
/** Aura number n of the generated family, 0 to AURA_VARIANTS - 1. */
export const auraAt = (n: number): AuraSpec => {
  const m = n % 4, r = Math.floor(n / 4) % 5, e = Math.floor(n / 20) % 12, k = Math.floor(n / 240) % 11
  const el = AURA_ELEMENTS[e]!
  return { id: `a${n}`, name: `${AURA_RARITIES[r]} ${el[0]} ${AURA_SHAPES[k]} (${AURA_MOTIONS[m]})`, kind: AURA_SHAPES[k]!, c: el[1][0], c2: el[1][1], n: 3 + 2 * r, r, m }
}
export const auraOf = (id: string): AuraSpec | undefined => {
  const hit = AURAS.find(a => a.id === id)
  if (hit) return hit
  const n = /^a(\d+)$/.test(id) ? Number(id.slice(1)) : -1
  return n >= 0 && n < AURA_VARIANTS ? auraAt(n) : undefined
}

const dot = (c: Cells, x: number, y: number, col: string, size = 1) => c.rect(Math.round(x), Math.round(y), size, size, col)
const ellipse = (c: Cells, cx: number, cy: number, rx: number, ry: number, col: string, thick = 0) => {
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
    if (thick ? d <= 1 && d >= 1 - thick : d <= 1) c.put(x, y, col)
  }
}
const mk = (rects: Rect[], cls: string, op?: number, st?: string): Part => ({ cls, rects, op, st })

/** An aura as two layers: `back` goes behind the crab, `front` over it. `by` is the crab's body offset. */
export const aura = (s: AuraSpec, by = 0): { back: Part[]; front: Part[] } => {
  const W = CW, H = CH
  const cx = CX, cy = 13 + by
  const rand = rng(hash(s.id))
  const c2 = s.c2 ?? s.c
  const back: Part[] = [], front: Part[] = []
  const n = s.n ?? 6
  const r = s.r ?? 2
  const m = s.m ?? 0
  if (s.kind === 'glow') {
    const bands: [number, number, number][] = [[15, 12, 0.2], [13, 10.5, 0.28], [11, 9, 0.38]]
    for (const [rx, ry, op] of bands.slice(0, 1 + Math.min(2, r >> 1))) { const c = new Cells(W, H); ellipse(c, cx, cy, rx - 2 + r * 0.6, ry - 2 + r * 0.5, s.c); back.push(mk(c.rects(), 'aura', op)) }
  } else if (s.kind === 'ring') {
    const c = new Cells(W, H); ellipse(c, cx, 23 + by, 11 + r * 0.6, 3, s.c, 0.25 + r * 0.06); back.push(mk(c.rects(), 'aura', 0.8))
    const d = new Cells(W, H); ellipse(d, cx, 23 + by, 10, 2, c2, 0.4); back.push(mk(d.rects(), 'pulse', 0.6))
  } else if (s.kind === 'orbit' || s.kind === 'runes') {
    const c = new Cells(W, H)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const x = cx + Math.cos(a) * 13.5, y = cy + Math.sin(a) * 10.5
      if (s.kind === 'orbit') { dot(c, x - 1, y - 1, i % 2 ? c2 : s.c, 3); dot(c, x, y, c2, 1) }
      else { const col = i % 2 ? c2 : s.c; const g = i % 3; const px = Math.round(x) - 1, py = Math.round(y) - 1
        if (g === 0) { c.rect(px + 1, py, 1, 3, col); c.rect(px, py + 1, 3, 1, col) } else if (g === 1) { c.rect(px, py, 3, 1, col); c.rect(px + 1, py + 1, 1, 2, col) } else { c.rect(px, py, 1, 3, col); c.rect(px + 2, py, 1, 3, col); c.rect(px, py + 1, 3, 1, col) } }
    }
    front.push(mk(c.rects(), 'orbit', 0.95))
  } else if (s.kind === 'rise' || s.kind === 'embers' || s.kind === 'bubbles' || s.kind === 'snow') {
    for (let i = 0; i < n; i++) {
      const c = new Cells(W, H)
      const x = 3 + rand() * (W - 7), y = 6 + rand() * 16
      const col = i % 2 ? c2 : s.c
      if (s.kind === 'bubbles') { c.rect(Math.round(x), Math.round(y), 3, 1, col); c.rect(Math.round(x), Math.round(y) + 2, 3, 1, col); c.rect(Math.round(x), Math.round(y) + 1, 1, 1, col); c.rect(Math.round(x) + 2, Math.round(y) + 1, 1, 1, col) }
      else dot(c, x, y, col, s.kind === 'embers' && i % 3 === 0 ? 2 : i % 2 ? 2 : 1)
      front.push(mk(c.rects(), s.kind === 'snow' ? 'fall' : 'rise', 0.9, `animation-delay:${(i * 0.37).toFixed(2)}s`))
    }
  } else if (s.kind === 'rays') {
    const c = new Cells(W, H)
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + (i / (n - 1)) * Math.PI
      for (let r = 11; r <= 14; r++) dot(c, cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 0.85, i % 2 ? c2 : s.c, 2)
    }
    back.push(mk(c.rects(), 'pulse', 0.85))
  } else if (s.kind === 'flame') {
    for (let i = 0; i < n; i++) {
      const c = new Cells(W, H)
      const x = 2 + Math.round((i / (n - 1)) * (W - 5)), base = 23 + by - (i % 3 === 1 ? 1 : 0)
      c.rect(x, base - 2, 2, 3, s.c); c.rect(x, base - 4, 1, 2, s.c); c.rect(x, base - 1, 1, 2, c2)
      front.push(mk(c.rects(), 'flick', 0.9, `animation-delay:${(i * 0.21).toFixed(2)}s`))
    }
  } else if (s.kind === 'bolt') {
    for (let i = 0; i < n; i++) {
      const c = new Cells(W, H)
      const x0 = 3 + Math.round(((i + 0.5) / n) * (W - 6)), y0 = 3 + (i % 2) * 3
      let x = x0, y = y0
      for (let k = 0; k < 6; k++) { c.rect(x, y, 1, 2, i % 2 ? c2 : s.c); x += k % 2 ? -1 : 1; y += 2 }
      front.push(mk(c.rects(), 'zap', 0.95, `animation-delay:${(i * 0.4).toFixed(2)}s`))
    }
  }
  if (m) for (const p of [...back, ...front]) p.cls = `${p.cls ?? ''} m${m}`
  return { back, front }
}

export const SPRITE_CSS = `.orbit{transform-box:fill-box;transform-origin:50% 50%;animation:spn 7s linear infinite}@keyframes spn{to{transform:rotate(360deg)}}
.rise{animation:rs 2.4s ease-out infinite}@keyframes rs{0%{transform:translateY(3px);opacity:0}20%{opacity:1}100%{transform:translateY(-8px);opacity:0}}
.fall{animation:fl2 2.8s linear infinite}@keyframes fl2{0%{transform:translateY(-6px);opacity:0}20%{opacity:1}100%{transform:translateY(6px);opacity:0}}
.flick{animation:fk .5s steps(2) infinite}@keyframes fk{50%{transform:translateY(-1px);opacity:.6}}
.zap{animation:zp 1.2s steps(1) infinite}@keyframes zp{0%,60%{opacity:0}61%,70%{opacity:1}71%{opacity:0}85%{opacity:1}}
.pet{animation:pb 1.1s ease-in-out infinite}@keyframes pb{50%{transform:translateY(-1px)}}
.m1{animation-duration:3.2s!important}.m2{animation-direction:reverse!important;animation-duration:9s!important}.m3{animation-duration:16s!important}`
