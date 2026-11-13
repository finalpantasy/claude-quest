// The hero and his world, drawn as one SVG string per scene in the D30 look (task-27): Resurrect 64 pixel art, every art pixel
// two screen pixels, sprites as small PNG data URIs, a bitmap font, thin bars. Every motion is CSS the compositor runs: the bob,
// the swing frames, the hit blink, the bars draining over the fight's own length. The mod redraws only when the task changes.
// The hero is H1, a human swordsman (D29); the older sprite library in ./sprites is no longer drawn from here.
import type { ActKind, Hero, Live, Rarity } from '../types'
import { ACHIEVEMENTS, APPRENTICE, CLASSES, FOLLOWERS } from './data'
import { fmt, moonOf, placeOf } from './game'
import { SPECIES, speciesOf } from './sprites/species'
import * as D from './sprites/pixel2'
import type { Pose, Px, Time, Variant } from './sprites/pixel2'

const P = D.P
const KNOWN = new Set(SPECIES.map(s => s.name))
/** The bestiary name behind a pack's name: "Undocumented Transitive Dep" is a Transitive Dep, "Foo Bar, Null Pointer" and "Foobar the Null Pointer" are Null Pointers. */
export const speciesKey = (name: string) => {
  if (KNOWN.has(name)) return name
  const tail = name.includes(', ') ? name.slice(name.lastIndexOf(', ') + 2) : name.includes(' the ') ? name.slice(name.indexOf(' the ') + 5) : name
  const words = tail.split(' ')
  for (let i = 0; i < words.length; i++) { const k = words.slice(i).join(' '); if (KNOWN.has(k)) return k }
  return name
}

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Screen pixels per art pixel, everywhere. */
export const S = 2
/** The band above the prompt: 60 art rows. H1 with his raised sword is 56 rows (112 px) and the boss 60, so 120 px is the smallest whole height that fits both with the bars and the XP strip. */
export const BAND_H = 120
export const STRIP_H = 18

const CSS = `<style>image{image-rendering:pixelated}
.bob{animation:b 1.6s step-end infinite}.bob2{animation:b 1.2s step-end infinite}.walk{animation:b .5s step-end infinite}.fly{animation:f .9s step-end infinite}.tw{animation:t 1.1s step-end infinite}.float{animation:f 2s step-end infinite}
@keyframes b{50%{transform:translateY(${S}px)}}@keyframes f{50%{transform:translateY(-${S * 2}px)}}@keyframes t{50%{opacity:0}}
.fa{animation:fa var(--p) step-end infinite}.fb{opacity:0;animation:fb var(--p) step-end infinite}@keyframes fa{50%{opacity:0}}@keyframes fb{50%{opacity:1}}
.foe{animation:hurt var(--p) step-end infinite}@keyframes hurt{46%{opacity:0}50%{opacity:1}}
.dmg{animation:fl calc(var(--p)*2) steps(8) infinite}@keyframes fl{0%{transform:translateY(0);opacity:0}10%{opacity:1}100%{transform:translateY(-${S * 6}px);opacity:0}}
.bar{transform-box:fill-box;transform-origin:0 50%}
.wave{animation:wv 3s steps(12) infinite}@keyframes wv{to{transform:translateX(-${S * 24}px)}}
.scroll{animation:sc .8s steps(4) infinite}@keyframes sc{to{transform:translateX(-${S * 16}px)}}
.spark{animation:sp .8s steps(4) infinite}@keyframes sp{0%,40%{opacity:0;transform:translate(0,0)}50%{opacity:1}100%{opacity:0;transform:translate(${S * 3}px,-${S * 3}px)}}
.coin{animation:sp 1s steps(4) infinite}
.beam{animation:t 1.2s step-end infinite}
.pulse{animation:t .8s step-end infinite}
.aura{animation:ap 2.4s steps(3) infinite}@keyframes ap{50%{opacity:.33}}
.mote{animation:mr 6s steps(10) infinite}@keyframes mr{0%{opacity:0;transform:translateY(0)}15%,85%{opacity:1}100%{opacity:0;transform:translateY(-${S * 14}px)}}
/* Live work: one-shots play once from where their start time put them, so a redraw never replays them. */
.o-melee{animation:om .55s steps(5) 1 both}@keyframes om{0%{opacity:0;transform:scale(.5)}25%{opacity:1}100%{opacity:0;transform:scale(1.4)}}
.o-arrow{animation:oa .6s steps(8) 1 both}@keyframes oa{0%{opacity:1;transform:translateX(0)}85%{opacity:1}100%{opacity:0;transform:translateX(var(--d))}}
.o-spell{animation:os .7s steps(8) 1 both}@keyframes os{0%{opacity:1;transform:translateX(0) scale(.6)}80%{opacity:1}100%{opacity:0;transform:translateX(var(--d)) scale(1.4)}}
.o-summon{animation:ou 1.2s steps(6) 1 both}@keyframes ou{0%{opacity:0;transform:translateY(${S * 3}px)}20%,70%{opacity:1;transform:translateY(0)}100%{opacity:0}}
.o-portal{animation:op 1s steps(5) 1 both}@keyframes op{0%{opacity:0;transform:scale(.2)}30%,70%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.2)}}
.o-hit{animation:oh 1.6s steps(8) 1 both}@keyframes oh{0%{opacity:0;transform:translateY(0)}10%{opacity:1}100%{opacity:0;transform:translateY(-${S * 12}px)}}
.o-chip{animation:oc .9s step-end 1 both}@keyframes oc{0%{opacity:1}100%{opacity:0}}
.o-orig{transform-box:fill-box;transform-origin:50% 50%}
.wx-rain rect{animation:wr .6s steps(6) infinite}@keyframes wr{0%{transform:translate(0,-${S * 12}px);opacity:0}15%,85%{opacity:1}100%{transform:translate(-${S * 3}px,${S * 12}px);opacity:0}}
.wx-snow rect{animation:ws 4s steps(16) infinite}@keyframes ws{0%{transform:translate(0,-${S * 8}px);opacity:0}20%,80%{opacity:1}50%{transform:translate(${S * 2}px,0)}100%{transform:translate(0,${S * 8}px);opacity:0}}
.wx-embers rect,.wx-spores rect{animation:we 3s steps(12) infinite}@keyframes we{0%{transform:translate(0,${S * 4}px);opacity:0}20%,70%{opacity:1}100%{transform:translate(${S * 2}px,-${S * 10}px);opacity:0}}
.wx-spores rect{animation-duration:5s}
.wx-fog rect{animation:wf 18s steps(36) infinite alternate}@keyframes wf{to{transform:translateX(${S * 60}px)}}
.wx-fireflies rect{animation:wl 2.6s steps(8) infinite}@keyframes wl{0%,100%{opacity:0;transform:translate(0,0)}30%,60%{opacity:1}50%{transform:translate(${S * 3}px,-${S * 2}px)}}
.wx-leaves rect{animation:wv2 4s steps(16) infinite}@keyframes wv2{0%{transform:translate(0,-${S * 8}px);opacity:0}15%,85%{opacity:1}33%{transform:translate(-${S * 3}px,-${S * 2}px)}66%{transform:translate(${S * 2}px,${S * 3}px)}100%{transform:translate(-${S * 4}px,${S * 8}px);opacity:0}}
.wx-aurora rect{animation:wa 7s steps(14) infinite alternate}@keyframes wa{0%{opacity:.2;transform:translateX(0)}50%{opacity:1}100%{opacity:.4;transform:translateX(${S * 8}px)}}
.wx-sand rect{animation:wd 1.4s steps(7) infinite}@keyframes wd{0%{transform:translateX(${S * 10}px);opacity:0}20%,80%{opacity:.8}100%{transform:translateX(-${S * 14}px);opacity:0}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>`

