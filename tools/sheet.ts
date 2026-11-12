// A tiny PNG sheet maker for the art samples: rects in, nearest-neighbour PNG out. No dependencies, no browser.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Rect, Sprite } from '../hooks/sprites/core'

const crcTable = (() => { const t: number[] = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}
export const png = (w: number, h: number, rgba: Uint8Array) => {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

const FONT: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  '-': '000000111000000', '+': '000010111010000', '.': '000000000000010', ':': '000010000010000', '/': '001001010100100', "'": '010010000000000', ',': '000000000010100', '(': '001010010010001', ')': '100010010010100', '#': '101111101111101',
}

export type Tile = { label?: string; sprite: Sprite | { w: number; h: number; rects: Rect[] }; note?: string }
const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]

export class Canvas {
  px: Uint8Array
  constructor(public w: number, public h: number, bg: string) {
    this.px = new Uint8Array(w * h * 4)
    const [r, g, b] = hex(bg)
    for (let i = 0; i < w * h; i++) { this.px[i * 4] = r; this.px[i * 4 + 1] = g; this.px[i * 4 + 2] = b; this.px[i * 4 + 3] = 255 }
  }
  fill(x: number, y: number, w: number, h: number, c: string, a = 1) {
    // whole pixels only: a fractional index would write a property, not a pixel
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
    const [r, g, b] = hex(c)
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) {
      const k = (j * this.w + i) * 4
      this.px[k] = this.px[k] * (1 - a) + r * a; this.px[k + 1] = this.px[k + 1] * (1 - a) + g * a; this.px[k + 2] = this.px[k + 2] * (1 - a) + b * a
    }
  }
  rects(rs: Rect[], x: number, y: number, s: number, a = 1) { for (const [rx, ry, rw, rh, c] of rs) this.fill(x + rx * s, y + ry * s, rw * s, rh * s, c, a) }
  text(t: string, x: number, y: number, s: number, c = '#c8c0d8') {
    let cx = x
    for (const ch of t.toUpperCase()) {
      const g = FONT[ch]
      if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') this.fill(cx + (i % 3) * s, y + Math.floor(i / 3) * s, s, s, c)
      cx += 4 * s
    }
  }
  save(file: string) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, png(this.w, this.h, this.px)) }
}

const partsOf = (t: Tile): { rects: Rect[]; op?: number }[] => ('parts' in t.sprite ? t.sprite.parts : [t.sprite])

/** A grid of tiles, each sprite scaled s times on a dark ground with its label under it. */
export const sheet = (file: string, tiles: Tile[], o: { cols: number; s: number; bg?: string; title?: string; cellW?: number; cellH?: number; pad?: number }) => {
  const pad = o.pad ?? 6
  const lab = 12
  const mw = Math.max(...tiles.map(t => t.sprite.w))
  const mh = Math.max(...tiles.map(t => t.sprite.h))
  const cw = o.cellW ?? mw * o.s + pad * 2
  const ch = o.cellH ?? mh * o.s + pad * 2 + lab
  const rows = Math.ceil(tiles.length / o.cols)
  const top = o.title ? 24 : 0
  const cv = new Canvas(cw * o.cols, ch * rows + top, o.bg ?? '#1b1626')
  if (o.title) cv.text(o.title, 6, 4, 2, '#ffd23f')
  tiles.forEach((t, i) => {
    const cx = (i % o.cols) * cw, cy = top + Math.floor(i / o.cols) * ch
    if ((((i % o.cols) + Math.floor(i / o.cols)) & 1) === 0) cv.fill(cx, cy, cw, ch, '#221c30')
    for (const p of partsOf(t)) cv.rects(p.rects, cx + Math.floor((cw - t.sprite.w * o.s) / 2), cy + pad, o.s, p.op ?? 1)
    if (t.label) cv.text(t.label.slice(0, Math.floor(cw / 8)), cx + 3, cy + ch - lab, 2, '#9a90b0')
  })
  cv.save(file)
}
