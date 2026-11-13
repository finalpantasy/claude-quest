// task-21: Final Fantasy era proportions at 32-bit detail. Four original heroes (T1 tactics, T2 battle sprite, T3 heroic, T4 stride)
// built on the task-20 raster (hero-32bit.ts): shaded shapes lit from the upper left, hue-shifted ramps, a selective outline. The body is
// a jointed figure (two-bone legs and arms solved from foot and hand targets), so every pose keeps its proportions. Nothing in the game
// imports this file; tools/render_hero_options.ts --ff draws it. Every design here is original: no character, job outfit or sprite from
// any game. One cell is one screen pixel at band size.
import { LEATHER, Raster, R, STEEL, GOLD, WOOD, blade, dot, ellN, finish32, inPoly, inRound, mixc, norm, shieldShape, skinRamp, spriteOf, starAt, unit } from './hero-32bit'
import type { Img32, Paint, Ramp, Rig32, V2 } from './hero-32bit'

export const WFF = 100, HFF = 80, FOOTFF = 76, SOLE = 75, CXFF = 42
export type FFId = 'T1' | 'T2' | 'T3' | 'T4'
export type PoseFF = 'attack' | 'sit'
export type LookFF = { skin: string; hair: string; eyes: string; accent: string }
export { spriteOf }

/** The body of one proportion study. Lengths are cells (screen pixels at band size). */
export type SpecFF = {
  id: FFId; name: string; side: boolean; style: 'swept' | 'spiky' | 'mane' | 'tail'
  /** head: face ellipse radii, hair rise above it, how far it leans ahead of the shoulders */
  hrx: number; hry: number; rise: number; fwd: number; neckW: number
  /** torso: hip to shoulder line, shoulder, chest, waist and hip half widths */
  tl: number; sw: number; chest: number; waistW: number; hipW: number
  /** legs and arms: hip to sole, limb radii, upper arm and forearm lengths */
  leg: number; thigh: number; calf: number; ua: number; fa: number; armR: number; foreR: number
  /** attack pose: hips drop, lean, front and back ankle offsets from the hip, hand offsets from each shoulder, weapon direction */
  wind: number; bend: number; drop: number; lean: number; fFoot: number; bFoot: number; wHand: V2; oHand: V2; wdir: V2; sitLean: number
  tunic: string; pants: string; boot: string
}
export const SPECS: Record<FFId, SpecFF> = {
  T1: { id: 'T1', name: 'TACTICS', side: false, style: 'swept', hrx: 5.6, hry: 6.1, rise: 2.8, fwd: 1.2, neckW: 2.2, tl: 14.5, sw: 7, chest: 6.1, waistW: 4.5, hipW: 5.5, leg: 28, thigh: 3.1, calf: 2.4, ua: 10, fa: 9.5, armR: 2.4, foreR: 2, wind: 1, bend: 1.2, drop: 1, lean: 1.2, fFoot: 7.5, bFoot: -6.5, wHand: [10, -3], oHand: [-2, 9], wdir: [0.72, -0.7], sitLean: 1, tunic: '#3f6fc0', pants: '#4a3a2c', boot: '#6b4526' },
  T2: { id: 'T2', name: 'BATTLE SPRITE', side: true, style: 'spiky', hrx: 7.4, hry: 7.4, rise: 3, fwd: 1.5, neckW: 2.6, tl: 15.5, sw: 5.2, chest: 5.6, waistW: 4.8, hipW: 5, leg: 22, thigh: 3.7, calf: 3, ua: 9, fa: 8.5, armR: 2.9, foreR: 2.5, wind: 0.9, bend: 2.2, drop: 2.5, lean: 3, fFoot: 8, bFoot: -7, wHand: [9, -3], oHand: [-5, 6], wdir: [1, -0.6], sitLean: 1.5, tunic: '#3f6fc0', pants: '#4a3a2c', boot: '#6b4526' },
  T3: { id: 'T3', name: 'HEROIC', side: false, style: 'mane', hrx: 5, hry: 5.4, rise: 2.5, fwd: 1.1, neckW: 2.2, tl: 16, sw: 8.2, chest: 7, waistW: 4.7, hipW: 5.7, leg: 31, thigh: 3.3, calf: 2.5, ua: 11, fa: 10, armR: 2.6, foreR: 2.1, wind: 1.6, bend: 1.2, drop: 1.5, lean: 1, fFoot: 8.5, bFoot: -8.5, wHand: [10, -4], oHand: [-9, 3], wdir: [0.85, -0.5], sitLean: 1, tunic: '#2f5a8a', pants: '#3a3a4a', boot: '#4a3426' },
  T4: { id: 'T4', name: 'STRIDE', side: false, style: 'tail', hrx: 6, hry: 6.4, rise: 3, fwd: 1.6, neckW: 2.3, tl: 14, sw: 7.4, chest: 6.4, waistW: 4.5, hipW: 5.5, leg: 28, thigh: 3.2, calf: 2.5, ua: 9.5, fa: 9, armR: 2.5, foreR: 2.1, wind: 2, bend: 2.4, drop: 4, lean: 3.2, fFoot: 12, bFoot: -11, wHand: [13, 0], oHand: [-9, 5], wdir: [1, -0.12], sitLean: 1.5, tunic: '#7a3a3a', pants: '#3a3040', boot: '#3a2a22' },
}
export const LOOKS_FF: Record<FFId, LookFF> = {
  T1: { skin: '#f2c49b', hair: '#7a4a2a', eyes: '#3a7ad8', accent: '#d0342c' },
  T2: { skin: '#e8b48a', hair: '#2a2a40', eyes: '#3aa0a0', accent: '#2fa8c8' },
  T3: { skin: '#e8b890', hair: '#c8a040', eyes: '#3a6ad0', accent: '#2a7ad8' },
  T4: { skin: '#dba274', hair: '#8a2a3a', eyes: '#8a5a2a', accent: '#e0902a' },
}

export type Leg = { hip: V2; knee: V2; ankle: V2 }
export type RigFF = Rig32 & { spec: SpecFF; side: boolean; wdir: V2; elbowL: V2; elbowR: V2; legs: [Leg, Leg]; hipC: V2; sh: number; chin: number; sit: boolean; scale: number }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
/** Two-bone solve: the joint between a and b with segments l1 and l2, on the side `pick` scores higher. */
const ik = (a: V2, b: V2, l1: number, l2: number, pick: (p: V2) => number): { joint: V2; end: V2 } => {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, dd = Math.min(d, l1 + l2 - 0.05)
  const ux = dx / d, uy = dy / d, a1 = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, l1 * l1 - a1 * a1))
  const px = a[0] + ux * a1, py = a[1] + uy * a1
  const c1: V2 = [px - uy * h, py + ux * h], c2: V2 = [px + uy * h, py - ux * h]
  return { joint: pick(c1) >= pick(c2) ? c1 : c2, end: [a[0] + ux * dd, a[1] + uy * dd] }
}

