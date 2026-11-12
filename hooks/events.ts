// task-15: random events, Godville and Progress Quest style. Pure: no `$`, no I/O, no imports from game.ts.
// A template is a line with slots; slots draw from the filler tables, so a few hundred templates make thousands of lines.
import type { Buff, Hero } from '../types'

export type Rng = () => number
/** Where the hero is when an event fires: the kind of task, and the place and monster to joke about. */
export type TaleCtx = 'fight' | 'camp' | 'town' | 'travel' | 'dead'
export type Tale = {
  line: string
  /** gold won (or lost, below zero), a short buff, or an item of this rarity */
  gold?: number
  buff?: Buff
  item?: 'magic' | 'rare'
  /** worth a toast: chain finales and the rarest events only */
  big?: boolean
  /** a running gag moved one step on */
  chain?: { id: string; step: number }
  /** which template made it, so the same joke shape rests a while */
  tpl?: number
}
export type TaleState = NonNullable<Hero['tales']>

// ------------------------------------------------------------------ fillers
const F: Record<string, readonly string[]> = {
  critter: ['a seagull', 'a goose', 'a tiny dragon', 'a pigeon in a hat', 'a goblin intern', 'a teapot with legs', 'a skeleton on break', 'a slime with opinions', 'a raccoon', 'a frog in a waistcoat', 'a moth', 'a lost sheep', 'a bard', 'a confused ghost', 'a mimic posing as a chair', 'a snail', 'a crow', 'a toad', 'a squirrel', 'a cat', 'an owl', 'a beetle', 'a llama', 'a hedgehog', 'a duck', 'a bat', 'an imp', 'a gnome', 'a very old turtle', 'a chicken', 'a badger', 'a newt', 'a ferret', 'a donkey', 'a magpie', 'a mole', 'a crab in a tie', 'a gecko', 'an otter', 'a parrot', 'a sleepy bear', 'a wombat', 'a fox', 'a pelican', 'a capybara'],
  thing: ['a rock', 'a barrel', 'a door marked DO NOT', 'a rusty spoon', 'a bucket', 'a signpost', 'a cursed sock', 'a lever', 'a sighing chest', 'a loaf of bread', 'a wet map', 'a candle', 'a teacup', 'a scroll titled TODO', 'a lantern', 'an old boot', 'a statue', 'a mushroom', 'a stump', 'a well', 'a haystack', 'a puddle', 'a cart', 'a pillar', 'a broom', 'a kettle', 'a wheelbarrow', 'a scarecrow', 'a mailbox', 'a birdhouse', 'a hammock', 'a bell', 'a harp', 'a crate of apples', 'a mop', 'a ladder', 'a rope', 'a trunk', 'a tiny door', 'a gargoyle', 'a sundial', 'a bench', 'a fence post', 'a cauldron', 'a quill', 'a teapot', 'a pillow', 'a cactus', 'a wagon wheel', 'a weathervane', 'a doormat', 'a mirror', 'a chair', 'a bookshelf', 'a jar of pickles', 'a drum', 'an anvil', 'a sack of flour', 'a trophy', 'a fountain'],
  tech: ['a merge conflict', 'a flaky test', 'a missing semicolon', 'a YAML indent', 'an off-by-one error', 'a race condition', 'a null pointer', 'a stale cache', 'an old TODO', 'a regex', 'a memory leak', 'an infinite loop', 'a typo in prod', 'a silent failure', 'an unowned dependency', 'a 404', 'a timezone bug', 'a deprecation warning', 'a lint error', 'a stack trace', 'a magic number', 'a dead branch', 'a circular import', 'a leaked env var', 'a rounding error', 'a hardcoded password', 'a broken build', 'a missing test', 'a 3am page', 'a flaky CI run', 'an unclosed tag', 'a stray console.log', 'a forgotten migration'],
  sign: ['No Dragons', 'Wet Floor', 'Here Be Bugs', 'Deploys Paused', 'Beware of Cat', 'Do Not Lick', 'Free Hugs (Mimic)', 'Exit Is Also Entrance', 'Closed For Refactor', 'Now With Fewer Traps', 'Trust The Process', 'You Are Here, Probably', 'No Fridays'],
  cry: ['For the backlog!', 'Ship it!', 'No more TODOs!', 'Rollback!', 'Coffee first!', 'For green tests!', 'Behold, a hotfix!', 'Not on a Friday!', 'It compiles!', 'To production!', 'Blame the cache!', 'Works on my machine!'],
  snack: ['a sandwich', 'a pickle', 'a cold pie', 'some cheese', 'a turnip', 'an apple', 'a biscuit', 'a muffin', 'some jerky', 'a pear', 'a dumpling', 'a waffle', 'a scone', 'a carrot', 'a plum', 'some soup', 'a pretzel', 'a meat pie', 'some berries', 'a fig', 'a honey cake', 'a baked potato'],
  fossil: ['a fossil semicolon', 'an ancient keyboard', 'a stone coffee mug', 'a carved TODO list', 'a petrified sticky note', 'a prehistoric mouse', 'a clay floppy disk', 'a bronze age bug report', 'a fossil rubber duck', 'a runic changelog'],
  mood: ['smug', 'confused', 'heroic', 'sleepy', 'unbothered', 'suspicious', 'proud', 'damp', 'inspired', 'peckish', 'majestic', 'mildly haunted', 'vindicated', 'humbled', 'dramatic', 'unstoppable', 'misunderstood', 'fancy', 'crispy', 'legendary'],
  sound: ['a sad trombone', 'distant applause', 'a dial-up tone', 'a single clap', 'a kazoo', 'dramatic music', 'a laugh track', 'a gong', 'a cowbell', 'a soft boing', 'a tuba', 'a slow clap', 'a rooster', 'a door creak', 'a polite cough', 'an angelic choir'],
}

