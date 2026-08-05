import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import SmartImage from '../components/SmartImage'
import {
  Search,
  Truck,
  Check,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  ArrowLeft,
  X,
} from 'lucide-react'

const SORT_OPTIONS = [
  { key: 'orderedAt', label: 'Order Date', dir: 'desc' },
  { key: 'orderedAt', label: 'Order Date', dir: 'asc' },
  { key: 'releaseOrder', label: 'Release Order', dir: 'asc' },
  { key: 'pokemon', label: 'Name', dir: 'asc' },
  { key: 'set', label: 'Set', dir: 'asc' },
]

function formatDate(iso) {
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

function Select({ id, label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-navy-400 dark:text-ice-300">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 px-3 py-2 text-sm text-navy-700 dark:text-ice-100 focus:outline-none focus:ring-2 focus:ring-glaceon"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function Ordered() {
  const navigate = useNavigate()
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

  const languages = useMemo(
    () => ['All', ...Array.from(new Set(orderedCards.map((c) => c.language))).sort()],
    [orderedCards]
  )

  const locations = useMemo(() => {
    const locs = new Set()
    orderedCards.forEach((c) => {
      const loc = collection[c.id]?.purchaseLocation
      if (loc) locs.add(loc)
    })
    return ['All', ...Array.from(locs).sort()]
  }, [orderedCards, collection])

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orderedCards.filter((c) => {
      if (q) {
        const text = `${c.pokemon} ${c.cardNumber} ${c.set}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      if (langFilter !== 'All' && c.language !== langFilter) return false
      if (locationFilter !== 'All' && collection[c.id]?.purchaseLocation !== locationFilter) return false
      return true
    })
  }, [orderedCards, search, langFilter, locationFilter, collection])

  const sortedCards = useMemo(() => {
    const { key, dir } = SORT_OPTIONS[sortIndex] || SORT_OPTIONS[0]
    const multiplier = dir === 'asc' ? 1 : -1
    return [...filteredCards].sort((a, b) => {
      let va
      let vb
      if (key === 'orderedAt') {
        va = collection[a.id]?.orderedAt || ''
        vb = collection[b.id]?.orderedAt || ''
      } else if (key === 'releaseOrder') {
        va = a.releaseOrder ?? 0
        vb = b.releaseOrder ?? 0
      } else {
        va = a[key] || ''
        vb = b[key] || ''
      }
      if (va < vb) return -1 * multiplier
      if (va > vb) return 1 * multiplier
      return a.releaseOrder - b.releaseOrder
    })
  }, [filteredCards, sortIndex, collection])

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
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
          <Truck className="w-7 h-7 text-amber-400" />
          Ordered Cards
        </h1>

        <div className="bg-white dark:bg-navy-700 rounded-2xl p-8 sm:p-12 shadow-card text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-ice-50 dark:bg-navy-600 flex items-center justify-center">
            <PackageCheck className="w-8 h-8 text-glaceon" />
          </div>
          <h2 className="text-lg font-semibold text-navy-700 dark:text-white">Nothing on the way</h2>
          <p className="text-sm text-navy-400 dark:text-ice-300 max-w-md mx-auto">
            You have no cards currently marked as ordered. Head back to the card list to mark a card as ordered while you wait for it to arrive.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-glaceon text-navy-700 font-semibold hover:bg-ice-300 transition shadow-card"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
          <Truck className="w-7 h-7 text-amber-400" />
          Ordered Cards
          <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200">
            {stats.inTransit}
          </span>
        </h1>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-navy-700 dark:text-ice-100 font-medium hover:bg-ice-50 dark:hover:bg-navy-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards, sets, numbers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 focus:outline-none focus:ring-2 focus:ring-glaceon text-navy-700 dark:text-ice-100 placeholder:text-navy-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-ice-100 dark:hover:bg-navy-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Select id="ordered-lang" label="Language" value={langFilter} options={languages} onChange={setLangFilter} />
          <Select id="ordered-location" label="Purchase Location" value={locationFilter} options={locations} onChange={setLocationFilter} />
          <button
            onClick={handleSort}
            className="col-span-2 sm:col-span-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-sm text-navy-700 dark:text-ice-100 hover:bg-ice-50 dark:hover:bg-navy-600 transition"
          >
            <span className="text-xs font-medium text-navy-400 dark:text-ice-300">Sort</span>
            <span className="flex items-center gap-1">
              {activeSort.label}
              {activeSort.dir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-navy-700 p-3 rounded-xl shadow-sm border border-ice-200 dark:border-navy-500">
          <div className="flex items-center gap-3">
            <input
              id="select-all"
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-ice-300 text-glaceon focus:ring-glaceon dark:bg-navy-600 dark:border-navy-500"
            />
            <label htmlFor="select-all" className="text-sm text-navy-700 dark:text-ice-100 font-medium cursor-pointer">
              {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
            </label>
          </div>
          <button
            onClick={handleMarkSelectedOwned}
            disabled={selected.size === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              selected.size > 0
                ? 'bg-glaceon text-navy-700 hover:bg-ice-300 shadow-card'
                : 'bg-ice-100 dark:bg-navy-600 text-navy-400 dark:text-ice-400 cursor-not-allowed'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            Mark selected owned
          </button>
        </div>
      </div>

      {sortedCards.length === 0 ? (
        <div className="text-center py-12 text-navy-400 dark:text-ice-300">
          No ordered cards match your filters.
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-700 rounded-2xl shadow-card border border-ice-200 dark:border-navy-500 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-ice-50 dark:bg-navy-600">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">
                    Card
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">
                    Set
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">
                    Language
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">
                    Purchase Location
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">
                    Ordered
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice-100 dark:divide-navy-600">
                {sortedCards.map((card) => {
                  const state = collection[card.id] || {}
                  const isSelected = selected.has(card.id)
                  return (
                    <tr key={card.id} className={isSelected ? 'bg-glaceon/10' : ''}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(card.id)}
                          className="w-5 h-5 rounded border-ice-300 text-glaceon focus:ring-glaceon dark:bg-navy-600 dark:border-navy-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/card/${card.id}`}
                            className="w-12 h-16 rounded-lg overflow-hidden bg-ice-100 dark:bg-navy-600 flex-shrink-0"
                          >
                            <SmartImage
                              card={card}
                              sources={card.imageSources || []}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                          <div>
                            <div className="font-semibold text-navy-700 dark:text-white">
                              <Link to={`/card/${card.id}`} className="hover:underline">
                                {card.pokemon}
                              </Link>
                            </div>
                            <div className="text-xs text-navy-400 dark:text-ice-300">{card.cardNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-700 dark:text-ice-100">{card.set}</td>
                      <td className="px-4 py-3 text-sm text-navy-700 dark:text-ice-100">{card.language}</td>
                      <td className="px-4 py-3 text-sm text-navy-700 dark:text-ice-100">{card.variant}</td>
                      <td className="px-4 py-3 text-sm text-navy-700 dark:text-ice-100">
                        {state.purchaseLocation || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-500 dark:text-ice-300">
                        {formatDate(state.orderedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleMarkOwned(card.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-glaceon text-navy-700 text-sm font-semibold hover:bg-ice-300 transition shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          Owned
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <div className="sm:hidden divide-y divide-ice-100 dark:divide-navy-600">
            {sortedCards.map((card) => {
              const state = collection[card.id] || {}
              const isSelected = selected.has(card.id)
              return (
                <div key={card.id} className={`p-3 ${isSelected ? 'bg-glaceon/10' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(card.id)}
                      className="mt-1 w-5 h-5 rounded border-ice-300 text-glaceon focus:ring-glaceon dark:bg-navy-600 dark:border-navy-500"
                    />
                    <Link
                      to={`/card/${card.id}`}
                      className="w-16 h-[4.5rem] rounded-lg overflow-hidden bg-ice-100 dark:bg-navy-600 flex-shrink-0"
                    >
                      <SmartImage
                        card={card}
                        sources={card.imageSources || []}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy-700 dark:text-white">
                        <Link to={`/card/${card.id}`} className="hover:underline">
                          {card.pokemon}
                        </Link>
                      </div>
                      <div className="text-xs text-navy-400 dark:text-ice-300">
                        {card.set} · {card.cardNumber}
                      </div>
                      <div className="text-xs text-navy-400 dark:text-ice-300 mt-1">
                        {card.language} · {card.variant}
                      </div>
                      {state.purchaseLocation && (
                        <div className="text-xs text-navy-500 dark:text-ice-300 mt-1">
                          From {state.purchaseLocation}
                        </div>
                      )}
                      <div className="text-xs text-navy-400 dark:text-ice-300 mt-1">
                        Ordered {formatDate(state.orderedAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkOwned(card.id)}
                      className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-glaceon text-navy-700 hover:bg-ice-300 transition shadow-sm"
                      title="Mark owned"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
