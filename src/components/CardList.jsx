import { useState, useMemo, useEffect } from 'react'
import { useCollection } from '../context/CollectionContext'
import { useSearchParams } from 'react-router-dom'
import CardItem from './CardItem'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const LAYOUT_CONFIG = {
  '2x2': { cols: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2', label: '2×2', pageSize: 4 },
  '3x3': { cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3', label: '3×3', pageSize: 9 },
  '4x3': { cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4', label: '4×3', pageSize: 12 },
  '4x4': { cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4', label: '4×4', pageSize: 16 },
}

function getVisiblePages(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = []
  pages.push(1)

  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)

  if (left > 2) pages.push('…')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('…')

  pages.push(total)
  return pages
}

export default function CardList() {
  const { cards, collection, layout, stats } = useCollection()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const masterPct = stats.total ? Math.round((stats.owned / stats.total) * 100) : 0

  const search = searchParams.get('q') || ''
  const setFilter = searchParams.get('set') || 'All'
  const langFilter = searchParams.get('lang') || 'All'
  const variantFilter = searchParams.get('variant') || 'All'
  const statusFilter = searchParams.get('status') || 'All'

  const sets = useMemo(() => ['All', ...Array.from(new Set(cards.map((c) => c.set))).sort()], [cards])
  const langs = useMemo(() => ['All', ...Array.from(new Set(cards.map((c) => c.language))).sort()], [cards])
  const variants = useMemo(() => ['All', ...Array.from(new Set(cards.map((c) => c.variant))).sort()], [cards])

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cards.filter((c) => {
      if (q && !c.pokemon.toLowerCase().includes(q) && !c.cardNumber.toLowerCase().includes(q) && !c.set.toLowerCase().includes(q)) return false
      if (setFilter !== 'All' && c.set !== setFilter) return false
      if (langFilter !== 'All' && c.language !== langFilter) return false
      if (variantFilter !== 'All' && c.variant !== variantFilter) return false
      if (statusFilter !== 'All') {
        const state = collection[c.id]
        if (statusFilter === 'owned' && !state?.owned) return false
        if (statusFilter === 'needed' && state?.owned) return false
        if (statusFilter === 'want' && !state?.want) return false
      }
      return true
    })
  }, [cards, collection, search, setFilter, langFilter, variantFilter, statusFilter])

  const pageSize = LAYOUT_CONFIG[layout].pageSize
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [layout, search, setFilter, langFilter, variantFilter, statusFilter])

  const paginatedCards = useMemo(() => {
    const safePage = Math.min(page, totalPages)
    return filteredCards.slice((safePage - 1) * pageSize, safePage * pageSize)
  }, [filteredCards, page, pageSize, totalPages])

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'All' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    setSearchParams(params)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateParam('q', e.target.value)}
              placeholder="Search cards, sets, numbers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 focus:outline-none focus:ring-2 focus:ring-glaceon text-navy-700 dark:text-ice-100 placeholder:text-navy-300"
            />
            {search && (
              <button
                onClick={() => updateParam('q', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-ice-100 dark:hover:bg-navy-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`p-2.5 rounded-xl border transition ${
              showFilters
                ? 'bg-glaceon border-glaceon text-navy-700'
                : 'bg-white dark:bg-navy-700 border-ice-200 dark:border-navy-500 text-navy-500 dark:text-ice-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-navy-700 p-3 rounded-xl shadow-card">
            <Select label="Set" value={setFilter} options={sets} onChange={(v) => updateParam('set', v)} />
            <Select label="Language" value={langFilter} options={langs} onChange={(v) => updateParam('lang', v)} />
            <Select label="Variant" value={variantFilter} options={variants} onChange={(v) => updateParam('variant', v)} />
            <Select
              label="Status"
              value={statusFilter}
              options={['All', 'owned', 'needed', 'want']}
              onChange={(v) => updateParam('status', v)}
            />
          </div>
        )}

        <div className="bg-white dark:bg-navy-700 rounded-xl p-3 border border-ice-200 dark:border-navy-500 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="text-sm font-medium text-navy-700 dark:text-white">
              Master Set {masterPct}% complete
            </div>
            <div className="text-xs text-navy-400 dark:text-ice-300">
              {stats.owned} / {stats.total} cards
            </div>
          </div>
          <div className="w-full h-2.5 bg-ice-100 dark:bg-navy-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-glaceon to-ice-300 transition-all"
              style={{ width: `${masterPct}%` }}
            />
          </div>
        </div>

        <div className="text-sm text-navy-400 dark:text-ice-300">
          {filteredCards.length > 0
            ? `Cards ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredCards.length)} of ${filteredCards.length}`
            : `0 of ${filteredCards.length} cards`}
        </div>
      </div>

      <div className={`grid gap-3 ${LAYOUT_CONFIG[layout].cols}`}>
        {paginatedCards.map((card) => (
          <CardItem key={card.id} card={card} density={layout} />
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-16 text-navy-400 dark:text-ice-300">
          No cards match your filters.
        </div>
      )}

      {filteredCards.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <div className="text-sm text-navy-500 dark:text-ice-300 order-2 sm:order-1">
            Page {page} of {totalPages}
          </div>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-navy-500 dark:text-ice-300 disabled:opacity-40 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-navy-500 dark:text-ice-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {getVisiblePages(page, totalPages).map((p, idx) =>
                p === '…' ? (
                  <span key={`gap-${idx}`} className="px-1 text-navy-400 dark:text-ice-300">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-medium transition ${
                      page === p
                        ? 'bg-glaceon text-navy-700'
                        : 'bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-navy-500 dark:text-ice-300 hover:bg-ice-100 dark:hover:bg-navy-600'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-navy-500 dark:text-ice-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-navy-500 dark:text-ice-300 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-navy-400 dark:text-ice-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 rounded-lg bg-ice-50 dark:bg-navy-600 border border-ice-200 dark:border-navy-500 text-sm focus:outline-none focus:ring-2 focus:ring-glaceon"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
