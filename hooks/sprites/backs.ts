// Capes and wings behind the crab. Wings are hand drawn left halves, 15 columns (x 0..14), mirrored; the third value is the row offset from y 5.
// `putBack` in gear.ts narrows any piece to the shell plus 2 cells a side and tames its colors, so backs frame the crab.
// Capes are drawn by a small function: a flaring cloak with a hem, a lining and a pattern, so many looks come from a short table.
import { Cells, pick } from './core'
import type { Pal } from './core'
import { CX, CW } from './crab'
import { gearPal, shapes } from './gearpal'
import type { Shape } from './gearpal'

const WINGS = shapes([
  ['Angel Wings', '..KK.........../.KFFK......KK../KFFFFK....KFFK./KFHFFFK..KFFFFK/KFFFFFFKKFFFFFK/.KFFFFFFFFFFFK./..KFFFFFFFFFK../...KFFFFFFFK.../....KKKKKKK....', 0],
  ['Bat Wings', 'K............../KK.....K.....K/KDK...KDK...KD/KDDK.KDDDK.KDD/KDDDKDDDDDKDDD/KDDDDDDDDDDDDM/.KDDDDDDDDDDMM/..KDKDDKDDKMMM/...K.KDK.KK.KM', 1],
  ['Dragon Wings', '..K............/.KDK...K......./KDDDK.KDK.....K/KDDDDKDDDK...KD/KDDDDDDDDDK.KDD/KDMDDDMDDDKKDDM/.KDDMDDDMDDDDMM/..KDDDMDDDMDMMM/...KKDDDKDDDMMM/.....KKK.KKKKKK', 0],
  ['Butterfly Wings', '.KKKK........../KMMMMK.....KKK./KMHMMMK...KMMMK/KMMMMMMK.KMMMMK/KMMMYMMKKMMMMMK/KMMMMMMMKMMMMMK/.KMMMMMKKMMMMK./..KKKKKK.KKKK../..KDDDK..KDDK.../..KDDDDKKDDDDK../...KKKK..KKKK..', 0],
  ['Fairy Wings', '...KK........../..KCCK....KK.../.KCFCCK..KCCK../.KCCCCCKKCCCCK./.KCFCCCKCCCCCK./..KCCCCKCCCCK.../...KKKK.KKKK..../.....KKK.KK...../....KCCCKCCK..../.....KKKKKK.....', 1],
  ['Flame Wings', '.R..R........../.RR.RR...R..../RRORRO..RR..R./RROYRROORRO.RO/ROYYROYYROYORR/ROYYYOYYYOYYOO/.ROYYYOYYYOYYO/..ROYYYOYYYOYY/...RROYYOYYOYY/....RRROYYOYY.', 1],
  ['Crystal Wings', '..........C..../.........CFC.../.....C..CCFCC../....CFC.CCCCC.C/...CCFCCCCFCCCC/..CCCCCCCCCCCCC/.CCFCCCCCCCCCCC/..CCCCCCCCCCCC./...CCCCCCCCCC../.....CCCCCC....', 0],
  ['Bone Wings', 'F..F.........../FF.FF.....F..../.FFNFF...FFF.../..FNNFF.FFNF.../..FNNNFFFNNNF../...FNNNFNNNNF../...FNNNNNNNF.../....FNNNNNF..../.....FFFFFF.....', 0],
  ['Gear Wings', '..KSSK........./.KSsSsK....KK../KSsSSsSKKKSSsK./KSSKKSSSSSSsSK./KsSSSSSKSsSSSK./.KSSSSSSSSSSSK./..KSSsSSSSSsK../...KSSSSSSSK.../....KKKKKKK....', 1],
  ['Leaf Wings', '..G.G........../.GGGGG....G..../GGNGGGG..GGG.../GGGNGGGGGGGG.../.GGGNGGGGGGGG../..GGGGGGGGGGGG./...GGGGGGGGGG../.....GGGGGG....', 2],
  ['Raven Wings', 'N............../NN.N...N....../.NNNN.NNN...../..NNNNNNNNK.../..NNNNNNNNNN../...NNMNNNNNNN./...NNNNMNNNNN./....NNNNNNNNN./.....N.N.NNNN.', 1],
  ['Ghost Wings', '....FFF......../..FFFFFF...FF../.FFFFFFFFFFFFF./FFFFFFFFFFFFFF./.FFFFFFFFFFFFF./FF.FFFFFFFFFF../.....FFFFFFFF../......FF.FFFF../.......F...FF..', 2],
  ['Ice Wings', 'C.C............/CCCC...C......./.CFCC.CCC....../.CFCCCCFCC...../..CCCCCCCCCC.../..CCFCCCCCCCC../...CCCCCCCCCCC./....CCCFCCCCCC./.....CCCCCCCCC.', 1],
  ['Dragonfly Wings', '.KKKK........../KMMMMK........./KMHMMMK......../.KMMMMMKK.....K/..KKKKKKMKKKKKK/...KKKK.KMMMMMM/..KMMMMMKKKMMMM/.KMMMMMMMK.KKKK/..KKKKKKK.......', 2],
  ['Eagle Wings', 'K.K............/KWKWK.....K..../KWWWWK...KWK.../KWwWWWKKKWWWK../.KWWwWWWWWWWWK./.KWWWwWWWWWWWK/..KWWWWWWWWWWWK/...KWWWWWWWWWWK/....KKKKKKKKKK.', 1],
  ['Demon Wings', 'R..R.........../RR.RR..R......./.RRRRR.RR....../.RRKRRRRRR....K/..RRKRRRRRRRRRR/..RDRRKRRRRRRDR/...RDRRRRRRRRDD/....RDDRRRRDDD./.....RRDDDDDDD..', 0],
  ['Cloud Wings', '...FFF........./..FFFFF..FFF.../.FFFFFFFFFFFFF./FFFFFFFFFFFFFF./.FFFFFFFFFFFFF./..FFFFFFFFFFFF./...FFFFFFFFFF../....FFFFFFFF....', 2],
  ['Rainbow Wings', 'R............../RO.....Y......./ROY...YG......./ROYG.YGB......./ROYGBBGBB....../.ROYGBBBBBBBB../..ROYGBBBBBBBB./...RRROYGGBBBB./....RRRROOYYGG.', 1],
  ['Void Wings', 'N..N.........../NN.NN..N......./NPNNPN.NN....../NPPNNPNNPN...../.NPPNNPPNPNN.../.NNPNPNNNPPNN../..NNNPPNNNNNN../...NNNNNNNNNN../....NNNNNNNN....', 1],
  ['Jetpack', '.........KKKK../........KEEEEK./........KEsEEK./........KEEEEK./........KRRRRK./.........YYYY../..........YY...', 5],
  ['Banner Pole', '..........W..../......KKKKW..../......KMMMKW.../......KMHMKW.../......KMMMKW.../.......KKKKW.../..........W..../..........W..../..........W....', 2],
  ['Quiver Pack', '...........W.../..........WRW../.........WBGW../.........WWWW../.........KWWK../.........KWWK../.........KWWK../..........KK...', 4],
  ['Backpack', '........KKKKKK./.......KMMMMMM./.......KMHHMMM./.......KMMMMMM./.......KMAAAMM./.......KMMMMMM./.......KDDDDDD./........KKKKKK.', 5],
  ['Sail', '..........KW.../.........KWFK../........KWFFK../.......KWFFFK../......KWFFFFK../.....KWFFFFFK../......KKKKKKK../..........W....', 2],
  ['Turtle Shell', '...KKKKKKKKKK../..KMMMMMMMMMMK./.KMMHHMMMMMMMMK/.KMHMMKKMMMMMMK/KMMMMKMMMMMMMMK/KMMMMMKKKKKKKKK/.KDDDDDDDDDDDD./..KKKKKKKKKKKK.', 4],
  ['Antenna Rack', '.............K./............KE./...........KE../..........KE.../........KKE..../.......KE....../.......KE......', 1],
  ['Spiked Pack', 'K..K..K.K....../KM.KM.KMK....../KMMKMMKMMK...../.KMMMMMMMMK..../..KMMMMMMMMMK../...KDDDDDDDDDK./....KKKKKKKKKK.', 4],
  ['Satellite Dish', '...........KK../..........KSSK./.........KSssSK/........KSsSSsK/........KKKKKKK/..........KE.../..........KE.../.........KKEK..', 3],
  ['Cloud Puff', '......FFF....../....FFFFFFF..../...FFFFFFFFFF../..FFFFFFFFFFFF./...FFFFFFFFFFFF/.....FFFFFFFFFF', 5],
])

