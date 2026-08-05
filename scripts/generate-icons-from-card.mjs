import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const cardPath = process.argv[2] || 'public/cards/006_Glaceon_005100_Holo.webp'
const cardFile = resolve(root, cardPath)

// Card is 733x1024. Crop the artwork region and center Glaceon.
const CARD_W = 733
const CROP_TOP = 120
const CROP_BOTTOM = 470
const CROP_HEIGHT = CROP_BOTTOM - CROP_TOP
const CROP_LEFT = 40
const CROP_WIDTH = CARD_W - CROP_LEFT * 2

const ICON_BG = '#0B1F33'
const CORNER_RADIUS_RATIO = 0.2

async function createIcon(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.12) : 0
  const inner = size - padding * 2
  const radius = Math.round(size * CORNER_RADIUS_RATIO)

  // 1) rounded navy square background
  const bg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${ICON_BG}"/>
    </svg>`
  )

  // 2) crop the card artwork, scale to fit inner square, and round its corners
  const art = await sharp(cardFile)
    .extract({ left: CROP_LEFT, top: CROP_TOP, width: CROP_WIDTH, height: CROP_HEIGHT })
    .resize(inner, inner, { fit: 'cover', position: 'center' })
    .toBuffer()

  const roundedArt = await sharp(art)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${inner}" height="${inner}">
            <rect width="${inner}" height="${inner}" rx="${Math.max(2, Math.round(inner * 0.08))}" ry="${Math.max(2, Math.round(inner * 0.08))}" fill="white"/>
          </svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  // 3) composite onto background
  return sharp(bg)
    .composite([{ input: roundedArt, left: padding, top: padding }])
    .png()
    .toBuffer()
}

async function main() {
  const configs = [
    { size: 192, maskable: false, name: 'icon-192x192.png' },
    { size: 512, maskable: false, name: 'icon-512x512.png' },
    { size: 192, maskable: true, name: 'icon-192x192-maskable.png' },
    { size: 512, maskable: true, name: 'icon-512x512-maskable.png' },
  ]

  for (const cfg of configs) {
    const buf = await createIcon(cfg.size, cfg.maskable)
    await sharp(buf).toFile(resolve(root, 'public', 'icons', cfg.name))
    console.log(`Generated ${cfg.name}`)
  }

  // favicon.ico: 32x32 on navy square
  const faviconBuf = await sharp(cardFile)
    .extract({ left: CROP_LEFT, top: CROP_TOP, width: CROP_WIDTH, height: CROP_HEIGHT })
    .resize(32, 32, { fit: 'cover', position: 'center' })
    .extend({
      top: 4,
      bottom: 4,
      left: 4,
      right: 4,
      background: { r: 11, g: 31, b: 51, alpha: 1 },
    })
    .png()
    .toBuffer()
  await sharp(faviconBuf).toFile(resolve(root, 'public', 'favicon.ico'))
  console.log('Generated favicon.ico')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
