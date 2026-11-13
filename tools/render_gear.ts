// Gear sheets for H1 (task-28): twelve loadouts in the real day and night frames, plus one row per slot. Pure PNG output, no browser.
//   npx --no-install tsx tools/render_gear.ts            -> $OUT/gear-sheet.png and gear-night.png
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Item, Rarity, Slot } from '../types'
import { P, Px } from '../hooks/sprites/pixel2/core'
import { png } from './sheet'
import { gearHero, lookOf, paintMotes, AURA_PAD, AURA_ALPHA, type Look, type AuraKind } from '../hooks/sprites/pixel2/gear'
import { world, shadowLayer, foePx, litOf, textPx, type Time, type Pose } from '../hooks/sprites/pixel2'

const OUT = process.env.OUT ?? join(import.meta.dirname, '..', 'docs', 'art', 'styles')
mkdirSync(OUT, { recursive: true })

import { LOADOUTS, it, put } from './gear_loadouts'

/** Zoomed blit onto a canvas. */
const blitZ = (dst: Px, src: Px, x: number, y: number, z: number) => {
  for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) { const c = src.get(i, j); if (c !== undefined) dst.rect(x + i * z, y + j * z, z, z, c) }
}
const label = (dst: Px, s: string, x: number, y: number, z = 2, color: string = P.cream) => blitZ(dst, textPx(s, color), x, y, z)
const crop = (p: Px, x0: number, y0: number, w: number, h: number) => { const o = new Px(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o.set(x, y, p.get(x0 + x, y0 + y)); return o }

const rgb = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] as const
const mixHex = (a: string, b: string, t: number) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i]! - v) * t).toString(16).padStart(2, '0')).join('')
/** A pixel buffer as a true color PNG (the aura is blended, so the sheets have more than 255 colors). */
const pngOf = (p: Px) => { const o = new Uint8Array(p.w * p.h * 4); p.c.forEach((c, i) => { if (c) { const [r, g, b] = rgb(c); o.set([r, g, b, 255], i * 4) } }); return png(p.w, p.h, o) }
/** Lay the aura under a hero: the glow oval at its opacity over whatever is there, then the ground ring and the motes at full strength. */
const layAura = (dst: Px, g: ReturnType<typeof gearHero>, ox: number, oy: number, under: string) => {
  if (!g.aura) return
  for (let j = 0; j < g.aura.h; j++) for (let i = 0; i < g.aura.w; i++) { const c = g.aura.get(i, j); if (c) dst.set(ox + i, oy + j, mixHex(dst.get(ox + i, oy + j) ?? under, c, AURA_ALPHA)) }
  if (g.ring) dst.blit(g.ring, ox, oy)
  paintMotes(dst, g.motes ?? [], ox, oy)
}

