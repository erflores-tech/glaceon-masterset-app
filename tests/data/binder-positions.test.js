import { describe, it, expect } from 'vitest'
import { getPageSlot, LAYOUT_CONFIG } from '../../src/lib/layout.js'
import cards from '../../src/data/cards.json'
import binderOrder from '../../src/data/binder-order.json'

const layouts = Object.keys(LAYOUT_CONFIG)
const order = new Map(binderOrder.map((cardId, index) => [cardId, index]))
const orderedCards = [...cards].sort((a, b) => {
  const aOrder = order.get(a.id) ?? Number.POSITIVE_INFINITY
  const bOrder = order.get(b.id) ?? Number.POSITIVE_INFINITY
  return aOrder - bOrder || a.releaseOrder - b.releaseOrder
})

describe('binder positions for all cards', () => {
  it('contains every non-Jumbo card exactly once in PDF order', () => {
    const nonJumboIds = cards.filter((card) => card.variant !== 'Jumbo').map((card) => card.id)
    expect(binderOrder).toHaveLength(nonJumboIds.length)
    expect(new Set(binderOrder).size).toBe(binderOrder.length)
    expect(new Set(binderOrder)).toEqual(new Set(nonJumboIds))
  })

  layouts.forEach((layout) => {
    const pageSize = LAYOUT_CONFIG[layout].pageSize

    it(`produces valid sequential positions in ${layout} layout`, () => {
      const positions = []
      const jumbos = []

      orderedCards.forEach((card) => {
        const { pageNum, slotNum } = getPageSlot(card, orderedCards, layout)
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
        const { pageNum } = getPageSlot(card, orderedCards, layout)
        return Math.max(max, pageNum)
      }, 0)

      expect(maxPage).toBe(expectedPages)
    })
  })

  it('matches the PDF order at the end of the 3x3 binder', () => {
    const card227 = orderedCards.find((card) => card.cardNumber === '227/208')
    const card047 = orderedCards.find((card) => card.cardNumber === '047/208')

    expect(order.get(card227.id)).toBe(142)
    expect(order.get(card047.id)).toBe(147)
    expect(getPageSlot(card227, orderedCards, '3x3')).toEqual({ pageNum: 16, slotNum: 8, pageSize: 9 })
    expect(getPageSlot(card047, orderedCards, '3x3')).toEqual({ pageNum: 17, slotNum: 4, pageSize: 9 })
  })
})