export type SceneOpts = { w: number; h: number; now: number; period: number; title?: boolean; live?: Live; xp?: number }

/** How long each action's one-shot plays, in ms; also what keeps it in the drawing. */
export const ACT_MS: Record<ActKind, number> = { melee: 550, arrow: 600, spell: 700, summon: 1200, portal: 1000, strike: 550 }
export const HIT_MS = 1600
/** The word and icon for each kind, for the strip and the terminal ticker. */
export const ACT_WORD: Record<ActKind, string> = { melee: 'strike', arrow: 'scout', spell: 'cast', summon: 'summon', portal: 'portal', strike: 'strike' }
export const ACT_ICON: Record<ActKind, string> = { melee: '⚔', arrow: '➳', spell: '✦', summon: '☠', portal: '◎', strike: '⚔' }

/** A turn's size on a log scale: 0 for a few hundred tokens, 1 near 100k. */
export const sizeOf = (tokens: number) => Math.max(0, Math.min(1, Math.log10(Math.max(1, tokens) / 300) / Math.log10(100000 / 300)))

const delayOf = (now: number, at: number) => `animation-delay:${(at - now).toFixed(0)}ms`

/** Palette color for each foe rank: the name line and the bars. */
const RANK_PAL: Record<string, string> = { normal: P.cloud, magic: P.ice, rare: P.gold, unique: P.orange, boss: P.rose, goblin: P.gold }
const HERO_X = 18 // body center column of the hero, in art pixels
/** Elite affixes that draw a tell around the pack leader; Horde shows as the pack itself. */
export const EFX: Record<string, string> = {
  Molten: 'fire', Overclocked: 'fire', 'Hot-Patched': 'fire', Frozen: 'ice', Juggernaut: 'crack', Mortar: 'crack',
  Shielding: 'bubble', Containerized: 'bubble', Illusionist: 'ghost', Teleporter: 'ghost', Obfuscated: 'ghost', Splitting: 'ghost',
  'Auto-Scaling': 'ghost', 'Garbage-Collected': 'ghost', 'Load-Balanced': 'ghost', Fast: 'speed', Retrying: 'speed',
  'Arcane Enchanted': 'beam', 'Root Access': 'beam', Waller: 'wall', Jailer: 'cage', Thunderstorm: 'bolt', Plagued: 'bugs',
  Vampiric: 'drip', 'Extra Health': 'plus', 'Self-Healing': 'plus', 'Infinite Scroll': 'plus', 'Rate-Limited': 'clock', Memoized: 'clock',
}
/** What H1 wears (task-28): an old save, a missing slot or an item the tables do not know leaves H1's own kit, never a crash. */
const lookOfHero = (hero: Hero): D.GearLook => { try { return D.lookOf(hero.gear) } catch { return { auras: [] } } }
const wornOf = (look: D.GearLook, pose: Pose): ReturnType<typeof D.gearHero> => { try { return D.gearHero(look, pose) } catch { return { hero: D.heroSprite(pose) } } }
/** Width of a ringed (outlined) line: the font plus one ring pixel per letter and a margin. */
const ringW = (s: string) => D.textWidth(s) + s.length + 2
/** The longest start of `s` that fits `max` art pixels once ringed, with two dots when it was cut. */
const fitRing = (s: string, max: number): string => {
  if (ringW(s) <= max) return s
  let n = s.length
  while (n > 1 && ringW(`${s.slice(0, n).trimEnd()}..`) > max) n--
  return `${s.slice(0, n).trimEnd()}..`
}

// ---------- places and weather (task-13) ----------
/** The place a biome is looked up by: the act zone, or the Atlas map's name. */
const whereOf = (h: Hero, title: string) => (h.stage ? title.split(' · ').pop()! : h.map.name)
const seedOf = (s: string) => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619) >>> 0; return x % 9973 }
/** Each weather: particle count per 100 art columns, size, colors by day and by night, and its CSS class. */
/** `up`: how far the motion lifts a particle while it shows, so it is spawned that far below the text rows. */
const WX: Record<D.Weather, { n: number; w: number; h: number; up?: number; day: string[]; night: string[] }> = {
  rain: { up: 12, n: 9, w: 1, h: 4, day: [P.ice, P.sky], night: [P.blue, P.indigo] },
  snow: { up: 8, n: 8, w: 1, h: 1, day: [P.white, P.cloud], night: [P.cloud, P.mist] },
  embers: { up: 10, n: 5, w: 1, h: 1, day: [P.amber, P.orange], night: [P.amber, P.gold] },
  fog: { n: 1, w: 70, h: 3, day: [P.cloud], night: [P.dusk] },
  fireflies: { up: 2, n: 4, w: 1, h: 1, day: [P.straw], night: [P.lime, P.gold] },
  spores: { up: 10, n: 5, w: 1, h: 1, day: [P.mint, P.foam], night: [P.mint, P.lilac] },
  leaves: { up: 8, n: 4, w: 2, h: 1, day: [P.copper, P.rust, P.gold], night: [P.rust, P.umber] },
  sand: { n: 6, w: 3, h: 1, day: [P.tan, P.straw], night: [P.clay, P.mauve] },
  aurora: { n: 1.2, w: 34, h: 2, day: [P.mint, P.lilac], night: [P.mint, P.aqua, P.lilac] },
}
/** Weather as a few pixel particles under CSS motion, kept below the text rows. Positions come from the place, so a redraw never jumps. */
const weather = (wx: D.Weather | undefined, aw: number, fy: number, seed: number, time: Time): string => {
  if (!wx) return ''
  const k = WX[wx], r = D.rng(seed), cols = time === 'night' ? k.night : k.day, top = 18, out: string[] = []
  const n = Math.max(2, Math.round(k.n * aw / 100))
  for (let i = 0; i < n; i++) {
    const up = k.up ?? 0, x = Math.floor(r() * aw), y = top + up + Math.floor(r() * Math.max(1, fy - top - up - 4)), d = (r() * 4).toFixed(2)
    const op = wx === 'fog' ? ' opacity=".35"' : wx === 'aurora' ? ` fill-opacity="${time === 'night' ? '.55' : '.25'}"` : ''
    const yy = wx === 'fog' ? fy - 10 - i * 4 : wx === 'aurora' ? top + (i % 3) * 2 : y
    out.push(`<rect x="${x * S}" y="${yy * S}" width="${k.w * S}" height="${k.h * S}" fill="${cols[i % cols.length]}"${op} style="animation-delay:-${d}s"/>`)
  }
  return `<g class="wx-${wx}" data-wx="${wx}">${out.join('')}</g>`
}