/** Templates. Slots: {H} hero name, {F} the monster, {P} the place, {n} a gold amount; any filler key in braces. */
type T = { s: string; at?: TaleCtx[]; gold?: [number, number]; buff?: Omit<Buff, 'left'> & { min: number }; item?: 'magic' | 'rare'; big?: boolean }
const ANY: T[] = [
  { s: '{H} loses a staring contest to {thing}.' },
  { s: '{H} argues with {critter} about tabs and spaces.' },
  { s: '{H} files a bug report against {critter}.' },
  { s: '{critter} steals {snack} from {H}. Fair.' },
  { s: '{H} finds {tech} under {thing}.' },
  { s: '{H} names {thing} Gerald. It suits it.' },
  { s: '{H} trips over {tech}. Nobody saw. Probably.' },
  { s: '{H} high-fives {critter}. It was not ready.' },
  { s: '{H} explains {tech} to {critter}. It nods.' },
  { s: '{critter} reviews {H}\'s footwork: LGTM.' },
  { s: '{H} turns {thing} off and on again. It works.' },
  { s: '{H} writes a haiku about {tech}.' },
  { s: '{H} shares {snack} with {critter} in silence.' },
  { s: '{H} apologizes to {thing}, just in case.' },
  { s: '{H} blames {tech} on {critter}.' },
  { s: '{critter} follows {H} for a while, then leaves.' },
  { s: '{H} counts to ten. Gets to nine. Good enough.' },
  { s: '{H} sharpens the sword on {thing}.' },
  { s: '{H} finds a note: fix later. It is later.' },
  { s: '{H} reads a sign: {sign}.' },
  { s: '{H} feels {mood} for no reason.' },
  { s: '{H} hears {sound} from somewhere.' },
  { s: '{H} hums the boss music. No boss shows up.' },
  { s: '{H} waves at {critter}. It waves back. Odd.' },
  { s: '{critter} tells {H} a secret. It is about {tech}.' },
  { s: '{H} sneezes. {critter} says bless you.' },
  { s: '{H} practices a victory pose on {thing}.' },
  { s: '{H} pats {thing}. Feels {mood}.' },
  { s: '{H} wonders if {thing} is a mimic. It is not.' },
  { s: '{H} wonders if {thing} is a mimic. It is.' },
  { s: '{critter} asks {H} for a code review.' },
  { s: '{H} recites the alphabet backwards. Gets lost.' },
  { s: '{critter} sings {H} a song about {tech}.' },
  { s: '{H} puts {thing} on a pedestal, for morale.' },
  { s: '{H} checks for traps. Finds {snack}.' },
  { s: '{H} spots {critter} wearing a tiny helmet.' },
  { s: '{H} tries to tame {critter}. It tames {H}.' },
  { s: '{H} says something wise. Nobody writes it down.' },
  { s: '{H} remembers {tech} and shudders.' },
  { s: '{critter} challenges {H} to chess. {H} loses.' },
  { s: '{H} pretends {thing} is a dragon. Wins.' },
  { s: '{H} gives {critter} a pep talk. It cries.' },
  { s: '{H} forgets why this quest started.' },
  { s: '{H} writes a strongly worded letter to {thing}.' },
  { s: '{H} finds {n} gold inside {thing}.', gold: [4, 12] },
  { s: '{critter} pays {H} {n} gold to go away.', gold: [6, 16] },
  { s: '{H} sells {thing} to {critter} for {n} gold.', gold: [5, 14] },
  { s: '{H} wins {n} gold betting on {critter}.', gold: [8, 20] },
  { s: '{H} drops {n} gold into {thing}. Gone.', gold: [-6, -2] },
  { s: '{critter} charges {H} {n} gold for directions.', gold: [-5, -2] },
  { s: '{critter} cheers {H} on. +10% attack speed.', buff: { name: 'Tale: Cheered', k: 'speed', v: 10, min: 10 } },
  { s: '{H} eats {snack}. Feels strong. +10% damage.', buff: { name: 'Tale: Snack', k: 'dmg', v: 10, min: 10 } },
  { s: '{H} naps by {thing}. +10% life for a while.', buff: { name: 'Tale: Nap', k: 'life', v: 10, min: 15 } },
  { s: '{H} reads a scroll about {tech}. +5% XP for a bit.', buff: { name: 'Tale: Studied', k: 'xp', v: 5, min: 10 } },
  { s: '{critter} trades {H} something shiny for a button.', item: 'magic' },
  { s: '{H} finds a stash behind {thing}.', item: 'magic' },
  { s: 'A dragon asks {H} to review its pull request.', big: true, item: 'rare' },
  { s: 'The sky spells out {H}. Nobody can explain it.', big: true, gold: [40, 80] },
  { s: '{H} teaches {critter} to sit. It already could.' },
  { s: '{H} drops {thing}. Nobody saw. Good.' },
  { s: '{H} trips over {thing}. Calls it a dodge roll.' },
  { s: '{H} hears {sound}. Looks around. Nothing.' },
  { s: '{H} names a cloud after {tech}.' },
  { s: '{critter} follows {H} for a while, then gets bored.' },
  { s: '{H} tries to pet {critter}. It bites. Fair.' },
  { s: '{H} carves a tally mark into {thing}.' },
  { s: '{H} makes eye contact with {critter}. Blinks first.' },
  { s: '{H} practices a speech. {critter} claps.' },
  { s: '{H} sees {thing} move. It was the wind. Probably.' },
  { s: '{H} keeps {thing} as a lucky charm now.' },
  { s: '{H} drafts a plan. Step one: {snack}.' },
  { s: '{H} stubs a toe on {thing}. Says a bad word.' },
  { s: '{H} finds {snack} in a pocket. Lucky.', buff: { name: 'Tale: Snack', k: 'life', v: 10, min: 10 } },
  { s: '{critter} pays {H} {n} gold for {thing}.', gold: [4, 12] },
]
const FIGHT: T[] = [
  { s: '{F} asks {H} to rebase first.' },
  { s: '{H} tells {F} its fix ships next release.' },
  { s: '{F} drops a stack trace. {H} reads all of it.' },
  { s: '{F} demands to speak to the dungeon manager.' },
  { s: '{H} and {F} agree: feature, not a bug.' },
  { s: '{F} was eating {snack}. {H} feels bad.' },
  { s: '{F} screams: works on my machine!' },
  { s: '{H} parries with a strongly worded comment.' },
  { s: '{F} rolls a natural 1 and looks away.' },
  { s: '{F} tries to unionize the other monsters.' },
  { s: '{H} yells: {cry}' },
  { s: '{H} yells: {cry} {F} flinches.' },
  { s: '{F} asks if this is in the sprint.' },
  { s: '{F} has {tech} and does not know it.' },
  { s: '{H} dodges. {F} dodges. Awkward.' },
  { s: '{F} calls {H} {mood}. Rude, but accurate.' },
  { s: '{F} files an appeal. Denied.' },
  { s: '{H} reads {F} its rights. It has none.' },
  { s: '{F} brought {critter} as backup. It left.' },
  { s: '{F} pauses to stretch. {H} waits, politely.' },
  { s: '{F} claims the fight is out of scope.' },
  { s: '{H} hits {F} with {thing}. Effective.' },
  { s: '{F} is {mood} about all of this.' },
  { s: '{F} drops {n} gold and an apology.', gold: [6, 16] },
  { s: '{F} asks {H} for a code review mid-swing.' },
  { s: '{F} pretends to be {thing}. It does not work.' },
  { s: '{F} cancels the meeting. {H} attacks anyway.' },
  { s: '{H} distracts {F} with {snack}. It works.' },
  { s: '{F} quotes the docs at {H}. They are outdated.' },
  { s: '{F} blames {tech}. {H} agrees, then swings.' },
  { s: '{H} wins a coin toss against {F}. Strikes first.' },
  { s: '{F} asks for a raise. {H} says no.' },
  { s: '{F} was promised there would be snacks.' },
  { s: '{F} says {H} looks {mood} today.' },
  { s: '{F} trips on {thing}. {H} feels stronger.', buff: { name: 'Tale: Momentum', k: 'dmg', v: 10, min: 10 } },
]
const CAMP: T[] = [
  { s: '{H} fishes up {tech}. Throws it back.' },
  { s: '{H} digs up {fossil}.' },
  { s: '{H} tells the fish about {tech}. They leave.' },
  { s: '{critter} watches {H} work. Offers no advice.' },
  { s: '{H} hits {thing} with a pick. It says ow.' },
  { s: '{H} finds {fossil} and labels it priceless.' },
  { s: '{H} reels in an old boot. Then another.' },
  { s: '{H} whistles. {critter} whistles back.' },
  { s: '{H} catches a fish that looks {mood}.' },
  { s: '{H} mines a rock shaped like {critter}.' },
  { s: 'The campfire tells {H} about {tech}.' },
  { s: '{H} roasts {snack} on a stick. Perfect.' },
  { s: '{H} sells {fossil} to {critter}: {n} gold.', gold: [6, 16] },
  { s: '{H} naps at camp. +10% life for a while.', buff: { name: 'Tale: Nap', k: 'life', v: 10, min: 15 } },
  { s: '{H} catches {thing}. Somehow.' },
  { s: '{H} digs a hole. Finds a smaller hole.' },
  { s: '{H} skips a stone. It skips back.' },
  { s: '{H} finds {tech} fossilized in amber.' },
  { s: '{H} names the campfire. It is {mood} about it.' },
  { s: '{H} fishes for an hour. Catches {snack}.' },
  { s: '{critter} steals {H}\'s bait. Comes back for more.' },
  { s: '{H} mines a gem. It is {thing}. Shiny though.' },
]
const TOWN: T[] = [
  { s: 'The shopkeeper charges {H} a vibes fee.' },
  { s: '{H} haggles for an hour. Saves 1 gold.' },
  { s: 'A bard sings about {H}. Rhymes sword with bored.' },
  { s: '{H} buys a potion labeled probably fine.' },
  { s: 'The town crier warns of {tech} in the castle.' },
  { s: 'The blacksmith calls {H}\'s sword {mood}.' },
  { s: '{H} reads the notice board: {sign}.' },
  { s: 'A child asks {H} to slay {critter}. {H} declines.' },
  { s: 'The innkeeper overcharges {H} for {snack}.' },
  { s: '{H} gets a parking ticket for the portal.' },
  { s: 'The mayor gives {H} a key to {thing}.' },
  { s: '{H} finds {n} gold in the couch at the inn.', gold: [5, 12] },
  { s: 'The guard fines {H} {n} gold for loitering.', gold: [-5, -2] },
  { s: '{H} buys {thing} on sale. Regrets it.' },
  { s: 'The mayor asks {H} to fix {tech}.' },
  { s: 'The baker gives {H} {snack} for free.' },
  { s: '{H} joins a queue. Nobody knows what for.' },
  { s: 'A merchant offers {H} {thing}. Only slightly cursed.' },
]
const TRAVEL: T[] = [
  { s: '{H} takes a shortcut. It is longer.' },
  { s: '{H} asks {critter} for directions. Bad idea.' },
  { s: '{H} hums on the road. {critter} joins in.' },
  { s: '{H} passes a sign: {sign}.' },
  { s: '{H} walks into {thing}. Pretends it was on purpose.' },
  { s: '{H} is followed by {critter}. Adopts it, briefly.' },
  { s: '{H} arrives at {P}. It is {mood} here.' },
  { s: '{H} finds {n} gold on the road.', gold: [3, 10] },
  { s: '{H} counts the trees on the road. Loses count.' },
  { s: '{H} gets lost. Finds {thing}. Still lost.' },
  { s: 'A cart passes {H}. The driver is {critter}.' },
  { s: '{H} takes the scenic route. The view is {thing}.' },
]
const DEAD: T[] = [
  { s: '{H}\'s ghost files a complaint about the hitbox.' },
  { s: '{H} respawns missing one sock.' },
  { s: '{H} writes I meant to do that in the logs.' },
  { s: '{H} respawns {mood}. Also damp.' },
  { s: '{critter} saw that. {H} will never live it down.' },
  { s: '{H} blames {tech}. The ghost agrees.' },
  { s: '{H} respawns holding {thing}. Unclear why.' },
  { s: '{H}\'s ghost tries to haunt {critter}. It shrugs.' },
  { s: '{H} respawns and checks for {snack}. Still there.' },
]
const POOLS: Record<TaleCtx, T[]> = { fight: FIGHT, camp: CAMP, town: TOWN, travel: TRAVEL, dead: DEAD }

