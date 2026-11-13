// Renders the hero look comparisons from hooks/sprites/hero-options.ts (nearest neighbour PNGs, no browser, no installs).
//   npx --no-install tsx tools/render_hero_options.ts [--only ABC] [--zoom 3] [--out dir] [--sheet] [--scene]
//   npx --no-install tsx tools/render_hero_options.ts --adv [--only 1357] [--sheet] [--scene] [--random 18]
// Writes hero-options.png (one row per option: 8 gear sets in attack and sit at --zoom, then the same at true size) and
// hero-options-scene.png (one band-size fight scene per option). With no --sheet or --scene it writes both.
// --adv draws the task-19 adventurers instead (adventurer-options*.png) and adventurer-random.png: for the two variants named
// by --random, 12 random looks bare, then the same 12 with random gear.
//   npx --no-install tsx tools/render_hero_options.ts --s [--only S1S2] [--sheet] [--scene]
// --s draws the task-21 round 2 16-bit candidates (hooks/sprites/hero-s.ts): hero-s.png and hero-s-scene.png.
//   npx --no-install tsx tools/render_hero_options.ts --ff [--only T1T2] [--sheet] [--scene] [--measure]
// --ff draws the task-21 Final Fantasy era proportion study (hooks/sprites/hero-ff.ts): hero-ff.png, hero-ff-scene.png, and with --measure prints sizes.
//   npx --no-install tsx tools/render_hero_options.ts --b32 [--sheet] [--scene] [--measure]
// --b32 draws the task-20 32-bit test (hooks/sprites/hero-32bit.ts): hero-32bit.png, hero-32bit-scene.png, and with --measure
// prints bytes and build time for SVG rects against a PNG data URI.
import { join, resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { Canvas } from './sheet'
import { crabSprite, foeSprite } from '../hooks/sprites'
import type { Sprite } from '../hooks/sprites/core'
import { ADVENTURERS, GEAR_SETS, OPTIONS, heroSprite, randomGear, randomLook } from '../hooks/sprites/hero-options'
import { FOOT32, GEAR32, H32, W32, colorsOf, hero32, spriteOf } from '../hooks/sprites/hero-32bit'
import type { Hero32, Img32, Pose32 } from '../hooks/sprites/hero-32bit'
import { draw } from '../hooks/sprites/core'
import { FOOTFF, GEAR_FF, LOOKS_FF, heroFF, spriteOf as spriteOfFF } from '../hooks/sprites/hero-ff'
import type { FFId, PoseFF } from '../hooks/sprites/hero-ff'
import { FOOTS, GEAR_S, KNIGHT_S, colorsOf as colorsOfS, heroS, spriteOf as spriteOfS } from '../hooks/sprites/hero-s'
import type { SId } from '../hooks/sprites/hero-s'
import { deflate, encodePng, pngImage } from '../hooks/png'
import { deflateSync } from 'node:zlib'
import { sceneSvg } from '../hooks/art'
import { newHero } from '../hooks/game'
import type { Hero, Item, Rarity, Slot } from '../types'
import type { AdvId, HeroId, HeroPose } from '../hooks/sprites/hero-options'

const ROOT = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const arg = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const OUT = resolve(arg('--out') ?? join(ROOT, 'docs', 'art', 'samples'))
const zoom = Number(arg('--zoom') ?? 3)
const adv = args.includes('--adv')
const only = arg('--only') ?? (adv ? '12345678' : 'ABCDEFGHIJ')
const opts: { id: HeroId; name: string }[] = adv ? ADVENTURERS.filter(o => only.includes(o.id.slice(1))) : OPTIONS.filter(o => only.includes(o.id))
const NAME = adv ? 'adventurer-options' : 'hero-options'
const b32 = args.includes('--b32')
const ffm = args.includes('--ff')
const fm = args.includes('--f')
const sm = args.includes('--s') || fm
const both = !b32 && !ffm && !sm && !args.includes('--sheet') && !args.includes('--scene') && !args.includes('--random')
const SKY = '#33261a', GROUND = '#7a5632', BG = '#16121e'

const extent = (sp: Sprite) => {
  let x0 = 99, y0 = 99, x1 = -99, y1 = -99
  for (const p of sp.parts) for (const [x, y, w, h] of p.rects) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h) }
  return { x0, y0, x1, y1 }
}
const put = (cv: Canvas, sp: Sprite, x: number, y: number, s: number) => { for (const p of sp.parts) cv.rects(p.rects, Math.round(x), Math.round(y), s, p.op ?? 1) }

if (!b32 && !ffm && !sm && (both || args.includes('--sheet'))) {
  const all = opts.flatMap(o => GEAR_SETS.flatMap(g => (['attack', 'sit'] as HeroPose[]).map(p => extent(heroSprite(o.id, p, g)))))
  const X0 = Math.min(0, ...all.map(e => e.x0)), X1 = Math.max(30, ...all.map(e => e.x1)), Y0 = Math.min(...all.map(e => e.y0)) - 1
  const FOOT = 34, GROUND_ROWS = 2
  const tw = (X1 - X0) * zoom + 4, th = (FOOT - Y0 + GROUND_ROWS) * zoom + 4
  const sw = X1 - X0 + 4, sh = FOOT - Y0 + GROUND_ROWS + 4
  const gut = 330, top = 40
  const small = 16 * sw
  const W = gut + 16 * tw + 12 + small, H = top + opts.length * (th + 6) + 6
  const cv = new Canvas(W, H, BG)
  cv.text(`${adv ? 'ADVENTURER VARIANTS' : 'HERO LOOK OPTIONS'}: THE SAME 8 GEAR SETS ON EVERY BODY. ATTACK AND SIT AT 3X, THEN TRUE SIZE`, 8, 6, 2, '#ffd23f')
  GEAR_SETS.forEach((g, i) => { cv.text(g.name.toUpperCase(), gut + i * tw + 4, 24, 2, '#9a90b0'); cv.text(g.name.toUpperCase(), gut + (8 + i) * tw + 4, 24, 2, '#9a90b0') })
  opts.forEach((o, r) => {
    const y = top + r * (th + 6)
    cv.text(o.id, 8, y + 8, 8, '#6ee07a')
    cv.text(o.name, 8, y + 64, 2, '#c8c0d8')
    cv.text('BARE', 8, y + 84, 2, '#9a90b0')
    put(cv, heroSprite(o.id, 'stand'), gut - (X1 - X0) * zoom - 2 - X0 * zoom, y + 2 - Y0 * zoom, zoom)
    ;(['attack', 'sit'] as HeroPose[]).forEach((pose, pi) => {
      GEAR_SETS.forEach((g, i) => {
        const x = gut + (pi * 8 + i) * tw
        cv.fill(x + 1, y, tw - 2, th, SKY); cv.fill(x + 1, y + (FOOT - Y0) * zoom + 2, tw - 2, GROUND_ROWS * zoom + 2, GROUND)
        put(cv, heroSprite(o.id, pose, g), x + 2 - X0 * zoom, y + 2 - Y0 * zoom, zoom)
      })
    })
    const sx0 = gut + 16 * tw + 12, sy = y + th - sh
    ;(['attack', 'sit'] as HeroPose[]).forEach((pose, pi) => {
      GEAR_SETS.forEach((g, i) => {
        const x = sx0 + (pi * 8 + i) * sw
        cv.fill(x, sy, sw, sh, SKY); cv.fill(x, sy + (FOOT - Y0) + 2, sw, GROUND_ROWS + 2, GROUND)
        put(cv, heroSprite(o.id, pose, g), x + 2 - X0, sy + 2 - Y0, 1)
      })
    })
  })
  cv.text('TRUE SIZE (1X)', gut + 16 * tw + 16, 24, 2, '#9a90b0')
  cv.save(join(OUT, `${NAME}.png`))
  console.log(`wrote ${join(OUT, `${NAME}.png`)} (${W}x${H})`)
}

