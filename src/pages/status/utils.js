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

export function filterCards({ cards, collection, search, langFilter, secondaryFilter, secondaryField }) {
  const q = search.trim().toLowerCase()
  return cards.filter((c) => {
    if (q) {
      const text = `${c.pokemon} ${c.cardNumber} ${c.set}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    if (langFilter !== 'All' && c.language !== langFilter) return false
    if (secondaryFilter !== 'All' && collection[c.id]?.[secondaryField] !== secondaryFilter) return false
    return true
  })
}

export function sortCards({ cards, sortOptions, sortIndex, collection, allCards, dateField }) {
  const option = sortOptions[sortIndex] || sortOptions[0]
  const { key, dir } = option
  const multiplier = dir === 'asc' ? 1 : -1
  const fromCollection = key === dateField || option.source === 'collection'
  return [...cards].sort((a, b) => {
    let va
    let vb
    if (fromCollection) {
      va = collection[a.id]?.[key] || ''
      vb = collection[b.id]?.[key] || ''
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
