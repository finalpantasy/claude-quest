// Renders the art sample sheets from hooks/sprites into docs/art/samples (nearest neighbour PNGs, no browser, no installs).
//   npx --no-install tsx tools/render_sprites.ts [group ...] [--out dir]
// Groups: crab gear catalogs variants monsters bosses pets auras parts scene. With no group, all of them.
import { join, resolve } from 'node:path'
import { Canvas, sheet } from './sheet'
import type { Tile } from './sheet'
import { AURAS, AURA_VARIANTS, BACK_VARIANTS, VARIANTS, BACKS, BOSS_NAMES, CHESTS, HATS, HEADS, MASKS, OFFHANDS, PETS, POSES, SPECIES, WEAPONS, boss, crabSprite, foeSprite, petSprite } from '../hooks/sprites'
import { BODIES } from '../hooks/sprites/bodies'
import { foe, PARTS } from '../hooks/sprites/foe'
import { FAMILIES } from '../hooks/sprites/parts'
import { PALETTES, ELEMENTS } from '../hooks/sprites/palettes'

const ROOT = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const oi = args.indexOf('--out')
const OUT = oi >= 0 ? resolve(args[oi + 1] ?? '.') : join(ROOT, 'docs', 'art', 'samples')
const groups = args.filter((a, i) => !a.startsWith('--') && (oi < 0 || i !== oi + 1))
const want = (g: string) => groups.length === 0 || groups.includes(g)
const RAR = ['#c8c8c8', '#8080ff', '#f2e05a', '#ff8a1f', '#2fd05a']
const rar = (i: number) => RAR[((i % 5) + 5) % 5] ?? '#c8c8c8'
const TRIM = ['#4aa3ff', '#e0443a', '#46c466', '#a65ee0']
const by = 2

if (want('crab')) {
  const look = { trim: '#4aa3ff', head: { id: 0, color: rar(1) }, chest: { id: 3, color: rar(2) }, weapon: { id: 0, color: rar(3) }, offhand: { id: 0, color: rar(4) } }
  const tool = (p: string) => (p === 'sit' ? 'rod' as const : p === 'dig' ? 'shovel' as const : p === 'mine' ? 'pick' as const : undefined)
  const plain: Tile[] = POSES.map(p => ({ label: p, sprite: crabSprite({ pose: p, trim: '#4aa3ff' }) }))
  const geared: Tile[] = POSES.map(p => ({ label: p, sprite: crabSprite({ pose: p, ...look, tool: tool(p), aura: p === 'active' ? 'active' : undefined }) }))
  sheet(join(OUT, 'crab-poses.png'), [...plain, ...geared], { cols: 9, s: 4, title: 'THE CRAB: EVERY POSE, BARE AND GEARED' })
  sheet(join(OUT, 'crab-poses-2x.png'), geared, { cols: 9, s: 2, pad: 4, title: 'BAND SIZE (2X)', bg: '#1b1626' })
  sheet(join(OUT, 'crab-poses-1x.png'), geared, { cols: 9, s: 1, pad: 3, cellW: 36, cellH: 44, title: '1X' })
}

if (want('gear')) {
  const tiles: Tile[] = []
  for (let i = 0; i < 40; i++) {
    tiles.push({ label: `GEAR ${i + 1}`, sprite: crabSprite({ pose: POSES[[0, 2, 3][i % 3] ?? 0] ?? 'stand', trim: TRIM[i % 4] ?? '#4aa3ff', head: { id: (i * 7) % HEADS.length, color: rar(i) }, chest: { id: (i * 11 + 3) % CHESTS.length, color: rar(i + 2) }, back: i % 3 ? { id: (i * 5) % BACKS.length, color: rar(i + 1) } : undefined, weapon: { id: (i * 13) % WEAPONS.length, color: rar(i) }, offhand: { id: (i * 3) % OFFHANDS.length, color: rar(i + 3) } }) })
  }
  sheet(join(OUT, 'crab-gear.png'), tiles, { cols: 8, s: 4, title: 'CRAB WITH GEAR: 40 COMBOS' })
}

