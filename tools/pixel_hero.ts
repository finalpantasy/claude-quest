// The task-24 hero: the same original adventurer as task-23 (front view, brown hair, blue tunic, red cape, round shield on the
// viewer's left, sword raised mid-swing on the right), painted as pixels. One design in unit space, two resolutions (res 1 hi-res,
// res 0.5 chunky). Never a crab: two straight legs, head 15 units of 82.
import { Cv, capsuleM, ellipseM, polyM, ramp, mixc, rectM, rrectM, union, minus, both, lighten, darken } from './pixel_kit'
import type { Mask, Pt, Ramp } from './pixel_kit'

export type Look = {
  name: 'hd' | 'cozy'
  skin: string; hair: string; tunic: string; trim: string; belt: string; gold: string; pants: string; boots: string; cape: string; steel: string; wood: string; shieldFace: string; ink: string
  /** ramp tuning: how far shadows and lights lean */
  cool: number; warm: number; k: number
  light: Pt
  /** rim light colour and strength (0 = none) */
  rimCol: string; rim: number
  outline: number; outlineLit: number
}
export const HD: Look = {
  name: 'hd', skin: '#e9ac84', hair: '#6a3d22', tunic: '#3e66c4', trim: '#f0dfae', belt: '#6e4426', gold: '#e6b94a', pants: '#5d4f6e', boots: '#4a2c1c', cape: '#b8343c', steel: '#c4cde0', wood: '#8a5a34', shieldFace: '#9a6a3c', ink: '#1c1226',
  cool: 255, warm: 40, k: 1.12, light: [0.5, -0.85], rimCol: '#ffd89a', rim: 0.55, outline: 0.5, outlineLit: 0.2,
}
export const COZY: Look = {
  name: 'cozy', skin: '#ffc08f', hair: '#8a4a22', tunic: '#3f7ee8', trim: '#fff2c0', belt: '#8a5226', gold: '#ffd23f', pants: '#7a58b8', boots: '#6a3a22', cape: '#ee4a4a', steel: '#d6e0f2', wood: '#a8683a', shieldFace: '#c8803e', ink: '#2e1a2e',
  cool: 265, warm: 50, k: 1.05, light: [-0.55, -0.83], rimCol: '#ffffff', rim: 0, outline: 0.78, outlineLit: 0.66,
}

export const SWING = 66 // degrees from straight up, clockwise: the paused frame
export const HERO = { height: 81.8 }

export type HeroOut = { cv: Cv; ox: number; oy: number; head: { top: number; chin: number } }

