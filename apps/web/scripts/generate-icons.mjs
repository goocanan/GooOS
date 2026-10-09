/*
 * Generates the PWA icon set from a single SVG source.
 *
 * Kept as a script rather than committed binaries alone so the icons can be
 * regenerated when the brand colour changes, without needing a design tool.
 *
 * Run: node scripts/generate-icons.mjs
 *
 * Writes to apps/web/public/icons/.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import path from 'node:path'

const OUT = path.resolve(import.meta.dirname, '../public/icons')

// Matches --color-brand-600 / --color-ink-950 in index.css.
const BRAND = '#b81e51'
const INK = '#08080b'

/** GooOS mark: a stylised content-flow glyph on a rounded brand tile. */
function svg({ maskable }) {
  // A maskable icon must survive a circular crop, so the artwork is inset
  // well inside the safe zone (the inner 80% of the canvas).
  const scale = maskable ? 0.72 : 0.9
  const offset = (1 - scale) / 2
  const t = (v) => v * scale + offset
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="${maskable ? 0 : 22}" fill="${INK}"/>
  <g transform="translate(0 0)">
    <rect x="${t(18)}" y="${t(18)}" width="${64 * scale}" height="${64 * scale}" rx="${14 * scale}" fill="${BRAND}"/>
    <rect x="${t(31)}" y="${t(31)}" width="${14 * scale}" height="${20 * scale}" rx="${4 * scale}" fill="${INK}" opacity="0.92"/>
    <rect x="${t(55)}" y="${t(31)}" width="${14 * scale}" height="${13 * scale}" rx="${4 * scale}" fill="${INK}" opacity="0.92"/>
    <rect x="${t(55)}" y="${t(52)}" width="${14 * scale}" height="${20 * scale}" rx="${4 * scale}" fill="${INK}" opacity="0.92"/>
    <rect x="${t(31)}" y="${t(59)}" width="${14 * scale}" height="${13 * scale}" rx="${4 * scale}" fill="${INK}" opacity="0.92"/>
  </g>
</svg>
`
}

// Minimal PNG encoder: no dependencies, 8-bit RGBA, no interlacing.
function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]
}

/** Renders the SVG to raw RGBA by drawing the same shapes directly. */
function rasterise(size, maskable) {
  const [br, bg, bb] = hex(BRAND)
  const [ir, ig, ib] = hex(INK)
  const px = Buffer.alloc(size * size * 4)

  const scale = maskable ? 0.72 : 0.9
  const offset = (1 - scale) / 2
  const t = (v) => v * scale + offset

  // Rects as [x, y, w, h, colour] in 0..100 space, with corner radius.
  const shapes = [
    [0, 0, 100, 100, [ir, ig, ib], maskable ? 0 : 22],
    [t(18), t(18), 64 * scale, 64 * scale, [br, bg, bb], 14 * scale],
    [t(31), t(31), 14 * scale, 20 * scale, [ir, ig, ib], 4 * scale],
    [t(55), t(31), 14 * scale, 13 * scale, [ir, ig, ib], 4 * scale],
    [t(55), t(52), 14 * scale, 20 * scale, [ir, ig, ib], 4 * scale],
    [t(31), t(59), 14 * scale, 13 * scale, [ir, ig, ib], 4 * scale],
  ]

  // Backing store for the rounded-rect coverage test, supersampled for AA.
  const SS = 4
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = ((x + (sx + 0.5) / SS) / size) * 100
          const uy = ((y + (sy + 0.5) / SS) / size) * 100
          // Topmost shape containing the sample wins.
          let picked = null
          for (const [sx0, sy0, sw, sh, col, rad] of shapes) {
            if (
              ux >= sx0 &&
              ux <= sx0 + sw &&
              uy >= sy0 &&
              uy <= sy0 + sh
            ) {
              const cx = Math.min(Math.max(ux, sx0 + rad), sx0 + sw - rad)
              const cy = Math.min(Math.max(uy, sy0 + rad), sy0 + sh - rad)
              const dx = ux - cx
              const dy = uy - cy
              if (dx * dx + dy * dy <= rad * rad) picked = col
            }
          }
          if (picked) { r += picked[0]; g += picked[1]; b += picked[2]; a += 255 }
        }
      }
      const n = SS * SS
      const i = (y * size + x) * 4
      const cov = a / n
      // Premultiply-correct average colour over covered samples only.
      const div = a > 0 ? a / 255 : 1
      px[i] = Math.round(r / div)
      px[i + 1] = Math.round(g / div)
      px[i + 2] = Math.round(b / div)
      px[i + 3] = Math.round(cov)
    }
  }

  // PNG scanlines with filter byte 0.
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT, { recursive: true })

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-512.png', 512, true],
]

for (const [name, size, maskable] of targets) {
  writeFileSync(path.join(OUT, name), rasterise(size, maskable))
  console.log('wrote', path.join('public/icons', name))
}
writeFileSync(path.join(OUT, 'icon.svg'), svg({ maskable: false }))
console.log('wrote public/icons/icon.svg')