// The bestiary: base creatures (each with a body), times element variants, make 500+ named species with stable looks.
// Any other name still gets a stable look from its hash. Original names; the first forty are the foes already in hooks/data.ts.
import { hash, pick } from './core'
import type { Sprite } from './core'
import { BODY_NAMES, PARTS, foe } from './foe'
import type { Look } from './foe'
import { ELEMENTS, PALETTES, PREFIX, shiny } from './palettes'
import type { Element, Palette } from './palettes'

export const BASE_FOES: [string, string][] = [
  ['Null Pointer', 'eye'], ['Off-By-One', 'worm'], ['Typo Imp', 'imp'], ['Unused Import', 'ghost'], ['Stray Semicolon', 'snake'], ['Magic Number', 'cube'], ['Dead Code Zombie', 'zombie'], ['TODO Wraith', 'wraith'],
  ['Breaking Change', 'golem'], ['Transitive Dep', 'spider'], ['Phantom Package', 'mimic'], ['Semver Scarab', 'scarab'], ['Postinstall Script', 'scorpion'], ['Polyfill Mummy', 'mummy'], ['Diamond Dependency', 'orb'], ['CVE Jackal', 'jackal'],
  ['Merge Conflict', 'hydra'], ['Detached HEAD', 'skull'], ['Rebase Ghoul', 'cultist'], ['Stash Hoarder', 'rat'], ['Squash Golem', 'cube'], ['Orphan Commit', 'egg'], ['Blame Specter', 'wisp'], ['Hook Lurker', 'anglerfish'],
  ['Heisenbug', 'beetle'], ['Race Condition', 'mantis'], ['Memory Leak', 'slime'], ['Deadlock Demon', 'demon'], ['Cache Stampede', 'boar'], ['Timezone Fiend', 'owl'], ['Flaky Test', 'moth'], ['Cron Horror', 'octopus'],
  ['Spaghetti Golem', 'worm'], ['God Object', 'ogre'], ['Singleton Cultist', 'cultist'], ['XML Yeti', 'yeti'], ['SOAP Elemental', 'jelly'], ['Y2K Revenant', 'skeleton'], ['Goto Gargoyle', 'gargoyle'], ['Stored Procedure Shaman', 'shaman'],
  ['Segfault Slime', 'slime'], ['Heap Ooze', 'jelly'], ['Buffer Jelly', 'jelly'], ['Core Dump Skull', 'skull'], ['Hollow Skull', 'skull'], ['Null Bat', 'bat'], ['Cron Bat', 'bat'], ['Dependency Spider', 'spider'],
  ['Crawler Spider', 'spider'], ['Unit Test Beetle', 'beetle'], ['Stag Beetle of Staging', 'beetle'], ['Cache Scarab', 'scarab'], ['Log Worm', 'worm'], ['Tapeworm', 'worm'], ['Pipe Snake', 'snake'], ['Cobra Script', 'snake'],
  ['Dangling Ghost', 'ghost'], ['Lost Connection', 'ghost'], ['Linter Imp', 'imp'], ['Hotfix Imp', 'imp'], ['Ticket Goblin', 'goblin'], ['Scope Goblin', 'goblin'], ['Legacy Skeleton', 'skeleton'], ['Bonehead Merge', 'skeleton'],
  ['Zombie Process', 'zombie'], ['Unkillable Daemon', 'zombie'], ['Monolith Golem', 'golem'], ['Config Golem', 'golem'], ['Build Ogre', 'ogre'], ['Release Ogre', 'ogre'], ['Review Gargoyle', 'gargoyle'], ['Ice Cache Yeti', 'yeti'],
  ['Fuzz Jackal', 'jackal'], ['Fork Wolf', 'wolf'], ['Packet Wolf', 'wolf'], ['Hog of Heap', 'boar'], ['Bug Crab', 'crab'], ['Kernel Crab', 'crab'], ['Stinger Script', 'scorpion'], ['Phishing Angler', 'anglerfish'],
  ['Thread Octopus', 'octopus'], ['Callback Kraken', 'octopus'], ['Watcher of Logs', 'eye'], ['Profiler Eye', 'eye'], ['Orb of Entropy', 'orb'], ['Stray Process', 'wisp'], ['Spore Daemon', 'mushroom'], ['Fungal Fork', 'mushroom'],
  ['Cube Root', 'cube'], ['Easter Egg', 'egg'], ['Hatch Bug', 'egg'], ['Lamp Moth', 'moth'], ['Cursor Moth', 'moth'], ['Hornet of Hotfix', 'wasp'], ['Stinger Wasp', 'wasp'], ['Prayer Mantis of Prod', 'mantis'],
  ['Cargo Cultist', 'cultist'], ['Pipeline Shaman', 'shaman'], ['Regex Shaman', 'shaman'], ['Rebase Knight', 'knight'], ['Empty Knight', 'knight'], ['Wrapper Mummy', 'mummy'], ['Gzip Mummy', 'mummy'], ['Hung Process Wraith', 'wraith'],
  ['Labyrinth Minotaur', 'minotaur'], ['Pager Demon', 'demon'], ['Legacy Lord', 'demon'], ['Rate-Limit Rat', 'rat'], ['Sewer Rat of Sockets', 'rat'], ['Cheshire Cat', 'cat'], ['Debug Cat', 'cat'], ['Nightly Owl', 'owl'],
  ['Hotfix Harpy', 'harpy'], ['Toad of Types', 'frog'], ['Tortoise of Tests', 'turtle'], ['Hydra of Heads', 'hydra'], ['Docs Whelp', 'whelp'], ['Wyrm of Weights', 'wyrm'], ['Mimic Chest', 'mimic'], ['Cursed Docs', 'book'],
  ['Totem of Tabs', 'totem'], ['Lantern Bearer', 'lantern'], ['Gearwork Fiend', 'gear'], ['Build Bot', 'robot'], ['Rogue Robot', 'robot'], ['Brew Cauldron', 'cauldron'], ['Flytrap Parser', 'plant'], ['Treant of Trees', 'treant'],
  ['Bloom Filter', 'flower'], ['Cactus of Caching', 'cactus'], ['Spinlock Spider', 'spider'], ['Bytecode Beetle', 'beetle'], ['Mutex Golem', 'golem'], ['Thunk Wraith', 'wraith'], ['Daemonized Owl', 'owl'], ['Lambda Lizard', 'whelp'], ['Egg of Entropy', 'egg'], ['Night Bat of Nightly', 'bat'], ['Goblin of Go', 'goblin'], ['Wolf of Wire', 'wolf'], ['Knight of Nulls', 'knight'], ['Book of Bugs', 'book'],
]

