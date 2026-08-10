import * as React from 'react'

export default function Select({ id, label, value, options, onChange }) {
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