type CapeP = { n: string; flare: number; rows: number; hem: 0 | 1 | 2 | 3 | 4; lining: string; pat: 0 | 1 | 2 | 3 | 4 | 5 }
const CAPES: CapeP[] = [
  { n: 'Short Cape', flare: 0.65, rows: 12, hem: 0, lining: 'D', pat: 0 },
  { n: 'Long Cloak', flare: 0.75, rows: 14, hem: 0, lining: 'D', pat: 0 },
  { n: 'Red Lined Cloak', flare: 0.8, rows: 14, hem: 0, lining: 'R', pat: 0 },
  { n: 'Tattered Cape', flare: 0.75, rows: 14, hem: 1, lining: 'D', pat: 0 },
  { n: 'Scalloped Mantle', flare: 0.9, rows: 13, hem: 2, lining: 'D', pat: 1 },
  { n: 'Fringed Poncho', flare: 1.0, rows: 12, hem: 3, lining: 'D', pat: 1 },
  { n: 'Pointed Cape', flare: 0.8, rows: 14, hem: 4, lining: 'D', pat: 0 },
  { n: 'Furred Cloak', flare: 0.8, rows: 14, hem: 0, lining: 'D', pat: 3 },
  { n: 'Starry Cape', flare: 0.8, rows: 14, hem: 0, lining: 'N', pat: 4 },
  { n: 'Runed Cloak', flare: 0.75, rows: 14, hem: 2, lining: 'N', pat: 5 },
  { n: 'Royal Cape', flare: 0.95, rows: 14, hem: 0, lining: 'R', pat: 3 },
  { n: 'Striped Cape', flare: 0.7, rows: 13, hem: 0, lining: 'D', pat: 1 },
  { n: 'Wide Cloak', flare: 1.0, rows: 14, hem: 0, lining: 'D', pat: 0 },
  { n: 'Narrow Cape', flare: 0.5, rows: 14, hem: 0, lining: 'D', pat: 0 },
  { n: 'Gold Hem Cloak', flare: 0.8, rows: 14, hem: 2, lining: 'D', pat: 1 },
  { n: 'Shadow Cloak', flare: 0.8, rows: 14, hem: 1, lining: 'N', pat: 0 },
  { n: 'Fringed Cloak', flare: 0.75, rows: 14, hem: 3, lining: 'D', pat: 0 },
  { n: 'Pointed Royal Cape', flare: 0.9, rows: 14, hem: 4, lining: 'R', pat: 1 },
  { n: 'Star Mantle', flare: 1.0, rows: 13, hem: 2, lining: 'P', pat: 4 },
  { n: 'Rune Poncho', flare: 1.0, rows: 12, hem: 3, lining: 'N', pat: 5 },
  { n: 'Furred Mantle', flare: 1.0, rows: 13, hem: 1, lining: 'D', pat: 3 },
  { n: 'Frost Cape', flare: 0.8, rows: 14, hem: 4, lining: 'C', pat: 4 },
  { n: 'Ember Cloak', flare: 0.8, rows: 14, hem: 1, lining: 'O', pat: 5 },
  { n: 'Leaf Cloak', flare: 0.85, rows: 14, hem: 4, lining: 'G', pat: 0 },
  { n: 'Silk Cape', flare: 0.8, rows: 14, hem: 2, lining: 'Q', pat: 1 },
  { n: 'Moon Cloak', flare: 0.85, rows: 14, hem: 4, lining: 'P', pat: 4 },
  { n: 'Sun Mantle', flare: 0.9, rows: 12, hem: 3, lining: 'Y', pat: 1 },
  { n: 'Bone Cloak', flare: 0.75, rows: 14, hem: 1, lining: 'F', pat: 5 },
  { n: 'Ocean Cape', flare: 0.8, rows: 14, hem: 2, lining: 'B', pat: 0 },
  { n: 'Pirate Coattails', flare: 0.5, rows: 14, hem: 4, lining: 'R', pat: 1 },
  { n: 'Hooded Shroud', flare: 0.65, rows: 14, hem: 1, lining: 'N', pat: 3 },
  { n: 'Dragon Cape', flare: 0.95, rows: 13, hem: 4, lining: 'O', pat: 5 },
  { n: 'Patchwork Cape', flare: 0.7, rows: 13, hem: 3, lining: 'G', pat: 4 },
  { n: 'Tattered Banner', flare: 0.45, rows: 14, hem: 1, lining: 'R', pat: 1 },
]