export type Species = { name: string; base: string; element: Element | null; look: Look; pal: Palette }

const NT = PARTS.top.length
const NF = PARTS.face.length
/** Look for base creature number b: the top and face parts walk a grid so no two bases on one body match. */
const lookOf = (b: number, body: string): Look => ({
  body,
  top: b % (NT + 1) === 0 ? undefined : (b % (NT + 1)) - 1,
  face: Math.floor(b / (NT + 1)) % (NF + 1) === 0 ? undefined : (Math.floor(b / (NT + 1)) % (NF + 1)) - 1,
  side: b % 3 === 0 ? undefined : (b * 5) % PARTS.side.length,
  bottom: b % 4 === 1 ? (b * 3) % PARTS.bottom.length : undefined,
  back: b % 5 === 2 ? (b * 7) % PARTS.back.length : undefined,
  mark: (b * 3 + 1) % 14,
})
const earth = (b: number) => pick(PALETTES.earth, b)

/** Mutations: a changed palette and different parts on the same creature. */
export const MUTATIONS = ['Elder', 'Alpha', 'Spectral', 'Armored', 'Feral', 'Gilded']
export const SPECIES: Species[] = []
BASE_FOES.forEach(([base, body], b) => {
  const look = lookOf(b, body)
  SPECIES.push({ name: base, base, element: null, look, pal: earth(b) })
  // every element, then every mutation: 15 species per base creature
  ELEMENTS.forEach((e, k) => SPECIES.push({ name: `${PREFIX[e]} ${base}`, base, element: e, look, pal: pick(PALETTES[e], b + k) }))
  MUTATIONS.forEach((m, k) => {
    const pal = earth(b + k + 1)
    SPECIES.push({
      name: `${m} ${base}`, base, element: null,
      look: { ...look, top: (look.top ?? 3) + 5 + 7 * k, side: k % 2 ? look.side : undefined, bottom: undefined, mark: k % 3 === 2 ? (look.mark ?? 0) % 14 : undefined },
      pal: { base: pal.accent, accent: pal.base, glow: pal.glow },
    })
  })
})
const INDEX = new Map(SPECIES.map(s => [s.name, s]))

/** The species for a name: the table's, or a stable one made from the name's hash. */
export const speciesOf = (name: string): Species => {
  const hit = INDEX.get(name)
  if (hit) return hit
  const h = hash(name)
  const body = pick(BODY_NAMES, h)
  const e = pick(ELEMENTS, h >>> 8)
  const elemental = (h >>> 12) % 3 === 0
  return { name, base: name, element: elemental ? e : null, look: lookOf(h >>> 4, body), pal: elemental ? pick(PALETTES[e], h >>> 16) : earth(h >>> 16) }
}

export type FoeDraw = { rank?: string; shiny?: boolean; tint?: string }
/** A monster sprite by name, with rank (eye glow and aura ring) and the rare color swap. */
export const foeSprite = (name: string, o: FoeDraw = {}): Sprite => {
  const s = speciesOf(name)
  return foe(s.look, { pal: o.shiny ? shiny(s.pal) : s.pal, rank: o.rank })
}
