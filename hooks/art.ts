// The little guy and his world, drawn as one SVG string per scene. Every motion is CSS the compositor runs:
// the hop, the swing, the health bars draining over the fight's own length. The mod redraws only when the
// task changes, never per frame.
import type { Hero, Item, Rarity } from '../types'
import { CLASSES, APPRENTICE, FOLLOWERS } from './data'
import { RANK_COLOR, fmt, itemColor, placeOf } from './game'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

type Px = (x: number, y: number, w: number, h: number, fill: string, cls?: string) => string
const pixels = (): Px => (x, y, w, h, fill, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${cls ? ` class="${cls}"` : ''}/>`

const SKIN = '#f1c27d'
const tint = (i: Item | undefined, fallback: string) => (i ? itemColor(i) : fallback)

/** The hero: 12 by 16 pixels, class colors, gear showing through in rarity colors. `tool` swaps the weapon for camp work. */
const heroSprite = (h: Hero, tool?: 'rod' | 'pick' | 'shovel' | 'none', pose: 'stand' | 'sit' = 'stand') => {
  const f = pixels()
  const cls = CLASSES[h.cls] ?? APPRENTICE
  const g = h.gear
  const out: string[] = []
  out.push(f(3, 0, 6, 2, tint(g.head, '#4a3020')))
  out.push(f(3, 2, 6, 3, SKIN), f(4, 3, 1, 1, '#1a1a1a'), f(7, 3, 1, 1, '#1a1a1a'))
  out.push(f(3, 5, 6, 5, cls.color), f(3, 7, 6, 1, tint(g.chest, cls.trim)), f(3, 9, 6, 1, tint(g.waist, '#3a2a1a')))
  out.push(f(2, 5, 1, 4, cls.color), f(2, 9, 1, 1, tint(g.hands, SKIN)))
  if (pose === 'sit') {
    out.push(f(4, 10, 5, 2, tint(g.legs, '#3a3a4a')), f(8, 12, 2, 2, tint(g.legs, '#3a3a4a')), f(9, 14, 2, 1, tint(g.feet, '#5a3a20')))
  } else {
    out.push(`<g class="l1">${f(4, 10, 2, 4, tint(g.legs, '#3a3a4a'))}${f(4, 14, 2, 1, tint(g.feet, '#5a3a20'))}</g>`)
    out.push(`<g class="l2">${f(6, 10, 2, 4, tint(g.legs, '#3a3a4a'))}${f(6, 14, 2, 1, tint(g.feet, '#5a3a20'))}</g>`)
  }
  const w = tint(g.weapon, '#cfd6e0')
  let weapon = ''
  if (tool === 'rod') weapon = f(10, -6, 1, 15, '#8a6a3a') + f(10, -6, 2, 1, '#8a6a3a')
  else if (tool === 'pick') weapon = f(10, 2, 1, 8, '#7a5230') + f(7, 1, 7, 1, '#9aa4b0') + f(7, 2, 1, 1, '#9aa4b0') + f(13, 2, 1, 1, '#9aa4b0')
  else if (tool === 'shovel') weapon = f(10, 0, 1, 9, '#7a5230') + f(9, 9, 3, 3, '#9aa4b0')
  else if (tool !== 'none') {
    const glyph = cls.weaponGlyph
    if (glyph === 'sword') weapon = f(10, 0, 1, 8, w) + f(9, 7, 3, 1, '#d9a441') + f(10, 8, 1, 2, '#5a3a20')
    else if (glyph === 'staff') weapon = f(10, 0, 1, 11, '#7a5230') + f(9, -2, 3, 2, w) + f(10, -3, 1, 1, '#ffffff')
    else if (glyph === 'bow') weapon = f(11, 1, 1, 1, w) + f(12, 2, 1, 6, w) + f(11, 8, 1, 1, w) + f(11.4, 2, 0.4, 6, '#e8e0d0')
    else if (glyph === 'scythe') weapon = f(10, -1, 1, 12, '#5a4a3a') + f(6, -1, 5, 1, w) + f(5, 0, 2, 1, w) + f(5, 1, 1, 1, w)
    else weapon = f(10, 5, 1, 4, w) + f(9, 8, 3, 1, '#d9a441')
  }
  out.push(f(9, 5, 1, 3, cls.color), f(9, 8, 1, 1, SKIN))
  return `${out.join('')}<g class="wpn">${weapon}</g>`
}

/** Six monster shapes on a 10 by 10 grid, colored by name, eyes glowing in the rank's color. */
const foeSprite = (kind: number, body: string, eye: string, isGoblin: boolean) => {
  const f = pixels()
  const dark = '#14141a'
  if (isGoblin) return f(3, 4, 4, 4, '#5a9a3a') + f(3, 1, 4, 3, '#6ab04a') + f(2, 0, 1, 2, '#6ab04a') + f(7, 0, 1, 2, '#6ab04a') + f(4, 2, 1, 1, eye) + f(6, 2, 1, 1, eye) + f(6, 3, 4, 5, '#d9a441') + f(7, 3, 2, 1, '#fff1a0') + f(3, 8, 1, 2, '#3a6a2a') + f(6, 8, 1, 2, '#3a6a2a')
  switch (kind) {
    case 0: return f(2, 4, 6, 4, body) + f(3, 2, 4, 2, body) + f(1, 5, 1, 1, body) + f(8, 5, 1, 1, body) + f(1, 7, 1, 1, body) + f(8, 7, 1, 1, body) + f(3, 1, 1, 1, body) + f(6, 1, 1, 1, body) + f(4, 3, 1, 1, eye) + f(5, 3, 1, 1, eye) + f(2, 6, 6, 1, dark)
    case 1: return f(2, 1, 6, 7, body) + f(3, 0, 4, 1, body) + f(2, 8, 1, 1, body) + f(4, 8, 1, 1, body) + f(6, 8, 1, 1, body) + f(3, 3, 1, 2, eye) + f(6, 3, 1, 2, eye) + f(4, 6, 2, 1, dark)
    case 2: return f(2, 2, 6, 6, body) + f(0, 3, 2, 4, body) + f(8, 3, 2, 4, body) + f(2, 8, 2, 2, body) + f(6, 8, 2, 2, body) + f(3, 4, 1, 1, eye) + f(6, 4, 1, 1, eye) + f(2, 2, 6, 1, dark)
    case 3: return f(3, 4, 4, 4, body) + f(3, 1, 4, 3, body) + f(2, 0, 1, 2, body) + f(7, 0, 1, 2, body) + f(0, 3, 3, 3, dark) + f(7, 3, 3, 3, dark) + f(3, 8, 1, 2, body) + f(6, 8, 1, 2, body) + f(4, 2, 1, 1, eye) + f(6, 2, 1, 1, eye)
    case 4: return f(1, 4, 8, 5, body) + f(2, 3, 6, 1, body) + f(3, 2, 4, 1, body) + f(3, 5, 1, 1, eye) + f(6, 5, 1, 1, eye) + f(2, 4, 1, 1, '#ffffff')
    default: return f(2, 1, 6, 5, body) + f(3, 6, 4, 2, body) + f(3, 3, 2, 2, dark) + f(5, 3, 2, 2, dark) + f(3, 3, 1, 1, eye) + f(6, 3, 1, 1, eye) + f(3, 7, 1, 1, dark) + f(5, 7, 1, 1, dark)
  }
}

const CSS = `<style>
text{font-family:ui-monospace,Menlo,Consolas,monospace;paint-order:stroke;stroke:#000;stroke-width:2px;stroke-linejoin:round}
.bob{animation:bob 1s steps(2) infinite}@keyframes bob{50%{transform:translateY(-1px)}}
.hop{animation:hop .9s ease-in-out infinite}@keyframes hop{0%,100%{transform:translateY(0)}40%,55%{transform:translateY(-3px)}}
.atk{animation:atk var(--p) ease-in-out infinite}@keyframes atk{0%,100%{transform:translateX(0)}45%,55%{transform:translateX(6px)}}
.atk .wpn{transform-box:fill-box;transform-origin:50% 90%;animation:sw var(--p) ease-in-out infinite}@keyframes sw{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(75deg)}}
.walk .l1{animation:st .4s steps(1) infinite}.walk .l2{animation:st .4s steps(1) infinite -.2s}@keyframes st{50%{transform:translateY(-1px)}}
.foe{animation:hurt var(--p) steps(1) infinite}@keyframes hurt{48%{opacity:1}50%{opacity:.35}58%{opacity:1}}
.shk{animation:shk var(--p) ease-in-out infinite}@keyframes shk{48%{transform:translateX(0)}52%{transform:translateX(2px)}60%{transform:translateX(0)}}
.dmg{animation:fl calc(var(--p)*2) ease-out infinite}@keyframes fl{0%{transform:translateY(0);opacity:0}10%{opacity:1}100%{transform:translateY(-16px);opacity:0}}
.bar{transform-box:fill-box;transform-origin:0 50%}
.beam{animation:beam 1.2s ease-in-out infinite}@keyframes beam{0%,100%{opacity:.5}50%{opacity:1}}
.bobber{animation:bb 1.6s ease-in-out infinite}@keyframes bb{0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}
.wave{animation:wv 3s linear infinite}@keyframes wv{from{transform:translateX(0)}to{transform:translateX(-24px)}}
.swing .wpn{transform-box:fill-box;transform-origin:20% 90%;animation:dig .8s ease-in-out infinite}@keyframes dig{0%,100%{transform:rotate(-40deg)}50%{transform:rotate(30deg)}}
.spark{animation:sp .8s ease-out infinite}@keyframes sp{0%,40%{opacity:0;transform:translate(0,0)}50%{opacity:1}100%{opacity:0;transform:translate(6px,-7px)}}
.tw{animation:tw 2.4s steps(2) infinite}@keyframes tw{50%{opacity:.2}}
.ghost{animation:gh 2s ease-in-out infinite;opacity:.55}@keyframes gh{50%{transform:translateY(-4px)}}
.scroll{animation:wv .8s linear infinite}
.coin{animation:sp 1s ease-out infinite}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>`

export type SceneOpts = { w: number; h: number; now: number; period: number; title?: boolean }

/** One scene: where the hero is and what it is doing, sized w by h. */
export const sceneSvg = (hero: Hero, o: SceneOpts): string => {
  const { w: W, h: H } = o
  const u = H / 40 // one hero pixel
  const ground = Math.round(H * 0.74)
  const place = placeOf(hero)
  const task = hero.task
  const hour = new Date(o.now).getHours()
  const isNight = hour >= 20 || hour < 6
  const parts: string[] = []
  const seed = hash(place.title)
  // Sky, far hills, ground.
  parts.push(`<rect width="${W}" height="${H}" fill="${place.sky}"/>`)
  if (isNight) {
    parts.push(`<rect width="${W}" height="${H}" fill="#000" opacity=".35"/>`, `<circle cx="${W * 0.88}" cy="${H * 0.18}" r="${u * 3}" fill="#f4f1d8" opacity=".85"/>`)
    for (let i = 0; i < 9; i++) parts.push(`<rect class="tw" style="animation-delay:-${(i * 0.31).toFixed(2)}s" x="${((seed >> i) % 97) / 97 * W}" y="${((seed >> (i + 3)) % 41) / 41 * H * 0.45}" width="${u * 0.6}" height="${u * 0.6}" fill="#fff"/>`)
  }
  const hills = Array.from({ length: 6 }, (_, i) => `${(i / 5) * W},${ground - H * (0.12 + (((seed >> (i * 3)) % 9) / 9) * 0.18)}`)
  parts.push(`<polygon points="0,${ground} ${hills.join(' ')} ${W},${ground}" fill="#000" opacity=".28"/>`)
  parts.push(`<rect y="${ground}" width="${W}" height="${H - ground}" fill="${place.ground}"/>`)
  const sprite = (x: number, y: number, scale: number, inner: string, cls = '', extra = '') =>
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(u * scale).toFixed(3)})"><g class="${cls}" ${extra}>${inner}</g></g>`
  const heroX = W * 0.16
  const heroY = ground - 15 * u
  const label = (s: string, x: number, y: number, size: number, fill = '#e8e0d0', anchor = 'start') =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`
  const fs = Math.max(8, Math.round(H / 8))
  const p = `--p:${o.period.toFixed(2)}s`

  // The party trails behind: followers, then minions.
  hero.followers.slice(0, 3).forEach((name, i) => {
    const c = ['#c8c8d8', '#8a6a4a', '#b06ad0', '#6a9ad0', '#d0a040'][FOLLOWERS.indexOf(name)] ?? '#aaa'
    const f = pixels()
    const body = f(3, 0, 6, 2, c) + f(3, 2, 6, 3, SKIN) + f(4, 3, 1, 1, '#111') + f(7, 3, 1, 1, '#111') + f(3, 5, 6, 5, c) + f(4, 10, 2, 4, '#3a3a4a') + f(6, 10, 2, 4, '#3a3a4a')
    parts.push(sprite(heroX - (i + 1) * 9 * u, heroY + 4 * u, 0.72, body, 'hop', `style="animation-delay:-${i * 0.3}s"`))
  })
  hero.minions.slice(0, 4).forEach((_, i) => {
    const f = pixels()
    const bones = f(2, 0, 4, 3, '#e8e4d8') + f(3, 1, 1, 1, '#7a3ad0') + f(5, 1, 1, 1, '#7a3ad0') + f(3, 3, 2, 3, '#e8e4d8') + f(2, 6, 1, 2, '#e8e4d8') + f(5, 6, 1, 2, '#e8e4d8')
    parts.push(sprite(heroX - (Math.min(3, hero.followers.length) * 9 + 6) * u - i * 5 * u, ground - 8 * u, 0.9, bones, 'hop', `style="animation-delay:-${(i * 0.21).toFixed(2)}s"`))
  })

  if (task.kind === 'fight' && task.foe) {
    const foe = task.foe
    const n = Math.min(4, foe.count)
    const big = foe.rank === 'boss' ? 1.9 : foe.rank === 'unique' ? 1.35 : foe.rank === 'rare' ? 1.15 : 1
    const hue = hash(foe.name) % 360
    const body = foe.rank === 'boss' ? `hsl(${hue} 55% 38%)` : `hsl(${hue} 45% 55%)`
    const eye = RANK_COLOR[foe.rank]
    const x0 = W * 0.56
    for (let i = 0; i < n; i++) {
      const fx = x0 + i * (W * 0.34) / Math.max(1, n) + (i % 2) * u * 2
      const fy = ground - 10 * u * big - (i % 2) * u
      // A glow underfoot in the rank's color for anything above normal.
      if (foe.rank !== 'normal') parts.push(`<ellipse cx="${(fx + 5 * u * big).toFixed(1)}" cy="${ground}" rx="${(6 * u * big).toFixed(1)}" ry="${(1.6 * u).toFixed(1)}" fill="${eye}" opacity=".35"/>`)
      parts.push(sprite(fx, fy, big, foeSprite(foe.sprite, body, eye, foe.rank === 'goblin'), 'foe shk', `style="${p};animation-delay:-${(i * 0.13).toFixed(2)}s"`))
    }
    // The pack's life drains over the fight; a lost fight leaves it standing.
    const barW = W * 0.34
    const end = task.win ? 0 : 0.25 + (hash(foe.name) % 40) / 100
    const anim = (name: string, to: number) => `@keyframes ${name}{from{transform:scaleX(1)}to{transform:scaleX(${to.toFixed(2)})}}`
    const timing = `animation:VAR ${task.ms}ms linear -${task.done}ms forwards`
    parts.push(`<style>${anim('fhp', end)}${anim('hhp', task.win ? 0.4 + (hash(foe.name) % 50) / 100 : 0)}</style>`)
    parts.push(`<rect x="${x0}" y="${H * 0.24}" width="${barW}" height="${u * 1.6}" fill="#000" opacity=".6"/>`)
    parts.push(`<rect class="bar" style="${timing.replace('VAR', 'fhp')}" x="${x0}" y="${H * 0.24}" width="${barW}" height="${u * 1.6}" fill="${foe.rank === 'normal' ? '#c0392b' : eye}"/>`)
    parts.push(label(`${foe.name}${foe.mods.length ? ` [${foe.mods.slice(0, 3).join(', ')}]` : ''}`, x0, H * 0.24 - 2, fs * 0.8, eye))
    parts.push(`<rect x="${heroX - u}" y="${heroY - 3 * u}" width="${14 * u}" height="${u}" fill="#000" opacity=".6"/>`)
    parts.push(`<rect class="bar" style="${timing.replace('VAR', 'hhp')}" x="${heroX - u}" y="${heroY - 3 * u}" width="${14 * u}" height="${u}" fill="#2fd05a"/>`)
    parts.push(sprite(heroX, heroY, 1, heroSprite(hero), 'atk', `style="${p}"`))
    // Floating numbers, three out of step; a crit in gold.
    for (let i = 0; i < 3; i++) {
      const isCrit = task.crit && i === 1
      parts.push(`<g class="dmg" style="${p};animation-delay:-${(i * o.period * 0.66).toFixed(2)}s"><text x="${(x0 + barW * (0.15 + i * 0.25)).toFixed(1)}" y="${(ground - 12 * u).toFixed(1)}" font-size="${isCrit ? fs * 1.15 : fs * 0.85}" fill="${isCrit ? '#ffd23f' : '#ffffff'}" font-weight="bold">${fmt((task.hit ?? 0) * (1 - i * 0.07))}${isCrit ? '!' : ''}</text></g>`)
    }
  } else if (task.kind === 'fish') {
    const wx = W * 0.42
    parts.push(`<rect x="${wx}" y="${ground - u}" width="${W - wx}" height="${H - ground + u}" fill="#1f5f8a"/>`)
    parts.push(`<g class="wave">${Array.from({ length: Math.ceil((W - wx) / 24) + 2 }, (_, i) => `<rect x="${wx + i * 24}" y="${ground + u * 2}" width="10" height="${u * 0.6}" fill="#7fc4ef" opacity=".6"/>`).join('')}</g>`)
    parts.push(`<rect x="${heroX - u}" y="${ground - 3 * u}" width="${14 * u}" height="${3 * u}" fill="#6a4a2a"/>`)
    parts.push(sprite(heroX + 6 * u, ground - 17 * u, 1, heroSprite(hero, 'rod', 'sit'), 'bob'))
    const tipX = heroX + 18 * u
    const tipY = ground - 23 * u
    const bobX = W * 0.72
    parts.push(`<path d="M${tipX} ${tipY} Q ${(tipX + bobX) / 2} ${ground - 18 * u} ${bobX} ${ground}" stroke="#e8e0d0" stroke-width="${u * 0.25}" fill="none" opacity=".7"/>`)
    parts.push(`<g class="bobber"><circle cx="${bobX}" cy="${ground + u * 0.4}" r="${u * 0.9}" fill="#e74c3c"/><rect x="${bobX - u * 0.9}" y="${ground - u * 0.5}" width="${u * 1.8}" height="${u * 0.6}" fill="#fff"/></g>`)
  } else if (task.kind === 'mine' || task.kind === 'dig') {
    const isMine = task.kind === 'mine'
    const rx = W * 0.5
    if (isMine) {
      parts.push(`<polygon points="${rx},${ground} ${rx + 6 * u},${ground - 14 * u} ${rx + 16 * u},${ground - 18 * u} ${rx + 26 * u},${ground - 9 * u} ${rx + 30 * u},${ground}" fill="#5c5c66"/>`)
      for (let i = 0; i < 5; i++) parts.push(`<rect x="${rx + (6 + i * 4) * u}" y="${ground - (5 + (i % 3) * 4) * u}" width="${u * 1.6}" height="${u * 1.2}" fill="${['#d9a441', '#7fd4ff', '#c58bff', '#e74c3c', '#2fd05a'][i]}"/>`)
    } else {
      parts.push(`<ellipse cx="${rx + 10 * u}" cy="${ground}" rx="${14 * u}" ry="${5 * u}" fill="#6a4a2a"/>`, `<rect x="${rx + 8 * u}" y="${ground - 3 * u}" width="${u * 1.4}" height="${u * 1.4}" fill="#e8c27a" class="tw"/>`)
    }
    parts.push(sprite(rx - 12 * u, ground - 15 * u, 1, heroSprite(hero, isMine ? 'pick' : 'shovel'), 'swing'))
    for (let i = 0; i < 3; i++) parts.push(`<rect class="spark" style="animation-delay:-${(i * 0.27).toFixed(2)}s" x="${rx + 2 * u}" y="${ground - 8 * u}" width="${u}" height="${u}" fill="${isMine ? '#ffd23f' : '#8a6a3a'}"/>`)
  } else if (task.kind === 'town') {
    for (let i = 0; i < 3; i++) {
      const bx = W * (0.45 + i * 0.17)
      parts.push(`<rect x="${bx}" y="${ground - 12 * u}" width="${12 * u}" height="${12 * u}" fill="#6a5a4a"/><polygon points="${bx - u},${ground - 12 * u} ${bx + 6 * u},${ground - 19 * u} ${bx + 13 * u},${ground - 12 * u}" fill="#8a3a2a"/><rect x="${bx + 4 * u}" y="${ground - 6 * u}" width="${3 * u}" height="${6 * u}" fill="#2a1a10"/><rect x="${bx + 8 * u}" y="${ground - 10 * u}" width="${2 * u}" height="${2 * u}" fill="#ffd27a"/>`)
    }
    parts.push(sprite(heroX, heroY, 1, heroSprite(hero), 'bob'))
    for (let i = 0; i < 3; i++) parts.push(`<circle class="coin" style="animation-delay:-${(i * 0.33).toFixed(2)}s" cx="${heroX + 12 * u}" cy="${heroY + 4 * u}" r="${u * 0.8}" fill="#ffd23f"/>`)
  } else if (task.kind === 'dead') {
    parts.push(`<rect x="${heroX}" y="${ground - 11 * u}" width="${9 * u}" height="${11 * u}" rx="${4 * u}" fill="#8a8a92"/>`, label('RIP', heroX + 4.5 * u, ground - 4 * u, fs * 0.8, '#2a2a2a', 'middle'))
    parts.push(sprite(heroX + 14 * u, heroY - 4 * u, 1, heroSprite(hero, 'none'), 'ghost'))
  } else {
    // Travel: the ground scrolls under a walking hero.
    parts.push(`<g class="scroll">${Array.from({ length: Math.ceil(W / 16) + 2 }, (_, i) => `<rect x="${i * 16}" y="${ground + 2 * u}" width="${6 * u}" height="${u * 0.6}" fill="#000" opacity=".3"/>`).join('')}</g>`)
    parts.push(sprite(heroX, heroY, 1, heroSprite(hero), 'walk hop'))
  }

  // A beam of light for a legendary dropped in the last 15 seconds.
  if (hero.beam && o.now - hero.beam.at < 15_000) {
    const bx = W * 0.72
    parts.push(`<defs><linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hero.beam.color}" stop-opacity="0"/><stop offset="1" stop-color="${hero.beam.color}" stop-opacity=".9"/></linearGradient></defs>`)
    parts.push(`<rect class="beam" x="${bx}" y="0" width="${u * 3}" height="${ground}" fill="url(#bm)"/>`, label(hero.beam.name, bx + u * 1.5, ground + fs, fs * 0.9, hero.beam.color, 'middle'))
  }

  // Header and the task's progress along the bottom.
  if (o.title !== false) {
    const cls = CLASSES[hero.cls] ?? APPRENTICE
    parts.push(label(place.title, 4, fs, fs * 0.85, '#c8c0b0'))
    parts.push(label(`Lv ${hero.level} ${cls.name}`, W - 4, fs, fs * 0.85, cls.trim, 'end'))
  }
  parts.push(label(task.label.length > 70 ? `${task.label.slice(0, 69)}…` : task.label, 4, H - u * 2, fs * 0.85, '#ffffff'))
  parts.push(`<style>@keyframes prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}</style>`)
  parts.push(`<rect x="0" y="${H - u}" width="${W}" height="${u}" fill="#000" opacity=".5"/><rect class="bar" style="animation:prog ${task.ms}ms linear -${task.done}ms forwards" x="0" y="${H - u}" width="${W}" height="${u}" fill="#d9a441"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${CSS}${parts.join('')}</svg>`
}

/** The ticker's text for a surface without SVG: icon, task, a bar, the percent. */
export const tickerText = (hero: Hero, now: number) => {
  const t = hero.task
  const pct = Math.min(1, t.done / Math.max(1, t.ms))
  const icon = t.kind === 'fight' ? '⚔' : t.kind === 'fish' ? '🎣' : t.kind === 'mine' ? '⛏' : t.kind === 'dig' ? '🏺' : t.kind === 'town' ? '🏘' : t.kind === 'dead' ? '☠' : '➜'
  const bar = '▓'.repeat(Math.round(pct * 10)) + '░'.repeat(10 - Math.round(pct * 10))
  void now
  return { icon, bar, pct: Math.round(pct * 100) }
}

export const rarityColor = (r: Rarity) => ({ normal: '#c8c8c8', magic: '#8080ff', rare: '#f2e05a', unique: '#ff8a1f', set: '#2fd05a' })[r]