const mirrorSelf = (c: Cells) => {
  for (let y = 0; y < c.h; y++) for (let x = 0; x < CX; x++) { const v = c.m.get(y * c.w + x); if (v) c.m.set(y * c.w + (CW - 1 - x), v) }
}
const putCape = (c: Cells, p: CapeP, pal: Pal, by: number) => {
  const y0 = 9 + by
  for (let r = 0; r < p.rows; r++) {
    // a gentle flare that stops 2 cells outside the shell (x 7), so the cape frames the crab
    const left = Math.max(5, Math.round(9 - r * p.flare * 0.45))
    for (let x = left; x < CX; x++) {
      const y = y0 + r
      const last = r === p.rows - 1
      if (last && p.hem === 2 && (x - left) % 2) continue
      if (last && p.hem === 4 && (CX - x) % 3 !== 1) continue
      if (p.hem === 1 && r >= p.rows - 2 && ((x * 5 + r * 3) % 4 === 0)) continue
      if (p.hem === 3 && r >= p.rows - 2 && (x + r) % 2) continue
      let col = x - left < 1 ? 'K' : x - left < 2 ? 'M' : x - left < 4 ? pal.M : pal[p.lining] ?? pal.D
      if (x === left) col = 'K'
      if (col === 'K') c.put(x, y, pal.K)
      else if (col === 'M') c.put(x, y, pal.M)
      else c.put(x, y, col)
      if (p.pat === 1 && (x - left === 1 || (last && x - left < 6))) c.put(x, y, pal.A)
      if (p.pat === 3 && r < 2 && x - left >= 1) c.put(x, y, pal.F)
      if (p.pat === 3 && x - left === 1) c.put(x, y, pal.F)
      if (p.pat === 4 && (x * 7 + r * 3) % 11 === 0 && x - left > 1) c.put(x, y, pal.Y)
      if (p.pat === 5 && (x * 5 + r * 4) % 9 === 0 && x - left > 1) c.put(x, y, pal.C)
    }
  }
  mirrorSelf(c)
}

export const BACKS: Shape[] = [...CAPES.map(p => ({ n: p.n, r: '' })), ...WINGS]
export const putBack = (c: Cells, id: number, color: string, by = 0) => {
  const i = id % BACKS.length
  const pal = gearPal(color)
  if (i < CAPES.length) return putCape(c, pick(CAPES, i), pal, by)
  const s = pick(BACKS, i)
  const top = 2 + by + (s.y ?? 0)
  if (!/Wings$/.test(s.n)) return c.paint(s.r, pal, 0, top, 1)
  // Wings are drawn half again as tall (every other row doubled): the bottom edge stays near where it was, the tips rise.
  const rows = s.r.split('/')
  const tall = rows.flatMap((r, y) => (y % 2 ? [r, r] : [r]))
  c.paint(tall.join('/'), pal, 0, Math.max(0, top + rows.length - tall.length + 1), 1)
}
