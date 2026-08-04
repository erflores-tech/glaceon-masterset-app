import { useMemo } from 'react'

const MAX_LOCATIONS = 10

export function useRecentLocations(collection) {
  return useMemo(() => {
    const locations = []
    for (const state of Object.values(collection || {})) {
      if (state?.purchaseLocation) {
        const loc = state.purchaseLocation.trim()
        if (loc && !locations.includes(loc)) {
          locations.push(loc)
        }
      }
    }
    return locations.slice(0, MAX_LOCATIONS)
  }, [collection])
}
