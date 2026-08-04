import { useCollection } from '../context/CollectionContext'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Heart, Sparkles } from 'lucide-react'

export default function Dashboard() {
  const { cards, collection, stats } = useCollection()
  const [langFilter, setLangFilter] = useState('All')

  const languages = useMemo(() => {
    const langs = new Set(cards.map((c) => c.language))
    return ['All', ...Array.from(langs).sort()]
  }, [cards])

  const filteredCards = useMemo(() => {
    return langFilter === 'All' ? cards : cards.filter((c) => c.language === langFilter)
  }, [cards, langFilter])

  const filteredStats = useMemo(() => {
    const total = filteredCards.length
    const owned = filteredCards.filter((c) => collection[c.id]?.owned).length
    return { total, owned, remaining: total - owned, pct: total ? Math.round((owned / total) * 100) : 0 }
  }, [filteredCards, collection])

  const setProgress = useMemo(() => {
    const map = {}
    filteredCards.forEach((c) => {
      if (!map[c.set]) map[c.set] = { total: 0, owned: 0 }
      map[c.set].total += 1
      if (collection[c.id]?.owned) map[c.set].owned += 1
    })
    return Object.entries(map)
      .map(([name, s]) => ({ name, ...s, pct: s.total ? Math.round((s.owned / s.total) * 100) : 0 }))
      .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name))
  }, [filteredCards, collection])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
        <Sparkles className="w-7 h-7 text-glaceon" />
        Collection Dashboard
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Cards" value={stats.total} icon={<Circle className="w-5 h-5 text-ice-400" />} />
        <StatCard label="Owned" value={stats.owned} icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Remaining" value={stats.remaining} icon={<Circle className="w-5 h-5 text-rose-300" />} />
        <StatCard label="Want List" value={stats.wanted} icon={<Heart className="w-5 h-5 text-rose-400" />} />
      </div>

      <div className="bg-white dark:bg-navy-700 rounded-2xl p-4 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Progress</h2>
            <p className="text-sm text-navy-400 dark:text-ice-300">
              {stats.owned}/{stats.total} overall ({stats.total ? Math.round((stats.owned / stats.total) * 100) : 0}%)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => setLangFilter(l)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  langFilter === l
                    ? 'bg-glaceon text-navy-700'
                    : 'bg-ice-100 dark:bg-navy-600 text-navy-500 dark:text-ice-300 hover:bg-ice-200 dark:hover:bg-navy-500'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-4 bg-ice-100 dark:bg-navy-600 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-glaceon to-ice-300 transition-all"
            style={{ width: `${filteredStats.pct}%` }}
          />
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
          {setProgress.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-28 sm:w-48 text-sm truncate" title={s.name}>{s.name}</div>
              <div className="flex-1 h-2.5 bg-ice-100 dark:bg-navy-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-glaceon rounded-full"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm text-navy-400 dark:text-ice-300">
                {s.owned}/{s.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-glaceon text-navy-700 font-semibold hover:bg-ice-300 transition shadow-card"
        >
          Back to Card List
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white dark:bg-navy-700 rounded-2xl p-4 shadow-card flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-ice-50 dark:bg-navy-600">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-navy-700 dark:text-white">{value}</div>
        <div className="text-xs text-navy-400 dark:text-ice-300 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  )
}