// ------------------------------------------------------------------ running gags
type Step = { s: string; gold?: [number, number]; buff?: Omit<Buff, 'left'> & { min: number }; item?: 'magic' | 'rare'; big?: boolean }
export const CHAINS: { id: string; name: string; steps: Step[] }[] = [
  { id: 'rival', name: 'Sir Grumbleton, the rival', steps: [
    { s: 'A rival, Sir Grumbleton, sneers at {H}\'s boots.' },
    { s: 'Sir Grumbleton brags about his test coverage.' },
    { s: 'Sir Grumbleton races {H} to {thing}. Trips.' },
    { s: 'Sir Grumbleton admits {H}\'s boots are nice.' },
    { s: 'Sir Grumbleton gives {H} a gift. Rivals no more.', item: 'rare', big: true },
  ] },
  { id: 'shellby', name: 'Shellby the moneylender', steps: [
    { s: 'Shellby the moneylender lends {H} {n} gold.', gold: [20, 30] },
    { s: 'Shellby reminds {H} about the loan. Small rush.' },
    { s: 'Shellby adds interest. And a tiny hat.' },
    { s: '{H} pays Shellby back: {n} gold. Debt free!', gold: [-33, -24], big: true },
  ] },
  { id: 'duck', name: 'The wise duck', steps: [
    { s: '{H} finds a rubber duck. It looks wise.' },
    { s: 'The duck listens to {H} explain {tech}.' },
    { s: 'The duck finds the bug. {H} takes the credit.' },
    { s: 'The duck leaves to help another hero. +5% XP.', buff: { name: 'Tale: Duck Wisdom', k: 'xp', v: 5, min: 30 }, big: true },
  ] },
  { id: 'bard', name: 'The bard who will not leave', steps: [
    { s: 'A bard starts following {H}, writing a song.' },
    { s: 'The bard\'s song has 14 verses so far.' },
    { s: 'The bard rhymes {H} with {thing}. Bold.' },
    { s: 'The bard sells the song: {H} gets {n} gold.', gold: [30, 50], big: true },
  ] },
]

