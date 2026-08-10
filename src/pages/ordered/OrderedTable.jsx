import { memo } from 'react'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import SmartImage from '../../components/SmartImage'
import { formatDate } from './utils.js'

function TableRow({ card, state, isSelected, onToggleRow, onMarkOwned }) {
  return (
    <tr className={isSelected ? 'bg-glaceon/10' : ''}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleRow(card.id)}
          aria-label={`Select ${card.pokemon}`}
          className="w-5 h-5 rounded border-ice-300 text-glaceon focus:ring-glaceon dark:bg-navy-600 dark:border-navy-500"
        />
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/card/${card.id}`}
          className="flex items-center gap-3 group"
          aria-label={`View ${card.pokemon} details`}
        >
          <div className="w-12 h-16 rounded-lg overflow-hidden bg-ice-100 dark:bg-navy-600 flex-shrink-0">
            <SmartImage
              card={card}
              sources={card.imageSources || []}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-semibold text-navy-700 dark:text-white group-hover:underline">
              {card.pokemon}
            </div>
            <div className="text-xs text-navy-400 dark:text-ice-300">{card.cardNumber}</div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-navy-700 dark:text-ice-100">{card.set}</td>
      <td className="px-4 py-3 text-sm text-navy-700 dark:text-ice-100">{card.language}</td>
      <td className="px-4 py-3 text-sm text-navy-700 dark:text-ice-100">{card.variant}</td>
      <td className="px-4 py-3 text-sm text-navy-700 dark:text-ice-100">
        {state.purchaseLocation || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-navy-500 dark:text-ice-300">
        {formatDate(state.orderedAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onMarkOwned(card.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-glaceon text-navy-700 text-sm font-semibold hover:bg-ice-300 transition shadow-sm"
        >
          <Check className="w-4 h-4" />
          Owned
        </button>
      </td>
    </tr>
  )
}

const MemoTableRow = memo(TableRow, (prev, next) => {
  return (
    prev.card.id === next.card.id &&
    prev.isSelected === next.isSelected &&
    prev.state.purchaseLocation === next.state.purchaseLocation &&
    prev.state.orderedAt === next.state.orderedAt &&
    prev.onToggleRow === next.onToggleRow &&
    prev.onMarkOwned === next.onMarkOwned
  )
})

export default function OrderedTable({ cards, collection, selected, onToggleRow, onMarkOwned }) {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-ice-50 dark:bg-navy-600">
          <tr>
            <th className="w-10 px-4 py-3">
              <span className="sr-only" id="select-all-label">Select all cards</span>
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">Card</th>
            <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">Set</th>
            <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">Language</th>
            <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">Variant</th>
            <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">Purchase Location</th>
            <th className="px-4 py-3 text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">Ordered</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 dark:text-ice-300 uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ice-100 dark:divide-navy-600">
          {cards.map((card) => (
            <MemoTableRow
              key={card.id}
              card={card}
              state={collection[card.id] || {}}
              isSelected={selected.has(card.id)}
              onToggleRow={onToggleRow}
              onMarkOwned={onMarkOwned}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
