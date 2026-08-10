export const SORT_OPTIONS = [
  { key: 'ownedAt', label: 'Owned Date', dir: 'desc' },
  { key: 'ownedAt', label: 'Owned Date', dir: 'asc' },
  { key: 'releaseOrder', label: 'Release Order', dir: 'asc' },
  { key: 'pokemon', label: 'Name', dir: 'asc' },
  { key: 'set', label: 'Set', dir: 'asc' },
  { key: 'grade', label: 'Grade', dir: 'asc' },
]

export function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export function filterOwnedCards({ cards, collection, search, langFilter, gradeFilter }) {
  const q = search.trim().toLowerCase()
  return cards.filter((c) => {
    if (q) {
      const text = `${c.pokemon} ${c.cardNumber} ${c.set}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    if (langFilter !== 'All' && c.language !== langFilter) return false
    if (gradeFilter !== 'All' && collection[c.id]?.grade !== gradeFilter) return false
    return true
  })
}

export function sortOwnedCards({ cards, sortIndex, collection, allCards }) {
  const { key, dir } = SORT_OPTIONS[sortIndex] || SORT_OPTIONS[0]
  const multiplier = dir === 'asc' ? 1 : -1
  return [...cards].sort((a, b) => {
    let va
    let vb
    if (key === 'ownedAt') {
      va = collection[a.id]?.ownedAt || ''
      vb = collection[b.id]?.ownedAt || ''
    } else if (key === 'releaseOrder') {
      va = allCards.indexOf(a)
      vb = allCards.indexOf(b)
    } else {
      va = a[key] || ''
      vb = b[key] || ''
    }
    if (va < vb) return -1 * multiplier
    if (va > vb) return 1 * multiplier
    return a.releaseOrder - b.releaseOrder
  })
}
