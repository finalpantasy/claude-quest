// Pets: original collectible creatures in evolution lines (a baby, a middle form, often a final form), each with an element.
// 16 kinds drawn as a baby and an adult shape, scaled to three sizes, plus element ornaments. 192 lines make 500+ pets. No names or designs from anyone else's games.
import { hash, hue } from './core'
import type { Part, Sprite } from './core'
import { pick } from './core'
import { compose, cropped, foePal, scaleOps } from './foe'
import { bounds, edge, finish, run } from './shape'
import type { Palette } from './palettes'

export const PET_ELEMENTS = ['ember', 'tide', 'leaf', 'spark', 'frost', 'stone', 'spirit', 'gloom', 'light', 'toxin', 'steel', 'gale'] as const
export type PetElement = (typeof PET_ELEMENTS)[number]

const pp = (base: string, accent: string, glow: string): Palette => ({ base, accent, glow })
const PET_BASE: Record<PetElement, Palette[]> = {
  ember: [pp('#f07a3a', '#ffd060', '#fff0a0'), pp('#d8452a', '#f0a030', '#ffe060')],
  tide: [pp('#4aa8e8', '#bfe8ff', '#ffffff'), pp('#3a68c8', '#70e0e0', '#e0ffff')],
  leaf: [pp('#5ab84a', '#f0e070', '#fffbc0'), pp('#3a9a5a', '#f08ab0', '#ffe8f0')],
  spark: [pp('#f0d83a', '#6a8af0', '#ffffff'), pp('#e0b82a', '#4a4a8a', '#ffffa0')],
  frost: [pp('#9ad8f0', '#ffffff', '#d0f0ff'), pp('#7aa0e0', '#e0f0ff', '#ffffff')],
  stone: [pp('#a89a7a', '#6a5a4a', '#ffe08a'), pp('#8a8a9a', '#c0a060', '#fff0c0')],
  spirit: [pp('#a88ae0', '#e0d0ff', '#ffffff'), pp('#7a6ac0', '#c0f0f0', '#e8ffff')],
  gloom: [pp('#5a4a70', '#c05080', '#ff6a8a'), pp('#3a3a50', '#8a60c0', '#ffa0ff')],
  light: [pp('#fff0b0', '#ffc060', '#ffffff'), pp('#fde8d0', '#a0d0f0', '#fff8c0')],
  toxin: [pp('#9ac83a', '#b060d0', '#f0ff70'), pp('#7a9a3a', '#e0a0e0', '#ffff90')],
  steel: [pp('#a8b4c4', '#e0c060', '#e8f8ff'), pp('#8a98b0', '#c06060', '#ffffff')],
  gale: [pp('#9ae0d0', '#ffffff', '#e8fffa'), pp('#7acaf0', '#f0f8ff', '#ffffff')],
}
/** Each element has two hand-picked palettes and a third with the body hue turned a little. */
const PET_PAL = Object.fromEntries(PET_ELEMENTS.map(e => [e, [...PET_BASE[e], { ...PET_BASE[e][0]!, base: hue(PET_BASE[e][0]!.base, 28) }]])) as Record<PetElement, Palette[]>
const PREFIXES: Record<PetElement, string[]> = {
  ember: ['Em', 'Pyr', 'Cin', 'Ign', 'Flar', 'Sear', 'Char'], tide: ['Aqu', 'Tid', 'Brin', 'Rill', 'Mist', 'Wav', 'Dew'], leaf: ['Fol', 'Ver', 'Moss', 'Fern', 'Briar', 'Sap', 'Clov'],
  spark: ['Zap', 'Volt', 'Jolt', 'Arc', 'Fluxo', 'Zing', 'Amp'], frost: ['Gla', 'Rim', 'Chil', 'Snow', 'Fros', 'Icy', 'Hail'], stone: ['Pet', 'Cobb', 'Rok', 'Ped', 'Gran', 'Flint', 'Slate'],
  spirit: ['Eth', 'Ecto', 'Spir', 'Haun', 'Lum', 'Phan', 'Mourn'], gloom: ['Umb', 'Gloam', 'Dusk', 'Nox', 'Shad', 'Murk', 'Vesp'], light: ['Sol', 'Lux', 'Aur', 'Hal', 'Glim', 'Dawn', 'Beam'],
  toxin: ['Tox', 'Veno', 'Bile', 'Fume', 'Gunk', 'Ooze', 'Bane'], steel: ['Fer', 'Cog', 'Rivet', 'Ingo', 'Anvil', 'Chro', 'Bolt'], gale: ['Zeph', 'Gust', 'Breez', 'Cirr', 'Squall', 'Drift', 'Whir'],
}

