import { describe, it, expect } from 'vitest'
import { getPageSlot } from '../../src/lib/layout.js'

const mockCards = Array.from({ length: 20 }, (_, i) => ({
  id: `c${i + 1}`,
  releaseOrder: i + 1,
  variant: i + 1 === 3 ? 'Jumbo' : 'Standard',
}))

describe('getPageSlot', () => {
  it('returns page and slot for a regular card', () => {
    const result = getPageSlot(mockCards[0], mockCards, '4x3')
    expect(result).toEqual({ pageNum: 1, slotNum: 1, pageSize: 12 })
  })

  it('skips Jumbo cards when computing binder position', () => {
    // c4 is releaseOrder 4, but only the 3rd non-jumbo card
    const result = getPageSlot(mockCards[3], mockCards, '4x3')
    expect(result).toEqual({ pageNum: 1, slotNum: 3, pageSize: 12 })
  })

  it('shifts cards after Jumbo to the next binder slots correctly', () => {
    // c5 is releaseOrder 5, but position 4
    const result = getPageSlot(mockCards[4], mockCards, '4x3')
    expect(result).toEqual({ pageNum: 1, slotNum: 4, pageSize: 12 })
  })

  it('crosses page boundary correctly after Jumbo shift', () => {
    // c14 is releaseOrder 14, position 13 (1 jumbo skipped before it)
    const result = getPageSlot(mockCards[13], mockCards, '4x3')
    expect(result).toEqual({ pageNum: 2, slotNum: 1, pageSize: 12 })
  })

  it('returns null page/slot for Jumbo cards', () => {
    const result = getPageSlot(mockCards[2], mockCards, '4x3')
    expect(result).toEqual({ pageNum: null, slotNum: null, pageSize: 12 })
  })

  it('supports legacy numeric releaseOrder argument', () => {
    const result = getPageSlot(5, null, '4x3')
    expect(result).toEqual({ pageNum: 1, slotNum: 5, pageSize: 12 })
  })

  it('respects different layout page sizes', () => {
    // c14 is position 13; with page size 4 -> page 4 slot 1
    const result = getPageSlot(mockCards[13], mockCards, '2x2')
    expect(result.pageSize).toBe(4)
    expect(result.pageNum).toBe(4)
    expect(result.slotNum).toBe(1)
  })
})