/** Paint the hero. The canvas origin is at design (-36, -95); design (0,0) is the middle of the feet line. */
export const hero = (look: Look, res: 1 | 0.5, swing = SWING): HeroOut => {
  const OX = 38, OY = 96
  const cv = new Cv(Math.ceil((OX + 82) * res), Math.ceil((OY + 3) * res), res, OX * res, OY * res)
  const R = (c: string, o: { k?: number } = {}) => ramp(c, { cool: look.cool, warm: look.warm, k: look.k * (o.k ?? 1) })
  const L = look.light
  const sk = look.skin
  const skin: Ramp = [mixc(sk, '#3a1a24', 0.62), mixc(sk, '#8a4a5a', 0.42), mixc(sk, '#c47a6c', 0.22), sk, mixc(sk, '#fff0d8', 0.3), mixc(sk, '#ffffff', 0.55)]
  const hair = R(look.hair), tunic = R(look.tunic), trim = R(look.trim, { k: 0.7 }), belt = R(look.belt), gold = R(look.gold), pants = R(look.pants), boots = R(look.boots)
  const cape = R(look.cape), steel = R(look.steel, { k: 1.15 }), wood = R(look.wood), shield = R(look.shieldFace)
  const hi = res === 1
  const P = (m: Mask, rp: Ramp, o = {}) => cv.paint(m, rp, { light: L, ...o })

  // cape, behind everything: straight hanging edges, a scalloped hem
  const capeM = polyM([[-11, -63], [11, -63], [16.5, -40], [17, -21], [12.5, -19], [9, -22], [5.5, -18.5], [1.5, -22], [-3, -18.5], [-7, -22], [-12, -19], [-17, -21], [-16.5, -40]])
  P(capeM, cape, { hl: false, max: 3 })

  // legs: two straight columns, feet planted a little apart and turned slightly out
  const legL = rectM(-9.4, -33, -1.8, -9), legR = rectM(1.8, -33, 9.4, -9)
  P(legL, pants); P(legR, pants)
  const bootL = union(rectM(-9.6, -12, -1.6, -4), polyM([[-9.6, -4.5], [-1.6, -4.5], [-1.6, -1.5], [-3, 0], [-11.4, 0], [-12.6, -1.6], [-10.5, -4.5]]))
  const bootR = union(rectM(1.6, -12, 9.6, -4), polyM([[1.6, -4.5], [9.6, -4.5], [10.5, -4.5], [12.6, -1.6], [11.4, 0], [3, 0], [1.6, -1.5]]))
  P(bootL, boots, { hl: false }); P(bootR, boots, { hl: false })
  const cuffs = union(rectM(-9.8, -12.4, -1.4, -9.8), rectM(1.4, -12.4, 9.8, -9.8))
  P(cuffs, trim, { flat: 3 })
  // soles
  P(union(rectM(-12.4, -0.9, -2.6, 0), rectM(2.6, -0.9, 12.4, 0)), boots, { flat: 1 })

  // torso: tunic with rounded shoulders, a darker cloth hem, collar, belt
  const torso = union(polyM([[-12.3, -61.5], [12.3, -61.5], [11, -52], [9.8, -41], [10.6, -31], [-10.6, -31], [-9.8, -41], [-11, -52]]), ellipseM(-10.5, -59.5, 4.6, 3.6), ellipseM(10.5, -59.5, 4.6, 3.6))
  P(torso, tunic, { hl: false })
  P(polyM([[-10.1, -34.2], [10.1, -34.2], [10.5, -31.3], [-10.5, -31.3]]), tunic, { flat: 2 })
  // belt and buckle
  P(rectM(-10, -42.2, 10, -38.6), belt, { flat: 3 })
  P(rectM(-2.4, -42.8, 2.4, -38), gold, { hl: true })
  // collar: a V of cream
  P(polyM([[-5, -64.6], [-1.4, -64.6], [0, -58.6], [1.4, -64.6], [5, -64.6], [0, -55.6]]), trim, { flat: 3 })

  // neck and head
  P(rectM(-2.6, -68, 2.6, -62.6), skin, { flat: 2 })
  const headM = ellipseM(0, -73.5, 6.2, 7)
  P(headM, skin, { hl: false, bias: 0.12 })
  // ears
  P(union(ellipseM(-6.2, -73, 1.2, 1.7), ellipseM(6.2, -73, 1.2, 1.7)), skin, { flat: 3 })
  // hair: a cap over the head with a swept fringe, short at the sides
  const fringe = (x: number) => (x < -4 ? -73.4 : x < 0 ? -75.4 + (x + 4) * -0.15 : x < 3 ? -76.4 + x * 0.5 : -74.4 + (x - 3) * 0.9)
  const hairM: Mask = (x, y) => (ellipseM(0, -74, 6.9, 7.7)(x, y) && y < fringe(x)) || (Math.abs(x) > 5 && Math.abs(x) < 6.9 && y > -77 && y < -71.6 && headM(x * 0.96, y))
  P(hairM, hair, { hl: true, light: L })

  // face details, by pixel so they stay crisp at both resolutions
  const ey = (y: number) => cv.py(y)
  const eye = R('#1c1230', { k: 0.6 })
  const ex0 = Math.round(cv.ox - 4 * res), ex1 = Math.round(cv.ox + 2 * res), cx0 = Math.round(cv.ox)
  if (hi) {
    for (const x of [ex0, ex1]) {
      const y = ey(-72.4)
      cv.rect(x, y, 2, 2, '#f8f2e6'); cv.rect(x + (x === ex0 ? 1 : 0), y, 1, 2, eye[3]); cv.set(x + (x === ex0 ? 1 : 0), y, eye[1])
      cv.rect(x, y - 2, 2, 1, mixc(look.hair, look.skin, 0.2)) // brow
    }
    cv.set(cx0, ey(-70.2), mixc(look.skin, '#a05a3c', 0.5)) // nose
    cv.rect(cx0 - 1, ey(-68.4), 2, 1, mixc(look.skin, '#c0504a', 0.75)) // mouth
    cv.set(ex0 - 1, ey(-70.4), mixc(look.skin, '#ff8a8a', 0.5)); cv.set(ex1 + 2, ey(-70.4), mixc(look.skin, '#ff8a8a', 0.5))
  } else {
    cv.set(ex0, ey(-72.4), eye[2]); cv.set(ex1, ey(-72.4), eye[2])
    cv.rect(cx0 - 1, ey(-68.6), 2, 1, mixc(look.skin, '#c0504a', 0.6))
  }

  // shield arm: a short arm angled across the body; the round shield sits in front of the left hip
  P(capsuleM(-12, -59, -17, -50.5, 2.9), tunic, { hl: false })
  const shM = ellipseM(-18.8, -48, 9.2, 9.2)
  P(shM, shield, { hl: false })
  P(minus(shM, ellipseM(-18.8, -48, 7, 7)), steel, { hl: false })
  P(ellipseM(-18.8, -48, 3.3, 3.3), R(look.cape), { hl: true })
  P(ellipseM(-18.8, -48, 1.2, 1.2), gold, { flat: 5 })
  // shield spokes (wood grain)
  if (hi) for (const a of [0, 60, 120]) { const r = (a * Math.PI) / 180; cv.line(cv.px(-18.8 - Math.cos(r) * 6.4), cv.py(-48 - Math.sin(r) * 6.4), cv.px(-18.8 + Math.cos(r) * 6.4), cv.py(-48 + Math.sin(r) * 6.4), shield[2]) }
  P(ellipseM(-18.8, -48, 3.3, 3.3), R(look.cape), { hl: true })
  P(ellipseM(-18.8, -48, 1.2, 1.2), gold, { flat: 5 })

  // sword arm: shoulder out to the elbow, forearm up to the fist
  const hand: Pt = [28, -68.3]
  P(capsuleM(11.5, -59.5, 24, -58, 3.2), tunic, { hl: false })
  P(capsuleM(24, -58, 27.2, -66.4, 2.9), tunic, { hl: false })
  P(capsuleM(26.6, -64, 28, -66.6, 2.1), skin, { flat: 3 })
  // the sword in its swing: direction d from the fist, blade 40 units
  const th = (swing * Math.PI) / 180
  const d: Pt = [Math.sin(th), -Math.cos(th)], nrm: Pt = [Math.cos(th), Math.sin(th)]
  const at = (t: number, s = 0): Pt => [hand[0] + d[0] * t + nrm[0] * s, hand[1] + d[1] * t + nrm[1] * s]
  P(capsuleM(...at(-3.2), ...at(3.6), 1.15), wood, { hl: false })
  P(capsuleM(...at(4.2, -5.8), ...at(4.2, 5.8), 1.5), gold, { hl: true })
  P(ellipseM(...at(-4.4), 1.6, 1.6), gold, { hl: true })
  const bladeM = polyM([at(5.4, -2.5), at(5.4, 2.5), at(35, 2.2), at(41.5, 0), at(35, -2.2)])
  P(bladeM, steel, { hl: true, bias: 0.12 })
  // fuller: a dark groove down the blade, a bright edge beside it
  const fuller = capsuleM(...at(8), ...at(33), hi ? 0.5 : 0.25)
  P(both(fuller, bladeM), steel, { flat: 2 })
  // wrist cuff, belt pouch, tunic folds (hi-res only)
  P(capsuleM(24.6, -61.5, 26.2, -65, 3.3), trim, { flat: 3 })
  P(rectM(6.4, -41, 9.8, -34.6), belt, { hl: false })
  if (hi) { cv.line(cv.px(-6), cv.py(-58), cv.px(-4.6), cv.py(-47), tunic[2]); cv.line(cv.px(4), cv.py(-56), cv.px(5.4), cv.py(-46), tunic[2]); cv.line(cv.px(-2), cv.py(-50), cv.px(-1.2), cv.py(-44), tunic[2]) }
  // fist over the grip
  P(ellipseM(hand[0], hand[1], 2.6, 2.6), skin, { hl: false })
  P(capsuleM(...at(-1.6, -1.8), ...at(1.8, -1.8), 1.1), skin, { flat: 2 })

  // soft contact shadows: shield on the torso, head on the collar, arm on the tunic
  cv.shadow(shM, 1, 1, '#14264a', 0.38)

  // outline and rim light
  if (look.rim > 0) cv.rim(look.rimCol, [1, -1], look.rim)
  cv.outline(look.ink, look.outline, [-look.light[0], -look.light[1]], look.outlineLit)
  return { cv, ox: OX, oy: OY, head: { top: -81.8, chin: -66.7 } }
}

/** The swing trail: a stepped arc behind the blade tip in light colours, drawn into its own canvas (design units, same origin). */
export const trail = (look: Look, res: 1 | 0.5, swing = SWING): Cv => {
  const OX = 38, OY = 96
  const cv = new Cv(Math.ceil((OX + 82) * res), Math.ceil((OY + 3) * res), res, OX * res, OY * res)
  const hand: Pt = [28, -68.3]
  const core = look.name === 'hd' ? '#fff4d0' : '#ffffff', edge = look.name === 'hd' ? '#ffcf86' : '#bfe8ff'
  for (const [rr, a0, a1, c, t] of [[42, 24, 49, core, 1], [37, 28, 47, edge, 1], [46, 30, 46, edge, 1]] as [number, number, number, string, number][]) {
    let prev: Pt | undefined
    for (let a = swing - a1; a <= swing - a0; a += 1.2) {
      const th = (a * Math.PI) / 180
      const x = cv.px(hand[0] + Math.sin(th) * rr), y = cv.py(hand[1] - Math.cos(th) * rr)
      if (prev) cv.line(prev[0], prev[1], x, y, c, Math.max(1, t)); prev = [x, y]
    }
  }
  return cv
}
void rrectM; void lighten; void darken
