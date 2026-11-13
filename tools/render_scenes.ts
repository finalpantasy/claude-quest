// Renders the README images from the real art in hooks/art.ts, for a made-up hero played by the real engine.
// A seeded hero works a simulated two days (edits, reads, commands, tests, commits, a subagent now and then);
// the script keeps the first moment of each kind of scene, draws it with sceneSvg or stripSvg, and turns the
// SVG into a PNG with headless Microsoft Edge. Animations are paused at a fixed time so reruns match.
//
//   npx --no-install tsx tools/render_scenes.ts           SVG, PNG and the GIF into docs/images
//   npx --no-install tsx tools/render_scenes.ts --list    only print what the simulation found
//
// Needs Edge (EDGE=<path to msedge.exe> to override) and ffmpeg on PATH for the GIF; nothing is installed.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Hero } from '../types'
import { sceneSvg, STRIP_H, stripSvg } from '../hooks/art'
import { applyCounts, derive, emptyCounts, newHero, step, xpToNext } from '../hooks/game'
import { RACES } from '../hooks/data'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, 'docs', 'images')
const NAME = 'Brindle'
const SEED = 20261012
const MIN = 60_000
const HOUR = 60 * MIN
const DAYS = 2
const START = new Date(2026, 9, 5, 8, 0, 0).getTime() // a Monday, 08:00 local
const race = RACES.find(r => r.name === 'Sonnet Elf')!

type Shot = { id: string; hero: Hero; now: number; note: string }

/** Two days: 12 working hours a day, counts every 5 minutes, the engine stepped every 30 seconds. */
const simulate = () => {
  const h = newHero(NAME, null, SEED, START)
  const counts = emptyCounts()
  const shots = new Map<string, Shot>()
  // A campaign moment is kept apart from an Atlas one (id:c), so the gallery can prefer the campaign's colors.
  const keep = (id: string, t: number, note: string) => {
    const key = h.stage && id !== 'fishing' ? `${id}:c` : id
    if (!shots.has(key)) shots.set(key, { id, hero: structuredClone(h), now: t, note })
  }
  for (let t = START; t < START + DAYS * 24 * HOUR; t += 30_000) {
    const hour = new Date(t).getHours()
    const working = hour >= 8 && hour < 20
    if (working && (t - START) % (5 * MIN) === 0) {
      const m = (t - START) / MIN
      counts.edit += 3; counts.read += 2; counts.bash += 2; counts.turns += 1
      if (m % 60 === 0) { counts.test += 1; counts.agent += 1 }
      if (m % 150 === 0) counts.commit += 1
      applyCounts(h, 'demo', { ...counts }, t, race.fx)
    }
    step(h, t, race.fx)
    const k = h.task
    const day = Math.floor((t - START) / (24 * HOUR))
    const mid = k.done > k.ms * 0.25 && k.done < k.ms * 0.75
    if (k.kind === 'fight' && k.foe && mid) {
      const f = k.foe
      if (f.rank === 'boss') keep(h.stage ? 'boss' : 'atlas-boss', t, `${f.name} at Lv ${h.level}`)
      else if (!h.stage && f.rank !== 'normal') keep('atlas', t, `${f.name} x${f.count} at Lv ${h.level}`)
      else if (h.chosen && f.count >= 3 && h.minions.length > 0) keep('fight', t, `${f.name} x${f.count} at Lv ${h.level}`)
      else if (f.rank === 'goblin') keep('goblin', t, `goblin at Lv ${h.level}`)
    }
    if (k.kind === 'dead' && mid) keep('death', t, `died at Lv ${h.level}`)
    if (k.kind === 'town' && mid) keep('town', t, `town at Lv ${h.level}`)
    if (k.kind === 'fish' && mid && !working && day >= 1) keep('fishing', t, `fishing at night, Lv ${h.level}`)
    if ((k.kind === 'mine' || k.kind === 'dig') && mid) keep(k.kind === 'mine' ? 'mining' : 'digging', t, `${k.kind} at Lv ${h.level}`)
  }
  return { hero: h, shots }
}

/** Into the Atlas: the same hero with the campaign behind it. The engine itself picks the pack. */
const atlasFrom = (base: Shot): Shot => {
  const h = structuredClone(base.hero)
  h.stage = null
  h.map = { ...h.map, tier: 7 }
  h.focus = HOUR
  h.task = { kind: 'travel', label: 'Opening a map device…', ms: 1000, done: 1000 }
  let t = base.now
  for (let i = 0; i < 400; i++) {
    t += 500
    step(h, t, race.fx)
    const k = h.task
    if (k.kind === 'fight' && k.foe && k.foe.rank !== 'normal' && k.done > k.ms * 0.3) break
  }
  return { id: 'atlas', hero: h, now: t, note: `${h.task.label}, T${h.map.tier}` }
}