// ------------------------------------------------------------------ rolling
const pick = <X>(r: Rng, a: readonly X[]): X => a[Math.floor(r() * a.length)]!
/** A small string hash, so the anti-repeat ring stores numbers, not lines. */
export const lineHash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
const RING = 200

/** Minutes until the next event: never fewer than 6, about 18 on average, at most 45. */
export const nextGapMs = (r: Rng) => Math.round(Math.min(45, 6 + -Math.log(1 - r() * 0.999) * 12) * 60_000)

export const ctxOf = (h: Hero): TaleCtx => {
  const k = h.task.kind
  return k === 'fight' ? 'fight' : k === 'town' ? 'town' : k === 'travel' ? 'travel' : k === 'dead' ? 'dead' : 'camp'
}

const fill = (s: string, h: Hero, r: Rng, place: string, amount: number) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) =>
    k === 'H' ? h.name : k === 'F' ? `the ${h.task.foe?.base ?? h.task.foe?.name ?? 'monster'}` : k === 'P' ? place : k === 'n' ? String(Math.abs(amount)) : pick(r, F[k] ?? ['something']))

const build = (t: T | Step, h: Hero, r: Rng, place: string): Tale => {
  const amount = t.gold ? Math.round((t.gold[0] + r() * (t.gold[1] - t.gold[0])) * Math.max(1, h.level)) : 0
  let line = fill(t.s, h, r, place, amount)
  line = (line.charAt(0).toUpperCase() + line.slice(1)).replace(/([.!?] )([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase())
  return {
    line,
    ...(t.gold ? { gold: amount } : {}),
    ...(t.buff ? { buff: { name: t.buff.name, k: t.buff.k, v: t.buff.v, left: t.buff.min * 60_000 } } : {}),
    ...(t.item ? { item: t.item } : {}),
    ...(t.big ? { big: true } : {}),
  }
}

/** Lines for the land the hero stands in (task-13), keyed by the biome palette. */
export const LAND: Record<string, readonly string[]> = {
  meadow: ['{H} lies in the grass and names the clouds.', 'A bee lands on {H}. They agree to disagree.', '{H} picks a flower. It files a complaint.', 'A cow watches {H} with deep suspicion.', '{H} rolls down a hill. Worth it.', 'The grass here is greener. {H} checks the diff.'],
  autumn: ['{H} jumps in a leaf pile. Finds {critter}.', 'A leaf lands on {H}. It is a sign. Of autumn.', '{H} drinks something with pumpkin in it.', '{H} watches the trees prune their branches.', '{H} wears a scarf. Feels {mood}.', '{H} rakes the leaves into a neat backlog.'],
  desert: ['{H} shakes a pound of sand out of one boot.', 'A mirage offers {H} a free tier. It is not.', '{H} finds a cactus. It finds {H} first.', 'A vulture follows {H} at a polite distance.', '{H} runs out of water. Then finds a well.', 'The sun deprecates the hat {H} is wearing.'],
  swamp: ['{H} loses a boot to the mud. The mud keeps it.', 'A frog croaks a stack trace at {H}.', '{H} steps on a log. The log blinks.', 'Something in the bog hums the build music.', '{H} smells like swamp now. Feels {mood}.', 'A will-o-wisp asks {H} for directions.'],
  jungle: ['{H} swings on a vine. The vine lets go.', 'A parrot repeats the last commit message of {H}.', '{H} finds a temple. It is a tool shed.', 'A monkey trades {H} a banana for {thing}.', '{H} gets lost in the undergrowth. And the overgrowth.', 'Something large watches {H} from the leaves.'],
  snow: ['{H} builds a snowman. It looks like the PM.', '{H} licks a frozen pole. Regrets it at once.', 'A snowball hits {H}. Nobody is there.', '{H} breathes out a little cloud. Cute.', '{H} makes a snow angel. It files a ticket.', 'A penguin judges the footwork of {H}.'],
  volcanic: ['{H} toasts {snack} on a lava vent. Perfect.', 'The ground here is hot. {H} hops a lot.', 'The eyebrows of {H} leave. They may come back.', 'A volcano rumbles. {H} rumbles back.', '{H} finds a rock still warm from production.', 'The air smells like burnt toast and hotfixes.'],
  crystal: ['{H} sees ten tired {H}s in a crystal.', 'A crystal hums at {H} in a minor key.', '{H} taps a crystal. It rings for an hour.', '{H} finds a crystal shaped like a cache key.', 'Light splits on the crystals. {H} poses.', 'A crystal shows {H} a better version of the code.'],
  cavern: ['{H} shouts hello. The echo says hello world.', 'A bat asks {H} to keep it down.', '{H} lights a torch. The dark looks annoyed.', 'Water drips on {H} once a second. Like a cron.', '{H} finds a glowing mushroom. Does not lick it.', '{H} bumps a stalactite. It bumps back.'],
  city: ['A server fan sings to {H}. Off key.', '{H} trips on a cable. Something goes offline.', 'A blinking light tells {H} all is fine.', '{H} hears a hard drive click. Prays.', 'An elevator plays smooth jazz for {H}.', '{H} finds a rack labeled DO NOT TOUCH. Touches.'],
  graveyard: ['A ghost asks {H} if the build is green yet.', '{H} reads a grave: here lies a hotfix.', 'A skeleton waves at {H}. {H} waves back.', '{H} hears whispers. It is only the logs.', 'A crow tells {H}: never deploy on a Friday.', '{H} steps on a grave. Apologizes to it.'],
  coast: ['A crab pinches {H}. Fair.', '{H} finds a bottle. The message is a stack trace.', 'A wave takes a sandal from {H}. Keeps it.', '{H} builds a sand castle. It passes review.', 'A seagull screams at {H} about the tide.', '{H} skips a stone. Seven hops. A record.'],
  void: ['{H} looks into the void. It looks busy.', 'Nothing happens to {H}. Loudly.', '{H} drops {thing} into the void. It returns null.', 'The stars here are out of order. {H} sorts them.', '{H} floats a little. Then remembers gravity.', 'The void asks {H} for a code review.'],
  ruins: ['{H} finds a statue of a forgotten maintainer.', '{H} reads an old wall: TODO fix before launch.', 'A pillar falls near {H}. Not a good sign.', '{H} finds an altar. Leaves {snack} on it.', '{H} dusts off a tablet. It is a changelog.', 'The ruins creak. {H} creaks back.'],
}

/** The event for this moment, or nothing (most moments are quiet; see nextGapMs for when they come). Never repeats a line from the last 200. */
export const rollEvent = (h: Hero, r: Rng, now: number, place = 'the road', land?: string): Tale | null => {
  void now
  const st = h.tales
  // a running gag in progress moves on a quarter of the time; a new one starts rarely
  // a gag line still in the ring waits; the roll falls through to an ordinary event
  const chains = st?.chain ?? {}
  const ring = new Set(st?.ring ?? [])
  const fresh = (t: Tale) => t.line.length <= 60 && !ring.has(lineHash(t.line))
  const active = CHAINS.filter(c => chains[c.id] !== undefined && chains[c.id]! < c.steps.length)
  if (active.length && r() < 0.25) {
    const c = pick(r, active), step = chains[c.id]!
    const tale = build(c.steps[step]!, h, r, place)
    if (fresh(tale)) return { ...tale, chain: { id: c.id, step: step + 1 } }
  }
  const idle = CHAINS.filter(c => chains[c.id] === undefined)
  if (idle.length && r() < 0.04) {
    const c = pick(r, idle)
    const tale = build(c.steps[0]!, h, r, place)
    if (fresh(tale)) return { ...tale, chain: { id: c.id, step: 1 } }
  }
  const ctx = ctxOf(h)
  const shapes = new Set(st?.tpl ?? [])
  for (let tries = 0; tries < 12; tries++) {
    const here = land && ctx !== 'town' && ctx !== 'dead' ? LAND[land] : undefined
    const pool: T[] = here && r() < 0.2 ? here.map(s => ({ s })) : r() < 0.55 ? POOLS[ctx] : ANY
    const t = pick(r, pool)
    if (t.big && r() > 0.15) continue
    const tpl = lineHash(t.s)
    if (shapes.has(tpl)) continue
    const tale = build(t, h, r, place)
    if (fresh(tale)) return { ...tale, tpl }
  }
  return null
}

/** Records a tale in the hero's small save state: the anti-repeat ring, the running gags and the last 50 for the pane. */
export const noteTale = (h: Hero, tale: Tale, t: number) => {
  const st = (h.tales ??= { next: 0, n: 0, chain: {}, ring: [], recent: [] })
  st.n++
  st.ring.push(lineHash(tale.line))
  if (st.ring.length > RING) st.ring.splice(0, st.ring.length - RING)
  st.recent.push({ t, s: tale.line })
  if (st.recent.length > 50) st.recent.splice(0, st.recent.length - 50)
  if (tale.tpl !== undefined) st.tpl = [...(st.tpl ?? []), tale.tpl].slice(-30)
  if (tale.chain) {
    const c = CHAINS.find(x => x.id === tale.chain!.id)!
    // a finished gag rests, then may come back much later
    st.chain[c.id] = tale.chain.step
    if (tale.chain.step >= c.steps.length) st.done = [...(st.done ?? []), c.id].slice(-8)
  }
  // a finished gag can start over once the other gags have had a turn
  for (const c of CHAINS) if ((st.chain[c.id] ?? 0) >= c.steps.length && (st.done ?? []).filter(d => d !== c.id).length >= 2) {
    delete st.chain[c.id]
    st.done = (st.done ?? []).filter(d => d !== c.id)
  }
}

/** How many lines the tables can make (for the Codex and the tests). */
export const TEMPLATE_COUNT = Object.values(LAND).reduce((s, l) => s + l.length, 0) + ANY.length + FIGHT.length + CAMP.length + TOWN.length + TRAVEL.length + DEAD.length + CHAINS.reduce((s, c) => s + c.steps.length, 0)

/** A line on entering a zone or map, by the biome palette (task-13). */
export const ENTER: Record<string, readonly string[]> = {
  meadow: ['Birds sing. The grass is very green.', 'A gentle breeze. Suspiciously gentle.', 'Flowers everywhere. One of them waves.'],
  autumn: ['Leaves crunch underfoot.', 'The trees are shedding old branches.', 'It smells of pumpkin and old code.'],
  desert: ['The air turns dry and hot.', 'Sand gets into everything at once.', 'Heat shimmers on the horizon.'],
  swamp: ['The ground turns soft and wet.', 'Something croaks in the mist.', 'Mud, reeds and a lot of flies.'],
  jungle: ['The trees close in overhead.', 'Vines hang everywhere. Some move.', 'It is loud, green and very humid.'],
  snow: ['The cold bites at once.', 'Snow squeaks under every step.', 'The wind brings ice and silence.'],
  volcanic: ['The ground is warm. Then hot.', 'Smoke and embers fill the air.', 'Lava hisses somewhere close.'],
  crystal: ['Crystals hum in the walls.', 'Light bends in odd colors here.', 'Everything sparkles a little too much.'],
  cavern: ['It goes dark and damp.', 'Water drips somewhere in the dark.', 'The walls close in. Echoes follow.'],
  city: ['Server fans roar on every side.', 'Cables snake across the floor.', 'Blinking lights in every direction.'],
  graveyard: ['It goes quiet. Too quiet.', 'Old graves lean in the fog.', 'A crow watches from a headstone.'],
  coast: ['The smell of salt and seaweed.', 'Waves lap at the shore.', 'Gulls circle overhead, plotting.'],
  void: ['The world fades to nothing.', 'The stars here feel very close.', 'Up and down stop meaning much.'],
  ruins: ['Broken pillars line the way.', 'Old stones carry older warnings.', 'Dust and silence and old code.'],
}