// ---------- cached backdrops ----------
const worlds = new Map<string, Px>()
const backdrop = (v: Variant, aw: number, ah: number, where?: string, moon = 4): Px => {
  const key = `${v}:${aw}x${ah}:${where ?? ''}:${v === 'V3' ? moon : ''}`
  let w = worlds.get(key)
  if (!w) {
    if (worlds.size >= 8) worlds.delete(worlds.keys().next().value as string)
    const fy = ah - 3, dy = ah - 75
    w = where === undefined ? D.world(v, aw, ah, dy, fy - 63 - dy, { x: HERO_X + 26, y: 17 }, undefined, 0, moon) : D.world(v, aw, ah, dy, fy - 63 - dy, { x: HERO_X + 26, y: 17 }, D.biomeOf(where), seedOf(where), moon)
    worlds.set(key, w)
  }
  return w
}

/** The scene, sized w by h screen pixels (each art pixel is two). */
/** How long a level-up or boss kill is celebrated in the scene. */
export const DING_MS = 12_000
/** How long the newest achievement shows as a trophy in the scene. */
export const TROPHY_MS = 10_000
export type Holiday = 'pumpkins' | 'tree' | 'hearts' | 'fireworks'
/** Real-calendar decorations, looks only: pumpkins late in October, a lit tree in December, hearts before Valentine's Day, fireworks at dusk and night on New Year's Eve and Day and the Fourth of July. */
export const holidaysOf = (now: number, time: Time): Holiday[] => {
  const d = new Date(now), m = d.getMonth() + 1, day = d.getDate(), out: Holiday[] = []
  if (m === 10 && day >= 15) out.push('pumpkins')
  if (m === 12) out.push('tree')
  if (m === 2 && day >= 10 && day <= 14) out.push('hearts')
  if (time !== 'day' && ((m === 12 && day === 31) || (m === 1 && day === 1) || (m === 7 && day === 4))) out.push('fireworks')
  return out
}

export { moonOf }

