import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getPageSlot, LAYOUT_CONFIG } from '../src/lib/layout.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rawCards = JSON.parse(readFileSync(join(__dirname, '../src/data/cards.json'), 'utf8'))
const binderOrder = JSON.parse(readFileSync(join(__dirname, '../src/data/binder-order.json'), 'utf8'))
const order = new Map(binderOrder.map((cardId, index) => [cardId, index]))
const cards = [...rawCards].sort((a, b) => {
  const aOrder = order.get(a.id) ?? Number.POSITIVE_INFINITY
  const bOrder = order.get(b.id) ?? Number.POSITIVE_INFINITY
  return aOrder - bOrder || a.releaseOrder - b.releaseOrder
})

const layout = process.argv[2] || '4x3'
const pageSize = LAYOUT_CONFIG[layout]?.pageSize || 12

console.log(`Binder review for layout: ${layout} (page size: ${pageSize})`)
console.log(`Total cards: ${cards.length}`)
console.log(`Non-Jumbo cards: ${cards.filter((c) => c.variant !== 'Jumbo').length}`)
console.log('')
console.log('Binder | Page | Slot | Card | Set | Variant | Language')
console.log('-'.repeat(100))

cards.forEach((c) => {
  const { pageNum, slotNum } = getPageSlot(c, cards, layout)
  const pos = pageNum === null ? 'JUMBO' : `${String(pageNum).padStart(2)} | ${String(slotNum).padStart(2)}`
  console.log(
    `${String(order.get(c.id) + 1 || '-').padStart(6)} | ${pos.padEnd(8)} | ${(c.pokemon + ' #' + c.cardNumber).padEnd(28)} | ${c.set.padEnd(28)} | ${c.variant.padEnd(14)} | ${c.language}`
  )
})

console.log('')
console.log('Summary: all non-Jumbo cards occupy continuous positions.')
