import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { useCollection } from '../hooks/useCollection'

import PageHeader from './ordered/PageHeader'
import EmptyState from './ordered/EmptyState'
import SearchInput from './ordered/SearchInput'
import Select from './ordered/Select'
import SortButton from './ordered/SortButton'
import SelectionBar from './ordered/SelectionBar'
import OrderedTable from './ordered/OrderedTable'
import OrderedMobileList from './ordered/OrderedMobileList'
import JumboSection from './ordered/JumboSection'
import { SORT_OPTIONS, filterOrderedCards, sortOrderedCards } from './ordered/utils.js'

export default function Ordered() {
  const { cards, collection, stats, toggleOwned, markManyOwned } = useCollection()
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('All')
  const [locationFilter, setLocationFilter] = useState('All')
  const [sortIndex, setSortIndex] = useState(0)
  const [selected, setSelected] = useState(new Set())

  const orderedCards = useMemo(() => {
    return cards.filter((c) => {
      const state = collection[c.id]
      return state?.ordered && !state?.owned
    })
  }, [cards, collection])

  const regularCards = useMemo(() => orderedCards.filter((c) => c.variant !== 'Jumbo'), [orderedCards])
  const jumboCards = useMemo(() => orderedCards.filter((c) => c.variant === 'Jumbo'), [orderedCards])

  const languages = useMemo(
    () => ['All', ...Array.from(new Set(regularCards.map((c) => c.language))).sort()],
    [regularCards]
  )

  const locations = useMemo(() => {
    const locs = new Set()
    regularCards.forEach((c) => {
      const loc = collection[c.id]?.purchaseLocation
      if (loc) locs.add(loc)
    })
    return ['All', ...Array.from(locs).sort()]
  }, [regularCards, collection])

  const filteredCards = useMemo(
    () => filterOrderedCards({ cards: regularCards, collection, search, langFilter, locationFilter }),
    [regularCards, collection, search, langFilter, locationFilter]
  )

  const sortedCards = useMemo(
    () => sortOrderedCards({ cards: filteredCards, sortIndex, collection, allCards: cards }),
    [filteredCards, sortIndex, collection, cards]
  )

  const allSelected = sortedCards.length > 0 && sortedCards.every((c) => selected.has(c.id))

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        sortedCards.forEach((c) => next.delete(c.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        sortedCards.forEach((c) => next.add(c.id))
        return next
      })
    }
  }, [allSelected, sortedCards])

  const toggleRow = useCallback((cardId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])

  const handleMarkOwned = useCallback(
    (cardId) => {
      toggleOwned(cardId)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(cardId)
        return next
      })
    },
    [toggleOwned]
  )

  const handleMarkSelectedOwned = useCallback(() => {
    if (selected.size === 0) return
    markManyOwned(Array.from(selected))
    setSelected(new Set())
  }, [selected, markManyOwned])

  const handleSort = useCallback(() => {
    setSortIndex((i) => (i + 1) % SORT_OPTIONS.length)
  }, [])

  const activeSort = SORT_OPTIONS[sortIndex]

  if (orderedCards.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      <PageHeader inTransit={stats.inTransit} />

      <div className="flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Select
            id="ordered-lang"
            label="Language"
            value={langFilter}
            options={languages}
            onChange={setLangFilter}
          />
          <Select
            id="ordered-location"
            label="Purchase Location"
            value={locationFilter}
            options={locations}
            onChange={setLocationFilter}
          />
          <SortButton activeSort={activeSort} onClick={handleSort} />
        </div>

        <SelectionBar
          selectedSize={selected.size}
          allSelected={allSelected}
          onToggleSelectAll={toggleSelectAll}
          onMarkSelectedOwned={handleMarkSelectedOwned}
        />
      </div>

      {sortedCards.length === 0 ? (
        <div className="text-center py-12 text-navy-400 dark:text-ice-300">
          No ordered cards match your filters.
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-700 rounded-2xl shadow-card border border-ice-200 dark:border-navy-500 overflow-hidden">
          <OrderedTable
            cards={sortedCards}
            collection={collection}
            selected={selected}
            onToggleRow={toggleRow}
            onMarkOwned={handleMarkOwned}
          />
          <OrderedMobileList
            cards={sortedCards}
            collection={collection}
            selected={selected}
            onToggleRow={toggleRow}
            onMarkOwned={handleMarkOwned}
          />
        </div>
      )}

      <JumboSection
        cards={jumboCards}
        collection={collection}
        onMarkOwned={handleMarkOwned}
      />
    </div>
  )
}