export const sceneSvg = (hero: Hero, o: SceneOpts): string => {
  const aw = Math.max(120, Math.floor(o.w / S)), ah = Math.max(48, Math.floor(o.h / S))
  const W = aw * S, H = ah * S
  const narrow = aw < 260
  const hour = new Date(o.now).getHours()
  const time: Time = hour >= 20 || hour < 6 ? 'night' : hour >= 17 ? 'dusk' : 'day'
  const variant: Variant = time === 'night' ? 'V3' : time === 'dusk' ? 'V2' : 'V1'
  const fy = ah - 3 // the row the soles stand on
  const task = hero.task, place = placeOf(hero), live = o.live
  const where = whereOf(hero, place.title), bio = D.biomeOf(where), ground = D.worldLook(variant, bio)
  const bg = backdrop(variant, aw, ah, where, moonOf(o.now))
  const cls = CLASSES[hero.cls] ?? APPRENTICE
  const out: string[] = []
  const img = (p: Px, x: number, y: number, cls = '', extra = '') =>
    `<image${cls ? ` class="${cls}"` : ''} x="${x * S}" y="${y * S}" width="${p.w * S}" height="${p.h * S}" href="${D.uri(p)}"${extra}/>`
  const g = (cls: string, inner: string, style = '', extra = '') => `<g class="${cls}"${style ? ` style="${style}"` : ''}${extra}>${inner}</g>`
  const lightHero = (p: Px) => D.litOf(p, time, true)
  const lightFoe = (p: Px) => D.litOf(p, time, false)
  const p = `--p:${(live?.active ? o.period * 0.55 : o.period).toFixed(2)}s`
  const rect = (x: number, y: number, w: number, h: number, fill: string, cls = '', extra = '') =>
    `<rect${cls ? ` class="${cls}"` : ''} x="${x * S}" y="${y * S}" width="${w * S}" height="${h * S}" fill="${fill}"${extra}/>`
  /** A thin bar: a one pixel ink frame around one row of fill. */
  const bar = (x: number, y: number, w: number, fill: string, cls = '', style = '') =>
    rect(x, y, w, 3, P.ink) + rect(x + 1, y + 1, w - 2, 1, P.night) + rect(x + 1, y + 1, w - 2, 1, fill, cls, style ? ` style="${style}"` : '')

  out.push(img(bg, 0, 0))

  // sprites stand with their bottom row on `fy`
  const look = lookOfHero(hero)
  const rings: string[] = []
  const heroAt = (pose: Pose, x = HERO_X, y = fy, cls = '', extra = '') => {
    const h = wornOf(look, pose).hero, px = lightHero(h.px)
    return img(px, x - h.feetX, y - px.h + 1, cls, ` data-hero="h1" data-pose="${pose}"${extra}`)
  }
  /** His aura: light behind him at 45%, a few motes rising (CSS), and the ring on the ground (queued under the bodies). Not lit for the time of day, it is a light. */
  const auraAt = (pose: Pose, x = HERO_X, y = fy) => {
    const w = wornOf(look, pose)
    if (!w.aura || !w.ring) return ''
    const ox = x - w.hero.feetX - D.AURA_PAD, oy = y - w.hero.px.h + 1 - D.AURA_PAD
    rings.push(img(w.ring, ox, oy, '', ' data-aura="ring"'))
    const motes = (w.motes ?? []).map(m => {
      const mx = ox + m.x, my = oy + m.y
      const body = (m.big ? [[0, 0, P.white], [1, 0, m.c], [-1, 0, m.c], [0, 1, m.c], [0, -1, m.c]] as const : [[0, 0, m.c]] as const).map(([dx, dy, c]) => rect(mx + dx, my + dy, 1, 1, c)).join('')
      return g('mote', body, `animation-duration:${m.dur.toFixed(1)}s;animation-delay:-${m.delay.toFixed(1)}s`)
    }).join('')
    return img(w.aura, ox, oy, 'aura', ` opacity="${D.AURA_ALPHA}" data-aura="glow"`) + motes
  }
  const bottom = (px: Px, x: number, lift = 0) => ({ x, y: fy - px.h + 1 - lift })
  const shadows: { cx: number; w: number; float?: boolean }[] = [{ cx: HERO_X + 2, w: 8 }]
  const nextSpot = { x: 0 }
  let focus: { x: number; top: number; boss?: boolean } | undefined // where hits land: the nearest foe

  // followers and minions trail on the ground right of the hero
  // at a mine or dig the rock and its props sit right of the hero, so the trail starts past them
  const spot = task.kind === 'mine' ? [D.rock(), D.cart()] : task.kind === 'dig' ? [D.mound(), D.flag(), D.sandBucket()] : []
  let trail = spot.length ? HERO_X + 22 + spot.reduce((s, p, i) => s + p.w + (i ? 3 : 4), 0) + 2 : task.kind === 'dead' ? HERO_X + 28 + D.stone().w + 3 : HERO_X + 17
  const foeStart = narrow ? 64 : Math.round(aw * 0.4)
  const followers: string[] = []
  // the party stops short of the foes, the first house in town, and the bucket on the bank by the dock
  const trailRoom = task.kind === 'fight' ? foeStart - 8 : task.kind === 'town' ? Math.round(aw * 0.36) - 3 : task.kind === 'fish' ? Math.round(aw * 0.36) - 24 - 9 - 2 : aw * 0.7 - 8
  const pet = hero.pets?.[hero.pets.length - 1]
  if (pet) {
    const p = lightHero(D.petPx(pet.line, pet.stage)), x = trail
    if (x + p.w <= trailRoom) {
      const b = bottom(p, x)
      followers.push(g('bob2', img(p, b.x, b.y), 'animation-delay:-0.15s', ` data-pet="${esc(D.petOf(pet.line, pet.stage).name)}"`))
      // by the campfire the pet naps
      if (task.kind === 'camp') for (let i = 0; i < 2; i++) followers.push(img(D.zFx(), b.x + p.w - 2 + i * 3, b.y - 6 - i * 2, 'mote', `style="animation-delay:-${(i * 3).toFixed(0)}s" data-zz="1"`))
      shadows.push({ cx: x + (p.w >> 1), w: 3 })
      trail += p.w + 3
    }
  }
  hero.followers.slice(0, 3).forEach((name, i) => {
    const f = lightHero(D.followerPx(Math.max(0, FOLLOWERS.indexOf(name)))), x = trail
    if (x + f.w > trailRoom) return
    const b = bottom(f, x)
    followers.push(g('bob2', img(f, b.x, b.y), `animation-delay:-${(i * 0.3).toFixed(1)}s`, ` data-follower="${esc(name)}"`))
    shadows.push({ cx: x + (f.w >> 1), w: 4 })
    trail += f.w + 3
  })
  hero.minions.slice(0, 4).forEach((_, i) => {
    const m = lightHero(D.minionPx()), x = trail
    if (x + m.w > trailRoom) return
    const b = bottom(m, x)
    followers.push(g('bob2', img(m, b.x, b.y), `animation-delay:-${(i * 0.21).toFixed(2)}s`))
    trail += m.w + 2
  })

  let textRight = aw - 4 // the header lines stop short of a boss
  let taleRow3 = false
  const bodies: string[] = []
  const hud: string[] = []
  const live2: string[] = []
  const props: string[] = []

  if (task.kind === 'fight' && task.foe) {
    const foe = task.foe, isBoss = foe.rank === 'boss'
    const shiny = !isBoss && hash(`${foe.name}:${foe.level}:${foe.hp}`) % 64 === 0
    const ink = RANK_PAL[foe.rank] ?? P.cloud
    // the pack, spread over the open ground right of the hero
    const sprites: { px: Px; lift: number; cls: string }[] = []
    if (isBoss) {
      const ramps = [undefined, 'teal', 'red', 'blue', 'gray', 'green', 'orange']
      sprites.push({ px: lightFoe(D.bossPx(ramps[hash(foe.name) % ramps.length])), lift: 0, cls: 'bob2' })
    } else {
      const sp = speciesOf(foe.base ?? speciesKey(foe.name)), creature = D.creatureOf(sp.look.body ?? sp.base, hash(sp.base))
      const px = lightFoe(D.foePx({ creature, ramp: shiny ? 'pink' : D.rampOf(sp.element), rank: foe.rank === 'normal' ? undefined : foe.rank }))
      const n = Math.min(foe.count, narrow ? 2 : 3)
      for (let i = 0; i < n; i++) sprites.push({ px, lift: creature === 'bat' ? 8 : 0, cls: creature === 'bat' ? 'fly' : 'bob2' })
    }
    const xa = foeStart, xb = aw - 6
    const total = sprites.reduce((s, q) => s + q.px.w, 0)
    const gap = sprites.length > 1 ? Math.max(3, Math.min(20, Math.floor((xb - xa - total) / (sprites.length - 1)))) : 0
    const span = total + gap * Math.max(0, sprites.length - 1)
    let x = isBoss ? xb - sprites[0]!.px.w : Math.round(xa + Math.max(0, xb - xa - span) / 2)
    const tops: number[] = [], lefts: number[] = []
    const mark = isBoss ? ` data-boss="${esc(foe.name)}"` : ` data-foe="${esc(foe.name)}"${shiny ? ' data-shiny="1"' : ''}`
    sprites.forEach((q, i) => {
      const b = bottom(q.px, x, q.lift)
      tops.push(b.y); lefts.push(x)
      bodies.push(g('foe', g(q.cls, img(q.px, b.x, b.y), `animation-delay:-${(i * 0.13).toFixed(2)}s`, mark), `${p};animation-delay:-${(i * 0.13).toFixed(2)}s`))
      shadows.push({ cx: x + (q.px.w >> 1), w: Math.max(4, q.px.w >> 2), float: q.lift > 0 })
      x += q.px.w + gap
    })
    // life bars drain over the fight; a lost fight leaves the pack standing
    const end = task.win ? 0 : 0.25 + (hash(foe.name) % 40) / 100
    const anim = (name: string, to: number) => `@keyframes ${name}{from{transform:scaleX(1)}to{transform:scaleX(${to.toFixed(2)})}}`
    const timing = (name: string) => `animation:${name} ${task.ms}ms linear -${task.done}ms forwards`
    hud.push(`<style>${anim('fhp', end)}${anim('hhp', task.win ? 0.4 + (hash(foe.name) % 50) / 100 : 0)}</style>`)
    sprites.forEach((q, i) => { if (!isBoss) hud.push(bar(lefts[i]! + 2, tops[i]! - 4, Math.max(8, q.px.w - 4), foe.rank === 'normal' ? P.rose : ink, 'bar', timing('fhp'))) })
    const top = Math.min(...tops)
    if (isBoss) {
      const left = lefts[0]!
      textRight = left - 4
      const label = fitRing(`Lv ${foe.level} ${foe.name}`, left - 6 - (HERO_X + 24))
      const lw = ringW(label), lx = Math.max(HERO_X + 24, left - 6 - lw)
      hud.push(img(D.textPx(label, P.gold, true), lx, 18), bar(lx + 1, 26, Math.max(20, lw - 2), P.rose, 'bar', timing('fhp')))
      // halfway down its bar the boss enrages: a red ring flares round it and a tag shows under the bar
      const bp = sprites[0]!.px, ring = D.ringFx(bp.w - 4, bp.h - 4, P.rose), enrage = `animation:enr ${task.ms}ms step-end -${task.done}ms forwards`
      hud.push(`<style>@keyframes enr{0%{opacity:0}50%,100%{opacity:1}}</style>`)
      props.push(g('', g('aura', img(ring, left + (bp.w >> 1) - (ring.w >> 1), tops[0]! + (bp.h >> 1) - (ring.h >> 1))), enrage, ' data-enrage="1"'))
      hud.push(g('', g('pulse', img(D.textPx('Enraged', P.rose, true), lx, 30)), enrage))
    } else {
      // the name on its own line; affixes follow only while the whole line stays short, else fewer, else none
      const room = Math.min(aw - 8 - (HERO_X + 24), narrow ? 9999 : 190)
      // a returning nemesis wears its name, in its own color
      const nem = hero.nemesis && hero.nemesis.beaten === undefined && !foe.named && foe.base === hero.nemesis.base ? hero.nemesis.name : undefined
      let label = nem ?? foe.name
      for (let k = Math.min(3, foe.mods.length); k > 0; k--) {
        const withMods = `${label} [${foe.mods.slice(0, k).join(', ')}]`
        if (ringW(withMods) <= room) { label = withMods; break }
      }
      label = fitRing(label, room)
      const lw = ringW(label)
      const lx = Math.min(aw - 4 - lw, Math.max(HERO_X + 24, Math.round((xa + xb) / 2 - lw / 2)))
      // a narrow band lends the foe's name row to a tale that needs it, for the tale's few seconds
      const t = freshTale(hero, o.now)
      taleRow3 = !!t && aw < 400 && taleRows(t, aw - 4 - (HERO_X + 26), 2).join(' ') !== t
      if (!taleRow3) hud.push(img(D.textPx(label, nem ? P.hot : ink, true), lx, Math.max(16, top - 20), '', nem ? ' data-nemesis="1"' : ''))
    }
    focus = { x: lefts[0]!, top: isBoss ? 40 : tops[0]!, boss: isBoss }
    // the hero swings between two frames; his life drains only when he loses
    const swing = wornOf(look, 'stand').hero
    const hp = swing.px
    // elite tells: the first two affixes with a mark draw it around the pack leader, behind the bodies
    const L = lefts[0]!, T = tops[0]!, lead = sprites[0]!.px, done = new Set<string>()
    for (const m of foe.mods) {
      const k = EFX[m]
      if (!k || done.has(k) || done.size >= 2) continue
      done.add(k)
      const at = (px: Px, x: number, y: number, cls = '', style = '') => props.push(img(px, x, y, cls, ` data-efx="${k}"${style ? ` style="${style}"` : ''}`))
      const lit = (px: Px) => lightFoe(px)
      if (k === 'fire') for (const x of [L - 3, L + lead.w - 5]) { const f = D.firePool(); at(f, x, fy - f.h + 2, 'pulse', `animation-delay:-${(x % 3) * 0.3}s`) }
      if (k === 'ice') for (const x of [L - 4, L + (lead.w >> 1) - 1, L + lead.w]) { const f = lit(D.iceShard()); at(f, x, fy - f.h + 1) }
      if (k === 'crack') { const f = D.crackFx(); at(f, L - f.w + 1, fy - 3); at(f, L + lead.w - 1, fy - 3) }
      if (k === 'bubble') { const f = D.ringFx(lead.w, lead.h); at(f, L + (lead.w >> 1) - (f.w >> 1), T + (lead.h >> 1) - (f.h >> 1), 'aura', 'opacity:.7') }
      if (k === 'ghost') at(lead, L + 6, T - 2, 'tw', 'opacity:.35')
      if (k === 'speed') at(D.speedFx(), L + lead.w + 1, T + (lead.h >> 1) - 1, 'tw')
      if (k === 'beam') props.push(rect(HERO_X + 14, fy - 7, Math.max(4, L - HERO_X - 16), 1, P.lilac, 'beam', ` data-efx="${k}" opacity=".85"`), rect(HERO_X + 14, fy - 8, Math.max(4, L - HERO_X - 16), 1, P.purple, 'beam', ` data-efx="${k}" opacity=".6"`))
      if (k === 'wall') { const f = D.tapeFx(); at(f, Math.round((HERO_X + 14 + L) / 2), fy - f.h + 1) }
      if (k === 'cage') { const h = 14; at(D.bracketFx(false, h), HERO_X - 12, fy - h + 1, 'pulse'); at(D.bracketFx(true, h), HERO_X + 11, fy - h + 1, 'pulse') } // knee-high, so it never reaches the text rows
      if (k === 'bolt') at(D.boltFx(), L + (lead.w >> 1) - 2, Math.max(28, T - 12), 'pulse')
      if (k === 'bugs') for (let i = 0; i < 4; i++) at(D.bugDot(), L + 2 + i * Math.max(2, lead.w >> 2), T + 2 + (i % 2) * 3, 'spark', `animation-delay:-${(i * 0.2).toFixed(1)}s`)
      // the icons sit at the leader's shoulder, clear of its name and bar
      const icon = (f: Px) => at(f, L + lead.w + 1, Math.max(28, T - 1 + (done.size - 1) * 6), 'tw')
      if (k === 'drip') icon(D.dropFx())
      if (k === 'plus') icon(D.plusFx())
      if (k === 'clock') icon(D.clockFx())
    }
    bodies.push(auraAt('stand'), g('bob', g('fa', heroAt('stand'), p) + g('fb', heroAt('swing'), p)))
    hud.push(bar(HERO_X - 7, fy - hp.h + 1 + swing.headTop - 6, 14, P.leaf, 'bar', timing('hhp')))
    // floating numbers over the foes, three out of step; a crit in gold
    for (let i = 0; i < 2; i++) {
      const crit = task.crit && i === 1, j = Math.min(i, sprites.length - 1)
      const n = D.textPx(`${fmt((task.hit ?? 0) * (1 - i * 0.07))}${crit ? '!' : ''}`, crit ? P.gold : P.skin, true)
      // a boss's numbers stand left of it, clear of the horns and flame; a lone foe's second number sits beside the first
      const nx = isBoss ? lefts[0]! - n.w - 2 : lefts[j]! + 4 + i * 3 + (sprites.length === 1 && i === 1 ? n.w : 0)
      const ny = isBoss ? 34 + i * 9 : Math.max(9, tops[j]! - 9)
      hud.push(g('dmg', img(n, nx, ny),`${p};animation-delay:-${(i * o.period * 0.66).toFixed(2)}s`))
    }
    // loot ring and glint in the open ground, a hit spark on the first foe
    if (!narrow) { const ring = D.ring(), r = lightFoe(ring), b = bottom(r, HERO_X + 76); props.push(img(r, b.x, b.y + 1), img(D.glint(), b.x - 1, b.y - 8, 'tw')) }
    props.push(img(D.hitSpark(), lefts[0]! - 10, fy - 14, 'tw'))
  } else if (task.kind === 'fish') {
    const wx = Math.round(aw * 0.36)
    props.push(rect(wx, fy - 4, aw - wx, ah - fy + 4, P.blue), rect(wx, fy - 4, aw - wx, 1, P.sky))
    props.push(g('wave', Array.from({ length: Math.ceil((aw - wx) / 12) + 3 }, (_, i) => rect(wx + i * 12, fy + 2 - (i % 2) * 3, 5, 1, P.ice, '', ' opacity=".9"')).join('')))
    const dock = D.plank(), dx = wx - 24
    props.push(img(dock, dx, fy - 1), img(D.post(), dx + 28, fy + 2))
    const fb = lightFoe(D.fishBucket())
    const fbb = bottom(fb, dx - 9) // on the bank, clear of the water and the hero
    props.push(img(fb, fbb.x, fbb.y, '', ' data-spot="fish"'))
    bodies.push(auraAt('rod', dx + 14, fy - 1), heroAt('rod', dx + 14, fy - 1, 'bob'))
    const bx = Math.round(aw * 0.66)
    // line from the rod tip (column 44 of the sprite, row 12 + 8) to the bobber
    const tipX = dx + 14 - 15 + 44, tipY = fy - 1 - 58 + 21
    const n = Math.max(Math.abs(bx - tipX), 1)
    props.push(Array.from({ length: n }, (_, i) => rect(tipX + i, tipY + Math.round(((fy - 4 - tipY) * (i / n) * (i / n))), 1, 1, P.cloud, '', ' opacity=".8"')).join(''))
    props.push(g('bob2', img(D.bobber(), bx, fy - 6)))
    shadows.length = 0
  } else if (task.kind === 'mine' || task.kind === 'dig') {
    const isMine = task.kind === 'mine', rx = HERO_X + 22 // within reach of the tool head
    const rockPx = lightFoe(isMine ? D.rock() : D.mound()), b = bottom(rockPx, rx)
    props.push(img(rockPx, b.x, b.y))
    // the spot's own props past the rock: a loaded cart at a mine, a flag and a bucket at a dig
    const extra = isMine ? [lightFoe(D.cart())] : [lightFoe(D.flag()), lightFoe(D.sandBucket())]
    let ex = b.x + rockPx.w + 4
    for (const px of extra) { const e = bottom(px, ex); props.push(img(px, e.x, e.y, '', ` data-spot="${task.kind}"`)); ex += px.w + 3 }
    const [a, c] = isMine ? ['pick', 'pickDown'] as const : ['shovel', 'shovelDown'] as const
    bodies.push(auraAt(a), g('bob2', g('fa', heroAt(a), '--p:.8s') + g('fb', heroAt(c), '--p:.8s')))
    for (let i = 0; i < 3; i++) props.push(img(D.dust(), rx + 4 + i * 3, fy - 12, 'spark', `style="animation-delay:-${(i * 0.27).toFixed(2)}s"`))
    shadows.push({ cx: rx + (rockPx.w >> 1), w: rockPx.w >> 1 })
  } else if (task.kind === 'town') {
    const roofs = [[P.red, P.scarlet], [P.blue, P.sky], [P.olive, P.moss]], walls = [[P.tan, P.apricot, P.rust], [P.sand, P.hay, P.clay], [P.cloud, P.white, P.mist]]
    const hs = narrow ? 2 : 3
    for (let i = 0; i < hs; i++) {
      const h = lightFoe(D.house(roofs[i]!, walls[i]!)), b = bottom(h, Math.round(aw * 0.36) + i * 30)
      props.push(img(h, b.x, b.y - 1))
    }
    // the stalls past the houses, dropped from the end when the band is too narrow for them
    let sx = Math.round(aw * 0.36) + (hs - 1) * 30 + 22
    for (const [px, kind] of [[lightFoe(D.stall()), 'stall'], [lightFoe(D.anvil()), 'anvil'], [lightFoe(D.brazier()), 'fire'], [lightFoe(D.booth()), 'booth']] as const) {
      if (sx + px.w > aw - 2) break
      const b = bottom(px, sx)
      props.push(img(px, b.x, b.y - 1, '', ` data-stall="${kind}"`))
      if (kind === 'fire') { const fa = D.fireA(); props.push(g('fa', img(fa, b.x, b.y - fa.h + 1), '--p:.5s') + g('fb', img(D.fireB(), b.x, b.y - fa.h + 1), '--p:.5s')) }
      if (kind === 'anvil') for (let i = 0; i < 2; i++) props.push(img(D.dust(), b.x + 3 + i * 4, b.y - 3, 'spark', `style="animation-delay:-${(i * 0.4).toFixed(2)}s"`))
      sx += px.w + (kind === 'fire' ? 8 : 4)
    }
    bodies.push(auraAt('stand'), heroAt('stand', HERO_X, fy, 'bob'))
    for (let i = 0; i < 3; i++) props.push(img(D.dust(), HERO_X + 14, fy - 28 - i, 'coin', `style="animation-delay:-${(i * 0.33).toFixed(2)}s"`))
  } else if (task.kind === 'camp') {
    // task-14: the hero sits by a campfire for the first half hour after Focus runs out
    const fa = D.fireA(), b = bottom(fa, Math.max(HERO_X + 30, trail + 3)) // past the party, so nobody stands in the fire
    props.push(g('fa', img(fa, b.x, b.y), '--p:.5s') + g('fb', img(D.fireB(), b.x, b.y), '--p:.5s'))
    for (let i = 0; i < 3; i++) props.push(img(D.dust(), b.x + 3 + i * 2, b.y - 6 - i * 2, 'spark', `style="animation-delay:-${(i * 0.31).toFixed(2)}s"`))
    bodies.push(auraAt('sit'), heroAt('sit', HERO_X, fy, 'bob'))
    shadows.push({ cx: b.x + (fa.w >> 1), w: fa.w >> 1 })
  } else if (task.kind === 'dead') {
    const st = lightFoe(D.stone()), b = bottom(st, HERO_X + 28)
    props.push(img(st, b.x, b.y), img(D.textPx('RIP', P.ink), b.x + 1, b.y + 3))
    bodies.push(g('float', heroAt('dead', HERO_X + 4, fy - 2)))
    shadows.push({ cx: HERO_X + 6, w: 6, float: true })
  } else {
    // travel: the ground scrolls under a walking hero
    const strip = D.stripOf(aw + 16, variant, ground)
    props.push(g('scroll', img(strip, 0, fy - 1)))
    bodies.push(auraAt('stand'), heroAt('stand', HERO_X, fy, 'walk'))
    if (live?.active) shadows.push({ cx: HERO_X, w: 0 })
  }

  // cast shadows go under everything: ground colors one step darker under an ellipse
  const sh = D.shadowLayer(bg, shadows, fy, variant, ground)
  out.push(img(sh, 0, 0))
  // a boss fight reddens the sky and brings embers where the place has no weather of its own
  const arena = task.kind === 'fight' && task.foe?.rank === 'boss'
  // one even wash over the whole backdrop: any edge in it would cross the ground as a seam
  if (arena) out.push(`<rect width="${aw * S}" height="${ah * S}" fill="${P.blood}" opacity=".2" data-arena="1"/>`)
  // a level-up lifts a gold pillar on the hero; a boss kill rains confetti. Both last DING_MS, looks only
  const ding = hero.ding && o.now >= hero.ding.at && o.now - hero.ding.at < DING_MS ? hero.ding : undefined
  if (ding?.kind === 'level') {
    rings.push(rect(HERO_X - 14, 18, 31, fy - 17, P.gold, 'beam', ' opacity=".28" data-ding="level"'), rect(HERO_X - 7, 18, 17, fy - 17, P.cream, 'beam', ' opacity=".3"'))
    for (let i = 0; i < 4; i++) rings.push(img(D.dust(), HERO_X - 4 + i * 4, fy - 6 - (i % 2) * 9, 'mote', `style="animation-delay:-${(i * 1.4).toFixed(1)}s"`))
    hud.push(g('pulse', img(D.textPx(ding.text, P.gold, true), HERO_X + 14, 20)))
  } else if (ding?.kind === 'boss') {
    hud.push('<style>.cf{animation:cf 2.4s steps(8) infinite}@keyframes cf{0%{opacity:0;transform:translateY(0)}10%{opacity:1}100%{opacity:.2;transform:translateY(' + S * 30 + 'px)}}</style>')
    const cols = [P.gold, P.hot, P.sky, P.leaf, P.lilac, P.coral]
    for (let i = 0; i < 24; i++) {
      const x = Math.round(aw * (0.22 + 0.74 * (((i * 41) % 97) / 97))), y = 19 + ((i * 13) % 11)
      hud.push(rect(x, y, 2 + (i % 2), 3 - (i % 2), cols[i % cols.length]!, 'cf', ` style="animation-delay:-${((i * 0.29) % 2.4).toFixed(2)}s"${i ? '' : ' data-ding="boss"'}`))
    }
  }
  // the newest achievement: a trophy and its name at the top right for a few seconds, outside fights where the foes' labels stand
  if (task.kind !== 'fight') {
    let id = '', at = 0
    for (const [k, v] of Object.entries(hero.ach)) if (v > at) { id = k; at = v }
    const a = o.now >= at && o.now - at < TROPHY_MS ? ACHIEVEMENTS.find(x => x.id === id) : undefined
    if (a) {
      const name = D.textPx(a.name, P.gold, true), x = aw - name.w - 13
      hud.push(g('', img(D.trophyFx(), x, 19) + img(name, x + 10, 21), '', ` data-trophy="${esc(a.id)}"`))
    }
  }
  // holiday decorations: ground props right of the party where nothing else stands, sky pieces above the ground
  const hols = holidaysOf(o.now, time), onGround = !['fight', 'dead', 'fish', 'town'].includes(task.kind)
  const tag = (k: Holiday) => ` data-holiday="${k}"`
  // the backdrop bakes a rock at columns 148 to 159; decorations step past it
  const clear = (x: number, w: number) => (x < 160 && x + w > 148 ? 160 : x)
  const pk1 = clear(aw - 27, 9)
  if (onGround && hols.includes('pumpkins')) for (const x of [pk1, Math.max(pk1 + 10, aw - 16)]) { const pk = lightFoe(D.pumpkin()), b = bottom(pk, x); props.push(img(pk, b.x, b.y, '', tag('pumpkins'))) }
  if (onGround && hols.includes('tree')) {
    const tr = lightFoe(D.winterTree()), b = bottom(tr, clear(aw - 18, 11))
    props.push(img(tr, b.x, b.y, '', tag('tree')), img(D.winterLights(), b.x, b.y, 'pulse'))
  }
  if (hols.includes('hearts')) [0.38, 0.52, 0.66, 0.8].forEach((f, i) => props.push(img(D.heartFx(), Math.round(aw * f), fy - 8 - (i % 2) * 3, 'mote', `style="animation-delay:-${(i * 1.5).toFixed(1)}s"${tag('hearts')}`)))
  if (hols.includes('fireworks')) {
    hud.push('<style>.fwk{transform-box:fill-box;transform-origin:center;animation:fw 1.8s steps(6) infinite}@keyframes fw{0%{opacity:0;transform:scale(.3)}15%{opacity:1}70%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(1.3)}}</style>')
    ;[[0.46, 20, P.gold, P.cream], [0.63, 25, P.hot, P.blush], [0.8, 19, P.sky, P.ice]].forEach(([f, y, c, tip], i) => props.push(img(D.burstFx(c as string, tip as string), Math.round(aw * (f as number)), y as number, 'fwk', `style="animation-delay:-${(i * 0.6).toFixed(1)}s"${tag('fireworks')}`)))
  }
  out.push(...props, ...rings, ...followers, ...bodies, weather(bio.wx ?? (arena ? 'embers' : undefined), aw, fy, seedOf(where), time), ...hud)

  // ---- live work ----
  if (live && (live.active || live.acts.length || live.hits.length)) {
    const front = HERO_X + 16, y = fy - 34, fx = focus?.x ?? Math.round(aw * 0.5), dist = Math.max(10, (fx - front) * S)
    if (live.active) live2.push(img(D.hitSpark(), HERO_X + 10, fy - 56, 'pulse', ' data-live-spark="1"'))
    for (const a of live.acts) {
      if (now(o) - a.at >= ACT_MS[a.kind]) continue
      const d = delayOf(o.now, a.at)
      const wrap = (cls: string, inner: string, extra = '') => `<g class="o-orig ${cls}" data-act="${a.kind}" style="${d};${extra}">${inner}</g>`
      if (a.kind === 'melee' || a.kind === 'strike') live2.push(wrap('o-melee', img(D.slashFx(), front + 2, y - 4)))
      else if (a.kind === 'arrow') live2.push(wrap('o-arrow', img(D.arrowFx(), front, y), `--d:${dist.toFixed(0)}px`))
      else if (a.kind === 'spell') live2.push(wrap('o-spell', img(D.orbFx(), front, y - 4), `--d:${dist.toFixed(0)}px`))
      else if (a.kind === 'summon') live2.push(wrap('o-summon', img(D.minionPx(), HERO_X - 16, fy - 9)))
      else live2.push(wrap('o-portal', img(D.portalFx(), fx - 2, fy - 14)))
    }
    for (const h of live.hits) {
      if (o.now - h.at >= HIT_MS) continue
      const k = sizeOf(h.tokens), n = D.textPx(`${fmt(h.tokens)}${h.crit ? '!' : ''}`, h.crit ? P.gold : P.white, true)
      live2.push(`<g class="o-hit" style="${delayOf(o.now, h.at)}" data-dmg="${Math.round(h.tokens)}" data-size="${Math.round(k * 100)}"${h.crit ? ' data-crit="1"' : ''}>${img(n, focus?.boss ? fx - n.w - 2 : fx + 6, Math.max(9, (focus?.top ?? fy - 20) - 18))}</g>`)
      // the foe's bar loses a chunk in proportion, flashing as it goes
      live2.push(rect(fx + 2, (focus?.top ?? fy - 20) - 3, Math.max(2, Math.round(10 * (0.2 + 0.8 * k))), 1, P.white, 'o-chip', ` style="${delayOf(o.now, h.at)}"`))
    }
    out.push(...live2)
  }

  // a beam of light for a legendary dropped in the last 15 seconds
  if (hero.beam && o.now - hero.beam.at < 15_000) {
    const bx = Math.round(aw * 0.72), c = D.nearest(...rgb(hero.beam.color))
    out.push(rect(bx - 1, 0, 3, fy, c, 'beam', ' opacity=".7"'), rect(bx, 0, 1, fy, P.white, 'beam'))
    out.push(img(D.textPx(hero.beam.name, c, true), Math.max(2, bx - (D.textWidth(hero.beam.name) >> 1)), fy - 8))
  }

  // header, the task and the XP strip
  const tx = HERO_X + 26, room = textRight - tx
  const tale = freshTale(hero, o.now)
  // a long tale takes the header row too, and on a narrow band the sky row under it (in a fight, only when the foe's name stepped aside)
  const rows = tale ? taleRows(tale, room, aw < 400 && (task.kind !== 'fight' || taleRow3) ? 3 : 2) : null
  const two = rows && rows.length > 1 ? rows : null
  if (two) {
    two.forEach((s, i) => out.push(img(D.textPx(s, P.gold, true), tx, 1 + i * 7, '', i ? '' : ' data-tale="1"')))
  } else if (o.title !== false) {
    const pct = `${Math.round(Math.max(0, Math.min(1, o.xp ?? 0)) * 100)}%`
    const who = narrow ? `LV ${hero.level} ${pct}` : `LV ${hero.level} ${cls.name} ${pct}`
    const wtxt = fitRing(who, room), ww = ringW(wtxt)
    out.push(img(D.textPx(wtxt, P.cloud, true), tx, 1))
    if (room - ww - 8 > 24) out.push(img(D.textPx(fitRing(place.title, room - ww - 8), P.skin, true), tx + ww + 8, 1))
  }
  if (!two) out.push(img(D.textPx(fitRing(tale ?? task.label, room), tale ? P.gold : P.skin, true), tx, 8, '', tale ? ' data-tale="1"' : ''))
  const xp = Math.max(0, Math.min(1, o.xp ?? 0))
  out.push(rect(0, ah - 1, aw, 1, P.ink), rect(0, ah - 1, Math.max(0, Math.round(aw * xp)), 1, P.gold))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" style="${p}"${live?.active ? ' data-live="active"' : ''} data-look="d30">${CSS}${out.join('')}</svg>`
}
const now = (o: SceneOpts) => o.now
const rgb = (c: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})/i.exec(c)
  const n = m ? parseInt(m[1]!, 16) : 0xffffff
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** The ticker's text for a surface without SVG: icon, task, a bar, the percent. */
export const tickerText = (hero: Hero, now: number, live?: Live) => {
  const t = hero.task
  const pct = Math.min(1, t.done / Math.max(1, t.ms))
  const icon = t.kind === 'fight' ? '⚔' : t.kind === 'fish' ? '🎣' : t.kind === 'mine' ? '⛏' : t.kind === 'dig' ? '🏺' : t.kind === 'town' ? '🏘' : t.kind === 'dead' ? '☠' : t.kind === 'camp' ? '🔥' : '➜'
  const bar = '▓'.repeat(Math.round(pct * 10)) + '░'.repeat(10 - Math.round(pct * 10))
  void now
  const action = live?.active ? (live.kind ? `${ACT_ICON[live.kind]} ${live.word}` : '⚒ working') : ''
  return { icon, bar, pct: Math.round(pct * 100), action }
}

