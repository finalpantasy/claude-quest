// The four D30 creatures and small effects (task-25), each a rows-of-keys sprite with a palette that can be swapped.
import { P, Px, darkOf, outline, spr } from './core'
import { BONE, golem, imp, skeleton, spider } from './foes2'

export const slime = () => outline(spr([
  '.......GGGGgg.......',
  '.....GGHHGGgggg.....',
  '....GHHHGGgggggg....',
  '...GHHGGgggggggggd..',
  '..GHHGGggggggggggdd.',
  '..GHGGgggggggggggdd.',
  '.GGggLeggggggLegdddd',
  '.GGggeeggggggeegdddd',
  '.Ggggeeggggggeegdddd',
  'Gggggggggggggggggddd',
  'gggggggmggmggggggddd',
  'ggggggggmmgggggggddD',
  'dggggggggggggggdddDD',
  '.ddgggggggggggdddDD.',
  '..DDDDDDDDDDDDDDDD..',
], { H: P.sprout, G: P.spring, g: P.leaf, d: P.green, D: P.pine, e: P.ink, L: P.cloud, m: P.pine }), darkOf)

/** Mushroom: a red-capped walker with a grumpy face. */
export const mushroom = () => outline(spr([
  '......rrRRRr......',
  '....rRRRooRRrr....',
  '...rRRRooooRRrq...',
  '..rRooRRooRRrrqq..',
  '.rRooooRRRRrrrrqq.',
  '.rRRooRRRRroorqqq.',
  'rRRRRRRRRrroooqqqq',
  'rrRRRRRrrrrroqqqqq',
  'qrrrrrrrrrrrqqqqqq',
  '.qwwwwwwwwwwwwwwq.',
  '....kSSSSSsssk....',
  '....SSSSSSsssk....',
  '....SbbSSbbssk....',
  '....SeSSSSessk....',
  '....SeSSSSessk....',
  '....SSSSSSsssk....',
  '....SSSmmmsssk....',
  '.....SSSSSsskk....',
  '....UUUu..UUuu....',
  '....uuun..uunn....',
], { R: P.scarlet, r: P.red, q: P.blood, o: P.skin, S: P.skin, s: P.apricot, k: P.tan, e: P.ink, b: P.wine, m: P.wine, w: P.clay, U: P.copper, u: P.rust, n: P.wine }), darkOf)

/** Bat: wings spread, hovering, small fangs. */
export const bat = () => outline(spr([
  '............P....P..........',
  '............PP..PP..........',
  '...vvv......PPPPPP......vvv.',
  '..vLLPv....PPPPPPPP....vPPpv',
  '.vLLPPPv...PeLPPeLP...vPPPpv',
  'vLLPPPPPv..PPPPPPPP..vPPPPpv',
  'vLPPPPPPPv.PPPffPPp.vPPPPPpv',
  'vLPPPPPPPPvPPPPPPPpvPPPPPPpv',
  'vPPPPPPPPPPPPPPPPPpPPPPPPPpv',
  '.vPPPPvPPPPvpPPPPpvPPPPvPPv.',
  '..vPPv.vPPv.vpPPpv.vPPv.vv..',
  '...vv...vv...vppv...vv......',
  '..............vv............',
], { P: P.purple, p: P.violet, v: P.grape, L: P.lilac, e: P.rose, f: P.cloud }), darkOf)

/** Phantom (the rare elite): a crowned teal wraith with red eyes, reaching wisps and a curling tail. */
export const phantom = () => outline(spr([
  '.....g..g..g......',
  '.....gggggggg.....',
  '.....GgYgGgYG.....',
  '....ffffffffff....',
  '...fFFFFFffffaa...',
  '..fFFFFFFfffaaaa..',
  '..fFFFFFffffaaaa..',
  '..fFeeFFFeefaaaa..',
  '..fFerFFFerfaaaa..',
  '..fFFFFFFfffaaaa..',
  '..fFFFFFffffaaat..',
  '..ffFFFFfffaaaat..',
  '.ffFFFFFfffaaatt..',
  'ff.fFFFffffaaattt.',
  'f..ffFFfffaaatttt.',
  '....ffffaaaatttt..',
  '.....ffaaaattttt..',
  '......faaattt.tt..',
  '.......aattt...t..',
  '........att.......',
  '.........tt.......',
  '..........t.......',
], { g: P.gold, G: P.amber, Y: P.rose, F: P.foam, f: P.mint, a: P.aqua, t: P.teal, e: P.ink, r: P.rose }), darkOf)