export const rigFF = (s: SpecFF, pose: PoseFF): RigFF => {
  const sit = pose === 'sit', scale = (s.leg + s.tl) / 45
  const hipY = sit ? SOLE - s.thigh * 2.5 : SOLE - s.leg + s.drop
  const hx = CXFF + (sit ? -3 : 0)
  const lean = sit ? s.sitLean : s.lean
  const shY = hipY - s.tl, sx = hx + lean
  const neckY = shY - 1.2, chin = neckY - 0.6
  const hcy = chin - s.hry + 0.6, hcx = sx + s.fwd
  const waistY = hipY - s.tl * 0.4
  const cxAt = (y: number) => hx + (sx - hx) * clamp((hipY - y) / (hipY - shY), 0, 1)
  const bk = s.side ? 0.78 : 1, fr = s.side ? 1.12 : 1
  const torso: [number, number][] = [
    [sx - s.neckW, neckY], [sx + s.neckW, neckY], [sx + s.sw * fr, shY + 0.6], [cxAt(shY + 4) + s.chest * fr, shY + 4], [cxAt(waistY) + s.waistW * fr, waistY], [hx + s.hipW * fr, hipY + 1],
    [hx - s.hipW * bk, hipY + 1], [cxAt(waistY) - s.waistW * bk, waistY], [cxAt(shY + 4) - s.chest * bk, shY + 4], [sx - s.sw * bk, shY + 0.6],
  ]
  const shL: V2 = s.side ? [sx - 0.5, shY + 2] : [sx - s.sw + 0.6, shY + 1.8], shR: V2 = s.side ? [sx + 1.2, shY + 2.2] : [sx + s.sw - 0.6, shY + 1.8]
  let legs: [Leg, Leg]
  const ankleY = SOLE - 3.2
  if (!sit) {
    const mk = (hipX: number, ax: number): Leg => {
      const hip: V2 = [hipX, hipY], L2 = Math.hypot(ax - hipX, ankleY - hipY) / 2 + s.bend, r = ik(hip, [ax, ankleY], L2, L2, p => p[0] - Math.abs(p[1] - (hipY + ankleY) / 2) * 0.1)
      return { hip, knee: r.joint, ankle: r.end }
    }
    legs = [mk(hx - 1.6, hx + s.bFoot), mk(hx + 1.6, hx + s.fFoot)]
  } else {
    const kn = s.thigh * 0.9
    legs = [
      { hip: [hx - 1.5, hipY + 1], knee: [hx - s.thigh * 3.1, SOLE - kn - 1], ankle: [hx + s.thigh * 1.6, SOLE - s.calf - 0.8] },
      { hip: [hx + 1.5, hipY + 1], knee: [hx + s.thigh * 3.3, SOLE - kn - 1], ankle: [hx - s.thigh * 1.3, SOLE - s.calf - 0.4] },
    ]
  }
  // arms: hand targets by pose; the elbow falls on the lower side
  let hRt: V2, hLt: V2
  if (sit) { hRt = [hx + 8, hipY - 3]; hLt = [hx + 2, hipY - 3.5] } else { hRt = [shR[0] + s.wHand[0], shR[1] + s.wHand[1]]; hLt = [shL[0] + s.oHand[0], shL[1] + s.oHand[1]] }
  const armR = ik(shR, hRt, s.ua, s.fa, p => p[1] * 1 - p[0] * 0.15), armL = ik(shL, hLt, s.ua, s.fa, p => p[1] * 1 + p[0] * 0.3)
  const wdir: V2 = (() => { const m = Math.hypot(s.wdir[0], s.wdir[1]) || 1; return [s.wdir[0] / m, s.wdir[1] / m] })()
  return {
    pose: pose === 'attack' ? 'attack' : 'sit', cx: hx, head: { cx: hcx, cy: hcy, rx: s.hrx, ry: s.hry, top: hcy - s.hry - s.rise, fx: hcx + s.hrx * 0.22 },
    torso, tcx: sx, tw: s.sw * 2, neck: neckY, waist: waistY, hem: hipY + 1, hip: hipY, shoulderL: shL, shoulderR: shR, handL: armL.end, handR: armR.end,
    spec: s, side: s.side, wdir, elbowL: armL.joint, elbowR: armR.joint, legs, hipC: [hx, hipY], sh: shY, chin, sit, scale,
  }
}

// ---- gear ----
export type GearFF = {
  name: string
  sleeve?: string; legs?: string; boots?: string; gloves?: string; cuff?: string
  /** metal plates over the shins and thighs */
  greave?: string; thighs?: string
  back?: (r: Raster, g: RigFF) => void
  chest?: (r: Raster, g: RigFF) => void
  /** drawn over the torso and legs: skirts, tabards, shoulder plates */
  over?: (r: Raster, g: RigFF) => void
  head?: (r: Raster, g: RigFF) => void
  hatLine?: boolean
  off?: (r: Raster, g: RigFF) => void
  weapon?: (r: Raster, g: RigFF) => void
}

const rampOf = (c: string, o?: { k?: number; sat?: number }) => R(c, o)
const sitting = (g: RigFF) => g.sit

const limb = (r: Raster, a: V2, b: V2, ra: number, rb: number, rp: Ramp, p: { max?: number; min?: number } = {}) => r.cap(a[0], a[1], b[0], b[1], ra, rb, rp, { max: 4, ...p })

const drawBoot = (r: Raster, g: RigFF, leg: Leg, boot: Ramp, cuff: Ramp) => {
  const { ankle, knee } = leg, sp = g.spec, s = sp.calf / 2.4
  const dx = ankle[0] - knee[0], dy = ankle[1] - knee[1], m = Math.hypot(dx, dy) || 1, ux = dx / m, uy = dy / m
  const top: V2 = [ankle[0] - ux * 4.5, ankle[1] - uy * 4.5]
  r.cap(top[0], top[1], ankle[0], ankle[1] + 0.4, sp.calf + 0.5, sp.calf + 0.35, boot, { max: 4 })
  const x = ankle[0], y = ankle[1]
  r.poly([[x - 2.4 * s, y - 2.4], [x + 2.4 * s, y - 2.4], [x + 2.8 * s, y - 0.5], [x + 6.2 * s, y + 0.5], [x + 6.6 * s, y + 3.1], [x - 2.9 * s, y + 3.1], [x - 3 * s, y]], boot, { bevel: 1.4, cyl: [x, 4], max: 4 })
  for (let i = -3; i <= 6; i++) r.tone(Math.floor(x + i * s), Math.floor(y + 2.6), boot, 1)
  // folded cuff
  r.poly([[top[0] - sp.calf - 0.9, top[1] - 0.8], [top[0] + sp.calf + 0.9, top[1] - 0.8], [top[0] + sp.calf + 0.9, top[1] + 1.6], [top[0] - sp.calf - 0.9, top[1] + 1.6]], cuff, { bevel: 0.9, max: 5 })
}

const drawLeg = (r: Raster, g: RigFF, leg: Leg, pants: Ramp, boot: Ramp, cuff: Ramp, gear?: GearFF) => {
  const sp = g.spec
  limb(r, leg.hip, leg.knee, sp.thigh, sp.thigh * 0.86, pants)
  limb(r, leg.knee, leg.ankle, sp.thigh * 0.86, sp.calf, pants)
  if (gear?.thighs) { const m = metal2(gear.thighs); limb(r, lerp2(leg.hip, leg.knee, 0.3), leg.knee, sp.thigh + 0.7, sp.thigh * 0.95, m, { max: 5 }); r.ell(leg.knee[0], leg.knee[1], sp.thigh + 1.1, sp.thigh + 0.9, m, { max: 5 }) }
  if (gear?.greave) { const m = metal2(gear.greave); limb(r, lerp2(leg.knee, leg.ankle, 0.15), leg.ankle, sp.calf + 0.8, sp.calf + 0.4, m, { max: 5 }) }
  drawBoot(r, g, leg, boot, cuff)
}
const lerp2 = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
export const metal2 = (c: string) => R(c, { k: 1.25 })

const drawArm = (r: Raster, g: RigFF, near: boolean, sleeve: Ramp, skin: Ramp, gear?: GearFF) => {
  const sp = g.spec, sh = near ? g.shoulderR : g.shoulderL, el = near ? g.elbowR : g.elbowL, hd = near ? g.handR : g.handL
  r.cap(sh[0], sh[1], el[0], el[1], sp.armR, sp.armR * 0.88, sleeve, { max: 4 })
  const glove = gear?.gloves ? R(gear.gloves) : skin
  r.cap(el[0], el[1], hd[0], hd[1], sp.foreR + 0.3, sp.foreR, sleeve, { max: 4 })
  if (gear?.cuff) { const dx = hd[0] - el[0], dy = hd[1] - el[1], m = Math.hypot(dx, dy) || 1, ux = dx / m, uy = dy / m, c = R(gear.cuff, { k: 1.1 }); r.cap(hd[0] - ux * 3.2, hd[1] - uy * 3.2, hd[0] - ux * 1.4, hd[1] - uy * 1.4, sp.foreR + 0.7, sp.foreR + 0.5, c, { max: 5 }) }
  r.ell(hd[0] + 0.3, hd[1] + 0.2, sp.foreR + 0.6, sp.foreR + 0.5, glove, { max: 4 })
}

// ---- the head ----
const headFace3q = (r: Raster, g: RigFF, skin: Ramp, hair: Ramp, lk: LookFF) => {
  const { cx, cy, rx, ry, fx } = g.head
  const inHead = (x: number, y: number) => {
    const v = (y - cy) / ry, k = v > 0.1 ? 1 - 0.28 * ((v - 0.1) / 0.9) ** 1.5 : 1
    return ((x - cx - (v > 0.3 ? (v - 0.3) * 1.2 : 0)) / (rx * k)) ** 2 + v * v <= 1
  }
  r.fill([cx - rx, cy - ry, cx + rx + 2, cy + ry], inHead, skin, { n: ellN(cx, cy, rx, ry, 0.8), max: 4, bias: 0.12 })
  const ey = Math.floor(cy + ry * 0.12), ink = R('#2a1820'), iris = R(lk.eyes), white = R('#fffaf2')
  const L = Math.floor(fx - rx * 0.6), Rx = Math.floor(fx + rx * 0.18)
  for (const ex of [L, Rx]) {
    r.tone(ex, ey, ink, 3); r.tone(ex + 1, ey, ink, 3); r.tone(ex + (ex === L ? -1 : 2), ey, ink, 3)
    r.tone(ex, ey + 1, white, 4); r.tone(ex + 1, ey + 1, iris, 2)
    r.tone(ex + (ex === L ? 1 : 0), ey + 2, iris, 4)
  }
  r.rect(L - 1, ey - 2, 3, 1, hair, 1); r.rect(Rx, ey - 2, 3, 1, hair, 1)
  r.tone(Math.floor(fx + 0.6), ey + 3, skin, 2); r.tone(Math.floor(fx + 0.6), ey + 2, skin, 4)
  const lip = R('#b04a3a'); r.rect(Math.floor(fx - 0.8), ey + 4, 2, 1, lip, 2)
  r.tone(L - 1, ey + 3, R('#f08a7a'), 4)
}

