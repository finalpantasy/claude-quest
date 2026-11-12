import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { sceneSvg } from './art'
import { FIGHT_XP_CURVE, FORGE, LIFE_XP_CURVE, PLUS_MAX, applyCounts, curveAt, derive, emptyCounts, forgeChance, forgeCost, forgeVisit, itemTitle, newHero, plusMult, rngOf, step, trainingOf, upgraded, xpAt, xpToNext } from './game'
import type { Hero, Item } from '../types'

const NOW = Date.parse('2026-10-12T12:00:00Z')
const MIN = 60_000

test('the XP curve is RuneScape: 92 is half of 99, and it never stops', () => {
  expect(xpAt(99)).toBe(13034431)
  expect(Math.abs(xpAt(92) * 2 - xpAt(99)) / xpAt(99)).toBeLessThan(0.01)
  expect(xpAt(120) / xpAt(99)).toBeGreaterThan(7)
  expect(Number.isFinite(xpAt(400))).toBe(true)
})

test('work banks focus once per count, whichever session sends it', () => {
  const h = newHero('Ada', 'paladin', 7, NOW)
  const c = { ...emptyCounts(), edit: 10, bash: 2 }
  applyCounts(h, 's1', c, NOW, {})
  const focus = h.focus
  applyCounts(h, 's1', c, NOW, {})
  expect(h.focus).toBe(focus)
  applyCounts(h, 's2', { ...emptyCounts(), read: 1 }, NOW, {})
  expect(h.focus).toBeGreaterThan(focus)
  expect(h.counts.edit).toBe(10)
})

test('with focus the hero fights and levels; without it the hero camps', () => {
  const h = newHero('Ada', 'paladin', 7, NOW)
  applyCounts(h, 's1', { ...emptyCounts(), edit: 200 }, NOW, {})
  step(h, NOW + 30 * MIN, {})
  expect(h.kills).toBeGreaterThan(0)
  expect(h.level).toBeGreaterThan(1)
  h.focus = 0
  step(h, NOW + 3 * 60 * MIN, {})
  expect(['fish', 'mine', 'dig', 'travel']).toContain(h.task.kind)
  const lifeLevels = h.life.fishing.lvl + h.life.mining.lvl + h.life.archaeology.lvl
  expect(lifeLevels).toBeGreaterThan(3)
})

test('the class awakens from how the person works', () => {
  const h = newHero('Ada', null, 7, NOW)
  expect(h.cls).toBe('apprentice')
  applyCounts(h, 's1', { ...emptyCounts(), bash: 45, edit: 5 }, NOW, {})
  expect(h.cls).toBe('sorcerer')
  expect(h.chosen).toBe(true)
})

test('model tokens no longer train attributes, and harmony rewards balanced work', () => {
  const opusOnly = trainingOf({ ...emptyCounts(), tokOpus: 4000, tokSonnet: 900, tokHaiku: 50, tokOther: 70 })
  expect([opusOnly.str, opusOnly.dex, opusOnly.int, opusOnly.vit]).toEqual([0, 0, 0, 0])
  expect(opusOnly.harmony).toBe(0)
  const even = trainingOf({ ...emptyCounts(), edit: 200, read: 200, bash: 200, turns: 100 })
  expect(even.harmony).toBeGreaterThan(0.9)
  expect(trainingOf({ ...emptyCounts(), tokCache: 400 }).luck).toBe(6)
})

test('each kind of work trains its own attribute', () => {
  const top = (c: Partial<ReturnType<typeof emptyCounts>>) => {
    const t = trainingOf({ ...emptyCounts(), ...c })
    const four = { str: t.str, dex: t.dex, int: t.int, vit: t.vit }
    return (Object.keys(four) as (keyof typeof four)[]).reduce((a, k) => (four[k] > four[a] ? k : a), 'str' as keyof typeof four)
  }
  expect(top({ edit: 300 })).toBe('str')
  expect(top({ read: 300 })).toBe('dex')
  expect(top({ bash: 300 })).toBe('int')
  expect(top({ agent: 100 })).toBe('int')
  expect(top({ web: 300 })).toBe('int')
  expect(top({ turns: 150 })).toBe('vit')
  expect(top({ compact: 60 })).toBe('vit')
})

