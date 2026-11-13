// Evidence renders for the D30 look as wired into the game (task-27): pose sheets and scene sheets from hooks/ only.
//   npx --no-install tsx tools/render_pixel2.ts poses     -> $OUT/poses.png
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { png } from './sheet'
import { Px } from '../hooks/sprites/pixel2/core'
import { heroSprite } from '../hooks/sprites/pixel2/hero'
import { foePx, followerPx, minionPx, bossPx } from '../hooks/sprites/pixel2'
import type { Pose } from '../hooks/sprites/pixel2/hero'

const OUT = process.env.OUT ?? join(import.meta.dirname, '..', 'docs', 'art', 'styles')
mkdirSync(OUT, { recursive: true })
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
/** Rows of sprites at a zoom on the darkest palette color. */
export const sheet = (items: Px[], z: number, gap = 6, bg = '#2e222f') => {
  const w = items.reduce((s, p) => s + p.w * z + gap, gap), h = Math.max(...items.map(p => p.h)) * z + gap * 2
  const out = new Uint8Array(w * h * 4)
  for (let i = 0; i < w * h; i++) { const [r, g, b] = hex(bg); out[i * 4] = r!; out[i * 4 + 1] = g!; out[i * 4 + 2] = b!; out[i * 4 + 3] = 255 }
  let x0 = gap
  for (const p of items) {
    for (let y = 0; y < p.h * z; y++) for (let x = 0; x < p.w * z; x++) {
      const c = p.get(Math.floor(x / z), Math.floor(y / z)); if (!c) continue
      const k = ((gap + y + (h - gap * 2 - p.h * z)) * w + x0 + x) * 4, [r, g, b] = hex(c)
      out[k] = r!; out[k + 1] = g!; out[k + 2] = b!
    }
    x0 += p.w * z + gap
  }
  return { w, h, out }
}
const arg = process.argv[2]
if (arg === 'poses') {
  const poses: Pose[] = ['stand', 'swing', 'sit', 'rod', 'pick', 'pickDown', 'shovel', 'shovelDown', 'dead']
  const s = sheet(poses.map(p => heroSprite(p).px), 5)
  writeFileSync(join(OUT, 'poses.png'), png(s.w, s.h, s.out))
  console.log('poses', s.w, s.h, poses.map(p => `${p} ${heroSprite(p).px.w}x${heroSprite(p).px.h}`).join(' '))
}

// ---------- scene renders through headless Edge, from the real sceneSvg ----------
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import type { Hero, Foe } from '../types'
import { BAND_H, STRIP_H, sceneSvg, stripSvg } from '../hooks/art'
import { newHero } from '../hooks/game'
import { LOADOUTS } from './gear_loadouts'