const page = (svg: string, w: number, h: number, at: number) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000;width:${w}px;height:${h}px;overflow:hidden}svg{display:block}</style></head><body>${svg}
<script>for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${at} }</script></body></html>`

const EDGE = process.env.EDGE ?? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => existsSync(p))

const shoot = (html: string, png: string, w: number, h: number, work: string) => {
  if (!EDGE) throw new Error('Microsoft Edge not found; set EDGE to msedge.exe')
  const file = join(work, `${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(file, html)
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${join(work, 'profile')}`,
    '--force-device-scale-factor=2', `--window-size=${w},${h}`, '--virtual-time-budget=500', `--screenshot=${png}`, pathToFileURL(file).href], { stdio: 'ignore' })
}

const main = () => {
  const { hero, shots } = simulate()
  const fight = shots.get('fight:c') ?? shots.get('fight')
  if (!shots.has('atlas') && fight) shots.set('atlas', atlasFrom(fight))
  console.log(`after ${DAYS} days: Lv ${hero.level}, ${hero.kills} kills, ${hero.deaths} deaths, class ${hero.cls}, stage ${JSON.stringify(hero.stage)}`)
  for (const [key, s] of shots) console.log(`${key.padEnd(12)} ${new Date(s.now).toString().slice(0, 21)}  ${s.note}  [${s.hero.task.label}]`)
  if (process.argv.includes('--list')) return

  mkdirSync(OUT, { recursive: true })
  const work = mkdtempSync(join(tmpdir(), 'quest-render-'))
  // 960 wide: at 720 a boss name with three affixes runs past the right edge.
  const W = 960
  const H = 150
  const noon = (t: number) => { const d = new Date(t); d.setHours(14, 0, 0, 0); return d.getTime() }
  const scenes: [string, string, number][] = [['fight', 'fight', 0.77], ['boss', 'boss', 0.77], ['fishing', 'fishing', 0.6], ['mining', 'mining', 0.3], ['town', 'town', 0.5], ['death', 'death', 0.8], ['atlas', 'atlas', 0.77]]
  try {
    for (const [file, id, at] of scenes) {
      const s = shots.get(`${id}:c`) ?? shots.get(id)
      if (!s) { console.log(`missing: ${id}`); continue }
      const now = id === 'fishing' ? s.now : noon(s.now)
      const period = Math.min(1.2, Math.max(0.3, 0.9 / derive(s.hero, race.fx).speed))
      const svg = sceneSvg(s.hero, { w: W, h: H, now, period })
      writeFileSync(join(work, `${file}.svg`), svg)
      shoot(page(svg, W, H, Math.round(at * period * 1000 * 2)), join(OUT, `${file}.png`), W, H, work)
    }
    const f = fight!
    const strip = stripSvg(f.hero, { w: W, xp: f.hero.xp / xpToNext(f.hero.level) })
    shoot(page(strip, W, STRIP_H, 0), join(OUT, 'strip.png'), W, STRIP_H, work)

    // The GIF: the fight scene, 24 frames over two swings, then ffmpeg with its own palette.
    const ff = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true } catch { return false } })()
    if (ff) {
      const period = Math.min(1.2, Math.max(0.3, 0.9 / derive(f.hero, race.fx).speed))
      const svg = sceneSvg(f.hero, { w: W, h: H, now: noon(f.now), period })
      const frames = 24
      const span = period * 2 * 1000
      const fdir = join(work, 'frames')
      mkdirSync(fdir)
      for (let i = 0; i < frames; i++) shoot(page(svg, W, H, Math.round((i / frames) * span)), join(fdir, `f${String(i).padStart(2, '0')}.png`), W, H, work)
      const fps = (frames / (span / 1000)).toFixed(2)
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps, '-i', join(fdir, 'f%02d.png'),
        '-vf', 'scale=960:-1:flags=neighbor,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none', '-loop', '0', join(OUT, 'fight.gif')])
    } else console.log('ffmpeg not on PATH: skipped the GIF')
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
  for (const n of readdirSync(OUT).sort()) console.log(`${n.padEnd(14)} ${(statSync(join(OUT, n)).size / 1024).toFixed(1)} KB`)
}

main()
