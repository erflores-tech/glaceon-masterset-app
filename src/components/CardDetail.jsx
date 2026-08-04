import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCollection } from '../context/CollectionContext'
import { useMemo } from 'react'
import { Check, Heart, ArrowLeft, StickyNote } from 'lucide-react'
import SmartImage from './SmartImage'

const GRADES = ['', 'NM', 'LP', 'MP', 'HP', 'PSA 10', 'PSA 9', 'PSA 8', 'CGC 10', 'BGS 9.5']

const LAYOUT_PAGE_SIZES = {
  '2x2': 4,
  '3x3': 9,
  '4x3': 12,
  '4x4': 16,
}

export default function CardDetail() {
  const { cardId } = useParams()
  const navigate = useNavigate()
  const { cards, toggleOwned, toggleWant, setNote, setGrade, getCardState, layout } = useCollection()

  const card = useMemo(() => cards.find((c) => c.id === cardId), [cards, cardId])
  const imageSources = card?.imageSources || []

  if (!card) {
    return (
      <div className="text-center py-20">
        <p className="text-navy-400 dark:text-ice-300">Card not found.</p>
        <Link to="/" className="text-glaceon hover:underline mt-2 inline-block">Back to list</Link>
      </div>
    )
  }

  const state = getCardState(card.id)
  const prevCard = cards[cards.findIndex((c) => c.id === cardId) - 1]
  const nextCard = cards[cards.findIndex((c) => c.id === cardId) + 1]

  const releaseOrder = card.releaseOrder || cards.findIndex((c) => c.id === cardId) + 1
  const pageSize = LAYOUT_PAGE_SIZES[layout] || 12
  const pageNum = Math.ceil(releaseOrder / pageSize)
  const slotNum = ((releaseOrder - 1) % pageSize) + 1

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-navy-500 dark:text-ice-300 hover:text-glaceon transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white dark:bg-navy-700 rounded-2xl p-4 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-full sm:w-56 flex-shrink-0">
            <div className="aspect-[2.5/3.5] rounded-xl overflow-hidden bg-ice-100 dark:bg-navy-600 shadow-card">
          <SmartImage
            card={card}
            sources={imageSources}
            detail={true}
            className="w-full h-full object-cover"
          />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-navy-700 dark:text-white">{card.pokemon}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge text={card.set} />
                <Badge text={card.language} />
                <Badge text={card.variant} />
                <Badge text={`#${card.cardNumber}`} />
                <Badge text={`Page ${pageNum}, Slot ${slotNum}`} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleOwned(card.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
                  state.owned
                    ? 'bg-glaceon text-navy-700'
                    : 'bg-ice-100 dark:bg-navy-600 text-navy-600 dark:text-ice-100 hover:bg-ice-200'
                }`}
              >
                <Check className="w-5 h-5" />
                {state.owned ? 'Owned' : 'Mark Owned'}
              </button>
              <button
                onClick={() => toggleWant(card.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
                  state.want
                    ? 'bg-rose-400 text-white'
                    : 'bg-ice-100 dark:bg-navy-600 text-navy-600 dark:text-ice-100 hover:bg-ice-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${state.want ? 'fill-current' : ''}`} />
                {state.want ? 'Wanted' : 'Want List'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-navy-400 dark:text-ice-300">Grade / Condition</label>
                <select
                  value={state.grade || ''}
                  onChange={(e) => setGrade(card.id, e.target.value)}
                  className="px-3 py-2 rounded-lg bg-ice-50 dark:bg-navy-600 border border-ice-200 dark:border-navy-500 focus:outline-none focus:ring-2 focus:ring-glaceon"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g || 'None'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-navy-400 dark:text-ice-300 flex items-center gap-1">
                <StickyNote className="w-3.5 h-3.5" /> Notes
              </label>
              <textarea
                value={state.note || ''}
                onChange={(e) => setNote(card.id, e.target.value)}
                rows={4}
                placeholder="Where you bought it, price, condition notes..."
                className="w-full px-3 py-2 rounded-lg bg-ice-50 dark:bg-navy-600 border border-ice-200 dark:border-navy-500 focus:outline-none focus:ring-2 focus:ring-glaceon resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        {prevCard ? (
          <Link
            to={`/card/${prevCard.id}`}
            className="px-4 py-2 rounded-xl bg-white dark:bg-navy-700 shadow-card text-sm font-medium hover:bg-ice-50 dark:hover:bg-navy-600"
          >
            ← {prevCard.pokemon}
          </Link>
        ) : (
          <span />
        )}
        {nextCard && (
          <Link
            to={`/card/${nextCard.id}`}
            className="px-4 py-2 rounded-xl bg-white dark:bg-navy-700 shadow-card text-sm font-medium hover:bg-ice-50 dark:hover:bg-navy-600"
          >
            {nextCard.pokemon} →
          </Link>
        )}
      </div>
    </div>
  )
}

function Badge({ text }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-ice-100 dark:bg-navy-600 text-xs font-medium text-navy-600 dark:text-ice-200">
      {text}
    </span>
  )
}
