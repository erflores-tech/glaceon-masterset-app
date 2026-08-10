import { memo } from 'react'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import SmartImage from '../../components/SmartImage'
import { formatDate } from './utils.js'

function MobileRow({ card, state, isSelected, onToggleRow, onMarkOwned }) {
  return (
    <div className={`p-3 ${isSelected ? 'bg-glaceon/10' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleRow(card.id)}
          aria-label={`Select ${card.pokemon}`}
          className="mt-1 w-5 h-5 rounded border-ice-300 text-glaceon focus:ring-glaceon dark:bg-navy-600 dark:border-navy-500"
        />
        <Link
          to={`/card/${card.id}`}
          className="w-16 h-[4.5rem] rounded-lg overflow-hidden bg-ice-100 dark:bg-navy-600 flex-shrink-0"
        >
          <SmartImage
            card={card}
            sources={card.imageSources || []}
            className="w-full h-full object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-navy-700 dark:text-white">
            <Link to={`/card/${card.id}`} className="hover:underline">
              {card.pokemon}
            </Link>
          </div>
          <div className="text-xs text-navy-400 dark:text-ice-300">
            {card.set} · {card.cardNumber}
          </div>
          <div className="text-xs text-navy-400 dark:text-ice-300 mt-1">
            {card.language} · {card.variant}
          </div>
          {state.purchaseLocation && (
            <div className="text-xs text-navy-500 dark:text-ice-300 mt-1">
              From {state.purchaseLocation}
            </div>
          )}
          <div className="text-xs text-navy-400 dark:text-ice-300 mt-1">
            Ordered {formatDate(state.orderedAt)}
          </div>
        </div>
        <button
          onClick={() => onMarkOwned(card.id)}
          className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-glaceon text-navy-700 hover:bg-ice-300 transition shadow-sm"
          title="Mark owned"
          aria-label={`Mark ${card.pokemon} owned`}
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

const MemoMobileRow = memo(MobileRow, (prev, next) => {
  return (
    prev.card.id === next.card.id &&
    prev.isSelected === next.isSelected &&
    prev.state.purchaseLocation === next.state.purchaseLocation &&
    prev.state.orderedAt === next.state.orderedAt &&
    prev.onToggleRow === next.onToggleRow &&
    prev.onMarkOwned === next.onMarkOwned
  )
})

export default function OrderedMobileList({ cards, collection, selected, onToggleRow, onMarkOwned }) {
  return (
    <div className="sm:hidden divide-y divide-ice-100 dark:divide-navy-600">
      {cards.map((card) => (
        <MemoMobileRow
          key={card.id}
          card={card}
          state={collection[card.id] || {}}
          isSelected={selected.has(card.id)}
          onToggleRow={onToggleRow}
          onMarkOwned={onMarkOwned}
        />
      ))}
    </div>
  )
}
