import { useContext } from 'react'
import { CollectionContext } from '../context/CollectionContext.js'

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection must be used inside CollectionProvider')
  return ctx
}