if (!b32 && !ffm && !sm && (both || args.includes('--scene'))) {
  // The real band: 720 by 88, ground at 74%, the hero at 14% of the width, a pack of four at 56%. Drawn at 2x so the scale stays whole.
  const K = 2, BW = 720, BH = 88
  const ground = Math.round(BH * 0.74), u = BH / 40, hs = 1.5, s = hs * K
  const gut = 330, rowH = BH * K + 8
  const cv = new Canvas(gut + BW * K, 40 + opts.length * rowH, BG)
  cv.text('BAND SIZE FIGHT SCENE (720 BY 88, SHOWN AT 2X): KNIGHT SET, ATTACK POSE, SAME PACK', 8, 6, 2, '#ffd23f')
  const knight = GEAR_SETS[0]!
  const foe = foeSprite('Hardcoded Phantom Package', {})
  opts.forEach((o, r) => {
    const x0 = gut, y0 = 40 + r * rowH + 4
    cv.text(o.id, 8, y0 + 4, 8, '#6ee07a'); cv.text(o.name, 8, y0 + 64, 2, '#c8c0d8')
    cv.fill(x0, y0, BW * K, BH * K, SKY)
    const hills = [0.16, 0.3, 0.22, 0.34, 0.2, 0.28]
    for (let i = 0; i < BW; i++) { const h = BH * (0.12 + 0.18 * (hills[Math.floor((i / BW) * 5.99)] ?? 0.2) / 0.34 * 0.6); cv.fill(x0 + i * K, y0 + (ground - h) * K, K, h * K, '#2a1f15') }
    cv.fill(x0, y0 + ground * K, BW * K, (BH - ground) * K, GROUND)
    const hero = heroSprite(o.id, 'attack', knight)
    const hx = BW * 0.14
    put(cv, hero, x0 + hx * K, y0 + (ground - (hero.foot ?? 34) * hs) * K, s)
    const bx = BW * 0.56, span = BW * 0.34, barY = BH * 0.24
    for (let i = 0; i < 4; i++) {
      const fx = bx + (i * span) / 4 + (span / 4 - foe.w * hs) / 2
      put(cv, foe, x0 + fx * K, y0 + (ground - (i % 2) * hs - (foe.foot ?? foe.h) * hs) * K, s)
    }
    cv.fill(x0 + bx * K, y0 + barY * K, span * K, u * 1.6 * K, '#000', 0.6); cv.fill(x0 + bx * K, y0 + barY * K, span * 0.4 * K, u * 1.6 * K, '#c0392b')
    cv.fill(x0 + (hx + 6 * hs) * K, y0 + 3 * K, 18 * hs * K, u * K, '#000', 0.6); cv.fill(x0 + (hx + 6 * hs) * K, y0 + 3 * K, 18 * hs * 0.6 * K, u * K, '#2fd05a')
    cv.text('HARDCODED PHANTOM PACKAGE', x0 + bx * K, y0 + (barY - 11) * K, 3, '#e8e0d0')
    cv.text('18', x0 + (bx + span * 0.35) * K, y0 + (ground - 36) * K, 4, '#ffffff'); cv.text('17', x0 + (bx + span * 0.65) * K, y0 + (ground - 40) * K, 3, '#c8c0b0')
  })
  cv.save(join(OUT, `${NAME}-scene.png`))
  console.log(`wrote ${join(OUT, `${NAME}-scene.png`)}`)
}

if (!b32 && !ffm && !sm && adv && (both || args.includes('--random'))) {
  // Identity is random (D25): 12 seeded looks per variant, bare in stand, then the same 12 with a random full set in attack.
  const pickIds = (arg('--random') ?? '18').replace(/[^1-8]/g, '').slice(0, 2)
  const ids = [...pickIds].map(n => `V${n}` as AdvId)
  const N = 12, z = 4, tw = 40 * z, th = 48 * z, gut = 330, top = 40
  const sw = 44, small = N * sw
  const rowH = th + 10
  const cv = new Canvas(gut + N * tw + 20 + small, top + ids.length * 2 * rowH + 10, BG)
  cv.text('RANDOM HEROES: 12 SEEDED LOOKS (SKIN, HAIR STYLE AND COLOR, EYES, FACE DETAIL, ACCENT) BARE, THEN THE SAME 12 WITH RANDOM GEAR. 4X, THEN TRUE SIZE', 8, 6, 2, '#ffd23f')
  ids.forEach((id, r) => {
    const name = ADVENTURERS.find(a => a.id === id)?.name ?? id
    ;([false, true] as const).forEach((geared, gi) => {
      const y = top + (r * 2 + gi) * rowH
      cv.text(id, 8, y + 8, 8, '#6ee07a'); cv.text(name, 8, y + 64, 2, '#c8c0d8'); cv.text(geared ? 'RANDOM GEAR' : 'BARE', 8, y + 84, 2, '#9a90b0')
      for (let i = 0; i < N; i++) {
        const look = randomLook(i + 1), g = geared ? randomGear(i + 1) : undefined
        const sp = heroSprite(id, geared ? 'attack' : 'stand', g, look)
        const x = gut + i * tw
        cv.fill(x + 1, y, tw - 2, th, SKY); cv.fill(x + 1, y + th - 3 * z, tw - 2, 3 * z, GROUND)
        put(cv, sp, x + 5 * z, y + th - 3 * z - 34 * z, z)
        const sx = gut + N * tw + 20 + i * sw, sy = y + th - 48
        cv.fill(sx, sy, sw, 48, SKY); cv.fill(sx, sy + 45, sw, 3, GROUND)
        put(cv, sp, sx + 7, sy + 45 - 34, 1)
      }
    })
  })
  cv.save(join(OUT, 'adventurer-random.png'))
  console.log(`wrote ${join(OUT, 'adventurer-random.png')}`)
}

