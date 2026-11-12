// The hero: a little orange crab, drawn front on. Canvas 30 by 28, center line between x 14 and x 15.
// Crab first: the eyes on their stalks sit in front of hats and masks, the orange shell shows around a small chest piece, the claws hold a weapon (right) and a shield (left).
import { Cells, TallCells, mix, shade } from './core'
import type { Pal, Part, Rect, Sprite } from './core'

export const CW = 30
export const CH = 28
export const DY = 4
export const CX = 15
export type Pose = 'stand' | 'walk' | 'attack' | 'cast' | 'sit' | 'dig' | 'mine' | 'dead' | 'active'
export const POSES: Pose[] = ['stand', 'walk', 'attack', 'cast', 'sit', 'dig', 'mine', 'dead', 'active']

export const CRAB = { b: '#e8743c', l: '#f9a672', d: '#b9502a', o: '#5a2210', c: '#f8d3a8' }
type CrabPal = Pal & { o: string; d: string; t: string; P: string }
export const crabPal = (trim: string, ghost = false): CrabPal => {
  const p: CrabPal = { b: CRAB.b, l: CRAB.l, d: CRAB.d, o: CRAB.o, c: CRAB.c, W: '#ffffff', P: '#1a1220', t: trim, T: shade(trim, -0.35) }
  if (ghost) for (const k of Object.keys(p)) if (k !== 'P') p[k] = mix(p[k] ?? '#ffffff', '#c9d8ff', 0.55)
  return p
}

/** Shell half: 8 columns, x 7..14, mirrored to x 15..22. */
const SHELL = '......oo/....oobb/...obbbb/..obbbbb/.obllbbb/.oblbbbb/obbbbbbb/obbbbbbb/obbbbbbd/.obbbddd/..ooodd.'
/** The shell's cells at body drop `by`, canvas key (y * CW + x) to grid letter: `o` the outline, `b` `l` `d` the orange. Gear reads it to stay off the orange. */
export const shellAt = (by: number) => new Cells(CW, CH).paint(SHELL, { o: 'o', b: 'b', l: 'l', d: 'd' }, 7, 10 + by, 1).m
/** Claw, tips up, 7 by 6. */
const CLAW = '.oo.oo./obbobbo/obllbbo/obbbbbo/.obbbo./..ooo..'
const CLAW_OPEN = 'oo...oo/obo.obo/obbobbo/obllbbo/.obbbo./..ooo..'

export type CrabOpts = { pose: Pose; trim: string; frame?: number }
export type Anchors = { grip: [number, number]; hold: [number, number]; by: number; lc: number; rc: number }

/** Where the claws and body sit in each pose: left claw top, right claw top, body drop. */
const POSE: Record<Pose, { lc: number; rc: number; by: number; open?: boolean; eyes?: 'ok' | 'x' | 'rest' }> = {
  stand: { lc: 10, rc: 10, by: 0 },
  walk: { lc: 10, rc: 10, by: 0 },
  attack: { lc: 10, rc: 5, by: 0, open: true },
  cast: { lc: 5, rc: 5, by: 0, open: true },
  sit: { lc: 12, rc: 6, by: 2, eyes: 'rest' },
  dig: { lc: 10, rc: 9, by: 0 },
  mine: { lc: 9, rc: 4, by: 0 },
  dead: { lc: 12, rc: 12, by: 1, eyes: 'x' },
  active: { lc: 7, rc: 7, by: 0, open: true },
}

/** Anchors for gear: the weapon's grip pixel and the shield's grip pixel, in canvas pixels. */
export const anchors = (pose: Pose): Anchors => {
  const p = POSE[pose]
  return { grip: [CX + 10, p.rc + DY + 3], hold: [CX - 10, p.lc + DY + 3], by: p.by + DY, lc: p.lc + DY, rc: p.rc + DY }
}

