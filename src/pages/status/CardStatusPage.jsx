import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { useCollection } from '../../hooks/useCollection'

import PageHeader from './PageHeader'
import EmptyState from './EmptyState'
import SearchInput from './SearchInput'
import Select from './Select'
import SortButton from './SortButton'
import SelectionBar from './SelectionBar'
import StatusTable from './StatusTable'
import StatusMobileList from './StatusMobileList'
import JumboSection from './JumboSection'
import { filterCards, sortCards } from './utils.js'

export default function CardStatusPage({ config }) {
  const ctx = useCollection()
  const { cards, collection, stats, toggleOwned } = ctx
  const markMany = ctx[config.bulkActionKey]
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('All')
  const [secondaryFilter, setSecondaryFilter] = useState('All')
  const [sortIndex, setSortIndex] = useState(0)
  const [selected, setSelected] = useState(new Set())

  const statusCards = useMemo(() => {
    return cards.filter((c) => config.isIncluded(collection[c.id]))
  }, [cards, collection, config])

  const regularCards = useMemo(() => statusCards.filter((c) => c.variant !== 'Jumbo'), [statusCards])
  const jumboCards = useMemo(() => statusCards.filter((c) => c.variant === 'Jumbo'), [statusCards])

  const languages = useMemo(
    () => ['All', ...Array.from(new Set(regularCards.map((c) => c.language))).sort()],
    [regularCards]
  )

  const secondaryOptions = useMemo(() => {
    const values = new Set()
    regularCards.forEach((c) => {
      const value = collection[c.id]?.[config.secondaryField]
      if (value) values.add(value)
    })
    return ['All', ...Array.from(values).sort()]
  }, [regularCards, collection, config])

  const filteredCards = useMemo(
    () => filterCards({
      cards: regularCards,
      collection,
      search,
      langFilter,
      secondaryFilter,
      secondaryField: config.secondaryField,
    }),
    [regularCards, collection, search, langFilter, secondaryFilter, config]
  )

  const sortedCards = useMemo(
    () => sortCards({
      cards: filteredCards,
      sortOptions: config.sortOptions,
      sortIndex,
      collection,
      allCards: cards,
      dateField: config.dateField,
    }),
    [filteredCards, sortIndex, collection, cards, config]
  )

  const allSelected = sortedCards.length > 0 && sortedCards.every((c) => selected.has(c.id))

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        sortedCards.forEach((c) => next.delete(c.id))
      } else {
        sortedCards.forEach((c) => next.add(c.id))
      }
      return next
    })
  }, [allSelected, sortedCards])

  const toggleRow = useCallback((cardId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])

  const handleMarkOne = useCallback(
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

  const handleMarkSelected = useCallback(() => {
    if (selected.size === 0) return
    markMany(Array.from(selected))
    setSelected(new Set())
  }, [selected, markMany])

  const handleSort = useCallback(() => {
    setSortIndex((i) => (i + 1) % config.sortOptions.length)
  }, [config])

  const activeSort = config.sortOptions[sortIndex]

  if (statusCards.length === 0) {
    return <EmptyState config={config} />
  }

  return (
    <div className="space-y-4">
      <PageHeader config={config} count={config.header.getCount(stats)} />

      <div className="flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={config.searchPlaceholder} />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Select
            id={config.ids.langSelect}
            label="Language"
            value={langFilter}
            options={languages}
            onChange={setLangFilter}
          />
          <Select
            id={config.ids.secondarySelect}
            label={config.secondaryLabel}
            value={secondaryFilter}
            options={secondaryOptions}
            onChange={setSecondaryFilter}
          />
          <SortButton activeSort={activeSort} onClick={handleSort} />
        </div>

        <SelectionBar
          config={config}
          selectedSize={selected.size}
          allSelected={allSelected}
          onToggleSelectAll={toggleSelectAll}
          onAction={handleMarkSelected}
        />
      </div>

      {sortedCards.length === 0 ? (
        <div className="text-center py-12 text-navy-400 dark:text-ice-300">
          {config.noMatchText}
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-700 rounded-2xl shadow-card border border-ice-200 dark:border-navy-500 overflow-hidden">
          <StatusTable
            cards={sortedCards}
            collection={collection}
            selected={selected}
            onToggleRow={toggleRow}
            onRowAction={handleMarkOne}
            config={config}
          />
          <StatusMobileList
            cards={sortedCards}
            collection={collection}
            selected={selected}
            onToggleRow={toggleRow}
            onRowAction={handleMarkOne}
            config={config}
          />
        </div>
      )}

      <JumboSection
        cards={jumboCards}
        collection={collection}
        onRowAction={handleMarkOne}
        config={config}
      />
    </div>
  )
}