// ---- task-20: the 32-bit test ----
const all32 = b32 && !args.includes('--sheet') && !args.includes('--scene') && !args.includes('--measure')
const NAMES32: Record<Hero32, string> = { V1: 'CHIBI POLISHED', V8: 'SCARF RUNNER' }
const put32 = (cv: Canvas, img: Img32, x: number, y: number, s: number) => put(cv, spriteOf(img), x, y, s)

if (b32 && (all32 || args.includes('--sheet'))) {
  const Z = 3, T = W32 * Z, gut = 250, top = 46, rowH = T + 14
  const rows = (['V1', 'V8'] as Hero32[]).flatMap(id => (['attack', 'sit'] as Pose32[]).map(pose => ({ id, pose })))
  const sets = [undefined, ...GEAR32]
  const sx0 = gut + sets.length * (T + 4) + 20
  const cv = new Canvas(sx0 + sets.length * (W32 + 4) + 8, top + rows.length * rowH + 8, BG)
  cv.text('32-BIT TEST: V1 AND V8, BARE AND THE SAME 8 GEAR SETS, ATTACK AND SIT. 3X, THEN TRUE SIZE (ONE CELL IS ONE SCREEN PIXEL AT BAND SIZE)', 8, 6, 2, '#ffd23f')
  sets.forEach((g, i) => { const n = (g?.name ?? 'bare').toUpperCase(); cv.text(n, gut + i * (T + 4) + 4, 26, 2, '#9a90b0'); cv.text(n.slice(0, 4), sx0 + i * (W32 + 4), 26, 2, '#9a90b0') })
  cv.text('TRUE SIZE (1X):', sx0, 6, 2, '#ffd23f')
  let most = 0
  rows.forEach(({ id, pose }, r) => {
    const y = top + r * rowH
    cv.text(id, 8, y + 8, 8, '#6ee07a'); cv.text(NAMES32[id], 8, y + 64, 2, '#c8c0d8'); cv.text(pose.toUpperCase(), 8, y + 84, 2, '#9a90b0')
    sets.forEach((g, i) => {
      const img = hero32(id, pose, g)
      most = Math.max(most, colorsOf(img))
      const x = gut + i * (T + 4)
      cv.fill(x, y, T, T, SKY); cv.fill(x, y + FOOT32 * Z, T, (H32 - FOOT32) * Z, GROUND)
      put32(cv, img, x, y, Z)
      const sx = sx0 + i * (W32 + 4), sy = y + T - H32
      cv.fill(sx, sy, W32, H32, SKY); cv.fill(sx, sy + FOOT32, W32, H32 - FOOT32, GROUND)
      put32(cv, img, sx, sy, 1)
    })
  })
  cv.save(join(OUT, 'hero-32bit.png'))
  console.log(`wrote ${join(OUT, 'hero-32bit.png')} (${cv.w}x${cv.h}), up to ${most} colors per sprite`)
}

if (b32 && (all32 || args.includes('--scene'))) {
  // The adventurer scene band (720 by 88 at 2x): today's V1 at 1.5 screen pixels per cell, then the 32-bit V1 and V8 at one
  // screen pixel per cell, Knight set, attack, the same pack of monsters.
  const K = 2, BW = 720, BH = 88, ground = Math.round(BH * 0.74), u = BH / 40, hs = 1.5
  const gut = 330, rowH = BH * K + 8
  const rows: { id: string; name: string; draw: (cv: Canvas, x0: number, y0: number, hx: number) => void }[] = [
    { id: 'V1', name: 'TODAY (16-BIT CELLS)', draw: (cv, x0, y0, hx) => { const sp = heroSprite('V1', 'attack', GEAR_SETS[0]!); put(cv, sp, x0 + hx * K, y0 + (ground - (sp.foot ?? 34) * hs) * K, hs * K) } },
    ...(['V1', 'V8'] as Hero32[]).map(id => ({ id, name: `32-BIT ${NAMES32[id]}`, draw: (cv: Canvas, x0: number, y0: number, hx: number) => put32(cv, hero32(id, 'attack', GEAR32[0]), x0 + (hx + 22.5 - 34) * K, y0 + (ground - FOOT32) * K, K) })),
  ]
  const cv = new Canvas(gut + BW * K, 40 + rows.length * rowH, BG)
  cv.text('BAND SIZE FIGHT SCENE (720 BY 88, SHOWN AT 2X): TODAY ABOVE, 32-BIT BELOW. KNIGHT SET, ATTACK POSE, SAME PACK', 8, 6, 2, '#ffd23f')
  const foe = foeSprite('Hardcoded Phantom Package', {})
  rows.forEach((o, r) => {
    const x0 = gut, y0 = 40 + r * rowH + 4
    cv.text(o.id, 8, y0 + 4, 8, '#6ee07a'); cv.text(o.name, 8, y0 + 64, 2, '#c8c0d8')
    cv.fill(x0, y0, BW * K, BH * K, SKY)
    const hills = [0.16, 0.3, 0.22, 0.34, 0.2, 0.28]
    for (let i = 0; i < BW; i++) { const h = BH * (0.12 + 0.18 * (hills[Math.floor((i / BW) * 5.99)] ?? 0.2) / 0.34 * 0.6); cv.fill(x0 + i * K, y0 + (ground - h) * K, K, h * K, '#2a1f15') }
    cv.fill(x0, y0 + ground * K, BW * K, (BH - ground) * K, GROUND)
    const hx = BW * 0.14
    o.draw(cv, x0, y0, hx)
    const bx = BW * 0.56, span = BW * 0.34, barY = BH * 0.24
    for (let i = 0; i < 4; i++) {
      const fx = bx + (i * span) / 4 + (span / 4 - foe.w * hs) / 2
      put(cv, foe, x0 + fx * K, y0 + (ground - (i % 2) * hs - (foe.foot ?? foe.h) * hs) * K, hs * K)
    }
    cv.fill(x0 + bx * K, y0 + barY * K, span * K, u * 1.6 * K, '#000', 0.6); cv.fill(x0 + bx * K, y0 + barY * K, span * 0.4 * K, u * 1.6 * K, '#c0392b')
    cv.fill(x0 + (hx + 6 * hs) * K, y0 + 3 * K, 18 * hs * K, u * K, '#000', 0.6); cv.fill(x0 + (hx + 6 * hs) * K, y0 + 3 * K, 18 * hs * 0.6 * K, u * K, '#2fd05a')
    cv.text('HARDCODED PHANTOM PACKAGE', x0 + bx * K, y0 + (barY - 11) * K, 3, '#e8e0d0')
  })
  cv.save(join(OUT, 'hero-32bit-scene.png'))
  console.log(`wrote ${join(OUT, 'hero-32bit-scene.png')}`)
}