/** The back layer, shell, face: everything that does not move on its own. Gear layers are painted between by the caller. */
export const crabParts = (o: CrabOpts, gear: { back?: (c: Cells) => void; chest?: (c: Cells) => void; head?: (c: Cells) => void; mask?: (c: Cells) => void; weapon?: (c: Cells) => void; off?: (c: Cells) => void } = {}): Sprite => {
  const p = POSE[o.pose]
  const ghost = o.pose === 'dead'
  const pal = crabPal(o.trim, ghost)
  const by = p.by + DY
  const body = new Cells(CW, CH)
  // Crab first: the back, the hat and the mask go behind the shell and the eyes, so the orange and the eyes always show.
  gear.back?.(body)
  gear.head?.(body)
  gear.mask?.(body)
  body.paint(SHELL, pal, 7, 10 + by, 1)
  // face: a small smile and the class gem
  const sm: [number, number][] = o.pose === 'dead' ? [] : [[13, 16], [14, 17], [15, 17], [16, 16]]
  for (const [x, y] of sm) body.put(x, y + by, pal.o)
  body.rect(14, 18 + by, 2, 1, pal.t)
  gear.chest?.(body)
  const eyes = new Cells(CW, CH)
  // three white cells and a pupil low on the right, looking at the foes: reads at band size in front of any hat
  const eyeL = '.oo./oWWo/oWPo/.oo.'
  const eyeR = '.oo./oWWo/oWPo/.oo.'
  const ep: Pal = { ...pal, X: pal.P }
  if (p.eyes === 'x') {
    eyes.paint('.oo./oXWo/oWXo/.oo.', ep, 9, 7 + by).paint('.oo./oWXo/oXWo/.oo.', ep, 17, 7 + by)
  } else if (p.eyes === 'rest') {
    eyes.paint('.oo./oWWo/oPPo/.oo.', pal, 9, 7 + by).paint('.oo./oWWo/oPPo/.oo.', pal, 17, 7 + by)
  } else {
    eyes.paint(eyeL, pal, 9, 7 + by).paint(eyeR, pal, 17, 7 + by)
  }
  eyes.rect(10, 11 + by, 2, 1, pal.d)
  eyes.rect(18, 11 + by, 2, 1, pal.d)

  const mkClaw = (left: boolean, top: number) => {
    const c = new Cells(CW, CH)
    const rows = p.open ? CLAW_OPEN : CLAW
    const ox = left ? 2 : 21
    // arm from the shell to the claw
    const ax = left ? 7 : 22
    c.rect(ax - (left ? 1 : 0), top + 6, 2, Math.max(1, 15 + by - top - 6), pal.d)
    c.rect(ax - (left ? 1 : 0), top + 6, 1, Math.max(1, 15 + by - top - 6), pal.o)
    c.paint(rows, pal, ox, top, 0)
    return c
  }
  const parts: Part[] = []
  const flat = (c: Cells) => c.rects()
  parts.push({ rects: flat(body) })
  parts.push({ rects: flat(eyes) })
  // legs: three a side, in two groups that alternate when walking
  const legs = (group: number) => {
    const c = new Cells(CW, CH)
    const lx = [8, 10, 12]
    for (let i = 0; i < 3; i++) {
      if (o.pose === 'sit') continue
      const x = lx[i] ?? 8
      // left leg i belongs to group (i % 2), right leg i to group ((i + 1) % 2)
      if (i % 2 === group) { c.put(x, 21 + by, pal.d); c.put(x - 1, 22 + by, pal.o); c.put(x, 22 + by, pal.o) }
      if ((i + 1) % 2 === group) { const rx = CW - 1 - x; c.put(rx, 21 + by, pal.d); c.put(rx + 1, 22 + by, pal.o); c.put(rx, 22 + by, pal.o) }
    }
    return c
  }
  parts.push({ cls: 'l1', rects: flat(legs(0)) })
  parts.push({ cls: 'l2', rects: flat(legs(1)) })
  parts.push({ cls: 'cl', rects: flat(mkClaw(true, p.lc + DY)) })
  const rc = mkClaw(false, p.rc + DY)
  parts.push({ cls: 'cr', rects: flat(rc) })
  if (gear.off) { const c = new Cells(CW, CH); gear.off(c); parts.push({ cls: 'off', rects: flat(c) }) }
  if (gear.weapon) { const c = new TallCells(CW, CH, 14); gear.weapon(c); parts.push({ cls: 'wpn', rects: flat(c) }) }
  return { w: CW, h: CH, parts }
}
