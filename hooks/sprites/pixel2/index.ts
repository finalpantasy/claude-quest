// The D30 look (task-25, task-26, task-27): Resurrect 64 pixel art, one pixel scale, drawn into small pixel buffers that travel as PNG data URIs.
import { base64, encodePng } from '../../png'
import { P, Px, moonOf, outline, darkOf, pad, relight, spr } from './core'
import { text, textWidth } from './font'
import { heroSprite } from './hero'
import { LOOKS, type Look, type Variant } from './world'
import { gearHero, type Look as GearLook } from './gear'

export * from './core'
export * from './font'
export * from './hero'
export * from './foes'
export * from './boss'
export * from './world'
export * from './biomes'
export * from './pets'
export { lookOf, gearHero, AURA_PAD, AURA_ALPHA, VISIBLE_SLOTS, glowStep } from './gear'
export type { Mote, Look as GearLook } from './gear'

const uris = new WeakMap<Px, string>()
/** A pixel buffer as a PNG data URI (cached per buffer). */
export const uri = (p: Px): string => {
  let u = uris.get(p)
  if (!u) { u = `data:image/png;base64,${base64(encodePng(p.w, p.h, p.c))}`; uris.set(p, u) }
  return u
}

const textCache = new Map<string, Px>()
/** A line of the bitmap font on a clear buffer: a one pixel ink drop shadow, or with `ring` a full outline. */
export const textPx = (s: string, color: string, ring = false): Px => {
  const key = `${ring ? 1 : 0}${color}${s}`
  let p = textCache.get(key)
  if (!p) {
    const w = textWidth(s) + (ring ? s.length + 2 : 1), h = ring ? 7 : 6
    p = new Px(w, h)
    text(p, s, ring ? 1 : 0, ring ? 1 : 0, color, P.ink, ring)
    if (textCache.size > 400) textCache.clear()
    textCache.set(key, p)
  }
  return p
}
/** The longest start of `s` that fits `max` art pixels, with two dots when it was cut. */
export const fitText = (s: string, max: number): string => {
  if (textWidth(s) <= max) return s
  let n = s.length
  while (n > 1 && textWidth(`${s.slice(0, n).trimEnd()}..`) > max) n--
  return `${s.slice(0, n).trimEnd()}..`
}

/** How a sprite is lit for the time of day: day as drawn, dusk relit warm, night dimmed and blue. */
export type Time = 'day' | 'dusk' | 'night'
/** A sprite lit for the time of day, cached on its source: one entry per time and facing. */
const lights = new WeakMap<Px, Map<string, Px>>()
export const litOf = (p: Px, t: Time, sunRight = true): Px => {
  if (t === 'day') return p
  let m = lights.get(p)
  if (!m) { m = new Map(); lights.set(p, m) }
  const k = `${t}${sunRight ? 1 : 0}`
  let v = m.get(k)
  if (!v) { v = t === 'dusk' ? relight(p, sunRight) : p.map(moonOf); m.set(k, v) }
  return v
}

// ---------- small props and effects ----------
export const glint = () => spr(['...w...', '...c...', '...c...', 'wccWccw', '...c...', '...c...', '...w...'], { w: P.gold, c: P.cream, W: P.white })
const memo = <T>(f: () => T) => { let v: T | undefined; return () => (v ??= f()) }
export const hitSpark = memo(() => spr(['...y...', '.y.c.y.', '..ccc..', 'ycWWWcy', '..ccc..', '.y.c.y.', '...y...'], { y: P.gold, c: P.cream, W: P.white }))
export const slashFx = memo(() => spr(['....ww', '...wWW', '..wWW.', '.wWW..', 'wWW...', 'wW....', 'w.....'].map(r => r.padEnd(6, '.')), { w: P.cloud, W: P.white }))
export const arrowFx = memo(() => spr(['.....w....', 'ccccccFFw.', '.....w....'], { c: P.cream, w: P.mist, F: P.cloud }))
export const orbFx = memo(() => spr(['..lll..', '.lLLLl.', 'lLWWWLl', 'lLWWWLl', 'lLWWWLl', '.lLLLl.', '..lll..'], { l: P.purple, L: P.lilac, W: P.white }))
export const portalFx = memo(() => spr(['..bbbb..', '.bIIIIb.', 'bI....Ib', 'bI....Ib', 'bI....Ib', 'bI....Ib', 'bI....Ib', 'bI....Ib', '.bIIIIb.', '..bbbb..'], { b: P.blue, I: P.ice }))
export const dust = memo(() => spr(['.y', 'y.'], { y: P.gold }))