if (b32 && args.includes('--measure')) {
  // Bytes: one hero sprite as SVG paths (merged rects, one path per color, as the game draws today) or as a PNG data URI
  // <image>, whole or split into its moving parts; then a real 720 by 88 fight scene (sceneSvg, 4 monsters) with the crab
  // markup swapped for each. Time: the whole build of one scene (draw the 32-bit hero from shapes, encode, splice).
  const NOW = new Date(2026, 9, 5, 14, 0, 0).getTime()
  const item = (slot: Slot, name: string, rarity: Rarity = 'rare'): Item => ({ slot, base: name, name, rarity, ilvl: 50, power: 10, affixes: [], sockets: 0, gems: [], quality: 0 })
  const h: Hero = newHero('Pinchley', 'paladin', 7, NOW)
  h.gear = { weapon: item('weapon', 'Longsword'), offhand: item('offhand', 'Tower Shield'), head: item('head', 'Thinking Cap'), chest: item('chest', 'Hoodie of Holding') }
  h.task = { kind: 'fight', label: 'a fight', ms: 8000, done: 3000, foe: { name: 'Null Pointer', rank: 'normal', level: 40, hp: 100, dmg: 5, count: 4, mods: [], sprite: 0 }, win: true, hit: 1200, crit: false }
  const scene = sceneSvg(h, { w: 720, h: 88, now: NOW, period: 0.8 })
  // the crab element, found by balancing <g> tags from its opening tag
  // (with the wrapper that places and scales it), so the 32-bit hero goes in at one screen pixel per cell, feet on the ground
  const at = scene.indexOf(' data-hero="crab"'), inner = scene.lastIndexOf('<g', at), outer = scene.lastIndexOf('<g', inner - 1)
  const g0 = /^<g transform="translate\([^)]*\) scale\([^)]*\)">$/.test(scene.slice(outer, inner)) ? outer : inner
  let depth = 0, i = g0, g1 = -1
  while (i < scene.length) {
    const open = scene.indexOf('<g', i), close = scene.indexOf('</g>', i)
    if (open >= 0 && open < close) { depth++; i = open + 2 } else { depth--; i = close + 4; if (depth === 0) { g1 = i; break } }
  }
  const crabG = scene.slice(g0, g1)
  const splitPng = (img: Img32) => {
    let out = ''
    for (const c of new Set(img.cls.map(v => v ?? ''))) {
      const px = img.c.map((v, k) => { const p = img.part[k] ?? -1; return (p >= 0 ? img.cls[p] ?? '' : '') === c ? v : undefined })
      let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1
      px.forEach((v, k) => { if (v !== undefined) { const x = k % img.w, y = Math.floor(k / img.w); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) } })
      if (x1 < 0) continue
      const crop: (string | undefined)[] = []
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) crop.push(px[y * img.w + x])
      out += `<g${c ? ` class="${c}"` : ''}>${pngImage(x1 - x0 + 1, y1 - y0 + 1, crop, x0, y0, 1)}</g>`
    }
    return out
  }
  const methods = {
    svg: (img: Img32) => draw(spriteOf(img), 94, Math.round(88 * 0.74) - FOOT32, 1),
    png: (img: Img32) => `<g transform="translate(94 ${Math.round(88 * 0.74) - FOOT32})">${pngImage(img.w, img.h, img.c, 0, 0, 1)}</g>`,
    pngParts: (img: Img32) => `<g transform="translate(94 ${Math.round(88 * 0.74) - FOOT32})">${splitPng(img)}</g>`,
  }
  const kb = (n: number) => (n / 1024).toFixed(1)
  const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'
  console.log(`runtime: ${isBun ? 'bun' : `node ${process.version} (tsx)`}`)
  console.log(`today, real 720x88 fight scene (crab with 4 gear pieces, 4 monsters): ${kb(scene.length)} KB, of it the crab ${kb(crabG.length)} KB`)
  console.log(`today, V1 Knight attack as SVG paths: ${kb(draw(heroSprite('V1', 'attack', GEAR_SETS[0]!), 90, 18, 1.5).length)} KB`)
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length, mx = (a: number[]) => Math.max(...a)
  for (const id of ['V1', 'V8'] as Hero32[]) {
    const sizes = { svg: [] as number[], png: [] as number[], pngParts: [] as number[], file: [] as number[], zlib: [] as number[], ours: [] as number[], colors: [] as number[] }
    for (const pose of ['attack', 'sit'] as Pose32[]) for (const g of [undefined, ...GEAR32]) {
      const img = hero32(id, pose, g)
      for (const m of ['svg', 'png', 'pngParts'] as const) sizes[m].push(methods[m](img).length)
      sizes.file.push(encodePng(img.w, img.h, img.c).length)
      sizes.colors.push(colorsOf(img))
      // the same indexed rows through zlib level 9, to see what our fixed-Huffman deflate leaves on the table
      const idx = new Map<string, number>(), rows = new Uint8Array((img.w + 1) * img.h)
      img.c.forEach((v, k) => { if (v !== undefined && !idx.has(v)) idx.set(v, idx.size + 1); rows[Math.floor(k / img.w) * (img.w + 1) + 1 + (k % img.w)] = v === undefined ? 0 : idx.get(v) ?? 0 })
      sizes.zlib.push(deflateSync(rows, { level: 9 }).length); sizes.ours.push(deflate(rows).length)
    }
    console.log(`${id}, 18 sprites (bare and 8 sets, attack and sit), ${Math.min(...sizes.colors)} to ${mx(sizes.colors)} colors: SVG paths avg ${kb(avg(sizes.svg))} KB max ${kb(mx(sizes.svg))} KB | PNG data URI avg ${kb(avg(sizes.png))} KB max ${kb(mx(sizes.png))} KB | PNG split into moving parts avg ${kb(avg(sizes.pngParts))} KB max ${kb(mx(sizes.pngParts))} KB`)
    console.log(`${id}, PNG file avg ${avg(sizes.file).toFixed(0)} B; image data: our fixed-Huffman deflate avg ${avg(sizes.ours).toFixed(0)} B, zlib level 9 avg ${avg(sizes.zlib).toFixed(0)} B`)
  }
  const knight = hero32('V1', 'attack', GEAR32[0])
  writeFileSync(join(OUT, 'check-v1-knight.png'), encodePng(knight.w, knight.h, knight.c))
  writeFileSync(join(OUT, 'check-scene-png.svg'), scene.slice(0, g0) + methods.pngParts(knight) + scene.slice(g1))
  writeFileSync(join(OUT, 'check-scene-svg.svg'), scene.slice(0, g0) + methods.svg(knight) + scene.slice(g1))
  for (const m of ['svg', 'png', 'pngParts'] as const) for (const id of ['V1', 'V8'] as Hero32[]) {
    const build = () => scene.slice(0, g0) + methods[m](hero32(id, 'attack', GEAR32[0])) + scene.slice(g1)
    const s = build()
    for (let k = 0; k < 5; k++) build()
    for (let k = 0; k < 30; k++) build()
    const N = 60, t0 = performance.now()
    for (let k = 0; k < N; k++) build()
    const ms = (performance.now() - t0) / N
    const img = hero32(id, 'attack', GEAR32[0])
    const t1 = performance.now(); for (let k = 0; k < N; k++) hero32(id, 'attack', GEAR32[0]); const drawMs = (performance.now() - t1) / N
    const t2 = performance.now(); for (let k = 0; k < N; k++) methods[m](img); const encMs = (performance.now() - t2) / N
    const t3 = performance.now(); for (let k = 0; k < N; k++) sceneSvg(h, { w: 720, h: 88, now: NOW, period: 0.8 }); const todayMs = (performance.now() - t3) / N
    console.log(`scene ${m.padEnd(8)} ${id}: ${kb(s.length)} KB, build ${ms.toFixed(2)} ms (draw ${drawMs.toFixed(2)} + encode ${encMs.toFixed(2)}); today's whole sceneSvg ${todayMs.toFixed(2)} ms`)
  }
}