test('a quarter of all training flows to the weakest attribute', () => {
  const grow = (v: number) => Math.round(6 * v ** 0.62)
  // Edits only: STR keeps three quarters, the quarter fills the three tied lowest evenly.
  const t = trainingOf({ ...emptyCounts(), edit: 400 })
  expect(t.str).toBe(grow(300))
  expect([t.dex, t.int, t.vit]).toEqual([grow(100 / 3), grow(100 / 3), grow(100 / 3)])
  // One stat far behind takes the whole quarter: 1200 trained, VIT untrained gets 300 and meets the rest.
  const behind = trainingOf({ ...emptyCounts(), edit: 400, read: 400, bash: 400 })
  expect(behind.vit).toBe(grow(300))
  expect(behind.str).toBe(grow(300))
  // It never overshoots: the lowest is lifted to meet the next, not past it.
  const day = trainingOf({ ...emptyCounts(), edit: 100, read: 600, bash: 300 })
  expect(day.str).toBeLessThanOrEqual(day.dex)
  expect(day.str).toBe(day.vit)
})

test('numbers stay finite far past 99, and a scene draws for every task', () => {
  const h = newHero('Ada', 'ranger', 7, NOW)
  const d = derive(h, {}, h.gear, 500)
  expect(Number.isFinite(d.dps) && Number.isFinite(d.life)).toBe(true)
  applyCounts(h, 's1', { ...emptyCounts(), edit: 400, commit: 1 }, NOW, {})
  const kinds = new Set<string>()
  for (let m = 1; m < 240; m += 3) {
    if (m === 120) h.focus = 0
    step(h, NOW + m * MIN, {})
    kinds.add(h.task.kind)
    const svg = sceneSvg(h, { w: 480, h: 76, now: NOW + m * MIN, period: 0.6 })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.includes('NaN')).toBe(false)
  }
  expect(kinds.has('fight')).toBe(true)
})

/** A typical Claude day: 12 active hours (per hour about 35 edits, 50 reads, 25 bash, 3 agents, 15 turns, a commit every 2 hours), then 12 idle hours, stepped every 5 minutes. Returns the hero and its total XP at the end of each day. */
function playDays(days: number, seed = 12345) {
  const h = newHero('Pace', null, seed, NOW)
  const rate = { edit: 35, read: 50, bash: 25, agent: 3, turns: 15, commit: 0.5 }
  const DAY = 24 * 60 * MIN
  const xp: number[] = [0]
  for (let day = 1; day <= days; day++) {
    for (let m = 5; m <= 24 * 60; m += 5) {
      const now = NOW + (day - 1) * DAY + m * MIN
      if (m <= 12 * 60) {
        const c = { ...emptyCounts() }
        for (const [k, v] of Object.entries(rate)) (c as Record<string, number>)[k] = Math.floor((m / 60) * v)
        applyCounts(h, `day${day}`, c, now, {})
      }
      step(h, now, {})
    }
    xp.push(xpAt(h.level) + h.xp)
  }
  return { h, xp }
}

test('pacing curves: positive, slower than the raw table, and exact at their anchors', () => {
  for (const [lvl, f] of FIGHT_XP_CURVE) expect(Math.abs(curveAt(FIGHT_XP_CURVE, lvl) - f)).toBeLessThan(1e-9)
  for (const [lvl, f] of LIFE_XP_CURVE) expect(Math.abs(curveAt(LIFE_XP_CURVE, lvl) - f)).toBeLessThan(1e-9)
  for (let lvl = 1; lvl <= 150; lvl++) {
    expect(curveAt(FIGHT_XP_CURVE, lvl)).toBeGreaterThan(0)
    expect(curveAt(FIGHT_XP_CURVE, lvl)).toBeLessThanOrEqual(0.15)
    expect(curveAt(LIFE_XP_CURVE, lvl)).toBeGreaterThan(0)
  }
  // Between two anchors the factor is the geometric blend, so it never overshoots either.
  const mid = curveAt([[10, 0.1], [20, 0.4]], 15)
  expect(Math.abs(mid - 0.2)).toBeLessThan(1e-9)
})

