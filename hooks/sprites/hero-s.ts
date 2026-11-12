// task-21, round 2: a 16-bit era hero, 3 to 3.5 heads tall, about 45 to 50 px, drawn on the task-20 raster but with three tones per
// material (shadow, base, light), one shared dark outline, and hand-placed joints (no solver). Legs are two plain tapered limbs with one
// gentle bend; boots are planted. Candidates: S1 upright 3/4, S2 lunge with cloak and ponytail in the wind, S3 true side view with a scarf.
// Nothing in the game imports this file; tools/render_hero_options.ts --s draws it. Every design is original.
import { Raster, ellN, finish32, inPoly, mixc, norm, ramp, spriteOf, colorsOf } from './hero-32bit'
import type { Img32, Ramp, V2 } from './hero-32bit'
export { spriteOf, colorsOf }

export const WS = 84, HS = 64, FOOTS = 61, SOLES = 60, CXS = 36
export type SId = 'S1' | 'S2' | 'S3' | 'F1' | 'F2' | 'F3'
export type LookS = { skin: string; hair: string; accent: string }
const INK = '#1a1222'

const cache = new Map<string, Ramp>()
/** Three tones per material: shadow, base, light, behind one shared dark line. Index 0 line, 1-2 shadow, 3 base, 4-5 light. */
export const R3 = (c: string, o?: { k?: number; sat?: number; cool?: number; warm?: number }): Ramp => {
  const key = c + JSON.stringify(o ?? {}); let v = cache.get(key)
  if (!v) { const r = ramp(c, o); v = [INK, r[2], r[2], r[3], r[4], r[4]]; cache.set(key, v) }
  return v
}
const skin3 = (c: string): Ramp => { const k = 'skin' + c; let v = cache.get(k); if (!v) { const sh = mixc(c, '#8a3a58', 0.36), li = mixc(c, '#fff2dc', 0.34); v = [INK, sh, sh, c, li, li]; cache.set(k, v) } return v }

