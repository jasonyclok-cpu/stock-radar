// 用純 Node(零依賴)生成 PWA 圖示:天藍底 + 黃色星星
// 執行:npm run icons
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// 點是否在五角星內(以中心 cx,cy、外徑 r)
function makeStarTest(cx, cy, r) {
  const outer = []
  const inner = []
  for (let i = 0; i < 5; i++) {
    const aOut = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    const aIn = aOut + Math.PI / 5
    outer.push([cx + r * Math.cos(aOut), cy + r * Math.sin(aOut)])
    inner.push([cx + r * 0.45 * Math.cos(aIn), cy + r * 0.45 * Math.sin(aIn)])
  }
  const poly = []
  for (let i = 0; i < 5; i++) poly.push(outer[i], inner[i])
  return (x, y) => {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]
      const [xj, yj] = poly[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4)
  const corner = size * 0.22
  const inStar = makeStarTest(size / 2, size / 2 + size * 0.03, size * 0.36)
  const bg = [56, 189, 248] // sky-400
  const star = [250, 204, 21] // yellow-400
  const edge = [245, 158, 11] // amber-500
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      // 圓角裁切
      const dx = Math.max(corner - x, x - (size - 1 - corner), 0)
      const dy = Math.max(corner - y, y - (size - 1 - corner), 0)
      if (dx * dx + dy * dy > corner * corner) {
        rgba[i + 3] = 0
        continue
      }
      let c = bg
      if (inStar(x, y)) {
        // 簡單描邊:鄰近邊界用深黃色
        const nearEdge =
          !inStar(x - size * 0.02, y) || !inStar(x + size * 0.02, y) ||
          !inStar(x, y - size * 0.02) || !inStar(x, y + size * 0.02)
        c = nearEdge ? edge : star
      }
      rgba[i] = c[0]
      rgba[i + 1] = c[1]
      rgba[i + 2] = c[2]
      rgba[i + 3] = 255
    }
  }
  return encodePNG(size, size, rgba)
}

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(outDir, name), renderIcon(size))
  console.log('✓', name)
}