const headFaceSide = (r: Raster, g: RigFF, skin: Ramp, hair: Ramp, lk: LookFF) => {
  const { cx, cy, rx, ry } = g.head
  // skull and jaw: a rounded cranium with a forward face and a nose and chin that step out of the profile
  const inHead = (x: number, y: number) => {
    const v = (y - cy) / ry
    const u = (x - cx) / rx
    const jaw = v > 0.25 ? 1 - 0.34 * ((v - 0.25) / 0.75) ** 1.4 : 1
    return u * u / (jaw * jaw) + v * v <= 1 && !(u < -0.35 && v > 0.45)
  }
  r.fill([cx - rx, cy - ry, cx + rx + 3, cy + ry], inHead, skin, { n: ellN(cx - 1, cy, rx, ry, 0.8), max: 4, bias: 0.12 })
  const nx = Math.floor(cx + rx - 0.3), ny = Math.floor(cy + ry * 0.28)
  r.tone(nx + 1, ny, skin, 3); r.tone(nx + 1, ny - 1, skin, 4); r.tone(nx, ny + 1, skin, 2); r.tone(nx + 1, ny + 1, skin, 2)
  const ey = Math.floor(cy - ry * 0.05), ex = Math.floor(cx + rx * 0.35)
  const ink = R('#2a1820'), iris = R(lk.eyes), white = R('#fffaf2')
  r.tone(ex, ey, ink, 3); r.tone(ex + 1, ey, ink, 3); r.tone(ex + 2, ey, ink, 3); r.tone(ex - 1, ey + 1, ink, 3)
  r.tone(ex, ey + 1, white, 4); r.tone(ex + 1, ey + 1, iris, 2); r.tone(ex + 2, ey + 1, ink, 3); r.tone(ex, ey + 2, iris, 4); r.tone(ex + 1, ey + 2, iris, 3)
  r.rect(ex - 1, ey - 2, 4, 1, hair, 1)
  const lip = R('#b04a3a'); r.rect(Math.floor(cx + rx * 0.4), Math.floor(cy + ry * 0.6), 2, 1, lip, 2)
  r.tone(ex - 2, ey + 3, R('#f08a7a'), 4)
  // the ear sits in the middle of the skull side
  r.ell(cx - rx * 0.12, cy + ry * 0.2, 1.4, 2, skin, { max: 3 }); r.tone(Math.floor(cx - rx * 0.12), Math.floor(cy + ry * 0.2), skin, 1)
}

/** Hair: a back mass, a cap that stops at a hairline, then the style's locks. Gear can hide the cap with `hatLine`. */
const hairBack = (r: Raster, g: RigFF, hair: Ramp) => {
  const { cx, cy, rx, ry } = g.head, s = g.spec, sw = g.side
  if (s.style === 'mane') {
    // long hair streams down the back and out to the left
    const pts: [number, number][] = []
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([cx - rx * 0.6 - t * 8 - Math.sin(t * 3) * 1.5, cy - ry * 0.4 + t * (g.sh - cy + 14)]) }
    for (let i = 10; i >= 0; i--) { const t = i / 10; pts.push([cx + rx * 0.2 - t * 6 - Math.sin(t * 3) * 1.2, cy + ry * 0.3 + t * (g.sh - cy + 15)]) }
    r.poly(pts, hair, { bevel: 1.6, n: () => norm(-0.3, 0, 1) })
    for (const t of [0.35, 0.6]) r.line(cx - rx * 0.3 - t * 6, cy + 2 + t * 14, cx - rx * 0.6 - t * 8, cy + 2 + t * 18, hair, 1)
  } else if (s.style === 'tail') {
    // a ponytail streaming back in the wind
    const bx = cx - rx * 0.9, by = cy - ry * 0.45
    const pts: [number, number][] = [[bx, by - 2], [bx - 7, by - 3], [bx - 16, by + 1], [bx - 22, by + 7], [bx - 17, by + 5.5], [bx - 12, by + 4], [bx - 6, by + 3], [bx + 1, by + 3]]
    r.poly(pts, hair, { bevel: 1.2, tilt: [0, -0.2] })
    r.poly([[bx - 6, by + 2], [bx - 13, by + 5], [bx - 20, by + 11], [bx - 14, by + 8]], hair, { bevel: 1 })
  } else if (s.style === 'swept') {
    r.poly([[cx - rx - 1, cy - 1], [cx - rx - 1.5, cy + ry * 0.9], [cx - rx + 2, cy + ry * 0.6], [cx + rx * 0.3, cy + ry * 0.1]], hair, { n: ellN(cx - 1, cy - 3, rx + 2, ry + 3) })
  } else if (sw) {
    r.poly([[cx - rx - 1.5, cy - 2], [cx - rx - 3, cy + ry * 0.8], [cx - rx + 1, cy + ry * 0.5], [cx, cy]], hair, { n: ellN(cx - 1, cy - 3, rx + 2, ry + 3) })
  }
}

const hairFront = (r: Raster, g: RigFF, hair: Ramp, hatLine?: boolean) => {
  const { cx, cy, rx, ry } = g.head, s = g.spec, k = ry / 6.4
  const capN = ellN(cx - 1, cy - ry * 0.3, rx + 2, ry + 2)
  const crx = rx * 1.12, cry = ry * 1.14, ccy = cy - ry * 0.26
  const hl = (x: number) => cy - ry * 0.42 + (Math.abs((x - cx) / rx)) ** 4 * ry * 0.7
  const ytop = (x: number) => ccy - cry * Math.sqrt(Math.max(0, 1 - ((x - cx + 0.5) / crx) ** 2))
  const capIn = (x: number, y: number) => ((x - cx + 0.5) / crx) ** 2 + ((y - ccy) / cry) ** 2 <= 1 && y < hl(x) + (g.side ? (x - cx > 0 ? -ry * 0.25 : ry * 0.45) : 0)
  if (!hatLine) r.fill([cx - crx - 1, ccy - cry - 1, cx + crx + 1, cy + ry * 0.6], capIn, hair, { n: capN })
  const swp = (pts: [number, number][]) => r.poly(pts, hair, { n: capN })
  if (!hatLine) {
    if (s.style === 'spiky') for (const [bx, w, dx, ht] of [[cx - 5, 4, -4, 5], [cx - 1, 5, -3, 7], [cx + 3, 5, -2, 6], [cx + 6, 3, -1, 4]] as const) { const y0 = ytop(bx) + 2.2; swp([[bx - w / 2, y0], [bx + dx, y0 - ht * k], [bx + w / 2, y0]]) }
    if (s.style === 'swept') { const y0 = ytop(cx + 1) + 2; swp([[cx - 2, y0 + 1], [cx + 3, y0 - 5], [cx + 7, y0 + 1]]); swp([[cx + 3, y0 + 1], [cx + 9, y0 - 3], [cx + 8, y0 + 4]]) }
    if (s.style === 'mane') { const y0 = ytop(cx) + 2; swp([[cx - 5, y0 + 1], [cx - 1, y0 - 4], [cx + 4, y0 + 1]]) }
    if (s.style === 'tail') for (const [bx, w, dx, ht] of [[cx - 4, 5, -6, 4.5], [cx + 0.5, 5, -5, 4.2], [cx + 5, 4, -2, 3]] as const) { const y0 = ytop(bx) + 2.2; swp([[bx - w / 2, y0], [bx + dx, y0 - ht * k], [bx + w / 2, y0]]) }
  }
  // forehead locks over the hairline
  const locks: (readonly [number, number, number, number])[] = g.side
    ? [[cx + 1.5, 3.5, 1.5, 3.5], [cx + rx * 0.45, 3, 1, 2.8]]
    : [[cx - rx + 0.5, 3.5, -1, 4.5], [cx - 2.5, 3.5, -0.5, 3.8], [cx + 1.2, 3.5, 0.5, 3.4], [cx + rx * 0.55, 3, 0.5, 3]]
  for (const [x0, w, dx, len] of locks) { const y0 = hl(x0 + w / 2) - 1.8; swp([[x0, y0], [x0 + w, y0], [x0 + w / 2 + dx, y0 + len * k]]) }
  for (const [x0] of locks.slice(1)) { const x = Math.floor(x0 + 0.5), y = Math.floor(hl(x0) - 1.8); r.tone(x, y, hair, 1); r.tone(x, y + 1, hair, 2) }
  if (!hatLine) for (let x = Math.floor(cx - rx * 0.6); x <= cx - 1; x++) r.tone(x, Math.floor(ytop(x) + 2 + Math.abs(x - cx + 3) * 0.3), hair, 5)
}