test('pacing: twelve active hours a day is about level 10 on day 1, 25 on day 7, and level 40 near day 30', () => {
  const { h, xp } = playDays(7)
  const day1 = playDays(1).h
  // Day 1: level 10, and each life skill about 10.
  expect(day1.level).toBeGreaterThanOrEqual(8)
  expect(day1.level).toBeLessThanOrEqual(12)
  for (const s of Object.values(day1.life)) {
    expect(s.lvl).toBeGreaterThanOrEqual(7)
    expect(s.lvl).toBeLessThanOrEqual(12)
  }
  // Day 7: level 25.
  expect(h.level).toBeGreaterThanOrEqual(21)
  expect(h.level).toBeLessThanOrEqual(29)
  for (const s of Object.values(h.life)) {
    expect(s.lvl).toBeGreaterThanOrEqual(20)
    expect(s.lvl).toBeLessThanOrEqual(30)
  }
  // XP needed against the XP rate of day 7: level 40 is about 36 more days at that rate, and the rate climbs with gear, so level 40 lands near day 30 (loose bounds).
  const rate = xp[7]! - xp[6]!
  expect(rate).toBeGreaterThan(0)
  const day40 = 7 + (xpAt(40) - xp[7]!) / rate
  expect(day40).toBeGreaterThan(20)
  expect(day40).toBeLessThan(50)
})

test('pacing: the first day pays for most of level 10, on average over four heroes', () => {
  // one seed swings day 1 by a fifth either way, so the check is the average of four
  const seeds = [12345, 1, 2, 3]
  const firstDay = seeds.reduce((sum, seed) => sum + playDays(1, seed).xp[1]!, 0) / seeds.length
  expect(firstDay).toBeGreaterThan(xpAt(9))
  expect(firstDay).toBeLessThan(xpAt(12))
})

// The hooks, end to end, on an in-memory disk.
let disk: Record<string, string> = {}
let liveWrites = 0
function host(on: On, store: Record<string, unknown> = {}) {
  disk = {}
  liveWrites = 0
  const norm = (p: string) => p.split(String.fromCharCode(92)).join('/')
  on('env.get', ($, e) => ({ value: ({ USERPROFILE: 'C:/Users/me', USERNAME: 'me' } as Record<string, string>)[(e as { name: string }).name] }) as never)
  on('session.id', () => ({ value: 's1' }) as never)
  on('session.model', () => ({ value: 'claude-opus-5-5' }) as never)
  on('session.surfaces', () => ({ value: ['terminal'] }) as never)
  on('fs.write', ($, e) => {
    const { path, text } = e as unknown as { path: string; text: string }
    disk[norm(path)] = text
    return { value: undefined } as never
  })
  on('fs.read', ($, e) => {
    const p = norm((e as { path: string }).path)
    if (p in disk) return { value: disk[p] } as never
    throw new Error(`missing ${p}`)
  })
  on('fs.list', ($, e) => {
    const dir = norm(String((e as { path?: string }).path ?? ''))
    const value = Object.keys(disk).filter(k => k.startsWith(`${dir}/`) && !k.slice(dir.length + 1).includes('/'))
      .map((k, i) => ({ name: k.slice(dir.length + 1), kind: 'file', size: disk[k]!.length, mtimeMs: disk[k]!.length * 1000 + i, isLink: false }))
    return { value } as never
  })
  on('ui.toast', () => ({ value: undefined }) as never)
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: 'ok', text: 'ok' }) as never)
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('state.set', async ($, e, next) => {
    if ((e as { key?: string }).key === 'live') liveWrites++
    return next(e)
  })
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="core" />
  })
  mock.store(on, store)
  return mock.clock(on, { now: NOW })
}

const BAND = { component: 'AbovePrompt', props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 12, bodyColumns: 120, scroll: { offset: 0, bodyRows: 11 }, view: {} } } as const