if (want('catalogs')) {
  const one = (list: { n: string }[], title: string, file: string, cols: number, mk: (i: number) => Tile['sprite']) =>
    sheet(join(OUT, file), list.map((h, i) => ({ label: h.n, sprite: mk(i) })), { cols, s: 4, title })
  one(HATS, `HATS: ${HATS.length}`, 'hats.png', 8, i => crabSprite({ pose: 'stand', trim: '#4aa3ff', head: { id: i, color: rar(i) } }))
  one(MASKS, `MASKS: ${MASKS.length}`, 'masks.png', 8, i => crabSprite({ pose: 'stand', trim: '#4aa3ff', head: { id: HATS.length + i, color: rar(i) } }))
  one(CHESTS, `ROBES AND SHELLS: ${CHESTS.length}`, 'robes.png', 8, i => crabSprite({ pose: 'stand', trim: '#4aa3ff', chest: { id: i, color: rar(i) } }))
  one(BACKS, `CAPES AND WINGS: ${BACKS.length}`, 'capes-wings.png', 8, i => crabSprite({ pose: 'stand', trim: '#4aa3ff', back: { id: i, color: rar(i) } }))
  one(OFFHANDS, `SHIELDS AND OFF-HANDS: ${OFFHANDS.length}`, 'offhands.png', 8, i => crabSprite({ pose: 'stand', trim: '#4aa3ff', offhand: { id: i, color: rar(i) } }))
  one(WEAPONS, `WEAPONS: ${WEAPONS.length}`, 'weapons.png', 8, i => crabSprite({ pose: 'stand', trim: '#4aa3ff', weapon: { id: i, color: rar(i) } }))
}

if (want('variants')) {
  // a spread slice of the combinations: the same drawings in other materials, trims, plumes and gems
  const slice = (n: number, total: number, k: number) => Array.from({ length: n }, (_, i) => (i * k + 7) % total)
  const tile = (label: string, look: Parameters<typeof crabSprite>[0]): Tile => ({ label, sprite: crabSprite(look) })
  const base = { pose: 'stand' as const, trim: '#4aa3ff' }
  sheet(join(OUT, 'weapon-variants.png'), slice(48, WEAPONS.length * VARIANTS.weapon, 53).map(n => { const id = n % WEAPONS.length, v = Math.floor(n / WEAPONS.length); return tile(`${WEAPONS[id]?.n ?? ''} ${v}`, { ...base, weapon: { id, color: rar(n), v } }) }), { cols: 8, s: 4, title: `WEAPONS: ${WEAPONS.length} DRAWINGS X ${VARIANTS.weapon} VARIANTS = ${WEAPONS.length * VARIANTS.weapon}` })
  const heads = slice(24, HEADS.length * VARIANTS.head, 37).map(n => { const id = n % HEADS.length, v = Math.floor(n / HEADS.length); return tile(`${HEADS[id]?.n ?? ''} ${v}`, { ...base, head: { id, color: rar(n), v } }) })
  const robes = slice(16, CHESTS.length * VARIANTS.chest, 29).map(n => { const id = n % CHESTS.length, v = Math.floor(n / CHESTS.length); return tile(`${CHESTS[id]?.n ?? ''} ${v}`, { ...base, chest: { id, color: rar(n), v } }) })
  const backs = slice(16, BACKS.length * BACK_VARIANTS, 31).map(n => { const id = n % BACKS.length, v = Math.floor(n / BACKS.length); return tile(`${BACKS[id]?.n ?? ''} ${v}`, { ...base, back: { id, color: rar(n), v } }) })
  const offs = slice(16, OFFHANDS.length * VARIANTS.offhand, 23).map(n => { const id = n % OFFHANDS.length, v = Math.floor(n / OFFHANDS.length); return tile(`${OFFHANDS[id]?.n ?? ''} ${v}`, { ...base, offhand: { id, color: rar(n), v } }) })
  sheet(join(OUT, 'armor-variants.png'), [...heads, ...robes, ...backs, ...offs], { cols: 8, s: 4, title: 'ARMOR: HATS AND MASKS, ROBES, CAPES AND WINGS, SHIELDS, WITH TRIMS' })
  sheet(join(OUT, 'auras-generated.png'), slice(48, AURA_VARIANTS, 41).map(n => ({ label: String(n), sprite: crabSprite({ ...base, aura: `a${n}`, head: { id: 0, color: '#8080ff' } }) })), { cols: 8, s: 4, title: `GENERATED AURAS: ${AURA_VARIANTS} (11 SHAPES X 12 ELEMENTS X 5 RARITIES X 4 MOTIONS)` })
}

