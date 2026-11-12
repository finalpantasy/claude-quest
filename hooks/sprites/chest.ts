// Robes and shell coverings. Left halves, 8 columns wide (x 7..14), mirrored; the third value is the row offset from the shell top (y 10).
// Each drawing is the texture for a small piece: `putChest` cuts it to the base's style (below), so most of the shell stays bare orange.
import { pick } from './core'
import { shapes } from './gearpal'
import type { Shape } from './gearpal'

const BASES = shapes([
  ['Robe', '..KMMMMM/.KMMHMMM/.KMMMMMM/KMMMMMMM/KMMMAAAA/KMMMMMMM/.KDMMMMM/..KKDDDD', 3],
  ['Hooded Robe', '....KMMM/...KMMHM/..KMMMMM/.KMMMMMM/.KMMMMMM/KMMMMMMM/KMMMAAAA/KMMMMMMM/.KDMMMMM/..KKDDDD', 1],
  ['Tabard', '...KMMMM/..KMMMMM/.KMMAAMM/.KMMMAMM/KMMMMAMM/KMMMMMMM/KMMMMMMM/.KDMMMMM/..KKDDDD', 2],
  ['Plate Armor', '......KK/....KKSS/...KSSSS/..KSSHSS/.KSSSSSS/.KSMMMMM/KSSSMMMM/KSSSSSSS/KsSSSSSS/.KsSSSSS/..KKsssK', 0],
  ['Chainmail', '....KKss/...KSsSs/..KsSsSS/.KSsSsSs/.KsSsSsS/KSsSsSsS/KsSsSsSs/KSsSsSsS/.KsSsSsS/..KKSsSs', 1],
  ['Leather Vest', '...KWWWW/..KWWwWW/.KWMWWWW/.KWWWWWW/KWMWWWWw/KWWWWWWw/KWMWWWWw/.KWWWWww/..KKwwww', 2],
  ['Bone Armor', '...KFFFF/..KFFFFF/.KFKFKFF/.KFFFFFF/KFKFKFKF/KFFFFFFF/KFKFKFKF/.KFFFFFF/..KKFFFF', 2],
  ['Mantle', 'KKKK.KMM/KMMMKKMM/KMMMMKMM/.KMMMMMM/.KMMMMMM/..KMMMMM/..KDMMMM/...KKDDD', 1],
  ['Scale Mail', '....KKSS/...KSsSS/..KSsSsS/.KSsSsSS/.KsSsSsS/KSsSsSSs/KsSsSsSs/KSsSsSSs/.KsSsSsS/..KKsSsS', 1],
  ['Cloth Wrap', '..KFFFFF/.KFFFFFF/.KFMFFFF/KFFMFFFF/KFFFMFFF/KFFFFMFF/.KFFFFMF/..KKFFFM', 3],
  ['Hoodie of Holding', '...KMMMM/..KMMSMM/.KMMSMMM/.KMMMMMM/KMMMMMMM/KMMKKKKK/KMMKDDDD/.KMKDDDD/..KKMMMM', 2],
  ['Flannel Plate', '..KRRRNR/.KRRNRRR/.KNNNNNN/KRRNRRRN/KRRNRRRN/KNNNNNNN/KRRNRRRN/.KRRNRRR/..KKNNNN', 3],
  ['Kevlar Cardigan', '...KMMMM/..KMMMMM/.KMMAMMM/.KMMMMMM/KMMMMAMM/KMMMMMMM/KMMMMAMM/.KMMMMMM/..KKDDDD', 2],
  ['Conference Tee', '..KFFFFF/.KFFFFFF/.KFFBBFF/KFFFBBFF/KFFFFFFF/KFFFFFFF/KFFFFFFF/.KFFFFFF/..KKFFFF', 3],
  ['Fur Mantle', 'KFFKFFFF/FFFFFFFF/KFFFFFFF/.KMMMMMM/.KMMMMMM/KMMMMMMM/KMMMMMMM/.KDMMMMM/..KKDDDD', 1],
  ['Feather Coat', 'K.K.K.K./KMKMKMKM/KMMMMMMM/.KMMMMMM/KMKMKMKM/KMMMMMMM/.KMKMKMK/..KMMMMM/..KKKKKK', 2],
  ['Crystal Shell', '.....KCC/....KCFC/...KCCCC/..KCFCCC/.KCCCCCC/KCCCFCCC/KCCCCCCC/KCFCCCCC/.KCCCCCC/..KKCCCC', 1],
  ['Lava Crust', '....KNNR/...KNRNO/..KNNONR/.KNRNNON/.KNNONNR/KNONNRNN/KNNRNONN/KNRNNNRN/.KNNONNO/..KKNNNN', 1],
  ['Vine Wrap', '..KGGGGG/.KGGGGGG/.KGGNGGG/KGGGGGGG/KGNGGGGG/KGGGGGNG/.KGGGGGG/..KGNGGG/...KKGGG', 3],
  ['Pirate Coat', '..KMMMMM/.KMMMMMM/.KMAMMMM/KMMMAMMM/KMMMAMMM/KMMMAMMM/KAMAMMMM/.KMMMMMM/..KKDDDD', 3],
  ['Samurai Do', '...KKKKK/..KMAMAM/.KMMMMMM/.KMAMAMA/KMMMMMMM/KMAMAMAM/KMMMMMMM/.KMAMAMA/..KKDDDD', 2],
  ['Monk Robe', '...KMMMM/..KMMMMM/.KMMKMMM/KMMMMKMM/KMMMMMKM/KMMMMMMK/KMMMMMMM/.KDMMMMM/..KKDDDD', 2],
  ['Starry Robe', '..KMMMMM/.KMMYMMM/.KMMMMMM/KMYMMMMM/KMMMMYMM/KMMMMMMM/.KMYMMMM/..KKDDDD', 3],
  ['Necro Robe', '..KNNNNN/.KNNFFNN/.KNNFFNN/KNNNFNNN/KNNNNNNN/KNNNNNNN/.KNNMMMM/..KKNNNN', 3],
  ['Paladin Plate', '...KSSSS/..KSSSSS/.KSSSAAS/.KSSSAAS/KSSSSAAS/KSSSAAAS/KSSSSAAS/.KsSSSSS/..KKssss', 2],
  ['Ranger Cloak', 'K.KGKGKG/KGKGGGGG/KGGGGGGG/.KGGMGGG/.KGGGGGG/KGGGMGGG/KGGGGGGG/.KDGGGGG/..KKDDDD', 1],
  ['Royal Mantle', 'KFKFKFKF/FKFKFKFK/KRRRRRRR/.KRRRRRR/.KRRRRRR/KRRFRFRR/KRRRRRRR/.KRRRRRR/..KKDDDD', 1],
  ['Barnacle Shell', '....KEEE/...KENEE/..KEEENE/.KENEEEE/.KEEEENE/KEENEEEE/KEEEEENE/KENEEEEE/.KEEENEE/..KKEEEE', 1],
  ['Gold Plate', '......KK/....KKAA/...KAAAA/..KAAYAA/.KAAAAAA/.KAAaaaa/KAAAAAAA/KAAAAAAA/KaAAAAAA/.KaAAAAA/..KKaaaa', 0],
  ['Ice Armor', '....KKCC/...KCFCC/..KCCCFC/.KCCCCCC/KCFCCCCC/KCCCCFCC/KCCCCCCC/KCFCCCCC/.KCCCCCC/..KKCCCC', 1],
])