test('the first session starts the hero, counts the work, and draws the ticker', async ($, on) => {
  const clock = host(on)
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true } as never)
  await clock.advance(1100)
  await clock.settle()
  expect(disk['C:/Users/me/.claude/claude-quest/hero.json']).toBeDefined()
  expect(JSON.parse(disk['C:/Users/me/.claude/claude-quest/lease.json']!).sid).toBe('s1')
  for (let i = 0; i < 5; i++) await $.tool.call({ tool: 'Edit', file_path: '/repo/a.ts', old_string: 'a', new_string: 'b' } as never)
  await clock.advance(4000)
  await clock.settle()
  expect(JSON.parse(disk['C:/Users/me/.claude/claude-quest/inbox/s1.json']!).edit).toBe(5)
  const hero = JSON.parse(disk['C:/Users/me/.claude/claude-quest/hero.json']!)
  expect(hero.counts.edit).toBe(5)
  expect(hero.name).toBe('Me')
  const ui = await $.ui.mount({ plugin: 'claude-quest', surface: 'terminal', ...BAND })
  const texts = ((await ui.findAll({ type: 'Text' })) as { text?: string }[]).map(t => t.text ?? '').join('\n')
  await ui.unmount()
  expect(texts).toContain('Lv 1')
  const desk = await $.ui.mount({ plugin: 'claude-quest', surface: 'desktop', ...BAND })
  const svgs = (await desk.findAll({ type: 'Svg' } as never)) as { props?: { source?: string } }[]
  await desk.unmount()
  expect(svgs.length).toBe(1)
  const source = JSON.stringify(svgs)
  expect(source).toContain('<svg')
  expect(source).not.toContain('NaN')
})

// The band: strip, pop, full and off.
type SvgNode = { props?: { source?: string; height?: number } }

async function svgsOn($: Engine, surface: 'desktop' | 'terminal') {
  const ui = await $.ui.mount({ plugin: 'claude-quest', surface, ...BAND })
  const svgs = (await ui.findAll({ type: 'Svg' } as never)) as SvgNode[]
  const texts = ((await ui.findAll({ type: 'Text' })) as { text?: string }[]).map(t => t.text ?? '').join(' ')
  await ui.unmount()
  return { svgs, texts }
}

async function started($: Engine, on: On, store: Record<string, unknown> = {}) {
  const clock = host(on, store)
  await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true } as never)
  await clock.advance(1100)
  await clock.settle()
  return clock
}

test('each band mode draws as specified on desktop: strip 18 px, full 120 px, off nothing', async ($, on) => {
  await started($, on, { band: 'strip' })
  let r = await svgsOn($, 'desktop')
  expect(r.svgs.length).toBe(1)
  expect(r.svgs[0]!.props!.height!).toBeLessThanOrEqual(20)
  expect(r.svgs[0]!.props!.source).toContain('Lv 1')
  await $.command.run({ command: 'quest', args: 'band full' } as never)
  r = await svgsOn($, 'desktop')
  expect(r.svgs[0]!.props!.height).toBe(120)
  await $.command.run({ command: 'quest', args: 'band pop' } as never)
  r = await svgsOn($, 'desktop')
  expect(r.svgs[0]!.props!.height!).toBeLessThanOrEqual(20)
  await $.command.run({ command: 'quest', args: 'band off' } as never)
  r = await svgsOn($, 'desktop')
  expect(r.svgs.length).toBe(0)
})

test('pop shows the full scene on a level up and collapses after about ten seconds', async ($, on) => {
  // Early levels now come slowly (pacing, D9), so start one point short of level 2 and the first win levels up.
  const clock = host(on, { band: 'pop' })
  disk['C:/Users/me/.claude/claude-quest/hero.json'] = JSON.stringify({ ...newHero('Ada', null, 7, NOW), xp: xpToNext(1) - 1 })
  await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true } as never)
  await clock.advance(1100)
  await clock.settle()
  for (let i = 0; i < 20; i++) await $.tool.call({ tool: 'Edit', file_path: '/repo/a.ts', old_string: 'a', new_string: 'b' } as never)
  let height = 0
  for (let i = 0; i < 3000 && height !== 120; i++) {
    await clock.advance(1000)
    if (i % 5 === 0) height = (await svgsOn($, 'desktop')).svgs[0]?.props?.height ?? 0
  }
  expect(height).toBe(120)
  await clock.advance(11_000)
  await clock.settle()
  const after = await svgsOn($, 'desktop')
  expect(after.svgs[0]!.props!.height!).toBeLessThanOrEqual(20)
})

