// Phantom Package as a pixel creature: a cardboard box with a face and a ghost tail. The rare one is gold with red eyes and a crown,
// the boss is the same box twice the size with bull horns. One design in unit space (feet y 0, centre x 0), rasterized at res 1 or 0.5.
import { Cv, capsuleM, ellipseM, polyM, ramp, mixc, rectM, rrectM, union, minus } from './pixel_kit'
import type { Mask, Pt, Ramp } from './pixel_kit'
import type { Look } from './pixel_hero'

export type FoeKind = 'norm' | 'rare' | 'boss'
export type FoeOut = { cv: Cv; ox: number; oy: number }

export const foe = (look: Look, res: 1 | 0.5, kind: FoeKind): FoeOut => {
  const sc = kind === 'boss' ? 1.4 : 1
  const half = Math.ceil((kind === 'boss' ? 52 : 40) * (kind === 'boss' ? 1 : 1)), up = kind === 'boss' ? 118 : kind === 'rare' ? 94 : 76
  const OX = half, OY = up + 2
  const cv = new Cv(Math.ceil(OX * 2 * res), Math.ceil((OY + 4) * res), res, OX * res, OY * res)
  const hd = look.name === 'hd'
  const R = (c: string, k = 1) => ramp(c, { cool: look.cool, warm: look.warm, k: look.k * k })
  const rare = kind === 'rare'
  const card = R(rare ? (hd ? '#e8b83a' : '#ffd84a') : hd ? '#c28a52' : '#e0a25a')
  const flap = R(rare ? (hd ? '#f3d060' : '#ffe680') : hd ? '#d6a064' : '#f0be76')
  const tape = R(rare ? '#fff2b8' : hd ? '#e2cf98' : '#f6e4ae', 0.6)
  const ghost = R(hd ? '#8672d6' : '#a58cff')
  const white = R('#fff8ee', 0.5)
  const L = look.light
  const T = (m: Mask): Mask => (x, y) => m(x / sc, y / sc)
  const P = (m: Mask, rp: Ramp, o = {}) => cv.paint(T(m), rp, { light: L, ...o })
  const px = (x: number) => Math.round(x * sc * res + cv.ox), py = (y: number) => Math.round(y * sc * res + cv.oy)

  // ghost tail: wavy hem with two drips, wider than the box at the top
  const tail: Pt[] = [[-17, -24], [17, -24], [18.5, -14], [15, -8], [12.5, -2.5], [9, -1], [8, -6], [4.5, -9], [1, -3], [-3, 0.5], [-7, -5], [-10, -9], [-14, -4], [-18, -12]]
  P(polyM(tail), ghost, { hl: true })
  // flaps: two open lids tipped outward like ears, then the box
  P(polyM([[-21, -50], [-33, -64], [-14, -60], [-7, -50]]), flap, { hl: false })
  P(polyM([[21, -50], [33, -64], [14, -60], [7, -50]]), flap, { hl: false })
  P(rrectM(-20.5, -52, 20.5, -21, 4), card, { hl: false })
  // the shaded underside and the packing tape down the middle
  P(rectM(-4.2, -52, 4.2, -21), tape, { hl: false, light: [-0.2, -0.95] })
  // tape seams
  if (res === 1) for (const x of [-4.2, 4.2]) cv.line(px(x), py(-51), px(x), py(-22), mixc(card[3], '#3a2418', 0.4))
  // label sticker, lower left
  P(rectM(-17, -29, -9, -22.5), R('#fff6dc', 0.5), { flat: 4 })
  if (res === 1) { cv.line(px(-16), py(-27.2), px(-10), py(-27.2), '#a84a3a'); cv.line(px(-16), py(-25), px(-12), py(-25), '#7a6a5a') }

  // eyes: white with a dark ring, a pupil looking at the hero, a glint
  const ink = look.ink
  const eyeCol = rare ? '#d82a2a' : look.name === 'hd' ? '#241632' : '#2e1a36'
  for (const sx of [-1, 1]) {
    const cx = sx * 10.2, cy = -38.5
    const lo = res < 1
    P(ellipseM(cx, cy, lo ? 6.6 : 7.4, lo ? 7.6 : 8.2), ramp(ink, { k: 0.5 }), { flat: 3 })
    P(ellipseM(cx, cy, lo ? 4.8 : 6, lo ? 5.8 : 6.9), white, { hl: false })
    P(ellipseM(cx - sx * 1.8, cy + 0.6, lo ? 2.6 : 3.5, lo ? 3.4 : 4), ramp(eyeCol, { k: 0.8 }), { flat: 3 })
    cv.set(px(cx - sx * 1.8) - (lo ? 0 : 1), py(cy - 1.4), '#ffffff')
    if (res === 1) cv.set(px(cx - sx * 1.8), py(cy + 2.6), mixc(eyeCol, '#ffffff', 0.35))
  }
  // angry brows (the box is cross, in a friendly way)
  const brow = look.ink
  cv.line(px(-18), py(-49.5), px(-5), py(-44.6), brow, res === 1 ? 2 : 1)
  cv.line(px(18), py(-49.5), px(5), py(-44.6), brow, res === 1 ? 2 : 1)
  // mouth: a wide grin with two little fangs
  P(polyM([[-9, -29.5], [9, -29.5], [6.5, -24], [0, -22.4], [-6.5, -24]]), ramp(ink, { k: 0.5 }), { flat: 3 })
  P(polyM([[-6.4, -29.2], [-3.4, -29.2], [-4.9, -25.6]]), white, { flat: 4 })
  P(polyM([[3.4, -29.2], [6.4, -29.2], [4.9, -25.6]]), white, { flat: 4 })
  if (rare) {
    // crown: three points with gems
    const crown = R('#ff9a2a')
    P(polyM([[-13, -60], [-16, -77], [-7.5, -68], [0, -80], [7.5, -68], [16, -77], [13, -60]]), crown, { hl: true })
    P(rectM(-13.4, -62.4, 13.4, -58.6), R('#ffc23a'), { hl: true })
    cv.set(px(0), py(-66), '#ff4a8a'); cv.set(px(-8), py(-63), '#5ad1ff'); cv.set(px(8), py(-63), '#6aff9a')
    if (res === 1) for (const [x, y, c] of [[0, -66, '#ff4a8a'], [-8, -63, '#5ad1ff'], [8, -63, '#6aff9a']] as [number, number, string][]) { cv.set(px(x) + 1, py(y), c); cv.set(px(x), py(y) + 1, c); cv.set(px(x) + 1, py(y) + 1, c) }
  }
  if (kind === 'boss') {
    // bull horns on the lids, curved up and in
    const horn = R('#f6ecd0', 0.7)
    P(polyM([[-19, -54], [-29, -60], [-33, -72], [-30, -80], [-26, -70], [-21, -64], [-13, -58]]), horn, { hl: true })
    P(polyM([[19, -54], [29, -60], [33, -72], [30, -80], [26, -70], [21, -64], [13, -58]]), horn, { hl: true })
    // scuff marks and a rivet row to say this one is huge
    if (res === 1) for (let i = -4; i <= 4; i++) { cv.set(px(i * 4.4), py(-21.2), mixc(card[2], '#2a1a14', 0.4)) }
  }
  cv.outline(look.ink, look.outline, [-look.light[0], -look.light[1]], look.outlineLit)
  if (look.rim > 0) cv.rim(look.rimCol, [1, -1], look.rim * 0.8)
  void capsuleM; void union; void minus
  return { cv, ox: OX, oy: OY }
}