/** Camp and town props, drawn once. */
export const house = (roof: string[], wall: string[]) => outline(spr([
  '.....RRRR.....',
  '...RRRrrrRR...',
  '..RRRrrrrrrRR.',
  '.RRrrrrrrrrrrR',
  'RRrrrrrrrrrrrr',
  '.wwwwwwwwwwww.',
  '.wWWwwwwwwwWw.',
  '.wWgwwwDDwgWw.',
  '.wWwwwwDdwwWw.',
  '.wwwwwwDdwwww.',
  '.wssssssdsssw.',
], { R: roof[0]!, r: roof[1]!, w: wall[0]!, W: wall[1]!, g: P.gold, D: P.umber, d: P.olive, s: wall[2]! }), darkOf)
export const rock = memo(() => outline(spr([
  '......hhHH........',
  '....hhHHHHhhs.....',
  '..hhHHbHHHHhhss...',
  '.hHHHHHHHHrHhhss..',
  'hHHHgHHHHHHhhhhss.',
  'hHHHHHHHeHHhhhsss.',
  'hhHHHHHHHHhhhhsss.',
  'hhhHHdHHHhhhhssss.',
  'hhhhhhhhhhhhssss..',
  '.sssssssssssss....',
], { H: P.mist, h: P.mauve, s: P.dusk, b: P.sky, r: P.rose, g: P.leaf, e: P.lilac, d: P.gold }), darkOf))
export const mound = memo(() => outline(spr([
  '....cccc....',
  '..ccCCCCcc..',
  '.cCCCCCCCCc.',
  'ccCCCCgCCCcc',
  'dddddddddddd',
], { c: P.copper, C: P.tan, g: P.gold, d: P.rust }), darkOf))
export const stone = memo(() => outline(spr([
  '..hhhhhhh..',
  '.hHHHHHHHh.',
  'hHHHHHHHHHs',
  'hHsssHHsssh',
  'hHHHHHHHHHs',
  'hHHsssHHsss',
  'hHHHsHHsHHs',
  'hHHHsHHsHHs',
  'hHHHHHHHHHs',
  'hHHHHHHHHHs',
  'hhhhhhhhhhs',
], { H: P.mist, h: P.mauve, s: P.dusk }), darkOf))
export const plank = memo(() => outline(spr([
  'ttttttttttttttttttttttttttttttttt',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'sssssssssssssssssssssssssssssssss',
], { t: P.tan, T: P.copper, s: P.rust }), darkOf))
export const post = memo(() => spr(['sT', 'sT', 'sT', 'sT'], { s: P.wine, T: P.rust }))
/** The campfire (task-14): two flame frames over crossed logs, swapped by the scene's fa/fb flicker. */
const FIRE_KEYS = { y: P.scarlet, Y: P.orange, O: P.amber, W: P.cream, r: P.red, l: P.copper, L: P.rust }
const fireLogs = ['LllLLlLLllL', '.LLllLllLL.']
export const fireA = memo(() => outline(spr([
  '.....y.....',
  '....yYy....',
  '...yYOYy...',
  '...YOOOY.y.',
  '..rYOWOYr..',
  '..rOOWOOr..',
  '.rrYOOOYrr.',
  ...fireLogs,
], FIRE_KEYS), darkOf))
export const fireB = memo(() => outline(spr([
  '....y......',
  '....Yy.....',
  '..y.YOy....',
  '..yYOOOY...',
  '..rYOWOYr..',
  '..rOOWOOr..',
  '.rrYOOOYrr.',
  ...fireLogs,
], FIRE_KEYS), darkOf))
export const bobber = memo(() => outline(spr(['rr', 'ww'], { r: P.rose, w: P.white }), darkOf))
/** Gathering spots (task-13): a loaded mine cart, a dig flag, and a bucket of sand or of water with a fish tail. */
export const cart = memo(() => outline(spr([
  '..oOoGoOo...',
  '.kkkkkkkkkk.',
  '.kKKKKKKKKk.',
  '.kKKKKKKKKk.',
  '..kkkkkkkk..',
  '..wW....wW..',
  '..ww....ww..',
], { o: P.mist, O: P.mauve, G: P.gold, k: P.rust, K: P.copper, w: P.dusk, W: P.mist }), darkOf))
export const flag = memo(() => outline(spr(['pRR.', 'pRRR', 'pRR.', 'p...', 'p...', 'p...', 'p...'], { p: P.umber, R: P.red }), darkOf))
const bucketOf = (fish: boolean) => outline(spr([
  ...(fish ? ['..fF..', '..Ff..', 'kbbbbk'] : ['kyyyyk']),
  'kKKKKk',
  '.kKKk.',
  '.kkkk.',
], { f: P.sky, F: P.ice, b: P.blue, y: P.tan, k: P.dusk, K: P.mist }), darkOf)
export const sandBucket = memo(() => bucketOf(false))
export const fishBucket = memo(() => bucketOf(true))
/** Town stalls (task-13): a market stall, an anvil, a brazier the campfire flames sit in, and a dice booth. */
export const stall = memo(() => outline(spr([
  'aaAAaaAAaaAAaaAAaaAA',
  'aaAAaaAAaaAAaaAAaaAA',
  'aa..aa..aa..aa..aa..',
  '.p.............w..p.',
  '.p......k..k...w..p.',
  '.p..yy..rr.bb..w..p.',
  '.p.yYyy.RR.BB.gGg.p.',
  'cccccccccccccccccccc',
  'CCCCCCCCCCCCCCCCCCCC',
  'CdCCCdCCCdCCCdCCCdCC',
  'CCCCCCCCCCCCCCCCCCCC',
], { a: P.red, A: P.cream, p: P.umber, k: P.umber, y: P.gold, Y: P.amber, r: P.rose, R: P.crimson, b: P.sky, B: P.blue, w: P.mist, g: P.copper, G: P.gold, c: P.tan, C: P.copper, d: P.rust }), darkOf))
export const anvil = memo(() => outline(spr([
  '.hhhhhhhhh..',
  'hHHHHHHHHHhh',
  '..hHHHHHh...',
  '...hHHHh....',
  '...hHHHh....',
  '..hhhhhhh...',
  '.tttttttttt.',
  '.TTTTTTTTTT.',
  '.TTtTTTTtTT.',
], { H: P.mist, h: P.mauve, t: P.tan, T: P.copper }), darkOf))
export const brazier = memo(() => outline(spr([
  'lLLLLLLLLLl',
  '.lLLLLLLLl.',
  '..l.....l..',
  '..l.....l..',
  '.ll.....ll.',
], { l: P.dusk, L: P.mauve }), darkOf))
export const booth = memo(() => outline(spr([
  '..PPPPPPPPPPPP..',
  '.PPppppppppppPP.',
  'PPppppppppppppPP',
  '.w............w.',
  '.w............w.',
  '.w..WW....yy..w.',
  '.w..Wk...yYYy.w.',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCC',
], { P: P.purple, p: P.lilac, w: P.umber, W: P.white, k: P.ink, y: P.gold, Y: P.amber, c: P.tan, C: P.copper }), darkOf))