export type Leg = { hip: V2; knee: V2; ankle: V2 }
export type Arm = { sh: V2; el: V2; hand: V2 }
export type SpecS = {
  id: SId; name: string; side: boolean; front?: boolean; style: 'swept' | 'tail' | 'spiky'
  head: { cx: number; cy: number; rx: number; ry: number }; neck: number
  torso: V2[]; hip: V2; legs: [Leg, Leg]; arms: [Arm, Arm]; wdir: V2
  rad: { thigh: number; shin: number; arm: number; fore: number }
  wind: number; tunic: string; pants: string; boot: string
}
const v = (x: number, y: number): V2 => [x, y]
export const SPECS_S: Record<SId, SpecS> = {
  // S1: the T1 body at 16-bit. Upright, sword raised forward, front knee bent over a planted shin, back leg straight.
  S1: {
    id: 'S1', name: 'UPRIGHT 3/4', side: false, style: 'swept', head: { cx: 1.5, cy: -39.5, rx: 5.3, ry: 5.4 }, neck: -34,
    torso: [v(-1.8, -34), v(4, -34), v(6.8, -32.2), v(6.2, -27.5), v(4.8, -23.5), v(5.4, -19), v(-4.8, -19), v(-4.2, -23.5), v(-5.8, -27.5), v(-6.3, -32.2)], hip: v(0.3, -19),
    legs: [{ hip: v(-2, -19.5), knee: v(-5, -10.5), ankle: v(-8.2, -3.2) }, { hip: v(2.2, -19.5), knee: v(6.8, -11), ankle: v(6.2, -3.2) }],
    arms: [{ sh: v(-5.4, -31), el: v(-8.6, -26.5), hand: v(-8, -22) }, { sh: v(6, -31), el: v(10, -29), hand: v(12, -34.5) }], wdir: v(0.6, -0.8),
    rad: { thigh: 2.7, shin: 2.2, arm: 2.1, fore: 1.9 }, wind: 0.8, tunic: '#3f6fc0', pants: '#5a4030', boot: '#5a4030',
  },
  // S2: T4 energy at 16-bit. A lunge with the sword thrust forward, ponytail and cloak streaming back.
  S2: {
    id: 'S2', name: 'LUNGE IN THE WIND', side: false, style: 'tail', head: { cx: 4, cy: -35.5, rx: 5.3, ry: 5.4 }, neck: -30,
    torso: [v(1.2, -30.4), v(6.6, -30.4), v(9.8, -28.8), v(9, -24.6), v(7, -20.8), v(6.4, -17), v(-3.6, -17), v(-2.6, -21), v(-4.4, -24.8), v(-5.6, -28.8)], hip: v(1.4, -17),
    legs: [{ hip: v(-1.5, -17.5), knee: v(-8.2, -9.6), ankle: v(-14.5, -3.2) }, { hip: v(3.6, -17.5), knee: v(10.4, -10.5), ankle: v(9.4, -3.2) }],
    arms: [{ sh: v(-2.5, -28.4), el: v(-6.2, -24), hand: v(-9.4, -26) }, { sh: v(9, -28.4), el: v(14.4, -27), hand: v(19, -27.6) }], wdir: v(1, -0.1),
    rad: { thigh: 2.7, shin: 2.2, arm: 2.1, fore: 1.9 }, wind: 1.6, tunic: '#7a3a3a', pants: '#3a3040', boot: '#3a2a22',
  },
  // S3: true side view, about 3.3 heads, a wide ready stance, scarf streaming behind, sword forward and up.
  S3: {
    id: 'S3', name: 'SIDE VIEW BATTLE', side: true, style: 'spiky', head: { cx: 2, cy: -38, rx: 6, ry: 5.6 }, neck: -32,
    torso: [v(-1.8, -32.4), v(3.4, -32.4), v(5.4, -30.4), v(5.6, -24.6), v(4.6, -19.4), v(-3.8, -19.4), v(-4.6, -24.6), v(-3.8, -30.4)], hip: v(0.4, -19.4),
    legs: [{ hip: v(-1, -19.8), knee: v(-6, -10.6), ankle: v(-9.5, -3.2) }, { hip: v(2, -19.8), knee: v(7.5, -10.8), ankle: v(7.8, -3.2) }],
    arms: [{ sh: v(-0.6, -29.6), el: v(-5.4, -26.4), hand: v(-5, -21.4) }, { sh: v(2.8, -29.6), el: v(8.2, -27.4), hand: v(12.4, -31.4) }], wdir: v(0.78, -0.62),
    rad: { thigh: 2.9, shin: 2.4, arm: 2.2, fore: 2, }, wind: 1.1, tunic: '#3f6fc0', pants: '#5a4030', boot: '#5a4030',
  },
  // F1 to F3: front view. Everything is symmetric about x = 0.5 (the middle of a pixel column), two straight leg columns with a one pixel gap.
  F1: {
    id: 'F1', name: 'CALM IDLE', side: false, front: true, style: 'swept', head: { cx: 0.5, cy: -39.5, rx: 5.4, ry: 5.5 }, neck: -34,
    torso: [v(-1.7, -34), v(2.7, -34), v(6.9, -32.4), v(6.4, -27.6), v(4.9, -23.6), v(5.7, -19), v(-4.7, -19), v(-3.9, -23.6), v(-5.4, -27.6), v(-5.9, -32.4)], hip: v(0.5, -19),
    legs: [{ hip: v(-2.4, -19.5), knee: v(-2.4, -11.3), ankle: v(-2.5, -3.2) }, { hip: v(3.4, -19.5), knee: v(3.4, -11.3), ankle: v(3.5, -3.2) }],
    arms: [{ sh: v(-5.6, -31), el: v(-7.8, -26.6), hand: v(-8.2, -22.4) }, { sh: v(6.6, -31), el: v(8.8, -26.6), hand: v(9.2, -22.4) }], wdir: v(0.22, -1),
    rad: { thigh: 2.4, shin: 2.1, arm: 2.1, fore: 1.9 }, wind: 0.8, tunic: '#3f6fc0', pants: '#5a4030', boot: '#5a4030',
  },
  F2: {
    id: 'F2', name: 'RAISED, READY TO STRIKE', side: false, front: true, style: 'spiky', head: { cx: 0.5, cy: -39.5, rx: 5.4, ry: 5.5 }, neck: -34,
    torso: [v(-1.7, -34), v(2.7, -34), v(6.9, -32.4), v(6.4, -27.6), v(4.9, -23.6), v(5.7, -19), v(-4.7, -19), v(-3.9, -23.6), v(-5.4, -27.6), v(-5.9, -32.4)], hip: v(0.5, -19),
    legs: [{ hip: v(-2.4, -19.5), knee: v(-2.4, -11.3), ankle: v(-2.5, -3.2) }, { hip: v(3.4, -19.5), knee: v(3.4, -11.3), ankle: v(3.5, -3.2) }],
    arms: [{ sh: v(-5.6, -31), el: v(-8.6, -26.5), hand: v(-6.8, -23.8) }, { sh: v(6.6, -31), el: v(11.6, -30.4), hand: v(13.6, -36.4) }], wdir: v(0.3, -1),
    rad: { thigh: 2.4, shin: 2.1, arm: 2.1, fore: 1.9 }, wind: 1.5, tunic: '#7a3a3a', pants: '#3a3040', boot: '#3a2a22',
  },
  F3: {
    id: 'F3', name: 'CAPE FLARING, SWORD OUT', side: false, front: true, style: 'tail', head: { cx: 0.5, cy: -39.5, rx: 5.4, ry: 5.5 }, neck: -34,
    torso: [v(-1.7, -34), v(2.7, -34), v(6.9, -32.4), v(6.4, -27.6), v(4.9, -23.6), v(5.7, -19), v(-4.7, -19), v(-3.9, -23.6), v(-5.4, -27.6), v(-5.9, -32.4)], hip: v(0.5, -19),
    legs: [{ hip: v(-2.4, -19.5), knee: v(-2.4, -11.3), ankle: v(-2.5, -3.2) }, { hip: v(3.4, -19.5), knee: v(3.4, -11.3), ankle: v(3.5, -3.2) }],
    arms: [{ sh: v(-5.6, -31), el: v(-8.4, -26.8), hand: v(-4.4, -25.6) }, { sh: v(6.6, -31), el: v(11.4, -29), hand: v(15.6, -32.2) }], wdir: v(0.82, -0.57),
    rad: { thigh: 2.4, shin: 2.1, arm: 2.1, fore: 1.9 }, wind: 1.8, tunic: '#2f5a8a', pants: '#3a3a4a', boot: '#4a3426',
  },
}
export const LOOKS_S: Record<SId, LookS> = {
  S1: { skin: '#f2c49b', hair: '#7a4a2a', accent: '#c0392b' },
  S2: { skin: '#e0a878', hair: '#8a2a3a', accent: '#e0902a' },
  S3: { skin: '#e8b48a', hair: '#2a2a40', accent: '#c0392b' },
  F1: { skin: '#f2c49b', hair: '#7a4a2a', accent: '#c0392b' },
  F2: { skin: '#e0a878', hair: '#8a2a3a', accent: '#e0902a' },
  F3: { skin: '#e8b890', hair: '#c8a040', accent: '#c0392b' },
}