// ---- the figure ----
export const heroFF = (id: FFId, pose: PoseFF, gear?: GearFF, look?: LookFF): Img32 => {
  const sp = SPECS[id], lk = look ?? LOOKS_FF[id], g = rigFF(sp, pose)
  const r = new Raster(WFF, HFF)
  const skin = skinRamp(lk.skin), hair = R(lk.hair, { cool: 265, warm: 30, k: 0.6, hs: 0.6 })
  const tunic = R(sp.tunic), pants = R(gear?.legs ?? sp.pants), boot = R(gear?.boots ?? sp.boot), cuff = R(gear?.cuff ?? gear?.boots ?? '#a07a4a', { k: 1.1 })
  const sleeve = R(gear?.sleeve ?? sp.tunic)
  r.layer('back', false)
  gear?.back?.(r, g)
  hairBack(r, g, hair)
  r.layer('l1'); drawLeg(r, g, g.legs[0], pants, boot, cuff, gear)
  r.layer('l2'); drawLeg(r, g, g.legs[1], pants, boot, cuff, gear)
  r.layer('body')
  // neck, then the torso, belt and the gear over it
  r.rect(Math.floor(g.tcx - 1.5), Math.floor(g.neck - 3), 3, 5, skin, 2)
  r.poly(g.torso, tunic, { cyl: [g.tcx, sp.sw + 3], bevel: 1.2, max: 4 })
  r.clip = (x, y) => inPoly(g.torso, x + 0.5, y + 0.5)
  const belt = R('#5a3a20'), gold = R('#f2c94c', { k: 1.2 })
  const by = Math.floor(g.waist)
  r.fill([g.cx - 14, by, g.cx + 16, by + 1], () => true, belt, { n: x => norm((x - g.tcx) / 10, -0.2, 1), max: 4 })
  r.rect(Math.floor(g.cx + 2), by, 3, 2, gold, 4); r.tone(Math.floor(g.cx + 3), by + 1, gold, 2)
  if (gear?.chest) { r.layer('body'); gear.chest(r, g) }
  r.clip = undefined
  if (gear?.over) { r.layer('body'); gear.over(r, g) }
  r.layer('cl'); drawArm(r, g, false, sleeve, skin, gear)
  r.layer('head')
  if (g.side) headFaceSide(r, g, skin, hair, lk); else headFace3q(r, g, skin, hair, lk)
  r.layer('hair'); hairFront(r, g, hair, gear?.hatLine)
  if (gear?.head) { r.layer('hat'); gear.head(r, g) }
  if (gear?.off && !g.sit) { r.layer('off'); gear.off(r, g) }
  r.layer('cr'); drawArm(r, g, true, sleeve, skin, gear)
  if (g.sit) { r.layer('wpn'); rodFF(r, g) } else if (gear?.weapon) { r.layer('wpn'); gear.weapon(r, g); r.layer('cr'); const hd = g.handR, glove = gear.gloves ? R(gear.gloves) : skin; r.ell(hd[0] + 0.3, hd[1] + 0.2, sp.foreR + 0.6, sp.foreR + 0.5, glove, { max: 4 }) }
  return finish32(r, FOOTFF)
}

const rodFF = (r: Raster, g: RigFF) => {
  const wood = R('#8a5a32'), line = R('#d8d8e0'), [hx, hy] = g.handR
  r.line(hx - 4, hy + 3, hx + 22, hy - 22, wood, 3, 2)
  for (let y = hy - 21; y < SOLE - 1; y++) r.tone(hx + 22, y, line, 4)
  r.ell(hx + 22, SOLE - 2, 1.5, 1.5, R('#e0443a'))
}

// ---- gear shapes shared by the sets ----
const k6 = (g: RigFF) => g.head.ry / 6.4
const metalR = (c: string) => R(c, { k: 1.25, cool: 230, warm: 55 })
const fillTorso = (r: Raster, g: RigFF, rp: Ramp, o: Paint = {}) => r.fill([g.tcx - 16, g.neck - 2, g.tcx + 16, g.hem + 2], () => true, rp, { n: x => norm((x - g.tcx) / (g.spec.sw + 3), -0.1, 1), max: 4, ...o })
const wob = (x: number, a: number, f: number) => Math.sin(x * f) * a

/** A cloak behind the body: hangs from the shoulders, streams out to the left in the wind, swallowtail hem, fold shading. */
const cloak = (r: Raster, g: RigFF, col: string, o: { len?: number; trail?: number; lining?: string } = {}) => {
  const rp = R(col), sx = g.tcx, top = g.neck, sw = g.spec.sw, wind = g.sit ? 0.6 : g.spec.wind
  const len = (o.len ?? 12) * (g.sit ? 0.45 : 0.85 * wind ** 0.2), trail = (o.trail ?? 8) * (g.sit ? 0.5 : wind)
  const bot = g.sit ? SOLE - 1 : g.hem + len, lift = g.sit ? 0 : Math.max(0, wind - 1) * 8
  const tipX = sx - sw - 3 - trail, x1 = sx + 1
  const edgeY = (x: number) => { const t = clamp((x1 - x) / (x1 - tipX), 0, 1); return bot - lift * t + Math.sin(x * 1.3) * 0.9 * t }
  const pts: [number, number][] = [[sx - 3, top], [sx + sw * 0.8, top + 2.5], [sx + 4, g.hem + len * 0.45], [x1, bot]]
  for (let i = 1; i <= 7; i++) { const x = x1 + (tipX - x1) * (i / 7); pts.push([x, edgeY(x) + (i % 2 ? 1.2 : -0.4)]) }
  pts.push([tipX + 2, top + 5 + (bot - lift - top) * 0.22], [sx - sw - 1, top + 4])
  r.poly(pts, rp, { bevel: 1.8, n: (x, y) => norm(Math.sin((x * 0.55 + y * 0.8) * 0.8) * 0.6 + (x - sx) * 0.02, -0.2, 1), max: 4 })
  if (o.lining) r.fill([tipX - 2, top, sx + sw, bot + 4], (x, y) => inPoly(pts, x, y) && y > edgeY(x) - 2.3, R(o.lining), { tone: 3 })
}

/** A shoulder plate (pauldron): a dome with a rim ridge, set on the shoulder joint. */
const pauldron = (r: Raster, g: RigFF, near: boolean, col: string, trim: string, size = 1) => {
  const p = near ? g.shoulderR : g.shoulderL, m = metalR(col), t = metalR(trim), sw = g.spec.side ? 0.8 : 1, rr = g.spec.armR * 1.7 * size
  r.ell(p[0] + (near ? 0.4 : -0.4), p[1] - 0.6, rr * sw + 0.8, rr * 0.82, m, { max: 5 })
  r.line(p[0] - rr * sw + 0.6, p[1] + rr * 0.62, p[0] + rr * sw - 0.6, p[1] + rr * 0.62, t, 4)
}

const poleFF = (r: Raster, g: RigFF, up: number, down: number, col = WOOD, w = 1.2): [V2, V2] => {
  const u = g.wdir, h = g.handR
  const a: V2 = [h[0] - u[0] * down, h[1] - u[1] * down], b: V2 = [h[0] + u[0] * up, h[1] + u[1] * up]
  r.cap(a[0], a[1], b[0], b[1], w, w, R(col), { max: 5 })
  return [b, u]
}
const wlen = (g: RigFF, n: number) => Math.round(n * Math.min(1.1, g.scale))
const sword = (r: Raster, g: RigFF, o: { len: number; w: number; col: string; guard: number; guardCol?: string; curve?: number; tip?: number; grip?: number; pommel?: boolean }) => blade(r, g, { dir: g.wdir, hand: g.handR, ...o, len: wlen(g, o.len) })

/** Full skirt of a robe or tabard over the legs: a waist band, a flare to a hem, optionally open in front so the lead boot shows. */
const skirt = (r: Raster, g: RigFF, rp: Ramp, o: { len: number; flare?: number; split?: boolean; trim?: Ramp; open?: number } = { len: 14 }) => {
  const [hx, hy] = g.hipC, hw = g.spec.hipW, f = o.flare ?? 4, len = g.sit ? Math.min(o.len, 5) : o.len
  const front = hx + (g.sit ? 6 : 4), lead = g.sit ? 0 : (g.legs[1].ankle[0] - hx) * 0.5
  const frontLen = o.split ? len * 0.55 : len
  const pts: [number, number][] = [[hx - hw - 0.5, hy - 1], [hx + hw + 0.5, hy - 1], [hx + hw + f + lead * 0.4, hy + frontLen], [hx + 1, hy + frontLen - 1.5 + (o.split ? 0 : 0)], [hx - 2, hy + len + 0.5], [hx - hw - f - 2, hy + len + (g.sit ? 0 : 1.5)]]
  r.poly(pts, rp, { bevel: 1.5, n: (x, y) => norm(Math.sin((x - hx) * 0.7) * 0.5 + (x - hx) * 0.03, -0.1, 1), max: 4 })
  if (o.trim) { r.line(hx - hw - f - 2, hy + len + (g.sit ? 0 : 1.5) - 0.5, hx - 1, hy + len, o.trim, 4, 1); r.line(hx + hw + f + lead * 0.4 - 0.5, hy + frontLen - 0.4, hx + 1.5, hy + frontLen - 1.6, o.trim, 4, 1) }
  void front
}

