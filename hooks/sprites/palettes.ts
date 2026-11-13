// Palettes: four per element, a neutral earth set, and the swaps for rare shiny monsters.
import { hue } from './core'

export type Palette = { base: string; accent: string; glow: string }
export const ELEMENTS = ['fire', 'frost', 'venom', 'void', 'storm', 'holy', 'shadow', 'nature'] as const
export type Element = (typeof ELEMENTS)[number]
export const PREFIX: Record<Element, string> = { fire: 'Cinder', frost: 'Frost', venom: 'Venom', void: 'Void', storm: 'Storm', holy: 'Radiant', shadow: 'Gloom', nature: 'Moss' }

const p = (base: string, accent: string, glow: string): Palette => ({ base, accent, glow })
export const PALETTES: Record<Element | 'earth', Palette[]> = {
  fire: [p('#d8452a', '#f0a030', '#ffe060'), p('#8a2a20', '#e0602a', '#ffd040'), p('#e0702a', '#7a2a1a', '#fff0a0'), p('#a02020', '#f0c040', '#ff8a30')],
  frost: [p('#6ab8e8', '#e8f4ff', '#ffffff'), p('#4a78c8', '#a0e0f0', '#e0ffff'), p('#9ad0f0', '#4a6aa8', '#ffffff'), p('#7a98b8', '#d0e8f8', '#aab4ff')],
  venom: [p('#7ac43a', '#a050c0', '#e8ff50'), p('#5a9a3a', '#d0e050', '#ff50d0'), p('#a060c0', '#60c040', '#e0ff70'), p('#4a7a2a', '#c05090', '#ffe040')],
  void: [p('#6a3ab8', '#c070f0', '#ff60ff'), p('#3a2a70', '#8a5ad0', '#a0a0ff'), p('#503080', '#e070a0', '#f0f0ff'), p('#2a1a50', '#7a50c8', '#ff70ff')],
  storm: [p('#e0d040', '#5a7ae0', '#ffffff'), p('#5a7ae0', '#f0e060', '#ffff80'), p('#8a9ab8', '#f0e050', '#ffffa0'), p('#c0b030', '#3a4a9a', '#ffffff')],
  holy: [p('#f0e0a0', '#ffd060', '#ffffff'), p('#fffbe8', '#e8c060', '#80d0ff'), p('#e8d8f8', '#f0b0d0', '#fff8a0'), p('#f8e0b0', '#a0d8f0', '#ffffff')],
  shadow: [p('#4a4a60', '#8a6ab0', '#ff4a6a'), p('#2a2a3a', '#6a5a8a', '#c070ff'), p('#5a4a50', '#a05060', '#ffb030'), p('#383850', '#506090', '#60ffd0')],
  nature: [p('#4aa04a', '#c0a040', '#e8ff60'), p('#8a6a3a', '#5ac050', '#ffe070'), p('#6aa83a', '#e06090', '#fff060'), p('#3a7a4a', '#a0d060', '#ffd0f0')],
  earth: [p('#8a7a5a', '#c8a04a', '#ffd23f'), p('#9a6a5a', '#5a8aa0', '#ff5a3a'), p('#7a9a5a', '#c8a04a', '#ffd23f'), p('#6a7aa0', '#d0c070', '#7affd0'), p('#a08a6a', '#6a4a3a', '#ff8a3a'), p('#5a7a8a', '#b0a060', '#7affe0')],
}
/** The rare color swap: hues turned, glow flipped. */
export const shiny = (q: Palette): Palette => ({ base: hue(q.base, 150), accent: hue(q.accent, 210), glow: hue(q.glow, 180) })
/** Ranks that change how a monster looks: eye glow and an aura ring, on top of its own palette. */
export const RANK_LOOK: Record<string, { glow: string; ring: string } | undefined> = {
  normal: undefined,
  magic: { glow: '#6f8cff', ring: '#6f8cff' },
  rare: { glow: '#f2e05a', ring: '#f2e05a' },
  unique: { glow: '#ff8a1f', ring: '#ff8a1f' },
  goblin: { glow: '#ffd23f', ring: '#ffd23f' },
  boss: { glow: '#ff4a4a', ring: '#ff4a4a' },
}
