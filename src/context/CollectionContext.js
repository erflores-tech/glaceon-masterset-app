import { createContext } from 'react'

/**
 * @typedef {import('../lib/sync.js').CardState} CardState
 * @typedef {import('../lib/sync.js').CollectionMap} CollectionMap
 */

/**
 * @typedef {Object} CollectionContextValue
 * @property {Array<import('../data/cards.json').Card>} cards
 * @property {CollectionMap} collection
 * @property {import('firebase/auth').User | null} user
 * @property {boolean} authLoading
 * @property {'local' | 'syncing' | 'synced' | 'error'} syncStatus
 * @property {Error | null} lastError
 * @property {number | null} pendingRemoteVersion
 * @property {Stats} stats
 * @property {string} layout
 * @property {(layout: string) => void} setLayout
 * @property {(cardId: string) => void} toggleOwned
 * @property {(cardIds: string[]) => void} markManyOwned
 * @property {(cardIds: string[]) => void} markManyNotOwned
 * @property {(cardId: string) => void} toggleOrdered
 * @property {(cardId: string, location: string) => void} setPurchaseLocation
 * @property {(cardId: string, note: string) => void} setNote
 * @property {(cardId: string, grade: string) => void} setGrade
 * @property {(cardId: string) => CardState} getCardState
 * @property {() => Promise<void>} signInWithGoogle
 * @property {() => Promise<void>} signInAsGuest
 * @property {() => Promise<void>} signOutUser
 * @property {() => void} exportJson
 * @property {(file: File, options?: { dryRun?: boolean }) => Promise<ImportResult>} importJson
 * @property {() => void} acknowledgeError
 * @property {number} BACKUP_VERSION
 * @property {number} MAX_BACKUP_SIZE_BYTES
 */

export const CollectionContext = createContext(null)