// ---- task-21: Final Fantasy era proportions at 32-bit ----
if (ffm) {
  const ids = ((arg('--only') ?? 'T1T2T3T4').match(/T\d/g) ?? []) as FFId[]
  const NAMES: Record<FFId, string> = { T1: 'TACTICS: 4 HEADS, 3/4 VIEW', T2: 'BATTLE SPRITE: 3 HEADS, SIDE VIEW', T3: 'HEROIC: 5 HEADS, CLOAK AND MANE', T4: 'WILDCARD: STRIDE, WIND AND PONYTAIL' }
  const sets = [undefined, ...GEAR_FF]
  const allFf = !args.includes('--sheet') && !args.includes('--scene') && !args.includes('--measure')
  const putFf = (cv: Canvas, id: FFId, pose: PoseFF, g: (typeof GEAR_FF)[number] | undefined, look: (typeof LOOKS_FF)[FFId] | undefined, x: number, y: number, s: number) => put(cv, spriteOfFF(heroFF(id, pose, g, look)), x, y, s)

  if (allFf || args.includes('--sheet')) {
    const Z = 3, CX0 = 4, CW = 94, T0 = 4, CHH = 74, gut = 190, cellW = CW * Z + 4, cellH = CHH * Z + 4, blockH = 24 + 3 * cellH + CHH + 12
    const cv = new Canvas(gut + 9 * cellW + 8, 30 + ids.length * blockH, BG)
    cv.text('FINAL FANTASY ERA PROPORTIONS AT 32-BIT: FOUR ORIGINAL HEROES, BARE AND THE SAME 8 GEAR SETS. ATTACK AND SIT AT 3X, 8 RANDOM LOOKS, THEN TRUE SIZE (1X)', 8, 6, 2, '#ffd23f')
    ids.forEach((id, bi) => {
      const y0 = 30 + bi * blockH
      cv.text(id, 8, y0 + 8, 8, '#6ee07a'); cv.text(NAMES[id], 8, y0 + 64, 2, '#c8c0d8')
      sets.forEach((g, i) => cv.text((g?.name ?? 'bare').toUpperCase(), gut + i * cellW + 4, y0 + 4, 2, '#9a90b0'))
      const cell = (row: number, col: number, pose: PoseFF, g: (typeof GEAR_FF)[number] | undefined, look?: (typeof LOOKS_FF)[FFId]) => {
        const x = gut + col * cellW, y = y0 + 24 + row * cellH
        cv.fill(x, y, CW * Z, CHH * Z, SKY); cv.fill(x, y + (FOOTFF - T0) * Z, CW * Z, (CHH - FOOTFF + T0) * Z, GROUND)
        putFf(cv, id, pose, g, look, x - CX0 * Z, y - T0 * Z, Z)
        const sx = gut + (row === 0 ? 0 : row === 1 ? 9 : 18) * (CW + 2) + col * (CW + 2), sy = y0 + 24 + 3 * cellH + 8
        cv.fill(sx, sy, CW, CHH, SKY); cv.fill(sx, sy + FOOTFF - T0, CW, CHH - FOOTFF + T0, GROUND)
        putFf(cv, id, pose, g, look, sx - CX0, sy - T0, 1)
      }
      sets.forEach((g, i) => { cell(0, i, 'attack', g); cell(1, i, 'sit', g) })
      for (let i = 0; i < 8; i++) {
        const rl = randomLook(i + 1), look = { skin: rl.skin, hair: rl.hair, eyes: rl.eyes, accent: rl.accent }
        cell(2, i, 'attack', GEAR_FF[i], look)
      }
      cv.text('ATTACK', 8, y0 + 24 + 90, 2, '#9a90b0'); cv.text('SIT', 8, y0 + 24 + cellH + 90, 2, '#9a90b0'); cv.text('RANDOM LOOKS', 8, y0 + 24 + 2 * cellH + 90, 2, '#9a90b0')
    })
    cv.save(join(OUT, 'hero-ff.png'))
    console.log(`wrote ${join(OUT, 'hero-ff.png')} (${cv.w}x${cv.h})`)
  }

  if (allFf || args.includes('--scene')) {
    // The real band: 720 by 88, drawn at 2x. Today's live crab above (scaled as the scene scales it), the task-20 32-bit V1,
    // then T1 to T4 at one screen pixel per cell. Knight set, attack pose, the same pack of monsters.
    const K = 2, BW = 720, BH = 88, ground = Math.round(BH * 0.74), u = BH / 40, hs = 1.5
    const gut = 330, rowH = BH * K + 8
    const crab = crabSprite({ pose: 'attack', trim: '#4aa3ff', head: { id: 0, color: '#b8c4d8' }, chest: { id: 3, color: '#7a8296' }, weapon: { id: 4, color: '#f2c94c' }, offhand: { id: 0, color: '#5a5ae0' } })
    const stance = extent(crabSprite({ pose: 'stand', trim: '#4aa3ff' }))
    const chs = Math.max(1, Math.min(3, (ground - Math.max(8, Math.round(BH / 8)) * 1.5) / (stance.y1 - stance.y0 + 3)))
    const knight = GEAR_FF[0]
    const rows: { id: string; name: string; draw: (cv: Canvas, x0: number, y0: number, hx: number) => void }[] = [
      { id: 'NOW', name: "TODAY'S LIVE CRAB", draw: (cv, x0, y0, hx) => put(cv, crab, x0 + hx * K, y0 + (ground - (crab.foot ?? crab.h) * chs) * K, chs * K) },
      { id: 'V1', name: 'TASK-20 32-BIT CHIBI', draw: (cv, x0, y0, hx) => put32(cv, hero32('V1', 'attack', GEAR32[0]), x0 + (hx + 22.5 - 34) * K, y0 + (ground - FOOT32) * K, K) },
      ...ids.map(id => ({ id, name: NAMES[id], draw: (cv: Canvas, x0: number, y0: number, hx: number) => putFf(cv, id, 'attack', knight, undefined, x0 + (hx + 22.5 - 42) * K, y0 + (ground - FOOTFF) * K, K) })),
    ]
    const cv = new Canvas(gut + BW * K, 40 + rows.length * rowH, BG)
    cv.text('BAND SIZE FIGHT SCENE (720 BY 88, SHOWN AT 2X): TODAY, TASK-20 CHIBI, THEN THE FOUR FINAL FANTASY ERA PROPORTIONS. KNIGHT SET, ATTACK POSE, SAME PACK', 8, 6, 2, '#ffd23f')
    const foe = foeSprite('Hardcoded Phantom Package', {})
    rows.forEach((o, r) => {
      const x0 = gut, y0 = 40 + r * rowH + 4
      cv.text(o.id, 8, y0 + 4, 8, '#6ee07a'); cv.text(o.name, 8, y0 + 64, 2, '#c8c0d8')
      cv.fill(x0, y0, BW * K, BH * K, SKY)
      const hills = [0.16, 0.3, 0.22, 0.34, 0.2, 0.28]
      for (let i = 0; i < BW; i++) { const h = BH * (0.12 + 0.18 * (hills[Math.floor((i / BW) * 5.99)] ?? 0.2) / 0.34 * 0.6); cv.fill(x0 + i * K, y0 + (ground - h) * K, K, h * K, '#2a1f15') }
      cv.fill(x0, y0 + ground * K, BW * K, (BH - ground) * K, GROUND)
      const hx = BW * 0.14
      o.draw(cv, x0, y0, hx)
      const bx = BW * 0.56, span = BW * 0.34, barY = BH * 0.24
      for (let i = 0; i < 4; i++) {
        const fx = bx + (i * span) / 4 + (span / 4 - foe.w * hs) / 2
        put(cv, foe, x0 + fx * K, y0 + (ground - (i % 2) * hs - (foe.foot ?? foe.h) * hs) * K, hs * K)
      }
      cv.fill(x0 + bx * K, y0 + barY * K, span * K, u * 1.6 * K, '#000', 0.6); cv.fill(x0 + bx * K, y0 + barY * K, span * 0.4 * K, u * 1.6 * K, '#c0392b')
      cv.fill(x0 + (hx + 6 * hs) * K, y0 + 3 * K, 18 * hs * K, u * K, '#000', 0.6); cv.fill(x0 + (hx + 6 * hs) * K, y0 + 3 * K, 18 * hs * 0.6 * K, u * K, '#2fd05a')
      cv.text('HARDCODED PHANTOM PACKAGE', x0 + bx * K, y0 + (barY - 11) * K, 3, '#e8e0d0')
    })
    cv.save(join(OUT, 'hero-ff-scene.png'))
    console.log(`wrote ${join(OUT, 'hero-ff-scene.png')} (${cv.w}x${cv.h})`)
  }

  if (args.includes('--measure')) {
    // Bytes per sprite (SVG rects, whole PNG data URI, PNG split into the moving parts), then a real 720 by 88 scene with the crab swapped for each.
    const NOW = new Date(2026, 9, 5, 14, 0, 0).getTime()
    const item = (slot: Slot, name: string, rarity: Rarity = 'rare'): Item => ({ slot, base: name, name, rarity, ilvl: 50, power: 10, affixes: [], sockets: 0, gems: [], quality: 0 })
    const h: Hero = newHero('Pinchley', 'paladin', 7, NOW)
    h.gear = { weapon: item('weapon', 'Longsword'), offhand: item('offhand', 'Tower Shield'), head: item('head', 'Thinking Cap'), chest: item('chest', 'Hoodie of Holding') }
    h.task = { kind: 'fight', label: 'a fight', ms: 8000, done: 3000, foe: { name: 'Null Pointer', rank: 'normal', level: 40, hp: 100, dmg: 5, count: 4, mods: [], sprite: 0 }, win: true, hit: 1200, crit: false }
    const scene = sceneSvg(h, { w: 720, h: 88, now: NOW, period: 0.8 })
    const at = scene.indexOf(' data-hero="crab"'), inner = scene.lastIndexOf('<g', at), outer = scene.lastIndexOf('<g', inner - 1)
    const g0 = /^<g transform="translate\([^)]*\) scale\([^)]*\)">$/.test(scene.slice(outer, inner)) ? outer : inner
    let depth = 0, i = g0, g1 = -1
    while (i < scene.length) {
      const open = scene.indexOf('<g', i), close = scene.indexOf('</g>', i)
      if (open >= 0 && open < close) { depth++; i = open + 2 } else { depth--; i = close + 4; if (depth === 0) { g1 = i; break } }
    }
    const crabG = scene.slice(g0, g1)
    const splitPng = (img: Img32) => {
      let out = ''
      for (const c of new Set(img.cls.map(v => v ?? ''))) {
        const px = img.c.map((v, k) => { const p = img.part[k] ?? -1; return (p >= 0 ? img.cls[p] ?? '' : '') === c ? v : undefined })
        let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1
        px.forEach((v, k) => { if (v !== undefined) { const x = k % img.w, y = Math.floor(k / img.w); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) } })
        if (x1 < 0) continue
        const crop: (string | undefined)[] = []
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) crop.push(px[y * img.w + x])
        out += `<g${c ? ` class="${c}"` : ''}>${pngImage(x1 - x0 + 1, y1 - y0 + 1, crop, x0, y0, 1)}</g>`
      }
      return out
    }
    const ty = Math.round(88 * 0.74) - FOOTFF, tx = 94 + 22 - 42
    const methods = {
      svg: (img: Img32) => draw(spriteOf(img), tx, ty, 1),
      png: (img: Img32) => `<g transform="translate(${tx} ${ty})">${pngImage(img.w, img.h, img.c, 0, 0, 1)}</g>`,
      pngParts: (img: Img32) => `<g transform="translate(${tx} ${ty})">${splitPng(img)}</g>`,
    }
    const kb = (n: number) => (n / 1024).toFixed(1)
    console.log(`runtime: node ${process.version} (tsx); today's scene ${kb(scene.length)} KB, of it the crab ${kb(crabG.length)} KB`)
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length, mx = (a: number[]) => Math.max(...a)
    for (const id of ids) {
      const sizes = { svg: [] as number[], png: [] as number[], pngParts: [] as number[], colors: [] as number[] }
      let top = 99, bot = 0, left = 99, right = 0
      for (const pose of ['attack', 'sit'] as PoseFF[]) for (const g of [undefined, ...GEAR_FF]) {
        const img = heroFF(id, pose, g)
        for (const m of ['svg', 'png', 'pngParts'] as const) sizes[m].push(methods[m](img).length)
        sizes.colors.push(colorsOf(img))
        img.c.forEach((v, k) => { if (v !== undefined) { const x = k % img.w, y = Math.floor(k / img.w); top = Math.min(top, y); bot = Math.max(bot, y); left = Math.min(left, x); right = Math.max(right, x) } })
      }
      console.log(`${id} 18 sprites: ${Math.min(...sizes.colors)} to ${mx(sizes.colors)} colors, extent x ${left}-${right} y ${top}-${bot}: SVG avg ${kb(avg(sizes.svg))} max ${kb(mx(sizes.svg))} KB | PNG avg ${kb(avg(sizes.png))} max ${kb(mx(sizes.png))} KB | PNG split avg ${kb(avg(sizes.pngParts))} max ${kb(mx(sizes.pngParts))} KB`)
      for (const m of ['svg', 'png', 'pngParts'] as const) {
        const build = () => scene.slice(0, g0) + methods[m](heroFF(id, 'attack', GEAR_FF[0])) + scene.slice(g1)
        const s = build()
        for (let k = 0; k < 20; k++) build()
        const N = 40, t0 = performance.now()
        for (let k = 0; k < N; k++) build()
        console.log(`  scene ${m.padEnd(8)} ${id}: ${kb(s.length)} KB, build ${((performance.now() - t0) / N).toFixed(2)} ms`)
      }
    }
  }
}

