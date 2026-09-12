import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function EmptyState({ config }) {
  const navigate = useNavigate()
  const HeaderIcon = config.header.icon
  const EmptyIcon = config.empty.icon

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
        <HeaderIcon className={`w-7 h-7 ${config.header.iconClass}`} />
        {config.header.title}
      </h1>

      <div className="bg-white dark:bg-navy-700 rounded-2xl p-8 sm:p-12 shadow-card text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-ice-50 dark:bg-navy-600 flex items-center justify-center">
          <EmptyIcon className={`w-8 h-8 ${config.empty.iconClass}`} />
        </div>
        <h2 className="text-lg font-semibold text-navy-700 dark:text-white">{config.empty.heading}</h2>
        <p className="text-sm text-navy-400 dark:text-ice-300 max-w-md mx-auto">
          {config.empty.body}
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