/** Kinds: baby shape, adult shape (16 grid, scaled down), and the three stage names' roots. */
const KINDS: { n: string; baby: string; adult: string; roots: [string, string, string] }[] = [
  { n: 'blob', baby: 'E10,5,4;Y6,9;Y6,10;M12,2', adult: 'E10,6,5;E6,4,3;Y5,8;Y5,9;M11,2;e3,12,1,1,A', roots: ['bub', 'blorb', 'blobnar'] },
  { n: 'cat', baby: 'E9,5,5;T3,5,4,1,6,5;Y5,9;Y5,10;M11,2', adult: 'E6,4,3;T3,5,4,0,6,4;E11,5,3;R3,12,2,3;L9,12,14,9,a;Y6,6;M8,2', roots: ['kit', 'lynx', 'pardus'] },
  { n: 'dog', baby: 'E9,5,5;e2,7,2,3;Y5,8;Y5,9;M11,2', adult: 'E6,4,4;e2,6,2,4;E11,5,3;R3,12,2,3;L9,12,13,10,a;Y5,6;M8,3', roots: ['pup', 'hound', 'canix'] },
  { n: 'bird', baby: 'E10,5,4;T6,8,7,10,8,9,a;Y5,8;Y5,9', adult: 'E7,4,4;E11,4,4;T0,5,4,9,4,12,a;T6,6,7,7,8,10,w;Y5,6', roots: ['chirp', 'finch', 'falcrest'] },
  { n: 'bug', baby: 'E10,4,4;E7,4,3;L5,5,3,2,a;Y6,7', adult: 'E10,5,4;E6,4,3;T0,6,5,8,5,12,w;L5,4,4,1,a;Y6,6', roots: ['mite', 'beetle', 'mantor'] },
  { n: 'fish', baby: 'E9,5,5;T1,6,4,9,4,12,A;Y6,8;M11,2', adult: 'E9,6,5;T0,5,3,9,3,13,A;Y5,7;M11,4', roots: ['fry', 'finn', 'piscor'] },
  { n: 'snake', baby: 'E11,5,3;E7,3,3;Y6,6;y7,9,r', adult: 'E12,6,3;E9,5,3;E6,4,3;Y6,5;y7,8,r', roots: ['wrig', 'serp', 'vyper'] },
  { n: 'rodent', baby: 'E9,5,5;e4,3,2,2,A;Y6,8;M10,2', adult: 'E7,4,4;e3,4,2,2,A;E12,5,3;L9,12,14,10,a;Y6,6', roots: ['nib', 'vole', 'rattor'] },
  { n: 'turtle', baby: 'E10,5,4,a;E6,3,3;Y6,6;R3,12,2,2', adult: 'E10,6,4,a;E10,5,3,d;E6,3,3;R2,12,2,3;Y6,6', roots: ['shellet', 'tortle', 'carapax'] },
  { n: 'dragon', baby: 'E10,5,4;E6,3,3;T6,2,7,0,8,3,w;Y6,6;L9,12,13,11,a', adult: 'E6,4,3;T0,5,4,6,4,12,d;E11,5,4;T6,2,7,0,8,3,w;L10,13,14,12,a;Y6,5;M8,2', roots: ['wyrmlet', 'drake', 'dragonar'] },
  { n: 'plant', baby: 'E10,5,4;e5,4,2,1,a;Y6,9;Y6,10', adult: 'E9,5,5;e4,4,3,2,a;e3,10,2,3,d;Y6,8;M11,2', roots: ['sprig', 'bloom', 'floraxe'] },
  { n: 'rock', baby: 'E10,5,4;Y6,9;R3,12,2,2', adult: 'E9,6,5;R1,8,2,4;Y6,7;M11,4', roots: ['pebb', 'boulder', 'golith'] },
  { n: 'ghost', baby: 'E8,4,5;R4,11,1,2;R6,12,1,2;Y6,7', adult: 'E7,5,5;C11,8,2;R4,12,1,2;R7,12,1,2;Y5,6', roots: ['wisp', 'phantle', 'spectrix'] },
  { n: 'mushroom', baby: 'E8,5,3,a;C10,4,4;Y6,11', adult: 'E5,6,4,a;C9,4,5;R3,5,1,1,w;Y6,11;M13,2', roots: ['spore', 'shroomp', 'fungoro'] },
  { n: 'bat', baby: 'E9,4,4;T5,5,6,2,7,5;Y6,8', adult: 'E9,3,4;T0,3,5,7,5,12,d;T5,3,7,0,7,5;Y6,8', roots: ['flit', 'batling', 'vampyrn'] },
  { n: 'fairy', baby: 'E9,4,4;e2,7,2,2,A;Y6,8', adult: 'E8,3,3;E12,3,3;T0,6,4,8,4,12,A;Y6,7', roots: ['pix', 'sprite', 'faelor'] },
]