export type RigS = {
  spec: SpecS; side: boolean; head: { cx: number; cy: number; rx: number; ry: number; fx: number }; torso: V2[]; tcx: number; neck: number; sh: number; hip: V2
  legs: [Leg, Leg]; arms: [Arm, Arm]; wdir: V2; handR: V2; handL: V2
}
const A = (p: V2): V2 => [CXS + p[0], SOLES + p[1]]
export const rigS = (sp: SpecS): RigS => {
  const h = A([sp.head.cx, sp.head.cy])
  const torso = sp.torso.map(A)
  const xs = torso.map(p => p[0]), shY = Math.min(...torso.map(p => p[1])) + 1.6
  const leg = (l: Leg): Leg => ({ hip: A(l.hip), knee: A(l.knee), ankle: A(l.ankle) })
  const arm = (a: Arm): Arm => ({ sh: A(a.sh), el: A(a.el), hand: A(a.hand) })
  const m = Math.hypot(sp.wdir[0], sp.wdir[1]) || 1
  const arms: [Arm, Arm] = [arm(sp.arms[0]), arm(sp.arms[1])]
  return {
    spec: sp, side: sp.side, head: { cx: h[0], cy: h[1], rx: sp.head.rx, ry: sp.head.ry, fx: h[0] + (sp.front ? 0 : sp.head.rx * 0.22) }, torso, tcx: (Math.min(...xs) + Math.max(...xs)) / 2, neck: A([0, sp.neck])[1], sh: shY, hip: A(sp.hip),
    legs: [leg(sp.legs[0]), leg(sp.legs[1])], arms, wdir: [sp.wdir[0] / m, sp.wdir[1] / m], handR: arms[1].hand, handL: arms[0].hand,
  }
}