/** Ring loot: a gold signet with a blue stone. */
export const ring = () => outline(spr([
  '.bB.',
  'gBbg',
  'g..G',
  'g..G',
  '.GG.',
], { b: P.blue, B: P.ice, g: P.gold, G: P.amber }), darkOf)
export const glint = () => spr(['...w...', '...c...', '...c...', 'wccWccw', '...c...', '...c...', '...w...'], { w: P.gold, c: P.cream, W: P.white })
export const spark = () => spr([
  '...y...',
  '.y.c.y.',
  '..ccc..',
  'ycWWWcy',
  '..ccc..',
  '.y.c.y.',
  '...y...',
], { y: P.gold, c: P.cream, W: P.white })

/** A thick stroke along points: radius from r0 to r1, color from the side of the stroke facing the light. */

// ---------- swaps, ranks and the mapping from the game's bestiary ----------
/** Five step ramps, light to dark, that a creature's main color can be swapped for. */
export const RAMPS: Record<string, string[]> = {
  green: [P.sprout, P.spring, P.leaf, P.green, P.pine],
  red: [P.peach, P.scarlet, P.red, P.blood, P.grape],
  orange: [P.cream, P.amber, P.orange, P.rust, P.wine],
  blue: [P.ice, P.sky, P.blue, P.indigo, P.navy],
  purple: [P.blush, P.lilac, P.purple, P.violet, P.grape],
  teal: [P.foam, P.mint, P.aqua, P.teal, P.deep],
  gold: [P.cream, P.gold, P.amber, P.copper, P.rust],
  gray: [P.cloud, P.mist, P.mauve, P.dusk, P.night],
  pink: [P.apricot, P.salmon, P.pink, P.mulberry, P.berry],
  lime: [P.cream, P.lime, P.moss, P.olive, P.umber],
  bone: BONE,
}
const recolor = (p: Px, from: string[], to: string[]) => {
  const m = new Map(from.map((c, i) => [c, to[i]!]))
  return p.map(c => m.get(c) ?? c)
}
export type Creature = 'slime' | 'mushroom' | 'bat' | 'phantom' | 'golem' | 'imp' | 'spider' | 'skeleton'
/** The ramp each creature is drawn in, so a swap knows what to replace (its outline colors are the dark end of the same ramp). */
const NATIVE: Record<Creature, string[]> = { slime: RAMPS.green!, mushroom: RAMPS.red!, bat: RAMPS.purple!, phantom: RAMPS.teal!, golem: RAMPS.gray!, imp: RAMPS.orange!, spider: RAMPS.blue!, skeleton: RAMPS.bone! }
const BASE: Record<Creature, () => Px> = { slime, mushroom, bat, phantom: () => phantomPlain(), golem, imp, spider, skeleton }

/** The phantom without its crown (the crown is added for a rare). */
const phantomPlain = () => {
  // rows 0 to 3 are the outline over the crown and its three rows; the head starts at row 4 and needs its own ink line above
  const p = phantom(), o = new Px(p.w, p.h - 3)
  for (let y = 4; y < p.h; y++) for (let x = 0; x < p.w; x++) o.set(x, y - 3, p.get(x, y))
  for (let x = 0; x < p.w; x++) if (o.get(x, 1) !== undefined) o.set(x, 0, P.ink)
  return o
}
const crown = () => spr(['g.g.g', 'gGgGg', 'gYGYg', 'GGGGG'], { g: P.gold, G: P.amber, Y: P.rose })
/** A one pixel halo around a sprite, outside its outline. */
const halo = (p: Px, color: string) => {
  const src = new Px(p.w + 2, p.h + 2)
  src.blit(p, 1, 1)
  const o = new Px(src.w, src.h)
  o.blit(p, 1, 1)
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
    if (src.get(x, y) !== undefined) continue
    if (src.get(x - 1, y) !== undefined || src.get(x + 1, y) !== undefined || src.get(x, y - 1) !== undefined || src.get(x, y + 1) !== undefined) o.set(x, y, color)
  }
  return o
}