const HX = 18, AWID = 360, AHGT = 60, FY = 57, FRAME_W = 190
/** The real band frame (meadow, a slime in the pack) with a loadout in it, in art pixels. Auras stay bright at night. */
const gearFrame = (look: Look, time: Time) => {
  const v = time === 'night' ? 'V3' : time === 'dusk' ? 'V2' : 'V1'
  const bg = world(v, AWID, AHGT, AHGT - 75, FY - 63 - (AHGT - 75), { x: HX + 26, y: 17 })
  const g = gearHero(look), px = litOf(g.hero.px, time, true), x = HX - g.hero.feetX, y = FY - px.h + 1
  const slime = litOf(foePx({ creature: 'slime' }), time, false), sx = Math.round(AWID * 0.4)
  bg.blit(shadowLayer(bg, [{ cx: HX + 2, w: 8 }, { cx: sx + (slime.w >> 1), w: 5 }], FY, v), 0, 0)
  bg.blit(slime, sx, FY - slime.h + 1)
  layAura(bg, g, x - AURA_PAD, y - AURA_PAD, '#000000')
  bg.blit(px, x, y)
  return crop(bg, 0, 0, FRAME_W, AHGT)
}
/** The hero alone with his aura, on a clear buffer (for reading at 3x the real size). */
const worlds = new Map<string, Px>()
const worldOf = (time: Time) => {
  const v = time === 'night' ? 'V3' : time === 'dusk' ? 'V2' : 'V1'
  let w = worlds.get(v)
  if (!w) { w = world(v, AWID, AHGT, AHGT - 75, FY - 63 - (AHGT - 75), { x: HX + 26, y: 17 }); worlds.set(v, w) }
  return w
}
const heroAlone = (look: Look, time: Time, bgc?: string, pose: Pose = 'stand') => {
  const g = gearHero(look, pose), o = new Px(g.hero.px.w + AURA_PAD * 2, g.hero.px.h + AURA_PAD * 2, bgc)
  if (!bgc) {
    // the real meadow behind him (open ground, away from the tree) so the aura's opacity reads as it will in the band
    const w = worldOf(time), yOff = FY - (g.hero.px.h - 1) - AURA_PAD
    for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) o.set(i, j, w.get(100 + i, Math.min(w.h - 1, Math.max(0, j + yOff))))
  }
  layAura(o, g, 0, 0, bgc ?? '#000000')
  o.blit(litOf(g.hero.px, time, true), AURA_PAD, AURA_PAD)
  return o
}
const tiles = (list: { label: string; gear: Partial<Record<Slot, Item>> }[], time: Time, cols: number) => {
  const readW = (48 + 2 + AURA_PAD * 2) * 6, tw = FRAME_W * 2 + 10 + readW + 24, th = Math.max(AHGT * 2, (59 + AURA_PAD * 2) * 6) + 34
  const rows = Math.ceil(list.length / cols), out = new Px(cols * tw + 8, rows * th + 8, time === 'night' ? '#1b1626' : P.ink)
  list.forEach((l, n) => {
    const x0 = 8 + (n % cols) * tw, y0 = 8 + Math.floor(n / cols) * th, look = lookOf(l.gear)
    label(out, `${list === LOADOUTS ? n + 1 : n + 1}. ${l.label}`, x0, y0, 2)
    blitZ(out, gearFrame(look, time), x0, y0 + 20, 2)
    blitZ(out, heroAlone(look, time), x0 + FRAME_W * 2 + 10, y0 + 20, 6)
  })
  return out
}

// ---------- one row per slot: every part alone on H1's default kit ----------
const row = (title: string, cells: { label: string; look: Look }[], z = 4, bg: string = P.ink, meadow = false) => {
  const cw = (48 + 2 + AURA_PAD * 2) * z + 10, ch = (59 + AURA_PAD * 2) * z + 20
  const out = new Px(cells.length * cw + 8, ch + 26, bg)
  label(out, title, 8, 4, 2, P.gold)
  cells.forEach((c, i) => { blitZ(out, heroAlone(c.look, 'day', meadow ? undefined : bg), 8 + i * cw, 24, z); label(out, c.label, 8 + i * cw + 4, 24 + (59 + AURA_PAD * 2) * z + 4, 1 + (z > 3 ? 1 : 0), P.cloud) })
  return out
}
const stackY = (parts: Px[], gap = 6, bg: string = P.ink) => {
  const w = Math.max(...parts.map(p => p.w)), h = parts.reduce((s, p) => s + p.h + gap, gap), out = new Px(w, h, bg)
  let y = gap
  for (const p of parts) { out.blit(p, 0, y); y += p.h + gap }
  return out
}

