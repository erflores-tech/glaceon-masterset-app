import { Link } from 'react-router-dom'
import { useCollection } from '../context/CollectionContext'
import { Check, Heart } from 'lucide-react'
import SmartImage from './SmartImage'

const DENSITY_TEXT = {
  '2x2': 'text-base',
  '3x3': 'text-sm',
  '4x3': 'text-xs',
  '4x4': 'text-xs',
}

export default function CardItem({ card, density = '4x3' }) {
  const { toggleOwned, toggleWant, getCardState } = useCollection()
  const state = getCardState(card.id)

  const imageSources = card.imageSources || []
  const isDense = density === '4x4' || density === '4x3'

  return (
    <div
      className={`group relative bg-white dark:bg-navy-700 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all ${
        state.owned ? 'ring-[3px] ring-glaceon ring-offset-1 ring-offset-ice-50 dark:ring-offset-navy-600' : ''
      }`}
    >
      <Link to={`/card/${card.id}`} className="block">
        <div className="aspect-[2.5/3.5] bg-ice-100 dark:bg-navy-600 relative overflow-hidden">
          <SmartImage
            card={card}
            sources={imageSources}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          {state.owned && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`flex items-center gap-2 rounded-full bg-glaceon text-white font-bold shadow-lg ring-2 ring-white/30 ${
                  isDense ? 'text-sm px-3 py-1.5' : 'text-base px-4 py-2'
                }`}
              >
                <Check className={isDense ? 'w-4 h-4' : 'w-5 h-5'} />
                Owned
              </div>
            </div>
          )}
          <div
            className={`absolute bottom-1.5 right-1.5 max-w-[85%] truncate rounded-full bg-white/90 dark:bg-navy-700/90 backdrop-blur-sm shadow text-navy-700 dark:text-ice-100 font-medium ${
              isDense ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
            }`}
            title={card.variant}
          >
            {card.variant}
          </div>
        </div>
      </Link>

      <div className={`${isDense ? 'p-1.5' : 'p-2.5'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={`font-semibold truncate text-navy-700 dark:text-white ${DENSITY_TEXT[density]}`} title={card.pokemon}>
              {card.pokemon}
            </div>
            <div className={`text-navy-400 dark:text-ice-300 truncate ${isDense ? 'text-[10px] leading-tight' : 'text-xs'}`}>
              {card.set} · {card.cardNumber}
            </div>
          </div>
          <div className={`flex flex-col gap-1 ${isDense ? 'hidden' : ''}`}>
            <button
              onClick={(e) => {
                e.preventDefault()
                toggleOwned(card.id)
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                state.owned
                  ? 'bg-glaceon text-navy-700'
                  : 'bg-ice-100 dark:bg-navy-600 text-navy-400 dark:text-ice-300 hover:bg-ice-200'
              }`}
              title={state.owned ? 'Mark not owned' : 'Mark owned'}
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                toggleWant(card.id)
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                state.want
                  ? 'bg-rose-400 text-white'
                  : 'bg-ice-100 dark:bg-navy-600 text-navy-400 dark:text-ice-300 hover:bg-ice-200'
              }`}
              title={state.want ? 'Remove from want list' : 'Add to want list'}
            >
              <Heart className={`w-4 h-4 ${state.want ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
