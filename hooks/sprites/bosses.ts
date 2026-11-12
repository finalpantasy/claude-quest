// Boss chassis: 24 by 24 drawings in the shape language, ground on row 22. Part families are scaled up to fit (see foe.ts).
import { ELEMENTS, PALETTES } from './palettes'
import type { Palette } from './palettes'
import { compose, cropped, foePal, PARTS, ring } from './foe'
import type { Look } from './foe'
import { hash, pick, shade } from './core'
import type { Part, Sprite } from './core'
import { finish } from './shape'

export const CHASSIS: [string, string][] = [
  ['titan', 'E14,9,8;E5,6,5;R1,9,4,9;R5,19,5,3;Y8,4;Y8,5;M7,6'],
  ['colossus', 'C3,10,7;E13,10,8;R0,8,4,9;R5,19,6,3;Y9,6;Y9,7;M10,6;E13,4,4,a'],
  ['dragon', 'E16,8,6;E7,5,4;T0,10,8,2,8,14,d;T1,5,8,7,8,11,d;T10,3,9,0,11,3,w;L17,18,23,17,a;Y8,6;M9,2'],
  ['hydra', 'E17,9,5;L7,16,5,8;e5,7,3,3;e11,4,3,3;Y5,6;Y11,3'],
  ['lich', 'E5,5,5;C9,9,9;R1,9,3,8;R6,18,3,4;T7,3,9,0,10,3,w;Y9,4;Y9,5;M8,5,k'],
  ['demon lord', 'E6,5,5;T3,4,5,0,8,5,w;E15,8,8;T0,6,7,10,6,22,d;T1,2,6,6,6,14,d;R5,19,4,4;Y9,6;M10,6'],
  ['spider queen', 'E16,7,5;E8,5,4;L2,13,8,15;L0,17,8,16;L1,21,8,18;L3,23,8,19;Y9,7;Y10,7'],
  ['kraken', 'E8,8,7;L3,16,2,22;L6,17,6,22;L9,17,9,22;L11,16,10,22;Y7,6;Y7,7;M10,6'],
  ['beholder', 'E12,9,9,w;E12,5,5,e;E12,2,2,k;L3,6,1,1,a;L2,3,0,3,a;L6,2,6,0,a'],
  ['treant', 'C0,8,5;E5,7,5;C9,10,9;R3,9,3,10;R4,19,4,4;Y8,5;M8,6;L4,3,2,0,a'],
  ['flame lord', 'E15,7,7;T3,12,6,2,10,12,r;E9,5,5;Y9,7;M11,4'],
  ['worm king', 'E19,9,3;E15,8,4;E10,7,4;E5,6,4;Y8,4;Y8,5;M7,4'],
  ['knight', 'E5,4,4,d;C4,8,2,k;E14,8,7,d;R2,9,3,9;R5,19,4,3;Y9,4;R16,12,1,3,a'],
  ['sphinx', 'E16,9,5;E7,5,5;R3,19,2,3;R6,19,2,3;T3,5,5,10,8,10,a;Y9,6;Y9,7;M10,4'],
  ['mimic king', 'C8,16,12;C6,16,3,a;R3,10,2,3,w;R7,10,2,3,w;Y9,12,e;M13,8;R5,11,1,2,w'],
  ['owl titan', 'E11,9,9;E8,6,4,a;T3,4,5,0,8,4;Y8,7;E8,2,2,e;L8,17,9,21,w'],
  ['scorpion king', 'E17,8,5;e4,15,3,3;R10,2,3,10,a;T10,1,12,0,12,4,w;Y9,13;L2,16,6,21,d'],
  ['beetle emperor', 'E16,9,6,a;E7,5,4;L2,19,7,15,d;L1,21,6,18,d;T10,3,11,0,12,4,w;Y9,6'],
  ['slime king', 'E16,11,7;E10,7,5;Y8,9;Y8,10;M13,4;E17,5,2,a'],
  ['serpent', 'E19,10,3;E15,8,3;E11,6,3;E7,4,4;Y10,6;Y10,7'],
  ['gear titan', 'E13,9,9;E13,5,5,k;R0,10,3,3;R4,1,3,3;Y9,13,e'],
  ['wraith lord', 'E7,5,5;E15,8,8;T6,18,10,22,8,23,d;T9,19,12,23,13,21,d;R7,6,2,2,k;Y9,7,e'],
  ['moth goddess', 'E13,3,6;E6,3,4;T0,3,8,8,8,16,a;T1,10,8,12,8,20,d;T7,4,8,0,10,4,w;Y9,6'],
  ['skull colossus', 'E8,8,7;C14,12,6;R6,8,3,4,k;Y8,9;R10,15,1,3,k;R12,15,1,3,k'],
]

export type BossLook = Look & { chassis: number }
export const bossSprite = (look: BossLook, pal: Palette, tint?: string): Sprite => {
  const ops = pick(CHASSIS, look.chassis)[1]
  const { g, foot } = compose(24, ops, look, 1, 1.5)
  const parts: Part[] = [ring(g, tint ?? pal.glow, 2), { rects: finish(g, foePal(pal, shade(pal.base, -0.78)), true, 2) }]
  return cropped(parts, foot)
}

