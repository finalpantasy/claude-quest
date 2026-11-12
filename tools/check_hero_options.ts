// AC2 of task-18 and AC4 of task-19: no gear shape sits at the bottom center between the legs, in any option, gear set or pose,
// nor on any task-19 adventurer, with the 8 sets and with 12 random looks in 12 random sets.
//   npx --no-install tsx tools/check_hero_options.ts
import { ADVENTURERS, GEAR_SETS, OPTIONS, heroSprite, randomGear, randomLook } from '../hooks/sprites/hero-options'
import type { GearSet, HeroLook, HeroPose } from '../hooks/sprites/hero-options'
import type { Sprite } from '../hooks/sprites/core'
const cellsOf = (sp: Sprite) => { const m = new Map<string, string>(); for (const p of sp.parts.slice(1)) if (p.cls !== 'wpn' && p.cls !== 'off') for (const [x, y, w, h, c] of p.rects) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) m.set(`${x + i},${y + j}`, c); return m }
let bad = 0, n = 0
/** Every part but the outline ring: nothing in x 14 and 15 between the gap rows. */
const gapCheck = (sp: Sprite, label: string, gap: readonly [number, number]) => {
  for (const p of sp.parts.slice(1)) for (const [x, y, w, h] of p.rects) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((x + i === 14 || x + i === 15) && y + j >= gap[0] && y + j <= gap[1]) { bad++; console.log('FILLED', label, x + i, y + j) }
}
for (const o of OPTIONS) for (const g of GEAR_SETS) for (const pose of ['attack', 'sit', 'stand'] as HeroPose[]) {
  const sp = heroSprite(o.id, pose, g); n++
  if (o.id === 'A') {
    // the crab's bottom center: the last two shell rows and what hangs below, x 12..17; compare with the bare crab: gear may recolor the shell outline, but no new shape may appear
    const by = pose === 'sit' ? 6 : 4, bare = cellsOf(heroSprite('A', pose)), geared = cellsOf(sp)
    for (let y = 19 + by; y <= 28; y++) for (let x = 11; x <= 18; x++) if (bare.get(`${x},${y}`) !== geared.get(`${x},${y}`) && bare.get(`${x},${y}`) !== '#5a2210') { bad++; console.log('A CHANGED', g.name, pose, x, y) }
  } else if (o.id !== 'E' && pose !== 'sit') gapCheck(sp, `${o.id} ${g.name} ${pose}`, o.id === 'C' || o.id === 'B' ? [31, 33] : [30, 33])
}
const combos: [GearSet | undefined, HeroLook | undefined, string][] = [[undefined, undefined, 'bare'], ...GEAR_SETS.map(g => [g, undefined, g.name] as [GearSet, undefined, string])]
for (let i = 1; i <= 12; i++) combos.push([randomGear(i), randomLook(i), `random ${i}`])
for (const o of ADVENTURERS) for (const [g, look, name] of combos) for (const pose of ['attack', 'stand'] as HeroPose[]) {
  n++
  gapCheck(heroSprite(o.id, pose, g, look), `${o.id} ${name} ${pose}`, [30, 33])
}
console.log(`${n} sprites checked, ${bad} gear cells in the bottom center between the legs`)