const domeFF = (r: Raster, g: RigFF, rp: Ramp, o: { up?: number; brow?: number; widen?: number; rim?: Ramp } = {}) => {
  const { cx, cy, rx, ry } = g.head, brow = cy - ry * (o.brow ?? 0.32)
  const drx = rx * (1.14 + (o.widen ?? 0)), dry = ry * (1.2 + (o.up ?? 0)), dcy = cy - ry * 0.24
  r.fill([cx - drx - 1, dcy - dry - 1, cx + drx + 1, brow + 1], (x, y) => ((x - cx + 0.3) / drx) ** 2 + ((y - dcy) / dry) ** 2 <= 1 && y < brow, rp, { n: ellN(cx - 0.5, dcy, drx, dry) })
  if (o.rim) r.fill([cx - drx - 1, brow - 2, cx + drx + 1, brow + 1], (x, y) => y >= brow - 1.7 && y < brow + 0.5 && Math.abs(x - cx + 0.3) <= drx * Math.sqrt(Math.max(0, 1 - ((y - dcy) / dry) ** 2)) + 0.5, o.rim, { n: x => norm((x - cx) / drx, -0.1, 1) })
  return { brow, drx, dry, dcy, top: dcy - dry }
}

const KNIGHT: GearFF = {
  name: 'Knight', sleeve: '#6a7490', legs: '#3a4258', boots: '#3a3f55', cuff: '#9fb0c8', greave: '#9fb0c8', thighs: '#8392ac', gloves: '#6a7690', hatLine: true,
  back: (r, g) => cloak(r, g, '#2a3f8f', { len: 14, trail: 9, lining: '#c8a040' }),
  chest: (r, g) => {
    const st = metalR('#a8b8d0'), gold = metalR(GOLD)
    fillTorso(r, g, st, { max: 5 })
    r.line(g.tcx + 0.5, g.neck + 2, g.tcx + 0.5, g.waist - 1, st, 5, 1); r.line(g.tcx - 0.5, g.neck + 3, g.tcx - 0.5, g.waist - 1, st, 2, 1)
    for (const y of [g.sh + 5, g.sh + 8]) { r.line(g.tcx - 12, y, g.tcx + 12, y, st, 2) }
    r.line(g.tcx - 12, g.neck + 1.5, g.tcx + 12, g.neck + 1.5, gold, 4, 1)
  },
  over: (r, g) => {
    const st = metalR('#9fb0c8'), hip = g.hipC, hw = g.spec.hipW
    for (const [dx, w] of [[-hw - 1, 4.2], [-hw + 3.2, 4.6], [hw - 4.6, 4.6], [hw + 0.1, 4.4]] as const) r.poly([[hip[0] + dx, hip[1] - 1], [hip[0] + dx + w, hip[1] - 1], [hip[0] + dx + w - 0.4, hip[1] + 6.5 * (g.scale > 0.9 ? 1 : 0.8)], [hip[0] + dx + 0.5, hip[1] + 6.5 * (g.scale > 0.9 ? 1 : 0.8)]], st, { bevel: 1.2, cyl: [hip[0] + dx + w / 2, w], max: 5 })
    pauldron(r, g, false, '#a8b8d0', '#c8a040', 1); pauldron(r, g, true, '#a8b8d0', '#c8a040', 1.1)
  },
  head: (r, g) => {
    const { cx, cy, rx, ry, fx } = g.head, st = metalR('#b8c4d8'), rim = metalR('#8a96b0'), crest = R('#c0392b', { k: 0.9 })
    const d = domeFF(r, g, st, { rim })
    r.poly([[cx - rx * 1.1, d.brow - 2], [cx - rx * 0.85, d.top - 2.5], [cx - rx * 0.1, d.top - 4.5], [cx + rx * 0.6, d.top - 2.5], [cx + rx * 0.5, d.top + 1], [cx - rx * 0.4, d.top - 0.6]], crest, { bevel: 1, tilt: [-0.2, -0.1] })
    r.poly([[cx - rx * 1.15, d.brow], [cx - rx * 1.2, cy + ry * 0.9], [cx - rx * 0.4, cy + ry * 0.75], [cx - rx * 0.55, d.brow]], rim, { bevel: 1 })
    r.rect(Math.floor(fx + 0.1), Math.floor(d.brow), 1, Math.max(3, Math.round(ry * 0.9)), rim, 4)
  },
  off: (r, g) => {
    const [x, y] = g.handL, rr = g.spec.armR * 3.6
    const inK = (px: number, py: number, i: number) => py >= y - rr + i && py <= y + rr * 1.5 - i * 0.5 && Math.abs(px - x) <= (rr - i) * (py < y + rr * 0.1 ? 1 : 1 - ((py - y - rr * 0.1) / (rr * 1.4)) ** 1.3)
    shieldShape(r, inK, [x - rr - 1, y - rr, x + rr + 1, y + rr * 1.5], R('#2a4fb0'), metalR(STEEL), 1.3)
    const gold = metalR(GOLD); r.line(x - rr * 0.6, y - rr * 0.1, x, y - rr * 0.7, gold, 4, 1); r.line(x, y - rr * 0.7, x + rr * 0.6, y - rr * 0.1, gold, 4, 1)
    r.line(x - rr * 0.6, y + rr * 0.5, x, y, gold, 4, 1); r.line(x, y, x + rr * 0.6, y + rr * 0.5, gold, 4, 1)
  },
  weapon: (r, g) => sword(r, g, { len: 29, w: 2.1, col: STEEL, guard: 4.5, guardCol: GOLD, grip: 5 }),
}

const WIZARD: GearFF = {
  name: 'Wizard', sleeve: '#4a58c8', legs: '#3a3a6a', boots: '#4a3a5a', cuff: '#e0b84a', hatLine: false,
  back: (r, g) => {
    const rp = R('#6a3ab0'), { cx, cy, rx, ry } = g.head, gold = metalR(GOLD)
    cloak(r, g, '#6a3ab0', { len: 15, trail: 10 })
    // a tall stiff collar behind the head
    r.poly([[g.tcx - 8, g.neck + 3], [cx - rx - 2, cy - ry * 0.2], [cx - rx * 0.6, cy - ry * 1.1], [cx + rx * 0.5, cy + ry * 0.2], [g.tcx + 5, g.neck + 2]], R('#4a2a8a'), { bevel: 1.4 })
    void rp; void gold
  },
  chest: (r, g) => {
    const robe = R('#4a58c8'), gold = metalR(GOLD)
    fillTorso(r, g, robe)
    r.line(g.tcx + 1, g.neck, g.tcx + 1, g.hem + 1, gold, 3, 2); r.line(g.tcx + 1, g.neck, g.tcx + 1, g.hem + 1, gold, 5, 1)
    for (const [dx, dy] of [[-5, 5], [-4, 9], [4.5, 7], [5, 11]] as const) starAt(r, Math.floor(g.tcx + dx), Math.floor(g.sh + dy), R('#f2e05a'))
  },
  over: (r, g) => {
    const robe = R('#4a58c8'), gold = metalR(GOLD)
    skirt(r, g, robe, { len: g.spec.leg * 0.72, flare: 5, split: !g.sit, trim: gold })
    const sash = R('#c8302c'), [hx, hy] = g.hipC
    const sl = g.sit ? 0.4 : 1
    r.poly([[hx + 2, g.waist], [hx + 5, g.waist], [hx + 7, hy + 9 * sl], [hx + 3, hy + 11 * sl], [hx + 1, hy + 8 * sl]], sash, { bevel: 1 })
    // bell sleeves
    for (const [near, p] of [[false, g.handL], [true, g.handR]] as const) { void near; r.poly([[p[0] - 4, p[1] - 4], [p[0] + 4, p[1] - 4], [p[0] + 5.5, p[1] + 3], [p[0] - 5, p[1] + 3]], R('#4a58c8'), { bevel: 1, max: 4 }); r.line(p[0] - 5, p[1] + 2.5, p[0] + 5, p[1] + 2.5, gold, 4) }
  },
  head: (r, g) => {
    const { cx, cy, rx, ry } = g.head, gold = metalR(GOLD), gem = R('#5ee0ea', { k: 1.2 })
    r.line(cx - rx * 0.9, cy - ry * 0.55, cx + rx * 0.9, cy - ry * 0.7, gold, 4, 1)
    r.ell(cx + rx * 0.2, cy - ry * 0.68, 1.3, 1.5, gem); dot(r, Math.floor(cx + rx * 0.15), Math.floor(cy - ry * 0.75), gem, 5)
  },
  off: (r, g) => {
    const [x, y] = g.handL, cover = R('#e8c43a'), page = R('#f4ecd8', { k: 0.5 })
    r.poly([[x - 4, y - 5], [x + 3.5, y - 6], [x + 4.5, y + 4], [x - 3.5, y + 5]], cover, { bevel: 1.4 })
    r.poly([[x + 3.5, y - 5], [x + 5.5, y - 5.5], [x + 6, y + 3.5], [x + 4.5, y + 4]], page, { tone: 4 })
    starAt(r, Math.floor(x), Math.floor(y - 0.5), R('#7a4ad0'))
  },
  weapon: (r, g) => {
    const [top, u] = poleFF(r, g, wlen(g, 24), 10, '#7a5030', 1.1)
    const cr = R('#5ee0ea', { k: 1.2 }), gold = metalR(GOLD), v: V2 = [-u[1], u[0]]
    r.cap(top[0] - v[0] * 3, top[1] - v[1] * 3, top[0] + v[0] * 3, top[1] + v[1] * 3, 1, 1, gold)
    const c: V2 = [top[0] + u[0] * 4, top[1] + u[1] * 4]
    r.poly([[c[0], c[1] - 5], [c[0] + 3.4, c[1]], [c[0], c[1] + 4.2], [c[0] - 3.4, c[1]]], cr, { bevel: 2.4 })
    dot(r, Math.floor(c[0] - 1), Math.floor(c[1] - 2), cr, 5)
    for (const [dx, dy] of [[-6, -3], [5.5, -2], [-4.5, 5], [4.5, 5.5]] as const) dot(r, Math.floor(c[0] + dx), Math.floor(c[1] + dy), cr, 5)
  },
}

