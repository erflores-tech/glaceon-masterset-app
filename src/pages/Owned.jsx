import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { useCollection } from '../hooks/useCollection'

import PageHeader from './owned/PageHeader'
import EmptyState from './owned/EmptyState'
import SearchInput from './ordered/SearchInput'
import Select from './ordered/Select'
import SortButton from './ordered/SortButton'
import SelectionBar from './owned/SelectionBar'
import OwnedTable from './owned/OwnedTable'
import OwnedMobileList from './owned/OwnedMobileList'
import JumboSection from './owned/JumboSection'
import { SORT_OPTIONS, filterOwnedCards, sortOwnedCards } from './owned/utils.js'

export default function Owned() {
  const { cards, collection, stats, toggleOwned, markManyNotOwned } = useCollection()
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('All')
  const [gradeFilter, setGradeFilter] = useState('All')
  const [sortIndex, setSortIndex] = useState(0)
  const [selected, setSelected] = useState(new Set())

  const ownedCards = useMemo(() => {
    return cards.filter((c) => {
      const state = collection[c.id]
      return state?.owned
    })
  }, [cards, collection])

  const regularCards = useMemo(() => ownedCards.filter((c) => c.variant !== 'Jumbo'), [ownedCards])
  const jumboCards = useMemo(() => ownedCards.filter((c) => c.variant === 'Jumbo'), [ownedCards])

  const languages = useMemo(
    () => ['All', ...Array.from(new Set(regularCards.map((c) => c.language))).sort()],
    [regularCards]
  )

  const grades = useMemo(() => {
    const set = new Set()
    regularCards.forEach((c) => {
      const grade = collection[c.id]?.grade
      if (grade) set.add(grade)
    })
    return ['All', ...Array.from(set).sort()]
  }, [regularCards, collection])

  const filteredCards = useMemo(
    () => filterOwnedCards({ cards: regularCards, collection, search, langFilter, gradeFilter }),
    [regularCards, collection, search, langFilter, gradeFilter]
  )

  const sortedCards = useMemo(
    () => sortOwnedCards({ cards: filteredCards, sortIndex, collection, allCards: cards }),
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

  const handleMarkNotOwned = useCallback(
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

  const handleMarkSelectedNotOwned = useCallback(() => {
    if (selected.size === 0) return
    markManyNotOwned(Array.from(selected))
    setSelected(new Set())
  }, [selected, markManyNotOwned])

  const handleSort = useCallback(() => {
    setSortIndex((i) => (i + 1) % SORT_OPTIONS.length)
  }, [])

  const activeSort = SORT_OPTIONS[sortIndex]

  if (ownedCards.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      <PageHeader ownedCount={stats.owned} />

      <div className="flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search owned cards, sets, numbers..." />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Select
            id="owned-lang"
            label="Language"
            value={langFilter}
            options={languages}
            onChange={setLangFilter}
          />
          <Select
            id="owned-grade"
            label="Grade"
            value={gradeFilter}
            options={grades}
            onChange={setGradeFilter}
          />
          <SortButton activeSort={activeSort} onClick={handleSort} />
        </div>

        <SelectionBar
          selectedSize={selected.size}
          allSelected={allSelected}
          onToggleSelectAll={toggleSelectAll}
          onMarkSelectedNotOwned={handleMarkSelectedNotOwned}
        />
      </div>

      {sortedCards.length === 0 ? (
        <div className="text-center py-12 text-navy-400 dark:text-ice-300">
          No owned cards match your filters.
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-700 rounded-2xl shadow-card border border-ice-200 dark:border-navy-500 overflow-hidden">
          <OwnedTable
            cards={sortedCards}
            collection={collection}
            selected={selected}
            onToggleRow={toggleRow}
            onMarkNotOwned={handleMarkNotOwned}
          />
          <OwnedMobileList
            cards={sortedCards}
            collection={collection}
            selected={selected}
            onToggleRow={toggleRow}
            onMarkNotOwned={handleMarkNotOwned}
          />
        </div>
      )}

      <JumboSection
        cards={jumboCards}
        collection={collection}
        onMarkNotOwned={handleMarkNotOwned}
      />
    </div>
  )
}