/** Element ornaments: three tops and three sides, in the same relative coordinates as monster parts. */
const ORN: Record<PetElement, { top: string[]; side: string[] }> = {
  ember: { top: ['T6,0,7,-3,8,0,r;T7,0,8,-4,8,0,A', 'T5,0,6,-2,7,0,r;T7,0,8,-3,8,0,r', 'E-2,3,2,r'], side: ['T0,2,-3,3,0,5,r', 'e-2,2,2,2,r', 'L0,3,-3,2,A'] },
  tide: { top: ['T7,0,8,-3,9,0,A', 'e8,-1,1,1,A;C-3,2,3,A', 'L6,0,5,-3,A;L5,-3,7,-3,A'], side: ['T0,-1,-3,0,0,3,A', 'e-2,1,2,3,A', 'L0,0,-3,-2,A;L0,2,-3,4,A'] },
  leaf: { top: ['L7,0,5,-3,d;e5,-3,2,1,a', 'e6,-2,2,1,a;C-3,1,3,d', 'C-3,2,2,a;C-2,1,2,d'], side: ['e-2,0,2,1,a', 'T0,0,-3,-2,0,2,a', 'L0,1,-3,3,d;e-3,3,1,1,a'] },
  spark: { top: ['L6,0,5,-3,A;L5,-3,7,-4,A', 'T4,0,5,-4,6,0,A', 'C-3,1,3,A;C-5,1,2,A'], side: ['L0,2,-3,1,A;L-3,1,-1,4,A', 'T0,1,-3,3,0,5,A', 'e-2,2,2,1,A'] },
  frost: { top: ['T6,0,7,-4,8,0,w', 'T5,0,6,-3,7,0,w;T7,0,8,-4,8,0,w', 'C-2,2,2,w'], side: ['T0,0,-3,2,0,4,w', 'e-2,2,2,2,w', 'L0,2,-3,0,w;L0,3,-3,5,w'] },
  stone: { top: ['R6,-2,2,2,d', 'T5,0,6,-3,8,0,d', 'R5,-1,3,1,d;R6,-2,1,1,d'], side: ['R-2,1,2,2,d', 'e-2,2,2,2,d', 'T0,0,-3,2,0,4,d'] },
  spirit: { top: ['E-2,2,2,A', 'T6,0,7,-4,8,0,A', 'e8,-2,1,2,A'], side: ['T0,1,-3,3,0,6,A', 'e-2,3,2,3,A', 'L0,2,-3,5,A'] },
  gloom: { top: ['L5,1,3,-2,w', 'T5,1,6,-3,7,1,r', 'R6,-2,1,2,r'], side: ['T0,0,-4,-2,0,3,d', 'T0,1,-3,3,0,5,d', 'L0,2,-3,5,r'] },
  light: { top: ['C-3,6,1,A', 'C-2,2,2,A;R4,-1,1,1,A', 'T6,0,7,-3,8,0,w'], side: ['T0,-1,-4,-3,0,2,w', 'e-3,0,3,2,w', 'L0,1,-3,-1,A'] },
  toxin: { top: ['e6,-2,1,1,A;e9,-3,1,1,A', 'L6,0,5,-3,d;e5,-3,1,1,A', 'C-3,2,2,a'], side: ['e-2,1,1,1,A', 'e-3,2,2,2,a', 'L0,2,-3,4,a'] },
  steel: { top: ['R4,-1,2,1,w', 'C-2,6,2,d', 'T6,0,7,-3,8,0,d'], side: ['R-3,0,3,2,d', 'e-2,1,2,2,w', 'T0,0,-3,1,0,3,w'] },
  gale: { top: ['e4,-1,2,2,w', 'T5,0,6,-3,7,0,w', 'e8,-2,2,1,w'], side: ['T0,0,-4,-2,0,3,w', 'e-3,1,3,2,w', 'L0,1,-4,0,w;L0,3,-4,4,w'] },
}