if (want('monsters')) {
  const pal = { base: '#7a9a5a', accent: '#c8a04a', glow: '#ffd23f' }
  sheet(join(OUT, 'monster-bodies.png'), BODIES.map(([n], i) => ({ label: n, sprite: foe({ body: n }, { pal: PALETTES.earth[i % 6] ?? pal }) })), { cols: 10, s: 6, title: `MONSTER BODIES: ${BODIES.length}` })
  const ranks = [undefined, undefined, undefined, 'magic', 'rare', 'unique', 'goblin']
  const tiles: Tile[] = []
  for (let i = 0; i < 60; i++) { const sp = SPECIES[(i * 11) % SPECIES.length]; if (sp) tiles.push({ label: sp.name, sprite: foeSprite(sp.name, { rank: ranks[i % ranks.length], shiny: i % 13 === 12 }) }) }
  sheet(join(OUT, 'monsters.png'), tiles, { cols: 10, s: 6, title: `MONSTERS: 60 OF ${SPECIES.length} SPECIES, ELEMENTS AND RANKS` })
  const el: Tile[] = []
  for (const e of ELEMENTS) for (let k = 0; k < 4; k++) el.push({ label: `${e} ${k + 1}`, sprite: foe({ body: 'zombie', top: k * 3 + (ELEMENTS.indexOf(e) % 3), side: k }, { pal: PALETTES[e][k] ?? pal }) })
  sheet(join(OUT, 'monster-elements.png'), el, { cols: 8, s: 6, title: 'ELEMENT PALETTES: 8 ELEMENTS, 4 EACH' })
}

if (want('parts')) {
  const pal = { base: '#7a9a5a', accent: '#c8a04a', glow: '#ffd23f' }
  const tiles: Tile[] = []
  for (const f of FAMILIES) f.v.forEach((_, i) => {
    const idx = PARTS[f.at].findIndex(p => p.n === `${f.n}${i}`)
    const look = { body: 'zombie', [f.at]: idx }
    tiles.push({ label: `${f.n} ${i + 1}`, sprite: foe(look, { pal }) })
  })
  sheet(join(OUT, 'monster-parts.png'), tiles, { cols: 12, s: 5, title: `PART FAMILIES: ${FAMILIES.length}` })
}

if (want('bosses')) {
  sheet(join(OUT, 'bosses.png'), BOSS_NAMES.slice(0, 20).map(n => ({ label: n, sprite: boss(n) })), { cols: 5, s: 6, title: 'BOSSES: 20 OF 53' })
  sheet(join(OUT, 'bosses-all.png'), BOSS_NAMES.map(n => ({ label: n, sprite: boss(n) })), { cols: 9, s: 4, title: `ALL ${BOSS_NAMES.length} BOSSES` })
}

if (want('pets')) {
  const pick = PETS.filter(p => p.line % 5 === 0 || p.line === 1).slice(0, 40)
  sheet(join(OUT, 'pets.png'), pick.map(p => ({ label: `${p.name} ${p.stage}`, sprite: petSprite(p) })), { cols: 8, s: 8, title: `PETS: 40 OF ${PETS.length}, EVOLUTION LINES` })
  sheet(join(OUT, 'pets-all.png'), PETS.map(p => ({ label: p.name, sprite: petSprite(p) })), { cols: 16, s: 4, title: `ALL ${PETS.length} PETS, ${new Set(PETS.map(p => p.line)).size} LINES` })
}

if (want('auras')) {
  sheet(join(OUT, 'auras.png'), AURAS.map(a => ({ label: a.name, sprite: crabSprite({ pose: 'stand', trim: '#4aa3ff', aura: a.id, head: { id: 0, color: '#8080ff' } }) })), { cols: 9, s: 4, title: `AURAS: ${AURAS.length}` })
}

if (want('scene')) {
  // A whole scene at band size (3x): the geared crab, a pet, a fight with eight monsters. Static; in the mod the same shapes move with CSS.
  const s = 3
  const cv = new Canvas(560, 150, '#1d2433')
  cv.fill(0, 110, 560, 40, '#3b3226')
  const put = (sp: { w: number; h: number; parts: { rects: [number, number, number, number, string][]; op?: number }[] }, x: number, y: number) => { for (const p of sp.parts) cv.rects(p.rects, x, y, s, p.op ?? 1) }
  put(crabSprite({ pose: 'attack', trim: '#4aa3ff', head: { id: 0, color: rar(3) }, chest: { id: 3, color: rar(2) }, back: { id: 6, color: rar(1) }, weapon: { id: 4, color: rar(3) }, offhand: { id: 0, color: rar(4) }, aura: 'unique' }), 10, 110 - 26 * s + 3 * s)
  put(petSprite(PETS[203] ?? PETS[0]!), 110, 110 - 14 * s + 4 * s)
  for (let i = 0; i < 8; i++) { const sp = SPECIES[(i * 53 + 7) % SPECIES.length]; if (sp) put(foeSprite(sp.name, { rank: i === 3 ? 'rare' : i === 6 ? 'magic' : undefined }), 190 + (i % 4) * 90 + (i > 3 ? 40 : 0), 110 - 12 * s - (i > 3 ? 20 : 0)) }
  cv.save(join(OUT, 'scene.png'))
}
console.log(`wrote sheets to ${OUT}`)
