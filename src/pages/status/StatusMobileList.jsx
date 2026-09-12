import { memo } from 'react'
import * as React from 'react'
import { Link } from 'react-router-dom'
import SmartImage from '../../components/SmartImage'
import { formatDate } from './utils.js'

function MobileRow({ card, state, isSelected, onToggleRow, onRowAction, config }) {
  const ActionIcon = config.rowAction.icon
  const chipValue = state[config.chip.key]
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
          {chipValue && (
            <div className="text-xs text-navy-500 dark:text-ice-300 mt-1">
              {config.chip.text(chipValue)}
            </div>
          )}
          <div className="text-xs text-navy-400 dark:text-ice-300 mt-1">
            {config.dateLabel} {formatDate(state[config.dateField])}
          </div>
        </div>
        <button
          onClick={() => onRowAction(card.id)}
          className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition shadow-sm ${config.actionClass}`}
          title={config.rowAction.mobileTitle}
          aria-label={config.rowAction.getAriaLabel(card)}
        >
          <ActionIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

const MemoMobileRow = memo(MobileRow, (prev, next) => {
  return (
    prev.card.id === next.card.id &&
    prev.isSelected === next.isSelected &&
    prev.state[prev.config.chip.key] === next.state[next.config.chip.key] &&
    prev.state[prev.config.dateField] === next.state[next.config.dateField] &&
    prev.onToggleRow === next.onToggleRow &&
    prev.onRowAction === next.onRowAction &&
    prev.config === next.config
  )
})

export default function StatusMobileList({ cards, collection, selected, onToggleRow, onRowAction, config }) {
  return (
    <div className="sm:hidden divide-y divide-ice-100 dark:divide-navy-600">
      {cards.map((card) => (
        <MemoMobileRow
          key={card.id}
          card={card}
          state={collection[card.id] || {}}
          isSelected={selected.has(card.id)}
          onToggleRow={onToggleRow}
          onRowAction={onRowAction}
          config={config}
        />
      ))}
    </div>
  )
}
