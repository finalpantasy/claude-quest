// task-29: four more D30 creatures (golem, imp, spider, skeleton) in the same rows-of-keys style as foes.ts.
// Keys 1 to 5 are the creature's own ramp, light to dark, so the element swaps in foes.ts can recolor them; light comes from the upper left.
import { P, darkOf, outline, spr } from './core'

export const BONE = [P.white, P.cloud, P.hay, P.sand, P.clay]
const ramp = (r: string[]) => ({ 1: r[0]!, 2: r[1]!, 3: r[2]!, 4: r[3]!, 5: r[4]! })

/** Golem: a mossy boulder with glowing cyan eyes, heavy fists and stubby legs. */
export const golem = () => outline(spr([
  '.......mmmnn..........',
  '......mm11222nn.......',
  '......1122222334......',
  '......1Gg222Gg34......',
  '......1gg222gg34......',
  '......2222ee2334......',
  '..mm11222222233344nn..',
  '.1122222222233333344..',
  '1122522222223333453344',
  '1222522222223333453344',
  '1223522222333333453445',
  '2223522222333333443445',
  'm22351222233333344344n',
  '2233522233333344453455',
  '2334522333334444454555',
  '.....2233....3444.....',
  '.....2233....3445.....',
  '....12233....34455....',
], { ...ramp([P.cloud, P.mist, P.mauve, P.dusk, P.night]), m: P.moss, n: P.olive, G: P.foam, g: P.aqua, e: P.ink }), darkOf)

/** Imp: a small horned devil with bat wings, big eyes, a fanged grin and a tail. */
export const imp = () => outline(spr([
  '....h..........h....',
  '....hH........Hh....',
  '.....H11122223H.....',
  '.....1122222233.....',
  '....112222222233....',
  '....12Le2222Le33....',
  '....12ee2222ee33....',
  '....122222222233....',
  '....122eeeeee233....',
  'V....122w22w333....V',
  'VV....22233333....VV',
  'VVv..1222223334..vVV',
  '.VVvv1222233344vvVV.',
  '..Vvv.22233334.vvV..',
  '...v..22233344..v...',
  '......223..344..4...',
  '.....1223..3344..44.',
  '.....2334..3445.....',
], { ...ramp([P.cream, P.amber, P.orange, P.rust, P.wine]), h: P.sand, H: P.clay, L: P.white, e: P.ink, w: P.white, V: P.mulberry, v: P.berry }), darkOf)

/** Spider: a round cave spider, eight jointed legs, two red eyes and pale fangs. */
export const spider = () => outline(spr([
  '.........1222.........',
  '.......11222223.......',
  '......1222222233......',
  '..33..1222222233..33..',
  '.3..3.2222222333.3..3.',
  '3....32rR22rR3333....3',
  '3...3.2222222334.3...3',
  '...3..3w2222w344..3...',
  '..3..3.33333344.3..3..',
  '.3..3...334444...3..3.',
  '3..3.....3444.....3..3',
  '..3.......44.......3..',
], { ...ramp([P.ice, P.sky, P.blue, P.indigo, P.navy]), r: P.rose, R: P.peach, w: P.cloud }), darkOf)

/** Skeleton: a bone soldier with glowing eye sockets, ribs and long arms. */
export const skeleton = () => outline(spr([
  '.....11122......',
  '....1111223.....',
  '....1kk1kk3.....',
  '....1kg1kg3.....',
  '....2112213.....',
  '.....1k1k3......',
  '......233.......',
  '..2111111223....',
  '.2..1k1k12..3...',
  '.2..111112..3...',
  '.3..1k1k12..4...',
  '.3...1112...4...',
  '.11..2222..11...',
  '.....2..3.......',
  '.....2..3.......',
  '.....2..3.......',
  '....12..34......',
], { ...ramp(BONE), k: P.ink, g: P.rose }), darkOf)
