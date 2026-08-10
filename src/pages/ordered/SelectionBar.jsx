import * as React from 'react'
import { PackageCheck } from 'lucide-react'

export default function SelectionBar({ selectedSize, allSelected, onToggleSelectAll, onMarkSelectedOwned }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-navy-700 p-3 rounded-xl shadow-sm border border-ice-200 dark:border-navy-500">
      <div className="flex items-center gap-3">
        <input
          id="select-all"
          type="checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          className="w-5 h-5 rounded border-ice-300 text-glaceon focus:ring-glaceon dark:bg-navy-600 dark:border-navy-500"
        />
        <label htmlFor="select-all" className="text-sm text-navy-700 dark:text-ice-100 font-medium cursor-pointer">
          {selectedSize > 0 ? `${selectedSize} selected` : 'Select all'}
        </label>
      </div>
      <button
        onClick={onMarkSelectedOwned}
        disabled={selectedSize === 0}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
          selectedSize > 0
            ? 'bg-glaceon text-navy-700 hover:bg-ice-300 shadow-card'
            : 'bg-ice-100 dark:bg-navy-600 text-navy-400 dark:text-ice-400 cursor-not-allowed'
        }`}
      >
        <PackageCheck className="w-4 h-4" />
        Mark selected owned
      </button>
    </div>
  )
}