/** Emblems drawn over the chest middle (left half, columns 5..7, from y 14). */
export const EMBLEMS: [string, string][] = [
  ['Heart', 'RR./RRR/.RR/..R'],
  ['Star', '..Y/.YY/YYY/.YY'],
  ['Skull', '.FF/FFF/FNF/.FF'],
  ['Cross', '..A/..A/AAA/..A'],
  ['Eye', '.FF/FPF/.FF/...'],
  ['Flame', '..R/.RO/ROY/ROO'],
  ['Bolt', '..Y/.YY/.Y./YY.'],
  ['Gem', '..C/.CF/CCC/.CC'],
  ['Moon', '.FF/FF./FF./.FF'],
  ['Sun', 'A.A/.AY/AYY/.AY'],
]

/**
 * Where each base sits on the shell, crab first: a small piece, never a full cover (task-17).
 * sash a strap across the left side, belt a band low on the shell, apron a front flap, plate a lower chest plate,
 * pauldrons two shoulder plates, collar a band under the eye stalks.
 */
export type ChestStyle = 'sash' | 'belt' | 'apron' | 'plate' | 'pauldrons' | 'collar'
const STYLES: ChestStyle[] = [
  'sash', 'collar', 'apron', 'pauldrons', 'plate', 'sash', 'pauldrons', 'collar', 'plate', 'belt',
  'collar', 'apron', 'plate', 'apron', 'collar', 'pauldrons', 'pauldrons', 'plate', 'sash', 'belt',
  'pauldrons', 'belt', 'apron', 'collar', 'plate', 'collar', 'collar', 'pauldrons', 'plate', 'pauldrons',
]
export type ChestShape = Shape & { e?: number; st: ChestStyle }
const BASE_SHAPES: ChestShape[] = BASES.map((s, i) => ({ ...s, st: STYLES[i] ?? 'plate' }))

export const CHESTS: ChestShape[] = [
  ...BASE_SHAPES,
  ...[
    [0, 0], [3, 1], [4, 2], [6, 3], [8, 4], [10, 5], [12, 6], [13, 7], [14, 8], [16, 9], [20, 0], [21, 1], [22, 2], [24, 3], [26, 4], [27, 5], [28, 6], [29, 7],
    [1, 8], [2, 9], [5, 0], [7, 1], [9, 2], [11, 3], [15, 4], [17, 5], [18, 6], [19, 7], [23, 8], [25, 9],
  ].map(([b = 0, e = 0]) => ({ n: `${pick(EMBLEMS, e)[0]} ${pick(BASES, b).n}`, r: pick(BASES, b).r, y: pick(BASES, b).y, e, st: pick(BASE_SHAPES, b).st })),
]
/** Is shell cell (x, row r from the shell top) inside a chest style's piece? Rows 6 and 7 hold the smile, row 8 the class gem; most styles keep off them. */
export const inStyle = (st: ChestStyle, x: number, r: number) => {
  const f = Math.min(x, 29 - x) // folded onto the left half, 14 at the center
  if (st === 'apron') return r >= 8 && f >= 12
  if (st === 'plate') return r >= 8 && f >= 10
  if (st === 'belt') return r === 9 || (r === 10 && x >= 16)
  if (st === 'collar') return r >= 1 && r <= 3
  if (st === 'pauldrons') return r >= 2 && r <= 5 && f <= 11
  // the sash: two cells wide, from the left shoulder down toward the middle
  const sx = 10 + Math.floor((r - 3) / 2)
  return r >= 3 && x >= sx && x <= sx + 1
}
export const chestEmblem = (s: Shape & { e?: number }) => (s.e === undefined ? undefined : pick(EMBLEMS, s.e)[1])