/** A random event (task-15) from the last 8 seconds, shown in place of the task label; null when there is none. */
/** A tale wrapped at words into at most `max` rows of `room` art pixels; only the last row is ever cut. */
export const taleRows = (tale: string, room: number, max = 2): string[] => {
  const rows: string[] = []
  let rest = tale
  while (rows.length < max - 1 && ringW(rest) > room) {
    let cut = rest.lastIndexOf(' ')
    while (cut > 0 && ringW(rest.slice(0, cut)) > room) cut = rest.lastIndexOf(' ', cut - 1)
    if (cut <= 0) break
    rows.push(rest.slice(0, cut))
    rest = rest.slice(cut + 1)
  }
  return [...rows, fitRing(rest, room)]
}

export const freshTale = (hero: Hero, now?: number) => {
  const l = hero.tales?.recent.at(-1)
  return l && now !== undefined && now >= l.t && now - l.t < 8_000 ? l.s : null
}

export const rarityColor = (r: Rarity) => ({ normal: '#c8c8c8', magic: '#8080ff', rare: '#f2e05a', unique: '#ff8a1f', set: '#2fd05a' })[r]

/** The one-line band: H1's face as an icon, name and level, the task label, and a thin XP bar. No motion, 18 px tall. */
export const stripSvg = (hero: Hero, o: { w: number; xp: number; live?: Live; now?: number }): string => {
  const { w: W } = o
  const cls = CLASSES[hero.cls] ?? APPRENTICE
  const H = STRIP_H
  const fill = Math.max(0, Math.min(1, o.xp))
  const face = D.faceOf(lookOfHero(hero))
  const iconW = face.w * S
  const icon = `<image x="4" y="${(H - face.h * S) >> 1}" width="${iconW}" height="${face.h * S}" style="image-rendering:pixelated" href="${D.uri(face)}" data-hero="h1"/>`
  const text = (s: string, x: number, fillColor: string, weight = 'normal') =>
    `<text x="${x}" y="12" font-size="11" fill="${fillColor}" font-weight="${weight}">${esc(s)}</text>`
  const name = `${hero.name} Lv ${hero.level}`
  const nameX = 4 + iconW + 6
  const taskX = nameX + Math.ceil(name.length * 6.8) + 14
  const live = o.live?.active ? o.live : null
  const liveText = live ? `${live.kind ? ACT_ICON[live.kind] : '⚒'} ${live.kind ? live.word : 'working'} ${fmt(live.turnTokens)} tok` : ''
  const maxChars = Math.max(8, Math.floor((W - taskX - 8 - (liveText ? liveText.length * 6.8 + 14 : 0)) / 6.6))
  const tale = freshTale(hero, o.now)
  const said = tale ?? hero.task.label
  const label = said.length > maxChars ? `${said.slice(0, maxChars - 1)}…` : said
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>text{font-family:ui-monospace,Menlo,Consolas,monospace;paint-order:stroke;stroke:#000;stroke-width:2px;stroke-linejoin:round}.spulse{animation:stp .8s step-end infinite}@keyframes stp{50%{opacity:.3}}@media (prefers-reduced-motion: reduce){*{animation:none!important}}</style>`
    + `<rect width="${W}" height="${H}" fill="#14141a"/>`
    + icon
    + text(name, nameX, D.P.skin, 'bold') + text(label, taskX, tale ? '#ffd23f' : '#e8e0d0')
    + (liveText ? `<g class="spulse" data-live="active"><text x="${W - 8}" y="12" font-size="11" fill="#ffd23f" font-weight="bold" text-anchor="end">${esc(liveText)}</text></g>` : '')
    + `<rect x="0" y="${H - 2}" width="${W}" height="2" fill="#000" opacity=".6"/><rect x="0" y="${H - 2}" width="${(W * fill).toFixed(1)}" height="2" fill="#d9a441"/>`
    + `</svg>`
}