const base = (slot: Slot, b: string, name = b, r: Rarity = 'magic', x: Partial<Item> = {}) => it(slot, b, name, r, x)
const lk = (...items: Item[]) => lookOf(put(...items))
const withSword = (...items: Item[]) => lk(base('weapon', 'Mechanical Keyboard', 'Mechanical Keyboard', 'normal'), ...items)
const slotRows = (): Px[] => {
  const W: [string, string, string][] = [['SWORD', 'Mechanical Keyboard', 'Mechanical Keyboard'], ['DAGGER', 'Laser Pointer', 'Laser Pointer'], ['AXE', 'Rubber Mallet', 'Friday Deploy'], ['MACE', 'Ethernet Flail', 'Ethernet Flail'], ['HAMMER', 'Rubber Mallet', 'Rubber Mallet'], ['STAFF', 'Debugger Staff', 'Debugger Staff'], ['WAND', 'Soldering Wand', 'Soldering Wand'], ['SPEAR', 'Stack Trace Spear', 'Stack Trace Spear']]
  const rows: Px[] = []
  rows.push(row('WEAPON  (BASE NAME PICKS THE SHAPE, UNIQUES AND SETS BY NAME)', [{ label: 'DEFAULT KIT', look: lk() }, ...W.map(([l, b, n]) => ({ label: l, look: n === 'Friday Deploy' ? { ...lk(base('weapon', b, n, 'unique')), auras: [] } : lk(base('weapon', b, n, 'magic')) }))]))
  rows.push(row('OFF-HAND', [{ label: 'DEFAULT KIT', look: lk() }, ...['Rubber Duck Shield:ROUND', 'Second Monitor:KITE', 'Orb of Coffee:ORB', 'Grimoire of Docs:TOME', 'Quiver of Tabs:QUIVER'].map(s => { const [b, l] = s.split(':') as [string, string]; return { label: l, look: withSword(base('offhand', b)) } }), { label: 'EMPTY (BARE HAND)', look: withSword() }]))
  const H: [string, string, Rarity][] = [['CAP', 'Thinking Cap', 'magic'], ['HOOD', 'Hoodie Hood', 'magic'], ['HALF HELM', 'Noise-Cancelling Helm', 'normal'], ['FULL HELM', 'Noise-Cancelling Helm', 'rare'], ['VISOR', 'VR Visor', 'magic'], ['HEADSET', 'Headset of Standups', 'magic'], ['CROWN', 'Modal Crown', 'set'], ['CIRCLET', 'Monad of Understanding', 'rare']]
  rows.push(row('HEAD  (HAIR SHOWS UNDER THE OPEN ONES)', [{ label: 'NONE', look: lk() }, ...H.map(([l, b, r]) => ({ label: l, look: withSword(base('head', b, b, r)) }))]))
  const C: [string, string][] = [['TUNIC', 'Conference Tee'], ['LEATHER', 'Kevlar Cardigan'], ['MAIL', 'Chainmail of Linting'], ['PLATE', 'Flannel Plate'], ['ROBE', 'Hoodie of Holding']]
  rows.push(row('CHEST  (SAME BUILD, SAME BELT)', [{ label: 'DEFAULT TUNIC', look: lk() }, ...C.map(([l, b]) => ({ label: l, look: withSword(base('chest', b)) }))]))
  const backs: { label: string; look: Look }[] = []
  for (let n = 0; backs.length < 11; n++) {
    const look = lk(base('neck', 'Lanyard Amulet', `Amulet ${n * 7919}`), base('weapon', 'Mechanical Keyboard', 'Mechanical Keyboard', 'normal'))
    const key = `${look.back?.cut}${look.back?.color}`
    if (backs.some(b => `${b.look.back?.cut}${b.look.back?.color}` === key || (b.look.back?.cut === look.back?.cut && backs.filter(q => q.look.back?.cut === look.back?.cut).length >= 3))) continue
    backs.push({ label: `${look.back?.cut.toUpperCase()} ${look.back?.color}`, look })
  }
  rows.push(row('BACK  (CUT AND COLOR FROM THE NECK ITEM NAME)', [{ label: 'DEFAULT RED', look: lk() }, ...backs], 3))
  const R: Rarity[] = ['normal', 'magic', 'rare', 'unique', 'set']
  rows.push(row('RARITY ON TRIM AND METAL', R.map(r => ({ label: r === 'unique' ? 'UNIQUE + POWER AURA' : r.toUpperCase(), look: lk(base('weapon', 'Mechanical Keyboard', 'Mechanical Keyboard', r), base('offhand', 'Second Monitor', 'Second Monitor', r), base('head', 'Noise-Cancelling Helm', 'x', r, { ilvl: 40 }), base('chest', 'Chainmail of Linting', 'x', r)) }))))
  const A: [string, AuraKind[]][] = [['UNIQUE POWER', ['unique']], ['SET BONUS 2', ['set2']], ['SET BONUS 4', ['set4']], ['ANCIENT', ['ancient']], ['PRIMAL', ['primal']], ['PRIMAL + SET 4', ['primal', 'set4']]]
  rows.push(row('AURAS  (LIGHT AT 45% BEHIND H1, GROUND RING, MOTES)', A.map(([l, ks]) => ({ label: l, look: { ...lk(base('weapon', 'Mechanical Keyboard', 'Mechanical Keyboard', 'normal')), auras: ks } })), 4, P.ink, true))
  const G = [0, 1, 4, 7, 10, 13, 15]
  rows.push(row('UPGRADE GLOW  (METAL CATCHES LIGHT, THEN SPARKLES, THEN LIGHT BEHIND THE BLADE)', G.map(p => ({ label: p ? `+${p}` : '+0', look: lk(base('weapon', 'Mechanical Keyboard', 'Mechanical Keyboard', 'rare', { plus: p }), base('offhand', 'Second Monitor', 'Second Monitor', 'rare', { plus: p }), base('head', 'Noise-Cancelling Helm', 'x', 'rare', { plus: p }), base('chest', 'Flannel Plate', 'x', 'rare', { plus: p })) }))))
  return rows
}

