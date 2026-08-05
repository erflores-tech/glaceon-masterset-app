import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgBuffer = readFileSync(resolve(root, 'public', 'glaceon-logo.svg'))

const sizes = [
  { size: 192, maskable: false, name: 'icon-192x192.png' },
  { size: 512, maskable: false, name: 'icon-512x512.png' },
  { size: 192, maskable: true, name: 'icon-192x192-maskable.png' },
  { size: 512, maskable: true, name: 'icon-512x512-maskable.png' },
]

async function render({ size, maskable, name }) {
  const padding = maskable ? Math.round(size * 0.12) : 0
  const inner = size - padding * 2

  const png = await sharp(svgBuffer, { density: 144 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp(png).toFile(resolve(root, 'public', 'icons', name))
  console.log(`Generated ${name}`)
}

// favicon.ico: 32x32 and 16x16 multi-resolution
async function generateFavicon() {
  const sizes = [32, 16]
  const buffers = await Promise.all(
    sizes.map((s) =>
      sharp(svgBuffer, { density: 144 })
        .resize(s, s, { fit: 'contain', background: { r: 11, g: 31, b: 51, alpha: 1 } })
        .png()
        .toBuffer()
    )
  )
  await sharp(buffers[0], { density: 144 })
    .toFile(resolve(root, 'public', 'favicon.ico'))
  console.log('Generated favicon.ico')
}

await Promise.all(sizes.map(render))
await generateFavicon()
console.log('Done')