test('the band mode persists across a restart, and an old ticker setting migrates', async ($, on) => {
  const restart = () => $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true } as never)
  await started($, on, { ticker: false })
  expect((await svgsOn($, 'desktop')).svgs.length).toBe(0)
  await $.command.run({ command: 'quest', args: 'ticker' } as never)
  expect((await svgsOn($, 'desktop')).svgs.length).toBe(1)
  await $.command.run({ command: 'quest', args: 'band full' } as never)
  await restart()
  expect((await svgsOn($, 'desktop')).svgs[0]!.props!.height).toBe(120)
  await $.command.run({ command: 'quest', args: 'ticker' } as never)
  await restart()
  expect((await svgsOn($, 'desktop')).svgs.length).toBe(0)
  await $.command.run({ command: 'quest', args: 'ticker' } as never)
  await restart()
  expect((await svgsOn($, 'desktop')).svgs[0]!.props!.height).toBe(120)
})

test('a saved band wins over an old ticker setting, and the terminal keeps its one line', async ($, on) => {
  await started($, on, { band: 'strip', ticker: false })
  expect((await svgsOn($, 'desktop')).svgs.length).toBe(1)
  for (const mode of ['strip', 'pop', 'full']) {
    await $.command.run({ command: 'quest', args: `band ${mode}` } as never)
    const t = await svgsOn($, 'terminal')
    expect(t.svgs.length).toBe(0)
    expect(t.texts).toContain('Lv 1')
  }
  await $.command.run({ command: 'quest', args: 'band off' } as never)
  expect((await svgsOn($, 'terminal')).texts).not.toContain('Lv 1')
})

// Live work: what the hero does while Claude works.
const usage = (tokens: number) => ({ model: 'claude-opus-5-5', input_tokens: tokens, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 })
const begin = ($: Engine, id = 't1') => $.turn.start({ text: 'go', turnId: id } as never)
const finish = ($: Engine, tokens: number, id = 't1') => $.turn.complete({ reason: 'answer', answer: 'done', durationMs: 1000, isAborted: false, turnId: id, usage: usage(tokens) } as never)
const sourceOf = async ($: Engine) => (await svgsOn($, 'desktop')).svgs[0]!.props!.source!

test('AC1: a turn start shows the active pose and a turn end calms it', async ($, on) => {
  const clock = await started($, on, { band: 'full' })
  expect(await sourceOf($)).not.toContain('data-live="active"')
  await begin($)
  await clock.settle()
  expect(await sourceOf($)).toContain('data-live="active"')
  await clock.advance(500)
  await finish($, 3000)
  await clock.settle()
  expect(await sourceOf($)).not.toContain('data-live="active"')
})

test('AC2: each kind of tool call plays its own action', async ($, on) => {
  const clock = await started($, on, { band: 'full' })
  await begin($)
  const calls: [object, string][] = [
    [{ tool: 'Edit', file_path: '/repo/a.ts', old_string: 'a', new_string: 'b' }, 'melee'],
    [{ tool: 'Read', file_path: '/repo/a.ts' }, 'arrow'],
    [{ tool: 'Bash', command: 'ls' }, 'spell'],
    [{ tool: 'Agent', prompt: 'x' }, 'summon'],
    [{ tool: 'WebFetch', url: 'https://example.com' }, 'portal'],
  ]
  for (const [call, kind] of calls) {
    await clock.advance(1200)
    await $.tool.call(call as never)
    await clock.settle()
    expect(await sourceOf($)).toContain(`data-act="${kind}"`)
  }
})

test('AC3: token spend lands as damage sized by tokens, and a big turn crits', async ($, on) => {
  const clock = await started($, on, { band: 'full' })
  const size = (svg: string) => Number(/data-dmg="\d+"[^>]*data-size="(\d+)"/.exec(svg)?.[1] ?? 0)
  await begin($)
  await clock.advance(1200)
  await finish($, 2000)
  await clock.settle()
  const small = await sourceOf($)
  expect(small).toContain('data-dmg="2000"')
  expect(small).not.toContain('data-crit')
  await clock.advance(5000)
  await begin($, 't2')
  await clock.advance(1200)
  await finish($, 80_000, 't2')
  await clock.settle()
  const big = await sourceOf($)
  expect(big).toContain('data-dmg="80000"')
  expect(big).toContain('data-crit="1"')
  expect(size(big)).toBeGreaterThan(size(small))
})