export type PetStage = 1 | 2 | 3
export type Pet = { name: string; line: number; stage: PetStage; kind: string; element: PetElement; shiny?: boolean }
const SIZE: Record<PetStage, number> = { 1: 10, 2: 12, 3: 14 }

const NLINES = 192
const lineOf = (j: number) => {
  const kind = j % 16, q = Math.floor(j / 16)
  const e = pick(PET_ELEMENTS, 5 * kind + 3 * q)
  return { kind, q, e, prefix: pick(PREFIXES[e], kind + q * 2), stages: q < 8 ? 3 : 2 }
}

export const PETS: Pet[] = []
for (let j = 0; j < NLINES; j++) {
  const l = lineOf(j)
  for (let s = 1; s <= l.stages; s++) {
    const kind = pick(KINDS, l.kind)
    PETS.push({ name: l.prefix + pick(kind.roots, s - 1), line: j, stage: s as PetStage, kind: kind.n, element: l.e })
  }
}

/** One pet's sprite: stage 1 is the baby shape at 10 pixels, stages 2 and 3 the adult at 12 and 14, with ornaments growing by stage. */
export const petSprite = (p: Pet): Sprite => {
  const l = lineOf(p.line)
  const kind = pick(KINDS, l.kind)
  const k = SIZE[p.stage] / 16
  const orn = ORN[p.element]
  const pal = pick(PET_PAL[p.element], l.q)
  const top = p.stage >= 2 ? pick(orn.top, l.q) : l.q % 4 === 0 ? (l.q === 0 ? undefined : pick(orn.top, l.q / 4)) : l.q % 2 ? pick(orn.top, l.q + 1) : undefined
  const side = p.stage >= 3 ? pick(orn.side, l.q) : undefined
  const { g, foot } = compose(16, p.stage === 1 ? kind.baby : kind.adult, { top: undefined }, k)
  // ornaments attach to the finished body and grow with the pet
  const off = Math.round(SIZE[p.stage] / 4)
  const b = bounds(g)
  const mid = Math.round((b.top + b.bot) / 2)
  if (side) run(g, scaleOps(side, k), edge(g, mid), mid)
  if (top) run(g, scaleOps(top, k), off, b.top)
  return cropped([{ rects: finish(g, foePal(pal)) }], foot)
}
export const PET_LINES = NLINES
export const petHash = (p: Pet) => hash(p.name)
