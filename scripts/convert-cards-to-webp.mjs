import { readdir, mkdir, stat, rename, unlink } from 'fs/promises'
import { join, extname, basename } from 'path'
import sharp from 'sharp'

const CARDS_DIR = join(import.meta.dirname, '..', 'public', 'cards')
const STAGING_DIR = join(CARDS_DIR, '.webp-staging')

async function convert() {
  await mkdir(STAGING_DIR, { recursive: true })

  const files = await readdir(CARDS_DIR)
  const pngs = files.filter((f) => f.toLowerCase().endsWith('.png'))

  if (pngs.length === 0) {
    console.log('No PNG files found in public/cards/')
    return
  }

  let originalTotal = 0
  let webpTotal = 0

  for (const file of pngs) {
    const input = join(CARDS_DIR, file)
    const outputName = `${basename(file, extname(file))}.webp`
    const output = join(STAGING_DIR, outputName)

    const originalSize = (await stat(input)).size
    originalTotal += originalSize

    await sharp(input).webp({ lossless: true }).toFile(output)

    const webpSize = (await stat(output)).size
    webpTotal += webpSize

    const saved = originalSize - webpSize
    const pct = ((saved / originalSize) * 100).toFixed(1)
    console.log(
      `${file} → ${outputName}: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(webpSize / 1024 / 1024).toFixed(2)} MB (${pct}% saved)`
    )
  }

  console.log(
    `\nTotal: ${(originalTotal / 1024 / 1024).toFixed(2)} MB → ${(webpTotal / 1024 / 1024).toFixed(2)} MB (${
      (((originalTotal - webpTotal) / originalTotal) * 100).toFixed(1)
    }% saved)`
  )
  console.log(`Staged ${pngs.length} WebP files in ${STAGING_DIR}`)
}

convert().catch((err) => {
  console.error(err)
  process.exit(1)
})