const KING: GearFF = {
  name: 'King', sleeve: '#a8282c', legs: '#2a2a3a', boots: '#4a2a26', cuff: '#f2c94c', hatLine: false,
  back: (r, g) => cloak(r, g, '#a02030', { len: 16, trail: 12, lining: '#f2e8d8' }),
  chest: (r, g) => {
    const gold = metalR(GOLD)
    fillTorso(r, g, R('#c8302c'))
    r.line(g.tcx - 12, g.waist, g.tcx + 12, g.waist, gold, 4, 2)
    for (const dy of [4, 7.5, 11]) { const y = g.sh + dy; if (y < g.waist - 1) { dot(r, Math.floor(g.tcx + 1), Math.floor(y), gold, 4); dot(r, Math.floor(g.tcx + 1), Math.floor(y) + 1, gold, 2) } }
    r.rect(Math.floor(g.tcx - 0.5), Math.floor(g.waist), 2, 2, R('#3a6ad8'), 4)
  },
  over: (r, g) => {
    const er = R('#f4eee4', { k: 0.6 }), c = g.tcx, y = g.neck, sw = g.spec.sw
    r.poly([[c - sw - 1, y - 0.5], [c + sw + 1, y - 0.5], [c + sw + 1.5, y + 4], [c + 4, y + 4.5], [c, y + 2.5], [c - 4, y + 4.5], [c - sw - 1.5, y + 4]], er, { cyl: [c, sw + 2], bevel: 1.3 })
    for (const x of [-sw + 1.5, -3, 3, sw - 1.5]) { r.tone(Math.floor(c + x), Math.floor(y + 2), R('#2a2230'), 3); r.tone(Math.floor(c + x), Math.floor(y + 3), R('#2a2230'), 3) }
    const [hx, hy] = g.hipC, gold = metalR(GOLD), tab = R('#c8302c')
    const tl = g.sit ? 0.45 : 1
    r.poly([[hx - g.spec.hipW, hy], [hx + g.spec.hipW + 1, hy], [hx + g.spec.hipW + 2, hy + 8 * tl], [hx + 1, hy + 10 * tl], [hx - g.spec.hipW - 1, hy + 8 * tl]], tab, { bevel: 1.2, max: 4 })
    r.line(hx - g.spec.hipW - 1, hy + 8 * tl, hx + g.spec.hipW + 1, hy + 8.5 * tl, gold, 4)
  },
  head: (r, g) => {
    const { cx, cy, rx, ry } = g.head, gold = metalR(GOLD), by = cy - ry * 0.95
    const pts: [number, number][] = [[cx - rx * 1.1, by + 3]]
    const N = 5
    for (let i = 0; i < N; i++) { const x0 = cx - rx * 1.1 + (i * (rx * 2.2)) / N; pts.push([x0 + 0.5, by - 4.5 + (i % 2 ? 1.5 : 0)], [x0 + rx * 0.22, by - 0.5]) }
    pts.push([cx + rx * 1.1, by - 3.5], [cx + rx * 1.1, by + 3])
    r.poly(pts, gold, { bevel: 1.1, cyl: [cx, rx * 1.1] })
    r.line(cx - rx * 1.1, by + 2, cx + rx * 1.1, by + 2, gold, 2, 1)
    for (const [dx, c] of [[-rx * 0.6, '#d0342c'], [0, '#3a6ad8'], [rx * 0.6, '#3aa060']] as const) { r.tone(Math.floor(cx + dx), Math.floor(by + 2.5), R(c), 4); r.tone(Math.floor(cx + dx), Math.floor(by + 1.5), R(c), 5) }
  },
  off: (r, g) => {
    const [x, y] = g.handL, rr = g.spec.armR * 3
    shieldShape(r, inRound(x, y, rr, rr), [x - rr - 1, y - rr - 1, x + rr + 1, y + rr + 1], R('#f2e05a', { k: 1.1 }), metalR('#b08a3a'), 1.3)
    r.ell(x, y, 2, 2, R('#c8302c')); r.rect(Math.floor(x - 0.5), Math.floor(y - rr + 1.5), 1, Math.round(rr * 2 - 3), R('#c8302c'), 3)
  },
  weapon: (r, g) => sword(r, g, { len: 26, w: 1.7, col: '#e8eef8', guard: 4, guardCol: GOLD }),
}

const ROGUE: GearFF = {
  name: 'Rogue', sleeve: '#4a4a5e', legs: '#30303e', boots: '#2e2a38', cuff: '#e0902a', gloves: '#3a3040', hatLine: true,
  back: (r, g) => cloak(r, g, '#3a3a52', { len: 11, trail: 9 }),
  chest: (r, g) => {
    const v = R('#5a4a64'), shirt = R('#d8d0c0', { k: 0.6 })
    fillTorso(r, g, v)
    r.fill([g.tcx - 4, g.neck, g.tcx + 5, g.waist], (x, y) => Math.abs(x - g.tcx - 0.5) < (g.waist - y) * 0.22 + 0.4, shirt, { tone: 3 })
    r.line(g.tcx - 9, g.sh + 0.5, g.tcx + 9, g.waist - 1, R(LEATHER), 2, 2); r.line(g.tcx + 9, g.sh + 0.5, g.tcx - 9, g.waist - 1, R(LEATHER), 3, 1)
    r.tone(Math.floor(g.tcx), Math.floor(g.sh + 4), metalR('#c8a050'), 5)
  },
  over: (r, g) => {
    const [hx, hy] = g.hipC, lea = R('#5a3a24')
    r.poly([[hx - g.spec.hipW - 1, hy - 1], [hx + g.spec.hipW + 1, hy - 1], [hx + g.spec.hipW + 2.5, hy + 5], [hx - g.spec.hipW - 2.5, hy + 6]], R('#3a3a52'), { bevel: 1, max: 4 })
    r.rect(Math.floor(hx - g.spec.hipW - 3), Math.floor(hy + 1), 3, 4, lea, 3)
    const sc = R('#e0902a'); r.poly([[g.tcx - 4, g.neck - 1], [g.tcx + 4, g.neck - 1], [g.tcx + 3, g.neck + 3], [g.tcx - 3, g.neck + 3]], sc, { cyl: [g.tcx, 5], bevel: 1 })
    r.poly([[g.tcx - 3, g.neck + 2], [g.tcx - 1, g.neck + 2], [g.tcx - 4, g.neck + 10], [g.tcx - 6.5, g.neck + 9]], sc, { tilt: [-0.3, 0] })
  },
  head: (r, g) => {
    const { cx, cy, rx, ry } = g.head, hd = R('#4a4a6e')
    const hrx = rx * 1.3, hry = ry * 1.28, hcy = cy - ry * 0.18
    r.fill([cx - hrx - 7, hcy - hry - 1, cx + hrx + 1, cy + ry * 1.3], (x, y) => {
      const inS = ((x - cx + 0.5) / hrx) ** 2 + ((y - hcy) / hry) ** 2 <= 1
      const face = ((x - cx - rx * 0.28) / (rx * 0.92)) ** 2 + ((y - cy - ry * 0.28) / (ry * 0.88)) ** 2 <= 1 && y > cy - ry * 0.55
      return inS && !face
    }, hd, { n: ellN(cx - 0.5, hcy, hrx, hry), max: 4 })
    r.poly([[cx - hrx + 1, hcy - 2], [cx - hrx - 8, hcy + 8], [cx - hrx - 2, cy + ry * 1.2], [cx - hrx + 1, hcy + 5]], hd, { tilt: [-0.4, 0.2] })
    r.fill([cx - rx, cy - ry * 0.7, cx + rx + 1, cy - ry * 0.5], (x, y) => y >= cy - ry * 0.65 && y < cy - ry * 0.5 && Math.abs(x - cx - rx * 0.28) < rx * 0.8, hd, { tone: 1 })
  },
  off: (r, g) => sword(r, { ...g, handR: g.handL, wdir: unit2(-0.35, 1) } as RigFF, { len: 11, w: 1.3, col: STEEL, guard: 2.4, guardCol: '#8a96b0', grip: 3 }),
  weapon: (r, g) => sword(r, g, { len: 13, w: 1.5, col: STEEL, guard: 3, guardCol: '#8a96b0', grip: 3 }),
}
const unit2 = (x: number, y: number): V2 => { const m = Math.hypot(x, y) || 1; return [x / m, y / m] }