const EDGE = process.env.EDGE ?? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => existsSync(p))
const shoot = (html: string, out: string, w: number, h: number) => {
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE')
  const work = mkdtempSync(join(tmpdir(), 'quest-p2-'))
  try {
    const file = join(work, 'p.html')
    writeFileSync(file, html)
    execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${join(work, 'profile')}`, '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--virtual-time-budget=800', `--screenshot=${out}`, pathToFileURL(file).href], { stdio: 'ignore' })
  } finally { rmSync(work, { recursive: true, force: true }) }
}
const at = (h: number) => new Date(2026, 9, 5, h, 0, 0).getTime()
const heroWith = (task: Hero['task'], level = 42): Hero => { const h = newHero('Brindle', null, 20261012, at(8)); h.level = level; h.task = task; return h }
const foe = (name: string, rank: Foe['rank'], count: number, mods: string[] = [], level = 44): Foe => ({ name, rank, level, hp: 900, dmg: 40, count, mods, sprite: 0 })
const fightTask = (f: Foe, done = 0.4, win = true): Hero['task'] => ({ kind: 'fight', label: f.rank === 'boss' ? `Facing ${f.name}` : `Fighting ${f.name}`, ms: 14000, done: Math.round(14000 * done), foe: f, win, hit: 1840, crit: false })
const SCENES = {
  fight: () => heroWith(fightTask(foe('Segfault Slime', 'normal', 3))),
  magic: () => heroWith(fightTask(foe('Spore Daemon', 'magic', 2, ['Fast']))),
  rare: () => heroWith(fightTask(foe('Unused Import', 'rare', 1, ['Fire Enchanted', 'Extra Fast']))),
  boss: () => heroWith(fightTask(foe('Merge Conflict, Lord of the Rebase', 'boss', 1, [], 50))),
  bat: () => heroWith(fightTask(foe('Null Bat', 'unique', 1))),
  goblin: () => heroWith(fightTask(foe('Treasure Goblin', 'goblin', 1))),
  fish: () => heroWith({ kind: 'fish', label: 'Fishing at the pier', ms: 20000, done: 6000 }),
  mine: () => heroWith({ kind: 'mine', label: 'Mining iron ore', ms: 20000, done: 6000 }),
  dig: () => heroWith({ kind: 'dig', label: 'Digging for relics', ms: 20000, done: 6000 }),
  town: () => heroWith({ kind: 'town', label: 'Resting in town', ms: 20000, done: 6000 }),
  dead: () => heroWith({ kind: 'dead', label: 'Recovering from defeat', ms: 20000, done: 6000 }),
  travel: () => heroWith({ kind: 'travel', label: 'Walking to the next map', ms: 20000, done: 6000 }),
} satisfies Record<string, () => Hero>
type SceneName = keyof typeof SCENES
const page = (body: string, w: number, h: number) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#1a1a22;width:${w}px;height:${h}px;overflow:hidden}svg,div{display:block}.z{transform-origin:0 0;image-rendering:pixelated}.dmg,.o-hit{animation:none!important;opacity:1!important}</style></head><body>${body}<script>for (const a of document.getAnimations()) { a.pause(); a.currentTime = 400 }</script></body></html>`
const draw = (name: SceneName, hour: number, w: number, h = BAND_H, gear: Hero['gear'] = {}) => { const hero = SCENES[name](); hero.gear = gear; return sceneSvg(hero, { w, h, now: at(hour), period: 0.9 }) }

if (arg === 'band') {
  // the layout sheet: fight, rare, boss, dusk fight, dusk boss at 1x (the real size), then fight and boss at 3x
  for (const w of [720, 360]) {
    const rows: [SceneName, number][] = [['fight', 14], ['rare', 14], ['boss', 14], ['fight', 18], ['boss', 18]]
    const big: [SceneName, number][] = [['fight', 14], ['boss', 14]]
    const H = rows.length * (BAND_H + 6) + 6 + big.length * (BAND_H * 3 + 6) + 6, Wp = w * 3 + 12
    let y = 6, body = ''
    for (const [n, hr] of rows) { body += `<div style="position:absolute;left:6px;top:${y}px">${draw(n, hr, w)}</div>`; y += BAND_H + 6 }
    for (const [n, hr] of big) { body += `<div class="z" style="position:absolute;left:6px;top:${y}px;transform:scale(3)">${draw(n, hr, w)}</div>`; y += BAND_H * 3 + 6 }
    shoot(page(body, Wp, H), join(OUT, `band-${w}.png`), Wp, H)
    console.log(`band-${w}.png ${Wp}x${H}`)
  }
}
if (arg === 'tasks') {
  // every task kind at the 720 band size, 1x, stacked, in a day and a night version
  const names = Object.keys(SCENES) as SceneName[]
  for (const [file, hr] of [['tasks-day', 14], ['tasks-night', 22]] as const) {
    const H = names.length * (BAND_H + 6) + 6
    let y = 6, body = ''
    for (const n of names) { body += `<div style="position:absolute;left:6px;top:${y}px">${draw(n, hr, 720)}</div>`; y += BAND_H + 6 }
    shoot(page(body, 732, H), join(OUT, `${file}.png`), 732, H)
    console.log(`${file}.png 732x${H}`)
  }
}
if (arg === 'budget') {
  // the byte and time table (task-28 AC6): every task kind, the late-game loadout, three times of day; cold is the first build in this process, warm the second
  const gear = LOADOUTS[Number(process.env.LOADOUT ?? 11)]!.gear
  const names = Object.keys(SCENES) as SceneName[]
  for (const hr of [14, 18, 22]) for (const n of names) {
    const t0 = performance.now(); const svg = draw(n, hr, 720, BAND_H, gear); const cold = performance.now() - t0
    const t1 = performance.now(); draw(n, hr, 720, BAND_H, gear); const warm = performance.now() - t1
    console.log(`${hr}h ${n.padEnd(7)} ${(svg.length / 1024).toFixed(1)} KB  cold ${cold.toFixed(0)} ms  warm ${warm.toFixed(0)} ms`)
  }
}
if (arg === 'gear') {
  // evidence: every task kind for the fresh, mid and late loadouts at 720 by 120, day and night, one image per loadout and time
  const names = Object.keys(SCENES) as SceneName[]
  const sets: [string, number][] = [['fresh', 0], ['mid', 6], ['late', 11]]
  for (const [tag, li] of sets) for (const [time, hr] of [['day', 14], ['night', 22]] as const) {
    const H = names.length * (BAND_H + 6) + 6
    let y = 6, body = ''
    for (const n of names) { body += `<div style="position:absolute;left:6px;top:${y}px">${draw(n, hr, 720, BAND_H, LOADOUTS[li]!.gear)}</div>`; y += BAND_H + 6 }
    shoot(page(body, 732, H), join(OUT, `gear-band-${tag}-${time}.png`), 732, H)
    console.log(`gear-band-${tag}-${time}.png 732x${H}`)
  }
}

if (arg === 'foes') {
  const cs = ['slime', 'mushroom', 'bat', 'phantom', 'golem', 'imp', 'spider', 'skeleton'] as const
  const items = [...cs.flatMap(c => [undefined, 'magic', 'rare', 'unique', 'goblin'].map(r => foePx({ creature: c, ramp: c === 'slime' ? 'orange' : undefined, rank: r }))), ...[0, 1, 2, 3, 4].map(followerPx), minionPx(), bossPx(), bossPx('teal')]
  const s = sheet(items, 4, 8)
  writeFileSync(join(OUT, 'foes.png'), png(s.w, s.h, s.out))
  console.log('foes', s.w, s.h)
}
if (arg === 'strip') {
  // the one-line strip (18 px) at 720 and 360, plain and live, and the pane scene (760 by 150), shown at 1x and 2x
  const h = SCENES.fight()
  const live = { active: true, acts: [], hits: [], turnTokens: 12400, word: 'strike', kind: 'melee' as const }
  const rows = [stripSvg(h, { w: 720, xp: 0.4 }), stripSvg(h, { w: 720, xp: 0.4, live }), stripSvg(h, { w: 360, xp: 0.7 })]
  let body = '', y = 6
  for (const s of rows) { body += `<div class="z" style="position:absolute;left:6px;top:${y}px;transform:scale(2)">${s}</div>`; y += STRIP_H * 2 + 6 }
  body += `<div style="position:absolute;left:6px;top:${y}px">${sceneSvg(h, { w: 760, h: 150, now: at(14), period: 0.9, xp: 0.4 })}</div>`
  const H = y + 156
  shoot(page(body, 1460, H), join(OUT, 'strip-pane.png'), 1460, H)
  console.log('strip-pane.png', 1460, H)
}
