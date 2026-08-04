import { useCollection, LAYOUT_OPTIONS } from '../context/CollectionContext'
import { Grid2X2, Grid3X3, LayoutGrid, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const LAYOUT_CONFIG = {
  '2x2': { cols: 'grid-cols-2', label: '2 × 2', pageSize: 4, desc: '4 cards per binder page' },
  '3x3': { cols: 'grid-cols-3', label: '3 × 3', pageSize: 9, desc: '9 cards per binder page' },
  '4x3': { cols: 'grid-cols-4', label: '4 × 3', pageSize: 12, desc: '12 cards per binder page' },
  '4x4': { cols: 'grid-cols-4', label: '4 × 4', pageSize: 16, desc: '16 cards per binder page' },
}

const LAYOUT_ICONS = {
  '2x2': Grid2X2,
  '3x3': Grid3X3,
  '4x3': LayoutGrid,
  '4x4': LayoutGrid,
}

export default function Settings() {
  const { layout, setLayout } = useCollection()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="p-2 rounded-xl bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-navy-500 dark:text-ice-300 hover:bg-ice-100 dark:hover:bg-navy-600 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-navy-700 dark:text-white">Settings</h1>
      </div>

      <section className="bg-white dark:bg-navy-700 rounded-2xl p-5 border border-ice-200 dark:border-navy-500 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-navy-700 dark:text-white">Binder layout</h2>
          <p className="text-sm text-navy-400 dark:text-ice-300 mt-1">
            Choose how cards are arranged on each page. This also sets how many cards appear per page in the list.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LAYOUT_OPTIONS.map((key) => {
            const config = LAYOUT_CONFIG[key]
            const Icon = LAYOUT_ICONS[key]
            const active = layout === key
            return (
              <button
                key={key}
                onClick={() => setLayout(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                  active
                    ? 'border-glaceon bg-glaceon/10 dark:bg-glaceon/20'
                    : 'border-ice-200 dark:border-navy-500 bg-ice-50 dark:bg-navy-600 hover:border-glaceon/50'
                }`}
              >
                <Icon className={`w-8 h-8 ${active ? 'text-glaceon' : 'text-navy-400 dark:text-ice-300'}`} />
                <div className={`font-semibold ${active ? 'text-navy-700 dark:text-white' : 'text-navy-600 dark:text-ice-200'}`}>
                  {config.label}
                </div>
                <div className="text-xs text-navy-400 dark:text-ice-300">{config.desc}</div>
              </button>
            )
          })}
        </div>

        <div className="text-xs text-navy-400 dark:text-ice-300 bg-ice-50 dark:bg-navy-600 rounded-lg p-3">
          Current selection: <span className="font-medium text-navy-700 dark:text-white">{LAYOUT_CONFIG[layout].label}</span> ·{' '}
          {LAYOUT_CONFIG[layout].pageSize} cards per page
        </div>
      </section>

      <section className="bg-white dark:bg-navy-700 rounded-2xl p-5 border border-ice-200 dark:border-navy-500 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-navy-700 dark:text-white">About</h2>
        <p className="text-sm text-navy-400 dark:text-ice-300">
          Glaceon Master Set tracker — offline-first PWA for tracking your Glaceon master set collection.
        </p>
      </section>
    </div>
  )
}