const SAMURAI: GearFF = {
  name: 'Samurai', sleeve: '#2a2a44', legs: '#26263a', boots: '#2a2220', cuff: '#c8a040', gloves: '#3a3040', hatLine: true,
  back: (r, g) => cloak(r, g, '#8a1f26', { len: 9, trail: 12 }),
  chest: (r, g) => {
    const lac = R('#b02828'), cord = R('#f2c94c'), dk = R('#2a2a44')
    r.fill([g.tcx - 14, g.neck, g.tcx + 14, g.hem + 2], () => true, lac, { n: (x, y) => norm((x - g.tcx) / (g.spec.sw + 3), (((y - g.neck) % 3.2) / 3.2) - 0.5, 1), max: 4 })
    for (let y = g.sh + 3; y < g.hem + 1; y += 3.2) for (let x = g.tcx - 11; x < g.tcx + 12; x += 3) r.tone(Math.floor(x + (Math.floor(y / 3.2) % 2)), Math.floor(y), cord, 3)
    r.rect(Math.floor(g.tcx - 4), Math.floor(g.neck), 8, 3, dk, 3)
  },
  over: (r, g) => {
    const lac = R('#9a2024'), cord = R('#f2c94c'), dk = R('#2a2a44'), [hx, hy] = g.hipC
    for (const [s, p] of [[-1, g.shoulderL], [1, g.shoulderR]] as const) {
      const w = g.spec.armR * 1.6
      r.poly([[p[0] - w, p[1] - 2.6], [p[0] + w, p[1] - 2.6], [p[0] + w + s * 1.6, p[1] + 7.5], [p[0] - w + s * 1.6, p[1] + 7.5]], lac, { bevel: 1.2, max: 4 })
      for (const dy of [0.5, 3, 5.5]) r.line(p[0] - w + 0.5 + s * 0.6, p[1] + dy, p[0] + w - 0.5 + s * 0.6, p[1] + dy, cord, 3)
      r.line(p[0] - w, p[1] - 2.6, p[0] + w, p[1] - 2.6, dk, 3, 1)
    }
    for (const [dx, w] of [[-g.spec.hipW - 1, 5], [-g.spec.hipW + 4.2, 5], [g.spec.hipW - 4.4, 5], [g.spec.hipW + 0.6, 4.6]] as const) { r.poly([[hx + dx, hy - 1], [hx + dx + w, hy - 1], [hx + dx + w, hy + 8], [hx + dx + 0.4, hy + 8]], lac, { bevel: 1, max: 4 }); r.line(hx + dx + 0.5, hy + 3.5, hx + dx + w - 0.5, hy + 3.5, cord, 3); r.line(hx + dx + 0.4, hy + 7.5, hx + dx + w, hy + 7.5, dk, 3) }
  },
  head: (r, g) => {
    const { cx, cy, rx, ry, fx } = g.head, lac = R('#2a2a44', { k: 0.85 }), gold = metalR(GOLD), red = R('#b03030')
    const d = domeFF(r, g, lac, { brow: 0.4, widen: 0.04 })
    r.line(cx - d.drx, d.brow - 1, cx + d.drx, d.brow - 1, gold, 4, 1)
    // neck guard: flared plates behind and beside the head
    for (let i = 0; i < 3; i++) { const y = d.brow + i * 2.2, w = d.drx + 1 + i * 1.1; r.poly([[cx - w - 1.5 + i * 0.3, y], [cx - rx * 0.2, y], [cx - rx * 0.2, y + 2.4], [cx - w - 2.2, y + 2.4]], i % 2 ? red : lac, { bevel: 0.8, max: 4 }) }
    // crescent crest: a bowl of gold whose horns rise above the brow
    const ro = rx * 1.05, ri = ro * 0.66, cxm = fx, cym = d.brow - 1.5 - ro
    r.fill([cxm - ro, cym, cxm + ro, cym + ro], (x, y) => { const dd = Math.hypot(x - cxm, y - cym); return y >= cym && dd <= ro && dd >= ri }, gold, { n: (x, y) => norm((x - cxm) / ro, (y - cym) / ro, 1) })
  },
  weapon: (r, g) => sword(r, g, { len: 27, w: 1.25, col: '#e8eef8', guard: 2.4, guardCol: '#2a2230', curve: -2.5, tip: 3, grip: 6, pommel: false }),
}

const PIRATE: GearFF = {
  name: 'Pirate', sleeve: '#2f5aa8', legs: '#5a3a30', boots: '#2e2420', cuff: '#d8c8a0', gloves: '#c8b890', hatLine: true,
  back: (r, g) => cloak(r, g, '#7a2030', { len: 10, trail: 10 }),
  chest: (r, g) => {
    const shirt = R('#ece4d0', { k: 0.6 }), gold = metalR(GOLD)
    fillTorso(r, g, R('#2f5aa8'))
    r.fill([g.tcx - 4, g.neck, g.tcx + 5, g.waist], (x, y) => Math.abs(x - g.tcx - 0.5) < (g.waist - y) * 0.24 + 0.6, shirt, { tone: 3 })
    for (const s of [-1, 1]) for (const dy of [4, 8, 12]) { const y = g.sh + dy; if (y < g.waist - 1) { dot(r, Math.floor(g.tcx + 0.5 + s * 5), Math.floor(y), gold, 4); dot(r, Math.floor(g.tcx + 0.5 + s * 5), Math.floor(y) + 1, gold, 2) } }
  },
  over: (r, g) => {
    const coat = R('#2f5aa8'), gold = metalR(GOLD), [hx, hy] = g.hipC, hw = g.spec.hipW, len = g.sit ? 5 : 15
    for (const s of [-1, 1]) r.poly([[hx + s * 1.5, hy - 1], [hx + s * (hw + 1), hy - 1], [hx + s * (hw + 4.5), hy + len], [hx + s * 2.5, hy + len - 1]], coat, { bevel: 1.4, max: 4 })
    r.line(hx - hw - 4, hy + len - 0.6, hx - 2.5, hy + len - 1.2, gold, 3); r.line(hx + 2.5, hy + len - 1.2, hx + hw + 4.5, hy + len - 0.6, gold, 3)
    r.poly([[hx - hw - 1, g.waist - 1], [hx + hw + 1, g.waist - 1], [hx + hw + 1, g.waist + 3], [hx - hw - 1, g.waist + 3]], R('#c8302c'), { bevel: 1, max: 4 })
  },
  head: (r, g) => {
    const { cx, cy, rx, ry } = g.head, bk = R('#2a2638'), gold = metalR(GOLD), fe = R('#c8302c'), brow = cy - ry * 0.3
    r.ell(cx - 0.5, brow - 0.5, rx * 1.75, 2.4, bk, { flat: 0.6 })
    r.poly([[cx - rx, brow], [cx + rx, brow], [cx + rx * 0.7, brow - ry * 1.15], [cx, brow - ry * 1.45], [cx - rx * 0.8, brow - ry * 1.0]], bk, { cyl: [cx, rx], bevel: 1.3 })
    r.line(cx - rx, brow - 1.5, cx + rx, brow - 1.5, gold, 4, 1)
    r.poly([[cx + rx * 0.7, brow - ry], [cx + rx * 2.2, brow - ry * 1.9], [cx + rx * 1.8, brow - ry * 0.9]], fe, { bevel: 0.8 })
    r.tone(Math.floor(cx - rx * 1.7), Math.floor(brow - 1), gold, 4)
  },
  off: (r, g) => sword(r, { ...g, handR: g.handL, wdir: unit2(-0.4, -0.9) } as RigFF, { len: 9, w: 1.4, col: '#4a4a52', guard: 1.5, guardCol: '#b08a3a', grip: 5 }),
  weapon: (r, g) => sword(r, g, { len: 23, w: 1.9, col: STEEL, guard: 3.5, guardCol: GOLD, curve: 3, tip: 5 }),
}

