import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ config, count }) {
  const navigate = useNavigate()
  const Icon = config.header.icon

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h1 className="text-2xl sm:text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
        <Icon className={`w-7 h-7 ${config.header.iconClass}`} />
        {config.header.title}
        <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${config.header.badgeClass}`}>
          {count}
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
  )
}
