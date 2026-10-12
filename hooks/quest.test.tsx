import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { sceneSvg } from './art'
import { applyCounts, derive, emptyCounts, newHero, step, trainingOf, xpAt } from './game'

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

test('training leans with the model used, and harmony rewards balance', () => {
  const opusOnly = trainingOf({ ...emptyCounts(), tokOpus: 4000 })
  expect(opusOnly.str).toBeGreaterThan(opusOnly.dex)
  expect(opusOnly.harmony).toBe(0)
  const even = trainingOf({ ...emptyCounts(), edit: 200, read: 200, bash: 200, turns: 100 })
  expect(even.harmony).toBeGreaterThan(0.9)
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

// The hooks, end to end, on an in-memory disk.
let disk: Record<string, string> = {}
function host(on: On) {
  disk = {}
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
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="core" />
  })
  mock.store(on, {})
  return mock.clock(on, { now: NOW })
}

const BAND = { component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 120, scroll: { offset: 0, bodyRows: 11 }, view: {} } } as const

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