// ---------- scene helpers ----------
/** Flat cast shadows as one overlay: each ground color under an ellipse becomes the look's darker step. */
export const shadowLayer = (bg: Px, shadows: { cx: number; w: number; float?: boolean }[], fy: number, v: Variant, L: Look = LOOKS[v]): Px => {
  const o = new Px(bg.w, bg.h)
  for (const s of shadows) {
    if (s.w <= 0) continue
    const rows: [number, number][] = s.float ? [[1, s.w - 1]] : [[0, s.w - 2], [1, s.w], [2, s.w - 2]]
    for (const [j, half] of rows) for (let i = -half; i <= half; i++) {
      const c = bg.get(s.cx + i, fy + j)
      if (c) { const d = L.shade(c); if (d !== c) o.set(s.cx + i, fy + j, d) }
    }
  }
  return o
}
/** A strip of path pebbles that repeats every 16 art pixels, for the travel scene to scroll. */
export const stripOf = (w: number, v: Variant, L: Look = LOOKS[v]): Px => {
  const o = new Px(w, 3)
  for (let x = 0; x < w; x += 16) { o.set(x + 3, 1, L.path[0]); o.set(x + 4, 1, L.path[0]); o.set(x + 11, 0, L.path[2]); o.set(x + 9, 2, L.path[0]) }
  return o
}
/** The hero's face from the stand sprite, for the one-line strip. */
export const faceIcon = memo(() => {
  const h = heroSprite('stand'), x0 = h.feetX - 6, y0 = h.headTop
  const o = new Px(13, 9)
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.set(x, y, h.px.get(x0 + x, y0 + y))
  return o
})
const faces = new Map<string, Px>()
/** The face in his helm or hood, for the one-line strip: the same 13 by 9 window, started higher when he wears something on his head (task-28). */
export const faceOf = (look: GearLook): Px => {
  if (!look.head) return faceIcon()
  const key = `${look.head.shape}|${look.head.rar}|${look.head.h}`
  let o = faces.get(key)
  if (!o) {
    const h = gearHero({ auras: [], head: look.head }).hero, x0 = h.feetX - 6, y0 = h.headTop - (look.head.shape === 'visor' || look.head.shape === 'circlet' ? 0 : 2)
    o = new Px(13, 9)
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.set(x, y, h.px.get(x0 + x, y0 + y))
    if (faces.size > 16) faces.clear()
    faces.set(key, o)
  }
  return o
}