const arg = process.argv[2] ?? 'all'
if (arg === 'all' || arg === 'sheet') {
  const day = tiles(LOADOUTS, 'day', 3)
  const rows = stackY(slotRows(), 6)
  const sheet = stackY([day, rows], 12)
  writeFileSync(join(OUT, 'gear-sheet.png'), pngOf(sheet))
  console.log('gear-sheet.png', sheet.w, sheet.h)
}
if (arg === 'all' || arg === 'night') {
  const pick = [3, 6, 9, 11].map(i => LOADOUTS[i]!)
  const night = tiles(pick, 'night', 2)
  writeFileSync(join(OUT, 'gear-night.png'), pngOf(night))
  console.log('gear-night.png', night.w, night.h)
}

if (arg === 'dev') {
  writeFileSync(join(OUT, 'dev-tiles-a.png'), pngOf(tiles(LOADOUTS.slice(0, 6), 'day', 3)))
  writeFileSync(join(OUT, 'dev-tiles-b.png'), pngOf(tiles(LOADOUTS.slice(6), 'day', 3)))
  slotRows().forEach((r, i) => writeFileSync(join(OUT, `dev-row${i}.png`), pngOf(r)))
}

if (arg === 'poses') {
  // every pose for a spread of loadouts, on the real meadow at 3x: the evidence that gear moves with the pose
  const poses: Pose[] = ['stand', 'swing', 'sit', 'rod', 'pick', 'pickDown', 'shovel', 'shovelDown', 'dead']
  const picks = (process.env.PICKS ?? '0,3,4,5,6,9,11').split(',').map(Number)
  const z = 3, cw = (48 + 2 + AURA_PAD * 2) * z + 6, ch = (59 + AURA_PAD * 2) * z + 6
  const time = (process.env.TIME ?? 'day') as Time
  const out = new Px(poses.length * cw + 8, picks.length * ch + 8, P.ink)
  picks.forEach((li, r) => poses.forEach((pose, c) => blitZ(out, heroAlone(lookOf(LOADOUTS[li]!.gear), time, undefined, pose), 8 + c * cw, 8 + r * ch, z)))
  writeFileSync(join(OUT, `dev-poses-${time}.png`), pngOf(out))
  console.log('dev-poses', out.w, out.h)
}
