export const LAYOUT_OPTIONS = ['2x2', '3x3', '4x3', '4x4']

export const LAYOUT_CONFIG = {
  '2x2': { cols: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2', label: '2×2', pageSize: 4 },
  '3x3': { cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3', label: '3×3', pageSize: 9 },
  '4x3': { cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4', label: '4×3', pageSize: 12 },
  '4x4': { cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4', label: '4×4', pageSize: 16 },
}

export function getPageSlot(cardOrReleaseOrder, cards, layout) {
  const pageSize = LAYOUT_CONFIG[layout]?.pageSize || 12

  // Legacy support: first argument used to be a raw release order number
  if (typeof cardOrReleaseOrder === 'number' || typeof cardOrReleaseOrder === 'string') {
    const safeOrder = Math.max(1, Number(cardOrReleaseOrder) || 1)
    const pageNum = Math.ceil(safeOrder / pageSize)
    const slotNum = ((safeOrder - 1) % pageSize) + 1
    return { pageNum, slotNum, pageSize }
  }

  const card = cardOrReleaseOrder
  if (!card || card.variant === 'Jumbo') {
    return { pageNum: null, slotNum: null, pageSize }
  }

  // Binder position excludes Jumbo cards because they do not fit in the binder pages.
  const binderIndex = cards
    ? cards.filter((c) => c.variant !== 'Jumbo' && c.releaseOrder <= card.releaseOrder).length
    : Math.max(1, Number(card.releaseOrder) || 1)

  const pageNum = Math.ceil(binderIndex / pageSize)
  const slotNum = ((binderIndex - 1) % pageSize) + 1
  return { pageNum, slotNum, pageSize }
}
