import { useContext } from 'react'
import { CollectionContext } from '../context/CollectionContext.js'

/**
 * React hook that returns the collection context value.
 *
 * @throws {Error} if used outside of a CollectionProvider.
 * @returns {import('../context/CollectionContext.js').CollectionContextValue}
 */
export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection must be used inside CollectionProvider')
  return ctx
}
