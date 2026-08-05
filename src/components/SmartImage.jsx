import * as React from 'react'
import { useState, useEffect } from 'react'
import { ImageOff } from 'lucide-react'

export default function SmartImage({ card, sources, className, detail = false }) {
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  const url = sources?.[index] || null

  useEffect(() => {
    setIndex(0)
    setFailed(false)
  }, [card?.id])

  if (failed || !url) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${className || ''}`}>
        {detail && <ImageOff className="w-10 h-10 text-navy-300 mb-3" />}
        <div className={`font-bold text-navy-700 dark:text-ice-200 ${detail ? 'text-lg' : 'text-sm'}`}>{card?.pokemon}</div>
        <div className={`text-navy-400 dark:text-ice-300 ${detail ? 'text-sm' : 'text-xs'}`}>{card?.set}</div>
        <div className={`font-semibold text-glaceon mt-1 ${detail ? 'text-base' : 'text-xs'}`}>#{card?.cardNumber}</div>
        {!detail && (
          <div className="text-xs text-navy-400 dark:text-ice-300 mt-1">
            {card?.language} · {card?.variant}
          </div>
        )}
      </div>
    )
  }

  return (
    <img
      key={url}
      src={url}
      alt={`${card?.pokemon} ${card?.cardNumber}`}
      loading="lazy"
      onError={() => {
        if (index + 1 < (sources?.length || 0)) {
          setIndex(index + 1)
        } else {
          setFailed(true)
        }
      }}
      className={className}
    />
  )
}