test('AC4: at most one redraw a second while working, none while idle', async ($, on) => {
  const clock = await started($, on, { band: 'strip' })
  const writes = () => liveWrites
  await clock.advance(60_000)
  expect(writes()).toBe(0)
  await begin($)
  for (let i = 0; i < 20; i++) await $.tool.call({ tool: 'Read', file_path: '/repo/a.ts' } as never)
  await clock.advance(1000)
  await clock.settle()
  expect(writes()).toBeLessThanOrEqual(2)
  expect(writes()).toBeGreaterThan(0)
  await clock.advance(10_000)
  const before = writes()
  await finish($, 1000)
  await clock.settle()
  expect(writes() - before).toBe(1)
  await clock.advance(60_000)
  expect(writes() - before).toBe(1)
})

test('the strip and the terminal show the live action', async ($, on) => {
  const clock = await started($, on, { band: 'strip' })
  await begin($)
  await $.tool.call({ tool: 'Bash', command: 'ls' } as never)
  await clock.advance(1100)
  await clock.settle()
  expect(await sourceOf($)).toContain('cast')
  expect((await svgsOn($, 'terminal')).texts).toContain('cast')
})

// The forge (task-10): +1 to +15 on equipped items.
const blade = (o: Partial<Item> = {}): Item => ({ slot: 'weapon', base: 'Sword', name: 'Old Blade', rarity: 'rare', ilvl: 30, power: 50, affixes: [{ k: 'dmg', v: 12 }, { k: 'crit', v: 4 }], sockets: 0, gems: [], quality: 5, ...o })
const robe = (o: Partial<Item> = {}): Item => ({ slot: 'chest', base: 'Robe', name: 'Old Robe', rarity: 'magic', ilvl: 30, power: 80, affixes: [{ k: 'vit', v: 20 }, { k: 'life', v: 100 }], sockets: 0, gems: [], quality: 0, ...o })
const forgeHero = (gear: Partial<Record<'weapon' | 'chest', Item>>): Hero => ({ ...newHero('Ada', null, 7, NOW), level: 30, gear })

test('task-10 AC1: an old item without a forge level derives exactly what v0.1 did', () => {
  // dps, life and armor measured on main (7d395ef) before the forge existed, for the same hero and items.
  const d = derive(forgeHero({ weapon: blade(), chest: robe() }), {})
  expect(d.dps).toBe(264.27947121576005)
  expect(d.life).toBe(1808.044)
  expect(d.armor).toBe(180)
  const zero = derive(forgeHero({ weapon: blade({ plus: 0 }), chest: robe({ plus: 0 }) }), {})
  expect(zero.dps).toBe(d.dps)
  expect(zero.life).toBe(d.life)
  expect(itemTitle(blade())).toBe('Old Blade')
  expect(itemTitle(blade({ plus: 6 }))).toBe('+6 Old Blade')
})

test('task-10 AC2: each forge level adds 6% of the base power and of every affix', () => {
  const at = (plus: number) => derive(forgeHero({ weapon: blade({ plus, affixes: [] }), chest: robe({ plus, affixes: [] }) }), {})
  const bare = derive(forgeHero({ weapon: blade({ affixes: [] }) }), {})
  // A life affix: what it adds over the bare hero scales the same way.
  const lifeOf = (plus: number) => derive(forgeHero({ weapon: blade({ affixes: [] }), chest: robe({ plus, affixes: [{ k: 'life', v: 100 }] }) }), {}).life - bare.life
  for (const plus of [0, 5, 10]) expect(plusMult(blade({ plus }))).toBe(1 + 0.06 * plus)
  // The robe's armor over a hero without it scales with the multiplier.
  const robeArmor = (plus: number) => at(plus).armor - bare.armor
  expect(Math.abs(robeArmor(5) / robeArmor(0) - 1.3)).toBeLessThan(0.02)
  expect(Math.abs(robeArmor(10) / robeArmor(0) - 1.6)).toBeLessThan(0.02)
  expect(Math.abs(lifeOf(5) / lifeOf(0) - 1.3)).toBeLessThan(0.02)
  expect(Math.abs(lifeOf(10) / lifeOf(0) - 1.6)).toBeLessThan(0.02)
  // The weapon's base damage scales the same way: with no affixes, dps grows by the multiplier.
  expect(Math.abs(at(10).dps / at(0).dps - 1.6)).toBeLessThan(0.02)
})

