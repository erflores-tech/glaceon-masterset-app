import * as React from 'react'
import { Link } from 'react-router-dom'
import { Check, Maximize } from 'lucide-react'
import SmartImage from '../../components/SmartImage'
import { formatDate } from './utils.js'

export default function JumboSection({ cards, collection, onMarkOwned }) {
  if (cards.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-navy-700 dark:text-white flex items-center gap-2">
        <Maximize className="w-5 h-5 text-amber-400" />
        Jumbo Cards
        <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200">
          {cards.length}
        </span>
      </h2>

      <div className="bg-white dark:bg-navy-700 rounded-2xl shadow-card border border-ice-200 dark:border-navy-500 overflow-hidden divide-y divide-ice-100 dark:divide-navy-600">
        {cards.map((card) => {
          const state = collection[card.id] || {}
          return (
            <div key={card.id} className="p-3 sm:p-4">
              <div className="flex items-start gap-4">
                <Link
                  to={`/card/${card.id}`}
                  className="w-24 h-32 sm:w-28 sm:h-36 rounded-lg overflow-hidden bg-ice-100 dark:bg-navy-600 flex-shrink-0"
                >
                  <SmartImage
                    card={card}
                    sources={card.imageSources || []}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold text-navy-700 dark:text-white text-lg">
                    <Link to={`/card/${card.id}`} className="hover:underline">
                      {card.pokemon}
                    </Link>
                  </div>
                  <div className="text-sm text-navy-400 dark:text-ice-300">
                    {card.set} · {card.cardNumber}
                  </div>
                  <div className="text-sm text-navy-400 dark:text-ice-300">
                    {card.language} · {card.variant}
                  </div>
                  {state.purchaseLocation && (
                    <div className="text-sm text-navy-500 dark:text-ice-300">
                      From {state.purchaseLocation}
                    </div>
                  )}
                  <div className="text-sm text-navy-400 dark:text-ice-300">
                    Ordered {formatDate(state.orderedAt)}
                  </div>
                </div>
                <button
                  onClick={() => onMarkOwned(card.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-glaceon text-navy-700 text-sm font-semibold hover:bg-ice-300 transition shadow-sm"
                  aria-label={`Mark ${card.pokemon} owned`}
                >
                  <Check className="w-4 h-4" />
                  Owned
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
