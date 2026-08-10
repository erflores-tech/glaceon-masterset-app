import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CircleX, ArrowLeft } from 'lucide-react'

export default function EmptyState() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        Owned Cards
      </h1>

      <div className="bg-white dark:bg-navy-700 rounded-2xl p-8 sm:p-12 shadow-card text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-ice-50 dark:bg-navy-600 flex items-center justify-center">
          <CircleX className="w-8 h-8 text-rose-300" />
        </div>
        <h2 className="text-lg font-semibold text-navy-700 dark:text-white">Nothing owned yet</h2>
        <p className="text-sm text-navy-400 dark:text-ice-300 max-w-md mx-auto">
          You have not marked any cards as owned. Head back to the card list and tap the checkmark on cards you already have.
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
