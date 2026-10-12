import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren } from 'claude-code'

import type { Counts, Fx, Hero, LifeSkill, Slot, View } from '../types'
import { sceneSvg, tickerText } from './art'
import { ACHIEVEMENTS, AFFIX, CURRENCY, ELIXIRS, FISH_SPOTS, GEMS, GEM_TIERS, KEYSTONES, MEALS, NO_RACE, POWERS, RACES, RELIC_SITES, SETS, SLOTS } from './data'
import {
  applyCounts, awaySummary, classOf, cubePowers, derive, emptyCounts, fmt, gemName, itemColor, itemTitle, newHero, oreOf, pickOf, placeOf,
  rodOf, roman, SKILL_PERKS, shovelOf, sitesDone, skillIcon, skillRanks, step, totalLevel, trainingOf, xpAt, xpToNext,
} from './game'

// Claude Quest: an idle ARPG that plays itself above the prompt. Real work in Claude banks Focus, which the
// hero spends fighting; with none left it camps and fishes, mines and digs. It never calls a model.
//
// Several sessions can be open at once and there is one hero: the session holding the lease (a file renewed
// every 3 seconds) runs the game and saves it; every session writes its own running counts to an inbox file
// the runner folds in once, by difference. Everything lives in ~/.claude/claude-quest.

const PANE = 'claude-quest'
const view = atom({ plugin: 'claude-quest', key: 'view' } as const, { hero: null, isLeader: false, at: 0 } as View)
const tab = atom({ plugin: 'claude-quest', key: 'tab' } as const, 'Hero')
const ticker = atom({ plugin: 'claude-quest', key: 'ticker' } as const, true)

const LEASE_MS = 10_000
const SAVE_MS = 10_000
const TOAST_GAP_MS = 8_000
const TABS = ['Hero', 'Gear', 'Party', 'Life', 'Log', 'Codex'] as const

// The module's own working state; a reload starts it over and the files carry the rest.
let dir = ''
let sid = ''
let mine: Counts = emptyCounts()
let isDirty = false
let hero: Hero | null = null
let isLeader = false
let tickN = 0
let lastSaved = 0
let lastKey = ''
let race: { name: string; fx: Fx; text: string } = NO_RACE
let toastAt = 0
let isQuiet = false
let followerText = ''
let hasTerminal = false
const inboxSeen = new Map<string, number>()

