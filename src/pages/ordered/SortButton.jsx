import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function SortButton({ activeSort, onClick }) {
  return (
    <button
      onClick={onClick}
      className="col-span-2 sm:col-span-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-navy-700 border border-ice-200 dark:border-navy-500 text-sm text-navy-700 dark:text-ice-100 hover:bg-ice-50 dark:hover:bg-navy-600 transition"
      aria-label={`Sort by ${activeSort.label} ${activeSort.dir === 'asc' ? 'ascending' : 'descending'}`}
    >
      <span className="text-xs font-medium text-navy-400 dark:text-ice-300">Sort</span>
      <span className="flex items-center gap-1">
        {activeSort.label}
        {activeSort.dir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </span>
    </button>
  )
}
