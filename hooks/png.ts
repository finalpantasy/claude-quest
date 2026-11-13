// task-20: a small PNG encoder in pure TypeScript (no DOM, no Node), so a 32-bit sprite can travel as a data URI inside the
// SVG scene. Not imported by the game yet. Indexed color (up to 256 colors, index 0 transparent), deflate with LZ77 and
// fixed Huffman codes, base64 by hand.

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (b: Uint8Array, from = 0, to = b.length) => { let c = 0xffffffff; for (let i = from; i < to; i++) c = (CRC[(c ^ (b[i] ?? 0)) & 255] ?? 0) ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const adler32 = (b: Uint8Array) => { let a = 1, s = 0; for (let i = 0; i < b.length; i++) { a = (a + (b[i] ?? 0)) % 65521; s = (s + a) % 65521 } return ((s << 16) | a) >>> 0 }

class Bits {
  out: number[] = []
  private buf = 0
  private n = 0
  put(v: number, len: number) { for (let i = 0; i < len; i++) { this.buf |= ((v >>> i) & 1) << this.n; if (++this.n === 8) { this.out.push(this.buf); this.buf = 0; this.n = 0 } } }
  /** A Huffman code goes in most significant bit first. */
  code(c: number, len: number) { for (let i = len - 1; i >= 0; i--) this.put((c >>> i) & 1, 1) }
  flush() { if (this.n > 0) { this.out.push(this.buf); this.buf = 0; this.n = 0 } }
}
const LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258]
const LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577]
const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
const lit = (b: Bits, s: number) => {
  if (s < 144) b.code(0x30 + s, 8)
  else if (s < 256) b.code(0x190 + s - 144, 9)
  else if (s < 280) b.code(s - 256, 7)
  else b.code(0xc0 + s - 280, 8)
}
const slot = (base: number[], v: number) => { let i = base.length - 1; while ((base[i] ?? 0) > v) i--; return i }

/** zlib stream: one final block of fixed Huffman codes over greedy LZ77 matches (hash chains, 32 KB window). */
export const deflate = (data: Uint8Array): Uint8Array => {
  const b = new Bits()
  b.put(1, 1); b.put(1, 2)
  const head = new Int32Array(1 << 15).fill(-1), prev = new Int32Array(data.length).fill(-1)
  const key = (i: number) => (((data[i] ?? 0) << 10) ^ ((data[i + 1] ?? 0) << 5) ^ (data[i + 2] ?? 0)) & 0x7fff
  const insert = (i: number) => { if (i + 2 < data.length) { const k = key(i); prev[i] = head[k] ?? -1; head[k] = i } }
  let i = 0
  while (i < data.length) {
    let best = 0, dist = 0
    if (i + 2 < data.length) {
      let j = head[key(i)] ?? -1, tries = 96
      while (j >= 0 && i - j <= 32768 && tries-- > 0) {
        let l = 0
        while (l < 258 && i + l < data.length && data[j + l] === data[i + l]) l++
        if (l > best) { best = l; dist = i - j; if (l === 258) break }
        j = prev[j] ?? -1
      }
    }
    if (best >= 3) {
      const ls = slot(LEN_BASE, best), ds = slot(DIST_BASE, dist)
      lit(b, 257 + ls); b.put(best - (LEN_BASE[ls] ?? 0), LEN_EXTRA[ls] ?? 0)
      b.code(ds, 5); b.put(dist - (DIST_BASE[ds] ?? 0), DIST_EXTRA[ds] ?? 0)
      for (let k = 0; k < best; k++) insert(i + k)
      i += best
    } else { lit(b, data[i] ?? 0); insert(i); i++ }
  }
  lit(b, 256); b.flush()
  const a = adler32(data)
  return Uint8Array.from([0x78, 0x01, ...b.out, a >>> 24, (a >>> 16) & 255, (a >>> 8) & 255, a & 255])
}

const u32 = (v: number) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]
const chunk = (type: string, data: ArrayLike<number>) => {
  const body = new Uint8Array(4 + data.length)
  for (let i = 0; i < 4; i++) body[i] = type.charCodeAt(i)
  body.set(Array.from(data), 4)
  return [...u32(data.length), ...body, ...u32(crc32(body))]
}
const rgbOf = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]

/** Pixels (`#rrggbb` or undefined for clear) as an indexed PNG. */
export const encodePng = (w: number, h: number, px: readonly (string | undefined)[]): Uint8Array => {
  const pal: string[] = [], idx = new Map<string, number>()
  const raw = new Uint8Array((w + 1) * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = px[y * w + x]
    let v = 0
    if (c !== undefined) { v = idx.get(c) ?? 0; if (!v) { pal.push(c); v = pal.length; idx.set(c, v) } }
    raw[y * (w + 1) + 1 + x] = v
  }
  if (pal.length > 255) throw new Error(`png: ${pal.length} colors, the indexed encoder takes 255`)
  const plte = [0, 0, 0, ...pal.flatMap(rgbOf)]
  return Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10,
    ...chunk('IHDR', [...u32(w), ...u32(h), 8, 3, 0, 0, 0]), ...chunk('PLTE', plte), ...chunk('tRNS', [0]), ...chunk('IDAT', deflate(raw)), ...chunk('IEND', [])])
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
export const base64 = (b: Uint8Array) => {
  let s = ''
  for (let i = 0; i < b.length; i += 3) {
    const n = ((b[i] ?? 0) << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0)
    s += (B64[n >>> 18] ?? '') + (B64[(n >>> 12) & 63] ?? '') + (i + 1 < b.length ? B64[(n >>> 6) & 63] ?? '' : '=') + (i + 2 < b.length ? B64[n & 63] ?? '' : '=')
  }
  return s
}
/** An SVG `<image>` drawing the pixels crisp at (x, y), `s` screen pixels per pixel. */
export const pngImage = (w: number, h: number, px: readonly (string | undefined)[], x: number, y: number, s: number, attrs = '') =>
  `<image x="${x}" y="${y}" width="${w * s}" height="${h * s}" style="image-rendering:pixelated" ${attrs}href="data:image/png;base64,${base64(encodePng(w, h, px))}"/>`
