import { describe, it, expect } from 'vitest'
import { getPageSlot, LAYOUT_CONFIG } from '../../src/lib/layout.js'
import cards from '../../src/data/cards.json'

const layouts = Object.keys(LAYOUT_CONFIG)

describe('binder positions for all cards', () => {
  layouts.forEach((layout) => {
    const pageSize = LAYOUT_CONFIG[layout].pageSize

    it(`produces valid sequential positions in ${layout} layout`, () => {
      const positions = []
      const jumbos = []

      cards.forEach((card) => {
        const { pageNum, slotNum } = getPageSlot(card, cards, layout)
        if (card.variant === 'Jumbo') {
          jumbos.push({ card, pageNum, slotNum })
        } else {
          positions.push({ card, pageNum, slotNum })
        }
      })

      // Jumbo cards should not have a binder slot
      jumbos.forEach(({ pageNum, slotNum }) => {
        expect(pageNum).toBeNull()
        expect(slotNum).toBeNull()
      })

      // Non-jumbo positions should be a continuous 1..N sequence
      positions.forEach(({ pageNum, slotNum }, index) => {
        const expectedPosition = index + 1
        const expectedPage = Math.ceil(expectedPosition / pageSize)
        const expectedSlot = ((expectedPosition - 1) % pageSize) + 1

        expect(pageNum).toBe(expectedPage)
        expect(slotNum).toBe(expectedSlot)
      })
    })
  })

  it('only the known Jumbo card is excluded', () => {
    const jumboCards = cards.filter((c) => c.variant === 'Jumbo')
    expect(jumboCards).toHaveLength(1)
    expect(jumboCards[0].cardNumber).toBe('SWSH197')
    expect(jumboCards[0].pokemon).toBe('Glaceon VSTAR')
  })

  it('total non-jumbo cards fit into expected number of pages', () => {
    const nonJumboCount = cards.filter((c) => c.variant !== 'Jumbo').length
    layouts.forEach((layout) => {
      const pageSize = LAYOUT_CONFIG[layout].pageSize
      const expectedPages = Math.ceil(nonJumboCount / pageSize)

      const maxPage = cards.reduce((max, card) => {
        if (card.variant === 'Jumbo') return max
        const { pageNum } = getPageSlot(card, cards, layout)
        return Math.max(max, pageNum)
      }, 0)

      expect(maxPage).toBe(expectedPages)
    })
  })
})