const TITLES = ['Warden', 'Archon', 'Duke', 'Regent', 'Marshal', 'Oracle', 'Warlord', 'Keeper', 'Herald', 'Colossus']
const DOMAINS = ['Dead Letters', 'Stale Caches', 'Orphaned Forks', 'Broken Builds', 'Silent Logs', 'Lost Merges', 'Flaky Gates', 'Zombie Threads', 'Cold Starts', 'Deprecated APIs']
const NAMED = [
  'The Butcher of Builds', 'Duriel, Lord of node_modules', 'Mephisto the Monorepo', 'Diablo, the Prod Incident', 'Baal, Lord of Technical Debt',
  'The Infinite Loop', 'Kernel Panic Incarnate', 'The Undying Monolith', 'Scope Creep, the Ever-Growing', 'The Midnight Deploy', 'The Unreproducible', 'The Shaper of Specs', 'The Elder Codebase',
  'The Final Merge', 'Queen of Queues', 'Warden of the Whitelist', 'The Unmaintained', 'Archlich of Auth', 'Dragon of Downtime', 'Kraken of the Cache', 'The Compile Colossus',
  'Grandmaster Garbage Collector', 'The Eternal Standup', 'Sovereign of Syntax', 'The Hotfix Hydra', 'Titan of Throttling', 'Empress of Entropy', 'Baron von Bytecode', 'The Rate Limiter',
  'Overlord of Overflow', 'The Backlog', 'Phoenix of Rollbacks', 'The Pager Prophet', 'Leviathan of Logs', 'Warlord of Workarounds', 'The Flaky Titan', 'Scorpion King of Scripts',
  'Lord of the Legacy Lib', 'The Deadlock Dragon', 'Sphinx of Semantics', 'The Memory Maw', 'Archduke of Async', 'The Vendor Lock', 'Magister of Migrations', 'The Cron Colossus',
  'Siege Engine of CI', 'Mother of Microservices', 'The Last Green Build', 'Idol of Indirection', 'King of the Kernel', 'The Whiteboard Wraith', 'Moth Queen of Midnight', 'Eclipse of the Edge Case',
  'The Merge Queen', 'Archivist of Dead Branches', 'Duke of Dangling Pointers', 'The Hundred-Tab Hydra', 'Lord of the Lockfile', 'The Silent Failure', 'Empress of the Event Loop', 'Colossus of Config',
  'The Zero-Day', 'Baron of Backpressure', 'The Unreviewed Diff', 'Sphinx of Schemas', 'The Staging Specter', 'Wyrm of the Wiki', 'The Dependency Dragon', 'Titan of Tech Debt',
  'Grand Inquisitor of Lint', 'The Flame Graph', 'Siren of the Standup', 'The Orphaned Process', 'Warden of the Watchdog', 'Kraken of the Queue', 'The Heisenbug Prime', 'Archon of Abstractions',
  'The Greenfield Ghost', 'Scourge of Slow Queries', 'The Tab-or-Space Tyrant', 'Oracle of Overrides', 'The Rollback Reaper', 'Beast of the Bundle', 'The Naming Problem', 'Regent of Retries',
  'The Cache Invalidator', 'Leviathan of Latency', 'The Spec That Changed', 'Mad King of Mocks', 'The Production Hotfix', 'Behemoth of the Build Farm', 'The Stack Smasher', 'Phantom of the Pull Request',
  'Emperor of Edge Cases', 'The Final Boss Fight', 'Keeper of the Keystore', 'The Merge Window', 'Specter of the Sprint', 'Titan of the Toolchain', 'The Infinite Scroll', 'Marshal of the Monorepo', 'Queen of the Query Planner', 'The Unreachable Code',
]
/** 103 named bosses and 100 more from titles and domains: 203 in all. */
export const BOSS_NAMES = [...NAMED, ...TITLES.flatMap(t => DOMAINS.map(d => `${t} of ${d}`))]

/** A boss by index in BOSS_NAMES, or by any name (hashed). The chassis, parts and palette are stable. */
export const bossLook = (name: string): { look: BossLook; pal: Palette } => {
  let i = BOSS_NAMES.indexOf(name)
  if (i < 0) i = (hash(name) % 997) + BOSS_NAMES.length
  const nt = PARTS.top.length, ns = PARTS.side.length
  const sub = PALETTES[pick(ELEMENTS, i * 3)]
  return {
    look: { chassis: i % CHASSIS.length, top: (i * 5 + 3) % nt, side: (i * 7 + 1) % ns, back: i % 3 === 0 ? (i * 5) % PARTS.back.length : undefined, face: i % 4 === 1 ? (i * 3) % PARTS.face.length : undefined, bottom: i % 5 === 2 ? i % PARTS.bottom.length : undefined, mark: (i * 5 + 2) % 14 },
    pal: pick(sub, i >> 3),
  }
}
export const boss = (name: string) => { const b = bossLook(name); return bossSprite(b.look, b.pal) }