const slash = (p: string) => p.replace(/\\/g, '/')
const parse = <T,>(text: string): T | null => {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

async function readRace($: EngineInterface) {
  const model = await $.session.model().catch(() => '')
  race = RACES.find(r => r.match.test(model)) ?? NO_RACE
}

async function lease($: EngineInterface, now: number) {
  const held = parse<{ sid: string; until: number }>(await $.fs.read(`${dir}/lease.json`).catch(() => ''))
  if (!held || held.until < now || held.sid === sid) {
    await $.fs.write(`${dir}/lease.json`, JSON.stringify({ sid, until: now + LEASE_MS }))
    if (!isLeader) {
      isLeader = true
      hero = null
    }
  } else if (isLeader) {
    isLeader = false
    hero = null
  }
}

async function save($: EngineInterface, now: number) {
  if (!hero) return
  lastSaved = now
  await $.fs.write(`${dir}/hero.json`, JSON.stringify(hero))
}

/** Folds every session's inbox into the hero: only files that changed since they were last read. */
async function drainInbox($: EngineInterface, now: number) {
  if (!hero) return []
  const notes: string[] = []
  const files = await $.fs.list(`${dir}/inbox`).catch(() => [])
  for (const f of files) {
    if (f.kind !== 'file' || !f.name.endsWith('.json')) continue
    if (inboxSeen.get(f.name) === f.mtimeMs) continue
    const counts = parse<Counts>(await $.fs.read(`${dir}/inbox/${f.name}`).catch(() => ''))
    inboxSeen.set(f.name, f.mtimeMs)
    if (counts) notes.push(...applyCounts(hero, f.name.slice(0, -5), { ...emptyCounts(), ...counts }, now, race.fx))
  }
  return notes
}

function toast($: EngineInterface, notes: string[], now: number) {
  if (isQuiet || !notes.length || now - toastAt < TOAST_GAP_MS) return
  toastAt = now
  $.ui.toast(notes.length > 1 ? `${notes[0]} (+${notes.length - 1} more in /quest)` : notes[0]!)
}

const keyOf = (h: Hero) => `${h.task.label}|${h.task.ms}|${h.beam?.at ?? 0}|${h.level}|${h.log.at(-1)?.t ?? 0}|${h.log.length}`

async function show($: EngineInterface, h: Hero | null, now: number, leader: boolean) {
  await update($, view, () => ({ hero: h ? (JSON.parse(JSON.stringify(h)) as Hero) : null, isLeader: leader, at: now }))
}

/** Once a second: write this session's counts, hold or lose the lease, and run or read the game. */
async function tick($: EngineInterface) {
  tickN++
  const now = await $.clock.now()
  if (isDirty) {
    isDirty = false
    await $.fs.write(`${dir}/inbox/${sid}.json`, JSON.stringify(mine))
  }
  if (tickN % 3 === 1) await lease($, now)
  if (tickN % 60 === 0) await readRace($)
  if (isLeader) {
    if (!hero) {
      hero = parse<Hero>(await $.fs.read(`${dir}/hero.json`).catch(() => ''))
      // The first session ever starts the hero: nobody picks anything, it finds its own way.
      if (!hero) {
        const user = (await $.env.get('USERNAME')) ?? (await $.env.get('USER')) ?? 'Hero'
        const name = user.charAt(0).toUpperCase() + user.slice(1)
        hero = newHero(name, null, (now ^ 0x5eed) >>> 0, now)
        await save($, now)
        $.ui.toast(`⚔ Claude Quest: ${name} wakes up. /quest to watch.`)
      }
    }
    const before = now - hero.lastTick > 10 * 60_000 ? (JSON.parse(JSON.stringify(hero)) as Hero) : null
    const notes = tickN % 3 === 1 ? await drainInbox($, now) : []
    notes.push(...step(hero, now, race.fx))
    if (before) {
      const s = awaySummary(before, hero, now - before.lastTick)
      if (s) {
        hero.log.push({ t: now, s, c: '#9fd8ff' })
        notes.unshift(s)
      }
    }
    toast($, notes, now)
    const key = keyOf(hero)
    if (key !== lastKey || (hasTerminal && tickN % 2 === 0)) {
      if (key !== lastKey) await save($, now)
      lastKey = key
      await show($, hero, now, true)
    }
    if (now - lastSaved > SAVE_MS) await save($, now)
  } else if (tickN % 3 === 1) {
    const text = await $.fs.read(`${dir}/hero.json`).catch(() => '')
    if (text && text !== followerText) {
      followerText = text
      await show($, parse<Hero>(text), now, false)
    }
  }
}

// What a tool call counts as.
const EDITS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])
const READS = new Set(['Read', 'Grep', 'Glob', 'LS', 'NotebookRead'])
const SHELLS = new Set(['Bash', 'PowerShell'])
const AGENTS = new Set(['Agent', 'Task'])
const isWeb = (tool: string) => tool === 'WebFetch' || tool === 'WebSearch' || /^mcp__(Claude_Browser|claude-in-chrome|plugin_browser-use)/.test(tool)
const TEST = /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bpytest\b|\bvitest\b|\bjest\b|\bcargo\s+test\b|\bgo\s+test\b|\bplugin\s+test\b|\bdotnet\s+test\b|\bmvn\s+test\b|\bgradlew?\s+test\b/
const COMMIT = /\bgit\s+commit\b/

const count = (k: keyof Counts, n = 1) => {
  mine[k] += n
  isDirty = true
}