// ---- task-21 round 2: 16-bit era, 3 to 3.5 heads (hooks/sprites/hero-s.ts) ----
if (sm) {
  const sids = ((arg('--only') ?? (fm ? 'F1F2F3' : 'S1S2S3')).match(/[SF]\d/g) ?? []) as SId[]
  const PFX = fm ? 'hero-f' : 'hero-s'
  const SNAMES: Record<SId, string> = { S1: 'UPRIGHT 3/4', S2: 'LUNGE IN THE WIND', S3: 'SIDE VIEW BATTLE', F1: 'FRONT, CALM IDLE', F2: 'FRONT, RAISED', F3: 'FRONT, CAPE FLARING' }
  const allS = !args.includes('--sheet') && !args.includes('--scene') && !args.includes('--measure')
  const putS = (cv: Canvas, id: SId, g: (typeof GEAR_S)[number] | undefined, x: number, y: number, s: number) => put(cv, spriteOfS(heroS(id, g)), x, y, s)
  if (allS || args.includes('--sheet')) {
    const Z = 6, CX0 = 6, CW = 70, T0 = 4, CHH = 60, gut = 20, cellW = CW * Z + 6
    const cells = sids.flatMap(id => [undefined, ...GEAR_S].map(g => ({ id, g })))
    const cv = new Canvas(gut + cells.length * cellW + 8, 36 + CHH * Z + 20 + CHH + 12, BG)
    cv.text('16-BIT ERA HEROES, 3 TO 3.5 HEADS: ' + (fm ? 'F1 CALM IDLE, F2 RAISED, F3 CAPE FLARING (FRONT VIEW)' : 'S1 UPRIGHT, S2 LUNGE IN THE WIND, S3 SIDE VIEW') + '. BARE AND THE KNIGHT SET. 6X, THEN TRUE SIZE', 8, 6, 2, '#ffd23f')
    let most = 0
    cells.forEach(({ id, g }, i) => {
      const x = gut + i * cellW, y = 30, img = heroS(id, g)
      most = Math.max(most, colorsOfS(img))
      cv.text(`${id} ${g ? 'KNIGHT' : 'BARE'} ${colorsOfS(img)} COLORS`, x + 4, y - 2, 2, '#9a90b0')
      cv.fill(x, y + 8, CW * Z, CHH * Z, SKY); cv.fill(x, y + 8 + (FOOTS - T0) * Z, CW * Z, (CHH - FOOTS + T0) * Z, GROUND)
      put(cv, spriteOfS(img), x - CX0 * Z, y + 8 - T0 * Z, Z)
      const sy = y + 8 + CHH * Z + 12
      cv.fill(x, sy, CW, CHH, SKY); cv.fill(x, sy + FOOTS - T0, CW, CHH - FOOTS + T0, GROUND)
      put(cv, spriteOfS(img), x - CX0, sy - T0, 1)
    })
    cv.save(join(OUT, `${PFX}.png`))
    console.log(`wrote ${join(OUT, `${PFX}.png`)} (${cv.w}x${cv.h}), up to ${most} colors per sprite`)
    if (fm) {
      // 8x close-ups of the legs: from the hip to the soles, bare and Knight
      const Z8 = 8, LX = 22, LW = 28, LY = 34, LH = 28, gap = 10
      const lc = new Canvas(gut + cells.length * (LW * Z8 + gap), 30 + LH * Z8 + 10, BG)
      lc.text('LEGS AT 8X: TWO STRAIGHT COLUMNS, A 1 PX GAP, THE KNEE ONLY A LIGHT MARK, BOOTS PLANTED AND TURNED SLIGHTLY OUT', 8, 6, 2, '#ffd23f')
      cells.forEach(({ id, g }, i) => { const x = gut + i * (LW * Z8 + gap); lc.fill(x, 24, LW * Z8, LH * Z8, SKY); put(lc, spriteOfS(heroS(id, g)), x - LX * Z8, 24 - LY * Z8, Z8) })
      lc.fill(0, 0, lc.w, 24, BG); lc.text('LEGS AT 8X: TWO STRAIGHT COLUMNS, A 1 PX GAP, THE KNEE ONLY A LIGHT MARK, BOOTS PLANTED AND TURNED SLIGHTLY OUT', 8, 6, 2, '#ffd23f')
      cells.forEach(({ id, g }, i) => lc.text(`${id} ${g ? 'KNIGHT' : 'BARE'}`, gut + i * (LW * Z8 + gap) + 2, 12 + 6, 2, '#9a90b0'))
      lc.save(join(OUT, `${PFX}-legs.png`))
      console.log(`wrote ${join(OUT, `${PFX}-legs.png`)} (${lc.w}x${lc.h})`)
    }
  }
  if (allS || args.includes('--scene')) {
    const K = 2, BW = 720, BH = 88, ground = Math.round(BH * 0.74), u = BH / 40, hs = 1.5
    const gut = 330, rowH = BH * K + 8
    const crab = crabSprite({ pose: 'attack', trim: '#4aa3ff', head: { id: 0, color: '#b8c4d8' }, chest: { id: 3, color: '#7a8296' }, weapon: { id: 4, color: '#f2c94c' }, offhand: { id: 0, color: '#5a5ae0' } })
    const stance = extent(crabSprite({ pose: 'stand', trim: '#4aa3ff' }))
    const chs = Math.max(1, Math.min(3, (ground - Math.max(8, Math.round(BH / 8)) * 1.5) / (stance.y1 - stance.y0 + 3)))
    const rows: { id: string; name: string; draw: (cv: Canvas, x0: number, y0: number, hx: number) => void }[] = [
      { id: 'NOW', name: "TODAY'S LIVE CRAB", draw: (cv, x0, y0, hx) => put(cv, crab, x0 + hx * K, y0 + (ground - (crab.foot ?? crab.h) * chs) * K, chs * K) },
      fm ? { id: 'S2', name: 'STEP A S2, 16-BIT LUNGE', draw: (cv, x0, y0, hx) => putS(cv, 'S2', KNIGHT_S, x0 + (hx + 22.5 - 36) * K, y0 + (ground - FOOTS) * K, K) } : { id: 'T4', name: 'ROUND 1 T4, 32-BIT', draw: (cv, x0, y0, hx) => put(cv, spriteOfFF(heroFF('T4', 'attack', GEAR_FF[0])), x0 + (hx + 22.5 - 42) * K, y0 + (ground - FOOTFF) * K, K) },
      ...sids.map(id => ({ id, name: SNAMES[id], draw: (cv: Canvas, x0: number, y0: number, hx: number) => putS(cv, id, KNIGHT_S, x0 + (hx + 22.5 - 36) * K, y0 + (ground - FOOTS) * K, K) })),
    ]
    const cv = new Canvas(gut + BW * K, 40 + rows.length * rowH, BG)
    cv.text(fm ? 'BAND SIZE FIGHT SCENE (720 BY 88, SHOWN AT 2X): TODAY, STEP A S2, THEN THE FRONT-VIEW CANDIDATES F1 TO F3. KNIGHT SET, SAME PACK' : 'BAND SIZE FIGHT SCENE (720 BY 88, SHOWN AT 2X): TODAY, ROUND 1 T4, THEN THE 16-BIT CANDIDATES S1 TO S3. KNIGHT SET, ATTACK POSE, SAME PACK', 8, 6, 2, '#ffd23f')
    const foe = foeSprite('Hardcoded Phantom Package', {})
    rows.forEach((o, r) => {
      const x0 = gut, y0 = 40 + r * rowH + 4
      cv.text(o.id, 8, y0 + 4, 8, '#6ee07a'); cv.text(o.name, 8, y0 + 64, 2, '#c8c0d8')
      cv.fill(x0, y0, BW * K, BH * K, SKY)
      const hills = [0.16, 0.3, 0.22, 0.34, 0.2, 0.28]
      for (let i = 0; i < BW; i++) { const h = BH * (0.12 + 0.18 * (hills[Math.floor((i / BW) * 5.99)] ?? 0.2) / 0.34 * 0.6); cv.fill(x0 + i * K, y0 + (ground - h) * K, K, h * K, '#2a1f15') }
      cv.fill(x0, y0 + ground * K, BW * K, (BH - ground) * K, GROUND)
      const hx = BW * 0.14
      o.draw(cv, x0, y0, hx)
      const bx = BW * 0.56, span = BW * 0.34, barY = BH * 0.24
      for (let i = 0; i < 4; i++) {
        const fx = bx + (i * span) / 4 + (span / 4 - foe.w * hs) / 2
        put(cv, foe, x0 + fx * K, y0 + (ground - (i % 2) * hs - (foe.foot ?? foe.h) * hs) * K, hs * K)
      }
      cv.fill(x0 + bx * K, y0 + barY * K, span * K, u * 1.6 * K, '#000', 0.6); cv.fill(x0 + bx * K, y0 + barY * K, span * 0.4 * K, u * 1.6 * K, '#c0392b')
      cv.fill(x0 + (hx + 6 * hs) * K, y0 + 3 * K, 18 * hs * K, u * K, '#000', 0.6); cv.fill(x0 + (hx + 6 * hs) * K, y0 + 3 * K, 18 * hs * 0.6 * K, u * K, '#2fd05a')
      cv.text('HARDCODED PHANTOM PACKAGE', x0 + bx * K, y0 + (barY - 11) * K, 3, '#e8e0d0')
    })
    cv.save(join(OUT, `${PFX}-scene.png`))
    console.log(`wrote ${join(OUT, `${PFX}-scene.png`)} (${cv.w}x${cv.h})`)
  }
}
