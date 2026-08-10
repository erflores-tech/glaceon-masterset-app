import * as React from 'react'
import { PackageX } from 'lucide-react'

export default function SelectionBar({ selectedSize, allSelected, onToggleSelectAll, onMarkSelectedNotOwned }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-navy-700 p-3 rounded-xl shadow-sm border border-ice-200 dark:border-navy-500">
      <div className="flex items-center gap-3">
        <input
          id="select-all-owned"
          type="checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          className="w-5 h-5 rounded border-ice-300 text-glaceon focus:ring-glaceon dark:bg-navy-600 dark:border-navy-500"
        />
        <label htmlFor="select-all-owned" className="text-sm text-navy-700 dark:text-ice-100 font-medium cursor-pointer">
          {selectedSize > 0 ? `${selectedSize} selected` : 'Select all'}
        </label>
      </div>
      <button
        onClick={onMarkSelectedNotOwned}
        disabled={selectedSize === 0}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
          selectedSize > 0
            ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 hover:bg-rose-200 dark:hover:bg-rose-900/60 shadow-card'
            : 'bg-ice-100 dark:bg-navy-600 text-navy-400 dark:text-ice-400 cursor-not-allowed'
        }`}
      >
        <PackageX className="w-4 h-4" />
        Mark selected not owned
      </button>
    </div>
  )
}