test('task-10 AC3: over 10,000 upgrades, critical forges near 10%, blessings near 15%, milestones once each', () => {
  const h = forgeHero({})
  const r = rngOf(h)
  let crits = 0
  let blessed = 0
  const N = 10_000
  for (let n = 0; n < N; n++) {
    const u = upgraded(r, blade({ plus: n % 14 }))
    if (u.crit) crits++
    if (u.blessed) blessed++
    expect(u.item.plus).toBeGreaterThan(n % 14)
  }
  expect(Math.abs(crits / N - FORGE.crit)).toBeLessThan(0.01)
  expect(Math.abs(blessed / N - FORGE.bless)).toBeLessThan(0.012)
  // Walk 200 items from +0 to +15: each milestone fires exactly once per item, whatever crits skip over.
  for (let k = 0; k < 200; k++) {
    let i = k % 2 ? blade() : { ...blade(), slot: 'ring' as const, affixes: [{ k: 'crit' as const, v: 2 }] }
    const fired: number[] = []
    const startAffixes = i.affixes.length
    while ((i.plus ?? 0) < PLUS_MAX) {
      const before = i
      const u = upgraded(r, i)
      fired.push(...u.crossed)
      i = u.item
      if (u.crossed.includes(15)) for (let j = 0; j < before.affixes.length; j++) expect(i.affixes[j]!.v).toBeGreaterThanOrEqual(before.affixes[j]!.v)
    }
    expect(fired).toEqual([5, 10, 15])
    // A weapon gets its socket at +5; a ring has no socket room, so +5 rolls a bonus affix. +10 always adds one.
    if (k % 2) {
      expect(i.sockets).toBe(1)
      expect(i.affixes.length).toBe(startAffixes + 1)
    } else expect(i.affixes.length).toBe(startAffixes + 2)
    expect(new Set(i.affixes.map(a => a.k)).size).toBe(i.affixes.length)
  }
})

test('task-10 AC4: a failed try costs only materials, never a level, and pity raises the next chance', () => {
  const h = forgeHero({ weapon: blade({ plus: 14 }) })
  h.gold = 1e12
  h.mats.ore = 1e9
  const odds = [forgeChance(15, h.life.smithing.lvl, 0)]
  // A stream that always rolls high: at +15 even eight pity steps stay under 100%, so every try fails.
  const tries = forgeVisit(h, () => 0.999, {}, NOW, [])
  expect(tries).toBe(FORGE.tries)
  expect(h.gear.weapon!.plus).toBe(14)
  expect(h.gear.weapon!.name).toBe('Old Blade')
  expect(h.gear.weapon!.pity).toBe(FORGE.tries)
  for (let p = 1; p <= 3; p++) odds.push(forgeChance(15, h.life.smithing.lvl, p))
  for (let p = 1; p < odds.length; p++) expect(Math.abs(odds[p]! - odds[p - 1]! - 0.1)).toBeLessThan(1e-9)
  expect(h.gold).toBeLessThan(1e12)
  expect(h.mats.ore).toBe(1e9 - FORGE.tries * forgeCost(blade(), 15, 30).ore)
  // Up to +3 never fails; the chance falls to about 90% at +4 and 15% at +15; the next success clears the pity.
  expect(forgeChance(3, 0, 0)).toBe(1)
  expect(Math.abs(forgeChance(4, 0, 0) - 0.9)).toBeLessThan(1e-9)
  expect(Math.abs(forgeChance(15, 0, 0) - 0.15)).toBeLessThan(1e-9)
  forgeVisit(h, () => 0, {}, NOW, [])
  expect(h.gear.weapon!.plus).toBe(15)
  expect(h.gear.weapon!.pity).toBe(undefined)
})

test('task-10 AC7: the active aura clears if no turn end arrives within ten minutes', async ($, on) => {
  const clock = await started($, on, { band: 'full' })
  await begin($)
  await clock.settle()
  expect(await sourceOf($)).toContain('data-live="active"')
  await clock.advance(9 * MIN)
  await clock.settle()
  expect(await sourceOf($)).toContain('data-live="active"')
  await clock.advance(MIN + 1000)
  await clock.settle()
  expect(await sourceOf($)).not.toContain('data-live="active"')
  // A turn that does finish cancels the timer: the next turn stays active past the old deadline.
  await begin($, 't2')
  await clock.advance(5 * MIN)
  await finish($, 100, 't2')
  await begin($, 't3')
  await clock.advance(6 * MIN)
  await clock.settle()
  expect(await sourceOf($)).toContain('data-live="active"')
})