const GROUPS: Record<Creature, string[]> = {
  slime: ['slime', 'jelly', 'orb', 'cube', 'egg', 'cauldron', 'mimic', 'book', 'lantern', 'octopus'],
  mushroom: ['mushroom', 'plant', 'flower', 'cactus', 'treant', 'frog', 'turtle', 'rat', 'boar', 'jackal', 'wolf', 'cat', 'ogre', 'yeti', 'minotaur', 'worm', 'snake'],
  bat: ['bat', 'moth', 'wasp', 'owl', 'harpy', 'anglerfish', 'eye', 'wyrm', 'whelp'],
  phantom: ['ghost', 'wraith', 'cultist', 'shaman', 'wisp', 'hydra'],
  golem: ['golem', 'robot', 'gear', 'totem', 'gargoyle'],
  imp: ['imp', 'demon', 'goblin'],
  spider: ['spider', 'scarab', 'beetle', 'scorpion', 'mantis', 'crab'],
  skeleton: ['skull', 'skeleton', 'zombie', 'mummy', 'knight'],
}
const CREATURE = new Map<string, Creature>(Object.entries(GROUPS).flatMap(([c, bases]) => bases.map(b => [b, c as Creature] as const)))
const ORDER: Creature[] = ['slime', 'mushroom', 'bat', 'phantom', 'golem', 'imp', 'spider', 'skeleton']
const ELEMENT_RAMP: Record<string, string> = { fire: 'orange', frost: 'blue', venom: 'lime', void: 'purple', storm: 'gold', holy: 'pink', shadow: 'gray', nature: 'green' }
/** Which of the eight creatures a bestiary base is, and the ramp swap its element asks for (none for an earth creature). */
export const creatureOf = (base: string, hash: number): Creature => CREATURE.get(base) ?? ORDER[hash % ORDER.length]!
/** The bestiary bodies drawn as this creature. */
export const creatureBodies = (c: Creature) => GROUPS[c]
export const rampOf = (element: string | null) => (element ? ELEMENT_RAMP[element] : undefined)

export type FoeLook = { creature: Creature; ramp?: string; rank?: string }
const foeCache = new Map<string, Px>()
/** A creature in its element's ramp with its rank on it: magic a blue halo, rare a crown and a gold halo, unique an orange halo, the treasure goblin gilded. */
export const foePx = ({ creature, ramp, rank }: FoeLook): Px => {
  const key = `${creature}:${ramp ?? ''}:${rank ?? ''}`
  let p = foeCache.get(key)
  if (p) return p
  p = BASE[creature]()
  const to = rank === 'goblin' ? RAMPS.gold : ramp ? RAMPS[ramp] : undefined
  if (to) p = recolor(p, NATIVE[creature], to)
  if (rank === 'rare') {
    const c = crown(), o = new Px(Math.max(p.w, c.w), p.h + c.h)
    o.blit(p, Math.floor((o.w - p.w) / 2), c.h); o.blit(c, Math.floor((o.w - c.w) / 2) + 1, 0)
    p = o
  }
  const edge = rank === 'magic' ? P.sky : rank === 'rare' ? P.gold : rank === 'unique' ? P.orange : rank === 'goblin' ? P.amber : undefined
  if (edge) p = halo(p, edge)
  foeCache.set(key, p)
  return p
}

// ---------- followers (small critters) and minions ----------
const FOLLOWERS: Px[] = [
  // dog
  spr(['.d....d.', 'ddd..ddd', 'dDDDDDDd', 'dDeDDeDd', 'dDDnnDDd', '.DDDDDD.', '.DD..DD.', '.dd..dd.'], { d: P.dusk, D: P.mist, e: P.ink, n: P.night }),
  // cat
  spr(['c....c', 'cc..cc', 'cCCCCc', 'cyCCyc', 'cCCnCc', '.CCCC.', '.CC.CC', '.c..c.'].map(r => r.padEnd(6, '.')), { c: P.night, C: P.dusk, y: P.gold, n: P.rose }),
  // fairy
  spr(['w....w..', 'ww..ww..', '.wwFFw..', '..FfFf..', '..FfFf..', '...ff...', '...f....'], { w: P.white, F: P.foam, f: P.mint }),
  // bird
  spr(['..bb....', '.bBBb...', 'bBeBbaa.', 'bBBBb...', '.bBBb...', '..bb....', '..a.a...'], { b: P.indigo, B: P.sky, e: P.ink, a: P.amber }),
  // rodent
  spr(['..rr.rr.', '.rRRrRRr', '.rReRRer', '.rRRnRRr', '..rRRRr.', '..rr.rr.', '...t....'].map(r => r.padEnd(8, '.')), { r: P.olive, R: P.moss, e: P.ink, n: P.rose, t: P.moss }),
].map(p => outline(p, darkOf))
export const followerPx = (i: number) => FOLLOWERS[((i % FOLLOWERS.length) + FOLLOWERS.length) % FOLLOWERS.length]!
export const minionPx = () => outline(spr(['.bbbbb.', '.bPbPb.', '.bbbbb.', '..bbb..', '.bbbbb.', '..b.b..', '.bb.bb.'], { b: P.cloud, P: P.purple }), darkOf)