export type GearS = {
  name: string; sleeve?: string; legs?: string; boots?: string; cuff?: string; greave?: string; gloves?: string
  back?: (r: Raster, g: RigS) => void; chest?: (r: Raster, g: RigS) => void; over?: (r: Raster, g: RigS) => void
  head?: (r: Raster, g: RigS) => void; hatLine?: boolean; off?: (r: Raster, g: RigS) => void; weapon?: (r: Raster, g: RigS) => void
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const limb = (r: Raster, a: V2, b: V2, ra: number, rb: number, rp: Ramp, max = 3) => r.cap(a[0], a[1], b[0], b[1], ra, rb, rp, { max })

const bootS = (r: Raster, x: number, y: number, boot: Ramp, cuff: Ramp) => {
  r.poly([[x - 2.5, y - 3.8], [x + 2.5, y - 3.8], [x + 2.7, y - 1], [x + 5.8, y + 0.4], [x + 6.1, y + 3.1], [x - 2.9, y + 3.1], [x - 2.9, y - 1]], boot, { bevel: 1.2, cyl: [x, 4], max: 3 })
  r.rect(Math.floor(x - 2.5), Math.floor(y - 3.8), 5, 2, cuff, 3)
}
/** A boot seen from the front, planted, the toe turned a little outward (dir -1 left foot, 1 right foot). */
const bootF = (r: Raster, x: number, y: number, boot: Ramp, cuff: Ramp, dir: number) => {
  const m = (px: number): number => x + (px - x) * dir
  r.poly([[m(x - 2.4), y - 3.8], [m(x + 2.4), y - 3.8], [m(x + 2.4), y - 1], [m(x + 4.6), y + 0.6], [m(x + 4.8), y + 3.1], [m(x - 2.4), y + 3.1]], boot, { bevel: 1, cyl: [x, 4], max: 3 })
  const x0 = Math.floor(Math.min(m(x - 2.4), m(x + 2.4))), x1 = Math.ceil(Math.max(m(x - 2.4), m(x + 2.4)))
  r.rect(x0, Math.floor(y - 3.8), x1 - x0, 2, cuff, 3)
}
const legS = (r: Raster, g: RigS, l: Leg, pants: Ramp, boot: Ramp, cuff: Ramp, greave: Ramp | undefined, dir: number) => {
  const d = g.spec.rad
  if (g.spec.front) {
    // two straight columns: a plain limb with no joint blob; the knee is only a small light mark and a darker row under it
    limb(r, l.hip, l.ankle, d.thigh, d.shin, pants)
    const kx = Math.floor(l.knee[0] + (dir < 0 ? -1 : 0)), ky = Math.floor(l.knee[1])
    if (greave) {
      limb(r, l.knee, l.ankle, d.shin + 0.1, d.shin, greave, 5)
      r.rect(kx - 1, ky - 1, 4, 3, greave, 3); r.tone(kx, ky - 1, greave, 5); r.tone(kx + 1, ky - 1, greave, 5)
      for (let i = -1; i <= 2; i++) r.tone(kx + i, ky + 1, greave, 1)
    } else { r.tone(kx, ky, pants, 5); r.tone(kx + 1, ky, pants, 5); r.tone(kx, ky + 1, pants, 1); r.tone(kx + 1, ky + 1, pants, 1) }
    bootF(r, l.ankle[0], l.ankle[1], boot, cuff, dir)
    return
  }
  limb(r, l.hip, l.knee, d.thigh, d.thigh * 0.86, pants); limb(r, l.knee, l.ankle, d.thigh * 0.86, d.shin, pants)
  if (greave) { limb(r, l.knee, l.ankle, d.shin + 0.9, d.shin + 0.5, greave, 5); r.ell(l.knee[0] + 0.3, l.knee[1], d.thigh * 0.95, d.thigh * 0.9, greave, { max: 5 }) }
  bootS(r, l.ankle[0], l.ankle[1], boot, cuff)
}
const armS = (r: Raster, g: RigS, a: Arm, sleeve: Ramp, glove: Ramp) => {
  const d = g.spec.rad
  limb(r, a.sh, a.el, d.arm, d.arm * 0.9, sleeve); limb(r, a.el, a.hand, d.arm * 0.9, d.fore, sleeve)
  r.ell(a.hand[0] + 0.3, a.hand[1] + 0.2, d.fore * 0.95, d.fore * 0.9, glove, { max: 3 })
}

// ---- head ----
const face3q = (r: Raster, g: RigS, skin: Ramp, hair: Ramp) => {
  const { cx, cy, rx, ry, fx } = g.head
  const inHead = (x: number, y: number) => { const t = (y - cy) / ry, k = t > 0.1 ? 1 - 0.28 * ((t - 0.1) / 0.9) ** 1.5 : 1; return ((x - cx - (t > 0.3 ? (t - 0.3) * 1.1 : 0)) / (rx * k)) ** 2 + t * t <= 1 }
  r.fill([cx - rx, cy - ry, cx + rx + 2, cy + ry], inHead, skin, { n: ellN(cx, cy, rx, ry, 0.8), max: 3, bias: 0.1 })
  const ey = Math.floor(cy + ry * 0.12), L = Math.floor(fx - rx * 0.58), Rx = Math.floor(fx + rx * 0.2)
  for (const ex of [L, Rx]) { r.tone(ex, ey, skin, 0); r.tone(ex, ey + 1, skin, 0) }
  r.tone(L - 1, ey - 2, hair, 1); r.tone(L, ey - 2, hair, 1); r.tone(Rx, ey - 2, hair, 1); r.tone(Rx + 1, ey - 2, hair, 1)
  r.tone(Math.floor(fx + 0.5), ey + 2, skin, 1); r.tone(Math.floor(fx - 0.5), ey + 4, skin, 1); r.tone(Math.floor(fx + 0.5), ey + 4, skin, 1)
}
const faceFront = (r: Raster, g: RigS, skin: Ramp, hair: Ramp) => {
  const { cx, cy, rx, ry } = g.head
  const inHead = (x: number, y: number) => { const t = (y - cy) / ry, k = t > 0.1 ? 1 - 0.3 * ((t - 0.1) / 0.9) ** 1.5 : 1; return ((x - cx) / (rx * k)) ** 2 + t * t <= 1 }
  r.fill([cx - rx - 1, cy - ry, cx + rx + 1, cy + ry], inHead, skin, { n: ellN(cx, cy, rx, ry, 0.8), max: 3, bias: 0.1 })
  const ey = Math.floor(cy + ry * 0.12), L = Math.floor(cx - 3.2), Rx = Math.floor(cx + 2.2)
  for (const ex of [L, Rx]) { r.tone(ex, ey, skin, 0); r.tone(ex, ey + 1, skin, 0) }
  for (const ex of [L - 1, Rx]) { r.tone(ex, ey - 2, hair, 1); r.tone(ex + 1, ey - 2, hair, 1) }
  r.tone(Math.floor(cx), ey + 2, skin, 1); r.tone(Math.floor(cx) - 1, ey + 4, skin, 1); r.tone(Math.floor(cx), ey + 4, skin, 1)
}
const faceSide = (r: Raster, g: RigS, skin: Ramp, hair: Ramp) => {
  const { cx, cy, rx, ry } = g.head
  const inHead = (x: number, y: number) => { const t = (y - cy) / ry, u = (x - cx) / rx, jaw = t > 0.25 ? 1 - 0.34 * ((t - 0.25) / 0.75) ** 1.4 : 1; return (u * u) / (jaw * jaw) + t * t <= 1 && !(u < -0.35 && t > 0.45) }
  r.fill([cx - rx, cy - ry, cx + rx + 3, cy + ry], inHead, skin, { n: ellN(cx - 1, cy, rx, ry, 0.8), max: 3, bias: 0.1 })
  const nx = Math.floor(cx + rx - 0.3), ny = Math.floor(cy + ry * 0.28)
  r.tone(nx + 1, ny, skin, 3); r.tone(nx + 1, ny - 1, skin, 3); r.tone(nx + 1, ny + 1, skin, 1); r.tone(nx, ny + 1, skin, 1)
  const ex = Math.floor(cx + rx * 0.38), ey = Math.floor(cy - ry * 0.08)
  r.tone(ex, ey, skin, 0); r.tone(ex, ey + 1, skin, 0); r.tone(ex - 1, ey - 2, hair, 1); r.tone(ex, ey - 2, hair, 1); r.tone(ex + 1, ey - 2, hair, 1)
  r.tone(Math.floor(cx + rx * 0.45), Math.floor(cy + ry * 0.62), skin, 1); r.tone(Math.floor(cx + rx * 0.45) + 1, Math.floor(cy + ry * 0.62), skin, 1)
  r.ell(cx - rx * 0.1, cy + ry * 0.22, 1.3, 1.8, skin, { max: 3 }); r.tone(Math.floor(cx - rx * 0.1), Math.floor(cy + ry * 0.22), skin, 1)
}
const hairBack = (r: Raster, g: RigS, hair: Ramp) => {
  const { cx, cy, rx, ry } = g.head, s = g.spec
  if (s.style === 'tail') {
    const bx = cx - rx * 0.85, by = cy - ry * 0.5
    r.poly([[bx, by - 2], [bx - 6, by - 3], [bx - 14, by + 1], [bx - 20, by + 7], [bx - 15, by + 5.5], [bx - 10, by + 4], [bx - 5, by + 3], [bx + 1, by + 3]], hair, { bevel: 1, tilt: [0, -0.2] })
    r.poly([[bx - 5, by + 2], [bx - 11, by + 5], [bx - 18, by + 11], [bx - 12, by + 8]], hair, { bevel: 0.8 })
  } else if (s.style === 'swept') r.poly([[cx - rx - 1, cy - 1], [cx - rx - 1.5, cy + ry * 0.9], [cx - rx + 2, cy + ry * 0.6], [cx + rx * 0.3, cy + ry * 0.1]], hair, { n: ellN(cx - 1, cy - 3, rx + 2, ry + 3) })
  else r.poly([[cx - rx - 1.5, cy - 2], [cx - rx - 3, cy + ry * 0.8], [cx - rx + 1, cy + ry * 0.5], [cx, cy]], hair, { n: ellN(cx - 1, cy - 3, rx + 2, ry + 3) })
}
const hairFront = (r: Raster, g: RigS, hair: Ramp, hatLine?: boolean) => {
  const { cx, cy, rx, ry } = g.head, s = g.spec
  const capN = ellN(cx - 1, cy - ry * 0.3, rx + 2, ry + 2)
  const crx = rx * 1.12, cry = ry * 1.14, ccy = cy - ry * 0.26
  const hl = (x: number) => cy - ry * 0.4 + Math.abs((x - cx) / rx) ** 4 * ry * 0.7
  const ytop = (x: number) => ccy - cry * Math.sqrt(Math.max(0, 1 - ((x - cx + 0.5) / crx) ** 2))
  const capIn = (x: number, y: number) => ((x - cx + 0.5) / crx) ** 2 + ((y - ccy) / cry) ** 2 <= 1 && y < hl(x) + (g.side ? (x - cx > 0 ? -ry * 0.25 : ry * 0.45) : 0)
  const tri = (pts: V2[]) => r.poly(pts, hair, { n: capN })
  if (!hatLine) {
    r.fill([cx - crx - 1, ccy - cry - 1, cx + crx + 1, cy + ry * 0.6], capIn, hair, { n: capN })
    if (s.style === 'spiky') for (const [bx, w, dx, ht] of [[cx - 4.5, 3.6, -3.5, 4], [cx - 1, 4.4, -3, 5.4], [cx + 2.5, 4.4, -2, 4.6], [cx + 5.5, 3, -1, 3]] as const) { const y0 = ytop(bx) + 2; tri([[bx - w / 2, y0], [bx + dx, y0 - ht], [bx + w / 2, y0]]) }
    if (s.style === 'swept') { const y0 = ytop(cx + 1) + 2; tri([[cx - 2, y0 + 1], [cx + 3, y0 - 4], [cx + 6.5, y0 + 1]]) }
    if (s.style === 'tail') for (const [bx, w, dx, ht] of [[cx - 3.5, 4, -5, 3.8], [cx + 0.5, 4.4, -4, 3.4], [cx + 4.5, 3.6, -2, 2.6]] as const) { const y0 = ytop(bx) + 2; tri([[bx - w / 2, y0], [bx + dx, y0 - ht], [bx + w / 2, y0]]) }
  }
  const locks: (readonly [number, number, number, number])[] = g.side ? [[cx + 1.2, 3.2, 1.2, 3], [cx + rx * 0.45, 2.8, 1, 2.4]] : [[cx - rx + 0.5, 3.2, -1, 4], [cx - 2.4, 3.2, -0.5, 3.4], [cx + 1, 3.2, 0.5, 3], [cx + rx * 0.55, 2.8, 0.5, 2.6]]
  for (const [x0, w, dx, len] of locks) { const y0 = hl(x0 + w / 2) - 1.6; tri([[x0, y0], [x0 + w, y0], [x0 + w / 2 + dx, y0 + len]]) }
}

// ---- cloak and scarf ----
const cloakF = (r: Raster, g: RigS, rp: Ramp, trim: Ramp, o: { len?: number; trail?: number } = {}) => {
  const sx = g.tcx, top = g.neck, wind = g.spec.wind, hy = g.hip[1], bot = hy + (o.len ?? 12) * wind ** 0.3
  const spL = 8 + (o.trail ?? 7) * wind * 0.8, spR = 7 + (o.trail ?? 7) * wind * 0.35
  const sag = (x: number) => ((spR - (x - sx)) / (spR + spL)) * wind * 1.4
  const pts: V2[] = [[sx - 3.5, top], [sx + 3.5, top], [sx + 7.4, top + 2], [sx + spR + 1, hy + 2], [sx + spR, bot - 1]]
  const N = 7
  for (let i = 0; i <= N; i++) { const x = sx + spR - ((spR + spL) * i) / N; pts.push([x, bot - sag(x) + (i % 2 ? 0.8 : -0.4)]) }
  pts.push([sx - spL - 1, hy + 1], [sx - 7.4, top + 3])
  r.poly(pts, rp, { bevel: 1.4, n: (x, y) => norm(Math.sin((x + y * 0.3) * 0.7) * 0.55 + (x - sx) * 0.02, -0.2, 1), max: 3 })
  r.fill([sx - spL - 3, top, sx + spR + 3, bot + 4], (x, y) => inPoly(pts, x, y) && y > bot - sag(x) - 2.2 && y < bot - sag(x) + 1.4, trim, { tone: 3 })
}
const cloak = (r: Raster, g: RigS, rp: Ramp, trim: Ramp, o: { len?: number; trail?: number } = {}) => {
  if (g.spec.front) { cloakF(r, g, rp, trim, o); return }
  const s = g.spec, sx = g.tcx, top = g.neck, hw = 6.5, wind = s.wind
  const hy = g.hip[1], len = (o.len ?? 9) * wind ** 0.2, trail = (o.trail ?? 7) * wind
  const bot = hy + len, lift = Math.max(0, wind - 1) * 6
  const tipX = sx - hw - 3 - trail, x1 = sx + 1
  const edgeY = (x: number) => { const t = clamp((x1 - x) / (x1 - tipX), 0, 1); return bot - lift * t + Math.sin(x * 1.3) * 0.7 * t }
  const pts: V2[] = [[sx - 2.5, top], [sx + hw * 0.7, top + 2], [sx + 3.5, hy + len * 0.4], [x1, bot]]
  for (let i = 1; i <= 6; i++) { const x = x1 + (tipX - x1) * (i / 6); pts.push([x, edgeY(x) + (i % 2 ? 1 : -0.3)]) }
  pts.push([tipX + 2, top + 4 + (bot - lift - top) * 0.2], [sx - hw - 1, top + 3])
  r.poly(pts, rp, { bevel: 1.5, n: (x, y) => norm(Math.sin((x * 0.55 + y * 0.8) * 0.8) * 0.6 + (x - sx) * 0.02, -0.2, 1), max: 3 })
  r.fill([tipX - 2, top, sx + hw, bot + 4], (x, y) => inPoly(pts, x, y) && y > edgeY(x) - 1.6 && y < edgeY(x) + 0.6, trim, { tone: 3 })
}
const scarf = (r: Raster, g: RigS, rp: Ramp) => {
  const { cx } = g.head, y = g.neck + 0.5, wnd = g.spec.wind
  r.poly([[cx - 3.5, y - 1.5], [cx + 4.5, y - 1.5], [cx + 5, y + 2.5], [cx - 4, y + 2.5]], rp, { bevel: 1, cyl: [cx, 5], max: 3 })
  const pts: V2[] = []
  for (let i = 0; i <= 9; i++) pts.push([cx - 3 - i * 2 * wnd, y - 0.5 + i * 0.5 + Math.sin(i * 0.9) * 1.2])
  for (let i = 9; i >= 0; i--) pts.push([cx - 3 - i * 2 * wnd, y + 2.8 + i * 0.7 + Math.sin(i * 0.9) * 1.2])
  r.poly(pts, rp, { bevel: 1, max: 3 })
}

// ---- the figure ----
export const heroS = (id: SId, gear?: GearS, look?: LookS): Img32 => {
  const sp = SPECS_S[id], lk = look ?? LOOKS_S[id], g = rigS(sp)
  const r = new Raster(WS, HS)
  const skin = skin3(lk.skin), hair = R3(lk.hair, { cool: 265, warm: 30, k: 0.6 }), acc = R3(lk.accent)
  const tunic = R3(sp.tunic), pants = R3(gear?.legs ?? sp.pants), boot = R3(gear?.boots ?? sp.boot), cuff = R3(gear?.cuff ?? '#a07a4a')
  const sleeve = R3(gear?.sleeve ?? sp.tunic), glove = gear?.gloves ? R3(gear.gloves) : skin
  const greave = gear?.greave ? R3(gear.greave) : undefined
  r.layer('back', false)
  gear?.back?.(r, g)
  if (!gear?.back && sp.wind > 1) cloak(r, g, R3('#8a2a3a'), R3('#c8a040'), { len: 7, trail: 7 })
  hairBack(r, g, hair)
  if (id === 'S3' || !gear) scarf(r, g, acc)
  r.layer('l1'); legS(r, g, g.legs[0], pants, boot, cuff, greave, -1)
  r.layer('l2'); legS(r, g, g.legs[1], pants, boot, cuff, greave, 1)
  r.layer('cl'); if (g.side) armS(r, g, g.arms[0], sleeve, glove)
  r.layer('body')
  r.rect(Math.floor(g.head.cx - 1.5), Math.floor(g.neck - 3), 3, 5, skin, 1)
  r.poly(g.torso, tunic, { cyl: [g.tcx, 8], bevel: 1, max: 3 })
  r.clip = (x, y) => inPoly(g.torso, x + 0.5, y + 0.5)
  const belt = R3('#5a3a20'), by = Math.floor(g.hip[1] - 4.5)
  r.fill([g.tcx - 9, by, g.tcx + 10, by + 1], () => true, belt, { tone: 3 })
  if (gear?.chest) { r.layer('body'); gear.chest(r, g) }
  r.clip = undefined
  if (gear?.over) { r.layer('body'); gear.over(r, g) }
  r.layer('cl'); if (!g.side) armS(r, g, g.arms[0], sleeve, glove)
  r.layer('head')
  if (g.spec.front) faceFront(r, g, skin, hair); else if (g.side) faceSide(r, g, skin, hair); else face3q(r, g, skin, hair)
  r.layer('hair'); hairFront(r, g, hair, gear?.hatLine)
  if (gear?.head) { r.layer('hat'); gear.head(r, g) }
  if (gear?.off) { r.layer('off'); gear.off(r, g) }
  r.layer('cr'); armS(r, g, g.arms[1], sleeve, glove)
  if (gear?.weapon) { r.layer('wpn'); gear.weapon(r, g); r.layer('cr'); r.ell(g.handR[0] + 0.3, g.handR[1] + 0.2, sp.rad.fore * 0.95, sp.rad.fore * 0.9, glove, { max: 3 }) }
  return finish32(r, FOOTS)
}

// ---- the Knight set: steel plates, a navy cloak, a red comb crest, a kite shield and a long sword ----
const bladeS = (r: Raster, g: RigS, len: number, steel: Ramp, gold: Ramp) => {
  const u = g.wdir, w: V2 = [-u[1], u[0]], [hx, hy] = g.handR
  const at = (s: number, t: number): V2 => [hx + u[0] * s + w[0] * t, hy + u[1] * s + w[1] * t]
  const q: V2[] = [at(2.5, -1.5), at(2.5, 1.5), at(len - 3, 1.5), at(len, 0), at(len - 3, -1.5)]
  r.poly(q, steel, { bevel: 0.9, tilt: [w[0] * -0.6, w[1] * -0.6], max: 5 })
  const g0 = at(-4, 0), g1 = at(2, 0)
  r.cap(g0[0], g0[1], g1[0], g1[1], 1, 1, R3('#5a4030'))
  const a = at(2.2, -4), b = at(2.2, 4); r.cap(a[0], a[1], b[0], b[1], 1, 1, gold, { max: 5 })
  const p = at(-5, 0); r.ell(p[0], p[1], 1.4, 1.4, gold)
}
export const KNIGHT_S: GearS = {
  name: 'Knight', sleeve: '#3a4258', legs: '#3a4258', boots: '#3a4258', cuff: '#a8b8d0', greave: '#a8b8d0', gloves: '#3a4258', hatLine: true,
  back: (r, g) => cloak(r, g, R3('#2a3f8f'), R3('#e0b040'), { len: 10, trail: 7 }),
  chest: (r, g) => {
    const st = R3('#a8b8d0'), gold = R3('#e0b040')
    r.fill([g.tcx - 12, g.neck - 2, g.tcx + 12, g.hip[1] + 2], () => true, st, { n: x => norm((x - g.tcx) / 9, -0.1, 1) })
    r.line(g.tcx + 0.5, g.neck + 2, g.tcx + 0.5, g.hip[1] - 5, st, 1, 1)
    r.line(g.tcx - 12, g.neck + 1.4, g.tcx + 12, g.neck + 1.4, gold, 4, 1)
    r.line(g.tcx - 12, g.sh + 6, g.tcx + 12, g.sh + 6, st, 1, 1)
  },
  over: (r, g) => {
    const st = R3('#a8b8d0'), gold = R3('#e0b040'), [hx, hy] = g.hip
    if (g.spec.front) {
      // front view: a navy tabard with a gold hem and a gold stripe, steel tassets either side, round shoulder plates
      const navy = R3('#2a3f8f')
      r.poly([[hx - 3.4, hy - 4], [hx + 3.4, hy - 4], [hx + 3.6, hy + 6], [hx, hy + 7.4], [hx - 3.6, hy + 6]], navy, { bevel: 1, max: 3 })
      r.line(hx, hy - 3, hx, hy + 6, gold, 4, 1); r.line(hx - 3.4, hy + 6, hx, hy + 7.2, gold, 4, 1); r.line(hx, hy + 7.2, hx + 3.4, hy + 6, gold, 4, 1)
      for (const s of [-1, 1]) for (const k of [0, 1]) r.poly([[hx + s * (4 + k * 2.2) - 1.6, hy - 2], [hx + s * (4 + k * 2.2) + 1.6, hy - 2], [hx + s * (4 + k * 2.2) + 1.6, hy + 4.4], [hx + s * (4 + k * 2.2) - 1.6, hy + 4.4]], st, { bevel: 0.8, max: 5 })
      for (const p of [g.arms[0].sh, g.arms[1].sh]) { r.ell(p[0], p[1] - 0.8, 3.6, 2.8, st, { max: 5 }); r.line(p[0] - 3, p[1] + 1.6, p[0] + 3, p[1] + 1.6, gold, 4, 1) }
      return
    }
    for (const dx of [-5, -1.2, 2.6]) r.poly([[hx + dx, hy - 2], [hx + dx + 3.8, hy - 2], [hx + dx + 3.6, hy + 4.6], [hx + dx + 0.4, hy + 4.6]], st, { bevel: 1, cyl: [hx + dx + 1.9, 3], max: 5 })
    for (const p of [g.arms[0].sh, g.arms[1].sh]) { r.ell(p[0], p[1] - 0.8, 3.6, 2.8, st, { max: 5 }); r.line(p[0] - 3, p[1] + 1.6, p[0] + 3, p[1] + 1.6, gold, 4, 1) }
  },
  head: (r, g) => {
    const { cx, cy, rx, ry, fx } = g.head, st = R3('#a8b8d0'), red = R3('#c0392b'), brow = cy - ry * 0.3
    if (g.spec.front) {
      // front view: a dome helm with a red fin down the middle, a thin nose bar and a cheek plate either side
      const drx = rx * 1.14, dry = ry * 1.2, dcy = cy - ry * 0.24
      r.fill([cx - drx - 1, dcy - dry - 1, cx + drx + 1, brow + 1], (x, y) => ((x - cx) / drx) ** 2 + ((y - dcy) / dry) ** 2 <= 1 && y < brow, st, { n: ellN(cx - 0.5, dcy, drx, dry) })
      r.fill([cx - drx - 1, brow - 2, cx + drx + 1, brow + 1], (x, y) => y >= brow - 1.4 && y < brow + 0.4 && Math.abs(x - cx) <= drx * Math.sqrt(Math.max(0, 1 - ((y - dcy) / dry) ** 2)) + 0.5, st, { tone: 1 })
      r.poly([[cx - 1.6, brow - 1], [cx + 1.6, brow - 1], [cx + 1.4, dcy - dry - 1], [cx, dcy - dry - 3.6], [cx - 1.4, dcy - dry - 1]], red, { bevel: 0.6, max: 3 })
      for (const s of [-1, 1]) r.poly([[cx + s * (rx * 1.1) - 1.1, brow], [cx + s * (rx * 1.1) + 1.1, brow], [cx + s * (rx * 1.0) + 1, cy + ry * 0.7], [cx + s * (rx * 1.0) - 1, cy + ry * 0.7]], st, { bevel: 0.6 })
      r.rect(Math.floor(cx), Math.floor(brow), 1, Math.max(3, Math.round(ry * 0.8)), st, 1)
      return
    }
    const drx = rx * 1.14, dry = ry * 1.2, dcy = cy - ry * 0.24
    r.fill([cx - drx - 1, dcy - dry - 1, cx + drx + 1, brow + 1], (x, y) => ((x - cx + 0.3) / drx) ** 2 + ((y - dcy) / dry) ** 2 <= 1 && y < brow, st, { n: ellN(cx - 0.5, dcy, drx, dry) })
    r.fill([cx - drx - 1, brow - 2, cx + drx + 1, brow + 1], (x, y) => y >= brow - 1.4 && y < brow + 0.4 && Math.abs(x - cx + 0.3) <= drx * Math.sqrt(Math.max(0, 1 - ((y - dcy) / dry) ** 2)) + 0.5, st, { tone: 1 })
    const top = dcy - dry
    r.poly([[cx - rx * 1.1, brow - 2], [cx - rx * 0.8, top - 2], [cx - rx * 0.1, top - 3.6], [cx + rx * 0.6, top - 1.6], [cx + rx * 0.5, top + 1], [cx - rx * 0.4, top - 0.4]], red, { bevel: 0.8, max: 3 })
    r.poly([[cx - rx * 1.15, brow], [cx - rx * 1.2, cy + ry * 0.8], [cx - rx * 0.4, cy + ry * 0.7], [cx - rx * 0.55, brow]], st, { bevel: 0.8 })
    r.rect(Math.floor(fx + 0.1), Math.floor(brow), 1, Math.max(3, Math.round(ry * 0.8)), st, 1)
  },
  off: (r, g) => {
    const [x, y] = g.handL, rr = 4.6, st = R3('#a8b8d0'), navy = R3('#2a3f8f'), gold = R3('#e0b040')
    const inK = (px: number, py: number, i: number) => py >= y - rr + i && py <= y + rr * 1.5 - i * 0.5 && Math.abs(px - x) <= (rr - i) * (py < y + rr * 0.1 ? 1 : 1 - ((py - y - rr * 0.1) / (rr * 1.4)) ** 1.3)
    const box: [number, number, number, number] = [x - rr - 1, y - rr, x + rr + 1, y + rr * 1.5]
    r.fill(box, (px, py) => inK(px, py, 0), st, { tone: 3 }); r.fill(box, (px, py) => inK(px, py, 1.1), navy, { n: px => norm((px - x) / rr, -0.3, 1) })
    r.line(x - 2.6, y + 0.2, x, y - 2, gold, 4, 1); r.line(x, y - 2, x + 2.6, y + 0.2, gold, 4, 1)
  },
  weapon: (r, g) => bladeS(r, g, 24, R3('#a8b8d0'), R3('#e0b040')),
}
export const GEAR_S: GearS[] = [KNIGHT_S]