const DEV: GearFF = {
  name: 'Dev', sleeve: '#4d8dff', legs: '#3a4a6a', boots: '#e8e8f0', cuff: '#ffffff', hatLine: false,
  back: (r, g) => {
    const pk = R('#e0902a'), c = g.tcx - 2, y = g.sh
    r.poly([[c - 8, y - 1], [c + 5, y - 1], [c + 6, y + 13], [c - 9, y + 13]], pk, { bevel: 2.2 }); r.rect(Math.floor(c - 6), Math.floor(y + 4), 9, 1, R('#a86418'), 2)
    r.poly([[g.head.cx - 8, g.neck - 1], [g.head.cx + 2, g.neck - 1], [g.head.cx + 2, g.neck + 4], [g.head.cx - 10, g.neck + 5]], R('#4d8dff'), { bevel: 1.2 })
  },
  chest: (r, g) => {
    const ink = R('#f4f4f8', { k: 0.4 })
    fillTorso(r, g, R('#4d8dff'))
    const x = Math.floor(g.tcx - 4), y = Math.floor(g.sh + 3)
    for (const [dx, dy] of [[1, 0], [0, 1], [0, 2], [-1, 3], [0, 4], [0, 5], [1, 6], [5, 0], [6, 1], [6, 2], [7, 3], [6, 4], [6, 5], [5, 6]] as const) r.tone(x + dx, y + dy, ink, 4)
    r.fill([g.tcx - 5, g.waist - 4, g.tcx + 6, g.waist - 1], () => true, R('#3a7ae8'), { tone: 2 })
  },
  head: (r, g) => {
    const { cx, cy, rx, ry } = g.head, bd = R('#2a2a3a'), cup = R('#e0443a')
    r.poly([[cx - rx - 1, cy + ry * 0.1], [cx - rx, cy - ry * 0.9], [cx, cy - ry * 1.25], [cx + rx * 0.9, cy - ry * 0.9], [cx + rx * 0.95, cy - ry * 0.55], [cx, cy - ry * 0.95], [cx - rx + 1.5, cy - ry * 0.6]], bd, { bevel: 0.9 })
    r.ell(cx - rx * 0.78, cy + ry * 0.22, 2.4, 3.2, cup, { max: 4 }); r.ell(cx - rx * 0.78, cy + ry * 0.22, 1.2, 1.8, R('#2a2a3a'), { tone: 2 })
  },
  off: (r, g) => {
    const [x, y] = g.handL, duck = R('#ffe45e', { k: 0.9 }), beak = R('#ff8a1f'), rr = g.spec.armR * 2.7
    shieldShape(r, inRound(x, y, rr, rr), [x - rr - 1, y - rr - 1, x + rr + 1, y + rr + 1], duck, R('#e0a020'), 1.2)
    r.ell(x + 1, y - 0.5, rr * 0.6, rr * 0.55, duck, { bias: 0.15 })
    r.rect(Math.floor(x + rr * 0.55), Math.floor(y - 1), 3, 2, beak, 3); r.tone(Math.floor(x + 1), Math.floor(y - 2), R('#2a2230'), 3)
  },
  weapon: (r, g) => {
    const [top, u] = poleFF(r, g, wlen(g, 12), 6, '#c8b898', 1)
    const v: V2 = [-u[1], u[0]], hd = R('#e0443a', { k: 0.9 }), key = R('#f4f4f8', { k: 0.5 })
    r.poly([[top[0] - v[0] * 8 - u[0] * 2, top[1] - v[1] * 8 - u[1] * 2], [top[0] + v[0] * 8 - u[0] * 2, top[1] + v[1] * 8 - u[1] * 2], [top[0] + v[0] * 8 + u[0] * 9, top[1] + v[1] * 8 + u[1] * 9], [top[0] - v[0] * 8 + u[0] * 9, top[1] - v[1] * 8 + u[1] * 9]], hd, { bevel: 1.4 })
    for (let a = -6; a <= 6; a += 3) for (let b = 0; b <= 6; b += 3) dot(r, Math.floor(top[0] + v[0] * a + u[0] * b + 0.5), Math.floor(top[1] + v[1] * a + u[1] * b + 0.5), key, 4)
  },
}

const CLERIC: GearFF = {
  name: 'Cleric', sleeve: '#e8e4d8', legs: '#d8d4c4', boots: '#e8e4d8', cuff: '#f2c94c', greave: '#d8dce8', gloves: '#f2f0e8', hatLine: false,
  back: (r, g) => {
    const { cx, cy, rx, ry } = g.head, gold = metalR(GOLD), wr = R('#f8f8ff', { k: 0.75, sat: 0.5 })
    for (const s of [-1, 1]) {
      const root: V2 = [g.tcx + s * 3, g.sh + 2]
      for (let i = 0; i < 5; i++) { const ang = -0.5 + i * 0.3, len = 17 - i * 1.7; r.cap(root[0], root[1], root[0] + s * Math.cos(ang) * len * (s < 0 ? 1.15 : 0.8), root[1] + Math.sin(ang) * len + 2, 2.3, 1, wr, { max: 4, bias: -0.04 * i }) }
    }
    // halo
    const hxc = cx - 2, hyc = cy - ry - 3.5
    r.fill([hxc - 8, hyc - 4, hxc + 8, hyc + 4], (x, y) => { const d = ((x - hxc) / 7) ** 2 + ((y - hyc) / 2.6) ** 2; return d <= 1 && d >= 0.42 }, gold, { n: (x, y) => norm((x - hxc) / 7, (y - hyc) / 3, 1) })
    void rx
  },
  chest: (r, g) => {
    const wh = R('#f4f0e4', { k: 0.6 }), gold = metalR(GOLD)
    fillTorso(r, g, wh)
    const x = Math.floor(g.tcx), y = Math.floor(g.sh + 3)
    r.ell(g.tcx + 0.5, y + 4, 4, 4, gold); r.ell(g.tcx + 0.5, y + 4, 2.4, 2.4, R('#ffe9a0', { k: 1.1 })); dot(r, x - 1, y + 2, R('#ffffff'), 5)
    r.line(g.tcx - 12, g.waist, g.tcx + 12, g.waist, gold, 3, 2)
  },
  over: (r, g) => {
    const wh = R('#f4f0e4', { k: 0.6 }), gold = metalR(GOLD)
    skirt(r, g, wh, { len: g.spec.leg * 0.5, flare: 4, trim: gold })
    pauldron(r, g, false, '#d8dce8', GOLD, 0.9); pauldron(r, g, true, '#d8dce8', GOLD, 1)
  },
  head: (r, g) => {
    const { cx, cy, rx, ry } = g.head, gold = metalR(GOLD)
    r.line(cx - rx * 0.9, cy - ry * 0.62, cx + rx * 0.9, cy - ry * 0.78, gold, 4, 1)
    r.ell(cx + rx * 0.1, cy - ry * 0.75, 1.5, 1.5, R('#ffe9a0', { k: 1.1 })); r.tone(Math.floor(cx + rx * 0.1), Math.floor(cy - ry * 0.8), R('#ffffff'), 5)
  },
  off: (r, g) => {
    const [x, y] = g.handL, rr = g.spec.armR * 2.8
    shieldShape(r, inRound(x, y, rr, rr), [x - rr - 1, y - rr - 1, x + rr + 1, y + rr + 1], R('#f4f0e4', { k: 0.6 }), metalR(GOLD), 1.4)
    r.ell(x, y, 2, 2, R('#ffe9a0', { k: 1.1 }))
    for (const [dx, dy] of [[0, -3.6], [3.6, 0], [-3.6, 0], [0, 3.6]] as const) dot(r, Math.floor(x + dx), Math.floor(y + dy), R('#ffe9a0'), 4)
  },
  weapon: (r, g) => {
    const [top, u] = poleFF(r, g, wlen(g, 22), 8, '#8a5a32', 1.1), gold = metalR(GOLD), c: V2 = [top[0] + u[0] * 2.5, top[1] + u[1] * 2.5]
    r.ell(c[0], c[1], 3.4, 3.4, gold)
    for (const [dx, dy] of [[0, -4.6], [4.6, 0], [-4.6, 0], [3.3, -3.3], [-3.3, -3.3], [0, 4.6]] as const) r.ell(c[0] + dx, c[1] + dy, 1.2, 1.2, gold)
    r.ell(c[0], c[1], 1.6, 1.6, R('#ffe9a0', { k: 1.1 }))
  },
}

export const GEAR_FF: GearFF[] = [KNIGHT, WIZARD, KING, ROGUE, SAMURAI, PIRATE, DEV, CLERIC]
export { mixc }