/** Elite affix marks (Diablo-style tells): small, drawn once, placed by the scene around the pack leader. */
export const firePool = memo(() => spr(['..oOOo..', '.oYYYOo.', 'rOOYOOor'], { r: P.red, o: P.orange, O: P.amber, Y: P.gold }))
export const iceShard = memo(() => outline(spr(['.W.', 'WIW', 'IbI', 'IbI'], { W: P.white, I: P.ice, b: P.sky }), darkOf, P.blue))
export const boltFx = memo(() => spr(['...yy', '..yy.', '.yyyy', '...y.', '..y..', '.y...', 'y....'], { y: P.cream }))
export const bugDot = memo(() => spr(['g'], { g: P.lime }))
export const dropFx = memo(() => outline(spr(['.r.', '.r.', 'rRr', 'rRr', '.r.'], { r: P.crimson, R: P.hot }), darkOf, P.blood))
export const plusFx = memo(() => outline(spr(['.g.', 'ggg', '.g.'], { g: P.spring }), darkOf, P.pine))
export const clockFx = memo(() => outline(spr(['.www.', 'wwkww', 'wwkkw', 'wwwww', '.www.'], { w: P.cloud, k: P.ink }), darkOf, P.dusk))
export const speedFx = memo(() => spr(['ww..www', '...ww..', 'www....'], { w: P.white }))
export const crackFx = memo(() => spr(['kk..k..', 'llkk.kk', '.kll.lk', '.l....l'], { k: P.ink, l: P.sand }))
export const tapeFx = memo(() => outline(spr(['rw', 'wr', 'rw', 'wr', 'rw', 'wr', 'rw', 'wr', 'rw', 'wr'], { r: P.red, w: P.white }), darkOf))
export const bracketFx = (right: boolean, h: number) => spr(Array.from({ length: h }, (_, i) => (i === 0 || i === h - 1 ? 'yy' : right ? '.y' : 'y.')), { y: P.gold })
/** A pixel ring around a w by h box, for the shield bubble. */
export const ringFx = (w: number, h: number, color: string = P.ice) => {
  const rx = w / 2 + 2, ry = h / 2 + 2, W = Math.ceil(rx * 2) + 1, H = Math.ceil(ry * 2) + 1
  return spr(Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => {
    const d = ((x - W / 2 + 0.5) / rx) ** 2 + ((y - H / 2 + 0.5) / ry) ** 2
    return d > 0.8 && d <= 1.05 ? 'b' : '.'
  }).join('')), { b: color })
}

// ---------- holiday decorations (real calendar, looks only) ----------
export const pumpkin = memo(() => outline(spr(['...s...', '.OOsOO.', 'OoOOOoO', 'OyOoOyO', 'OOOOOOO', 'OoyyyoO', '.OOOOO.'], { O: P.orange, o: P.copper, y: P.gold, s: P.green }), darkOf))
const TREE = ['....y....', '...yGy...', '...GGG...', '..GrGGG..', '..GGGbG..', '.GGyGGGG.', '.GGGGGrG.', 'GbGGGGGyG', 'GGGGrGGGG', '....u....', '....u....']
export const winterTree = memo(() => outline(spr(TREE, { G: P.green, y: P.gold, r: P.rose, b: P.sky, u: P.umber }), darkOf))
/** The tree's lights alone, padded like the outlined tree so they sit on it, for a blink. */
export const winterLights = memo(() => pad(spr(TREE.map(r => r.replace(/[Gu]/g, '.')), { y: P.cream, r: P.peach, b: P.ice })))
export const trophyFx = memo(() => outline(spr(['y.yyy.y', 'yyYYYyy', '.yYYYy.', '..yyy..', '...y...', '..yyy..', '.uuuuu.'], { y: P.gold, Y: P.cream, u: P.umber }), darkOf))
export const zFx = memo(() => spr(['zzz', '..z', '.z.', 'z..', 'zzz'], { z: P.cloud }))
export const heartFx = memo(() => outline(spr(['pp.pp', 'pPppp', 'ppppp', '.ppp.', '..p..'], { p: P.hot, P: P.blush }), darkOf))
export const burstFx = (c: string, tip: string) => spr(['t....t....t', '.c...c...c.', '..c..c..c..', '...c.W.c...', '....WWW....', 'tccWWWWWcct', '....WWW....', '...c.W.c...', '..c..c..c..', '.c...c...c.', 't....t....t'], { c, t: tip, W: P.white })