/** A display copy of a hero read from disk: its task moved on by the time since that save. */
const displayed = (v: View, now: number): Hero | null => {
  if (!v.hero) return null
  if (v.isLeader) return v.hero
  const h = v.hero
  return { ...h, task: { ...h.task, done: Math.min(h.task.ms, h.task.done + Math.max(0, now - h.lastTick)) } }
}

const periodOf = (h: Hero) => Math.min(1.2, Math.max(0.3, 0.9 / derive(h, race.fx).speed))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    const home = slash((await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? '')
    dir = `${home}/.claude/claude-quest`
    sid = await $.session.id()
    await $.command.register({ name: 'quest', description: 'Claude Quest: watch your hero. /quest ticker or /quest quiet to switch those' })
    const tick0 = await $.store.get('ticker').catch(() => undefined)
    if (typeof tick0 === 'boolean') await update($, ticker, () => tick0)
    isQuiet = (await $.store.get('quiet').catch(() => undefined)) === true
    hasTerminal = ((await $.session.surfaces().catch(() => [])) as readonly string[]).includes('terminal')
    await readRace($)
    // A resumed session carries on counting from its own inbox file.
    const own = parse<Counts>(await $.fs.read(`${dir}/inbox/${sid}.json`).catch(() => ''))
    if (own) mine = { ...emptyCounts(), ...own }
    followerText = ''
    $.clock.every(1000, () => void tick($).catch(() => undefined))
    return started
  })

  on('session.end', async ($, e, next) => {
    // Save and let the lease go so another session picks the hero up at once.
    if (isLeader && hero) {
      const now = await $.clock.now()
      await save($, now).catch(() => undefined)
      await $.fs.write(`${dir}/lease.json`, JSON.stringify({ sid, until: 0 })).catch(() => undefined)
    }
    if (isDirty) await $.fs.write(`${dir}/inbox/${sid}.json`, JSON.stringify(mine)).catch(() => undefined)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined) return ran
    const tool = e.tool
    const isError = ran.isError === true
    if (EDITS.has(tool)) count('edit')
    else if (READS.has(tool)) count('read')
    else if (AGENTS.has(tool)) count('agent')
    else if (isWeb(tool)) count('web')
    else if (SHELLS.has(tool)) {
      count('bash')
      const command = String((e as unknown as { command?: unknown }).command ?? '')
      if (!isError && COMMIT.test(command)) count('commit')
      if (TEST.test(command)) count(isError ? 'fail' : 'test')
    }
    if (isError) count('fail')
    return ran
  })

  on('turn.start', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId === undefined && String((e as { text?: unknown }).text ?? '').startsWith('Hand off this chat.')) count('handoff')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) count('turns')
    // Tokens train the attributes: by the model that spent them, and what came from the cache.
    const u = (e as { usage?: { model?: string; input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number } }).usage
    if (u) {
      const k = ((u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)) / 1000
      const m = u.model ?? ''
      count(/opus/i.test(m) ? 'tokOpus' : /sonnet/i.test(m) ? 'tokSonnet' : /haiku/i.test(m) ? 'tokHaiku' : 'tokOther', Math.round(k * 10) / 10)
      count('tokCache', Math.round((u.cache_read_input_tokens ?? 0) / 100) / 10)
    }
    return done
  })

  on('session.compact', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const percent = (await $.session.usage().catch(() => null))?.context?.percent ?? 100
    const r = await next(e)
    if (!('skip' in r && typeof r.skip === 'string')) {
      count('compact')
      if (percent < 75) count('rested')
    }
    return r
  })

  on('command.run', { command: 'quest' }, async ($, e) => {
    const arg = String(e.args ?? '').trim().toLowerCase()
    if (arg === 'ticker') {
      const on2 = !(await read($, ticker))
      await update($, ticker, () => on2)
      await $.store.set('ticker', on2)
      return { text: on2 ? 'Quest ticker shown above the prompt.' : 'Quest ticker hidden. /quest ticker brings it back.' }
    }
    if (arg === 'quiet') {
      isQuiet = !isQuiet
      await $.store.set('quiet', isQuiet)
      return { text: isQuiet ? 'Quest toasts off.' : 'Quest toasts on.' }
    }
    await $.ui.open({ id: PANE, title: 'Claude Quest', focus: true })
    return { text: 'Claude Quest opened.' }
  })

  // The ticker above the prompt: the scene where SVG draws, a line of text where it does not.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, ticker))) return next(e)
    const v = await read($, view)
    const now = await $.clock.now()
    const hr = displayed(v, now)
    if (!hr) return next(e)
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const Svg = e.surface !== 'terminal' && 'Svg' in ui ? ui.Svg : null
    const cls = classOf(hr)
    let row: RenderChildren
    if (Svg) {
      const W = Math.min(720, Math.max(360, (e.props.bodyColumns ?? 90) * 6))
      row = <Svg key="quest" source={sceneSvg(hr, { w: W, h: 88, now, period: periodOf(hr) })} alt={`${hr.name}, level ${hr.level} ${cls.name}: ${hr.task.label}`} width={W} height={88} />
    } else {
      const t = tickerText(hr, now)
      row = (
        <Text key="quest" wrap="truncate-end">
          <Text color={cls.trim} bold>{`${t.icon} Lv ${hr.level} ${cls.name}`}</Text>
          <Text dimColor>{' · '}</Text>
          <Text>{hr.task.label}</Text>
          <Text color="#d9a441">{` ${t.bar} ${t.pct}%`}</Text>
          {hr.focus > 0 ? <Text dimColor>{` · focus ${Math.ceil(hr.focus / 60_000)}m`}</Text> : <Text dimColor>{' · at camp'}</Text>}
        </Text>
      )
    }
    const below = await next(e).catch(() => null)
    return (
      <Box flexDirection="column">
        <Box paddingX={1}>{row}</Box>
        {below}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const Svg = e.surface !== 'terminal' && 'Svg' in ui ? ui.Svg : null
    const Button = 'Button' in ui ? ui.Button : null
    const v = await read($, view)
    const now = await $.clock.now()
    const hr = displayed(v, now)
    const current = await read($, tab)
    if (!hr) {
      return (
        <Box flexDirection="column">
          <Text bold>Claude Quest</Text>
          <Text dimColor>Your hero is waking up. It starts on its own within a few seconds.</Text>
        </Box>
      )
    }
    const cls = classOf(hr)
    const d = derive(hr, race.fx)
    const tr = trainingOf(hr.counts)
    const bar = (part: number, whole: number, width = 20) => {
      const n = Math.max(0, Math.min(width, Math.round((part / Math.max(1, whole)) * width)))
      return `${'▓'.repeat(n)}${'░'.repeat(width - n)}`
    }
    const line = (label: string, value: string, color?: string) => (
      <Box key={label} flexDirection="row">
        <Box width={16} flexShrink={0}><Text dimColor>{label}</Text></Box>
        <Text {...(color ? { color } : {})}>{value}</Text>
      </Box>
    )
    const section = (title: string, ...kids: RenderChildren[]) => (
      <Box key={title} flexDirection="column" marginTop={1}>
        <Text bold color="#d9a441">{title}</Text>
        {kids}
      </Box>
    )
    const W = Math.min(760, Math.max(360, (e.props.bodyColumns ?? 90) * 7))
    const tabs = Button
      ? (
        <Box flexDirection="row" gap={1}>
          {TABS.map(t => <Button key={`t-${t}`} label={t === current ? `[${t}]` : t} plain onPress={() => void update($, tab, () => t)} />)}
        </Box>
      )
      : <Text dimColor>{TABS.join(' · ')}</Text>
    const body: RenderChildren[] = []

    if (current === 'Hero') {
      const into = hr.xp
      const need = xpToNext(hr.level)
      body.push(
        section('Character',
          line('Hero', `${hr.name}, ${race.name} ${cls.name}${hr.chosen ? '' : ' (awakens after 50 actions)'}`, cls.trim),
          line('Level', `${hr.level}  ${bar(into, need)} ${Math.floor((into / need) * 100)}%  (${fmt(xpAt(hr.level) + into)} XP total)`),
          line('Total level', `${totalLevel(hr)} across six life skills`),
          line('Where', placeOf(hr).title),
          line('Focus', hr.focus > 0 ? `${Math.ceil(hr.focus / 60_000)} min of combat banked` : 'none: camping until you work in Claude again'),
          line('Race', `${race.name}: ${race.text} (from the model you run)`),
        ),
        section('Stats',
          line('Damage', `${fmt(d.dps)} DPS, hits for ${fmt(d.hit)}`),
          line('Life', `${fmt(d.life)}  ·  armor ${fmt(d.armor)}  ·  resist ${fmt(d.resist)}  ·  ${Math.round(d.dr)}% less damage`),
          line('Offense', `crit ${(d.crit * 100).toFixed(1)}% x${(1 + d.critDmg).toFixed(2)}  ·  speed ${d.speed.toFixed(2)}  ·  elite +${Math.round(d.elite)}%  ·  area +${Math.round(d.area)}%`),
          line('Find', `magic +${Math.round(d.mf)}%  ·  gold +${Math.round(d.gf)}%  ·  XP +${Math.round(d.xp)}%`),
        ),
        section('Training (how you work)',
          line('Strength', `${tr.str}  (Opus tokens, edits)`),
          line('Dexterity', `${tr.dex}  (Sonnet tokens, reads)`),
          line('Intelligence', `${tr.int}  (Haiku tokens, shell, agents, web)`),
          line('Vitality', `${tr.vit}  (turns, compacting early)`),
          line('Luck', `${tr.luck}  (cache reads)`),
          line('Harmony', `${Math.round(tr.harmony * 100)}%  (+${Math.round(25 * tr.harmony)}% damage for training evenly)`, tr.harmony >= 0.8 ? '#2fd05a' : undefined),
        ),
        section('Today\'s bounties',
          ...hr.bounties.list.map(b => line(hr.bounties.claimed.includes(b.id) ? '✓ done' : `${b.have}/${b.need}`, b.text, hr.bounties.claimed.includes(b.id) ? '#2fd05a' : undefined)),
        ),
        section('Record',
          line('Kills', `${fmt(hr.kills)}  ·  deaths ${fmt(hr.deaths)}  ·  biggest hit ${fmt(hr.stats.maxHit)}`),
          line('Atlas', hr.stage ? 'campaign in progress' : `tier ${hr.map.tier}, best cleared ${hr.map.best}`),
          line('Wealth', `${fmt(hr.gold)} gold  ·  ${hr.stats.legendaries} legendaries found`),
        ),
      )
      if (hr.buffs.length) body.push(section('Buffs', ...hr.buffs.map(b => line(b.name, `+${b.k === 'mult' ? `x${(1 + b.v).toFixed(2)}` : `${Math.round(b.v)} ${b.k}`} · ${Math.ceil(b.left / 60_000)}m`))))
    } else if (current === 'Gear') {
      const slotName: Record<Slot, string> = { weapon: 'Weapon', offhand: 'Off-hand', head: 'Head', chest: 'Chest', hands: 'Hands', waist: 'Waist', legs: 'Legs', feet: 'Feet', neck: 'Neck', ring: 'Ring', ring2: 'Ring' }
      body.push(section('Equipped', ...SLOTS.map(s => {
        const i = hr.gear[s]
        if (!i) return line(slotName[s], '(empty)')
        const affixes = i.affixes.slice(0, 3).map(a => `+${fmt(a.v)}${AFFIX[a.k].pct ? '%' : ''} ${AFFIX[a.k].label}`).join(', ')
        return (
          <Box key={`g-${s}`} flexDirection="column">
            {line(slotName[s], `${itemTitle(i)}  ilvl ${i.ilvl}${i.quality ? `  q${i.quality}` : ''}`, itemColor(i))}
            <Text dimColor wrap="truncate-end">{`                ${affixes}${i.gems.length ? `  ·  ${i.gems.map(gemName).join(', ')}` : i.sockets ? `  ·  ${i.sockets} empty socket${i.sockets > 1 ? 's' : ''}` : ''}`}</Text>
          </Box>
        )
      })))
      const worn: Record<string, number> = {}
      for (const i of Object.values(hr.gear)) if (i?.rarity === 'set' && i.uid) worn[i.uid] = (worn[i.uid] ?? 0) + 1
      const sets = SETS.filter(s => worn[s.id])
      if (sets.length) body.push(section('Sets', ...sets.map(s => line(`${worn[s.id]}/4`, `${s.name}: ${(worn[s.id] ?? 0) >= 2 ? s.twoText : '-'}${(worn[s.id] ?? 0) >= 4 ? `, ${s.fourText}` : ''}`, '#2fd05a'))))
      const cube = cubePowers(hr)
      body.push(section('Horadric Compiler', ...(cube.length ? cube.map(p => line(p.g === 'w' ? 'Weapon' : p.g === 'a' ? 'Armor' : 'Jewelry', `${p.item}: ${p.text}`, '#c58bff')) : [<Text key="nc" dimColor>No powers extracted yet.</Text>])))
      const orbs = CURRENCY.map(c => `${c.name} ${hr.currency[c.id] ?? 0}`).join('  ·  ')
      const gems = GEMS.map((g, ti) => {
        let best = -1
        for (let t = 7; t >= 0; t--) if ((hr.gems[ti * 8 + t] ?? 0) > 0) { best = t; break }
        return best >= 0 ? `${GEM_TIERS[best] ? `${GEM_TIERS[best]} ` : ''}${g}` : null
      }).filter(Boolean).join(', ')
      body.push(section('Stash',
        <Text key="orbs" wrap="wrap">{orbs}</Text>,
        line('Materials', `${hr.mats.crystal} crystals  ·  ${hr.mats.soul} souls  ·  ${hr.mats.ore} ore  ·  ${hr.mats.reagent} reagents`),
        line('Best gems', gems || 'none yet'),
        line('Mirrors', hr.mirrors ? `${hr.mirrors} (x${2 ** hr.mirrors} damage)` : 'none, yet'),
      ))
    } else if (current === 'Party') {
      body.push(section('Followers', ...(hr.followers.length ? hr.followers.map((f, i) => line(i < 3 ? 'In party' : 'Resting', f, '#9fd8ff')) : [<Text key="nf" dimColor>The first follower joins at level 5, more at 30 and 70, and one for every clean handoff.</Text>])))
      if (hr.minions.length) body.push(section('Minions (from your subagents)', ...hr.minions.map((m, i) => line(`#${i + 1}`, `${m.name} · ${Math.ceil(m.left / 60_000)}m`, '#c58bff'))))
      const ranks = skillRanks(hr.level)
      body.push(section(`Skills (${cls.name})`, ...(cls.skills.length ? cls.skills.map((s, i) => line(`Rank ${ranks[i]}`, `${s.name}: +${fmt(s.per * (ranks[i] ?? 0) * (s.k === 'mult' ? 100 : 1))}${s.k === 'mult' ? '% more damage' : s.k === 'dr' ? '% less damage taken' : ` ${AFFIX[s.k as keyof typeof AFFIX]?.label ?? s.k}`}`)) : [<Text key="ns" dimColor>Skills arrive with the class.</Text>])))
      const ks = KEYSTONES.map(k => line(k.at <= hr.level ? '✓' : `Lv ${k.at}`, `${k.name}: ${k.text}`, k.at <= hr.level ? '#ffd23f' : undefined))
      body.push(section('Passive keystones', ...ks))
    } else if (current === 'Life') {
      const skills: LifeSkill[] = ['fishing', 'mining', 'archaeology', 'cooking', 'smithing', 'alchemy']
      const tool: Record<LifeSkill, string> = {
        fishing: rodOf(hr.life.fishing.lvl), mining: `${pickOf(hr.life.mining.lvl)}, ${oreOf(hr.life.mining.lvl)}`, archaeology: shovelOf(hr.life.archaeology.lvl),
        cooking: `${hr.fish.meals.reduce((a, b) => a + b, 0)} meals ready`, smithing: `quality cap ${20 + Math.floor(hr.life.smithing.lvl / 5)}%`, alchemy: `${hr.elixirs.reduce((a, b) => a + b, 0)} elixirs ready`,
      }
      const total = totalLevel(hr)
      body.push(section(`Life skills (total level ${total}: +${Math.floor(total / 25)}% damage)`, ...skills.map(s => {
        const sk = hr.life[s]
        const perk = SKILL_PERKS[s]
        return (
          <Box key={`sk-${s}`} flexDirection="column">
            {line(`${skillIcon(s)} ${s}`, `${sk.lvl}  ${bar(sk.xp, xpToNext(sk.lvl), 12)}  ${tool[s]}`, sk.lvl >= 99 ? '#ffd23f' : undefined)}
            <Text dimColor>{`                perk: +${(perk.per * sk.lvl).toFixed(1)}${perk.text}`}</Text>
          </Box>
        )
      })))
      const spot = FISH_SPOTS[placeOf(hr).spot]!
      body.push(section(`Fishing journal: ${spot.name}`, ...[...spot.fish, ...spot.legends].map(f => line(hr.fish.journal[f] ? `x${hr.fish.journal[f]}` : '???', hr.fish.journal[f] ? `${f}  (best ${hr.fish.best[f]}kg)` : 'not caught yet', spot.legends.includes(f) && hr.fish.journal[f] ? '#ff8a1f' : undefined))))
      body.push(section(`Relic sites (${sitesDone(hr)} complete, +${2 * sitesDone(hr)}% damage)`, ...RELIC_SITES.map(s => {
        const found = s.relics.filter(r => hr.relics[r]).length
        return line(`${found}/${s.relics.length}`, s.name, found === s.relics.length ? '#ffd23f' : undefined)
      })))
      body.push(section('Pantry',
        line('Meals', MEALS.map(m => `${m.name} ${hr.fish.meals[m.tier] ?? 0}`).join('  ·  ')),
        line('Elixirs', ELIXIRS.map(x => `${x.name} ${hr.elixirs[x.tier] ?? 0}`).join('  ·  ')),
      ))
    } else if (current === 'Log') {
      body.push(section('Adventure log', ...hr.log.slice(-28).reverse().map((l, i) => (
        <Text key={`l-${i}`} wrap="truncate-end" {...(l.c ? { color: l.c } : {})}>{l.s}</Text>
      ))))
    } else {
      const got = ACHIEVEMENTS.filter(a => hr.ach[a.id]).length
      body.push(section(`Achievements (${got}/${ACHIEVEMENTS.length})`, ...ACHIEVEMENTS.map(a => line(hr.ach[a.id] ? '🏆' : '·', `${a.name}: ${a.text}`, hr.ach[a.id] ? '#ffd23f' : undefined))))
      body.push(section(`Legendary powers known (${hr.codex.length}/${POWERS.length})`, ...POWERS.map(p => line(hr.codex.includes(p.id) ? '★' : '·', hr.codex.includes(p.id) ? `${p.item}: ${p.text}` : '???', hr.codex.includes(p.id) ? '#ff8a1f' : undefined))))
    }

    return (
      <Box flexDirection="column">
        {Svg ? <Svg source={sceneSvg(hr, { w: W, h: 150, now, period: periodOf(hr) })} alt={`${hr.name}: ${hr.task.label}`} width={W} height={150} /> : <Text bold>{`⚔ ${hr.name} · Lv ${hr.level} ${cls.name} · ${hr.task.label}`}</Text>}
        {tabs}
        {body}
        <Text dimColor>{`${roman(Object.keys(hr.ach).length)} · this session ${v.isLeader ? 'runs the game' : 'watches the game another session runs'}`}</Text>
      </Box>
    )
  })
}

