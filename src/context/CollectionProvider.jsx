import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from 'firebase/auth'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import {
  createBackupPayload,
  validateBackupFile,
  validateBackupPayload,
  computeImportPreview,
  BACKUP_VERSION,
  MAX_BACKUP_SIZE_BYTES,
} from '../lib/backup'
import { mergeRemoteCollection, bumpVersion } from '../lib/sync'
import { LAYOUT_OPTIONS } from '../lib/layout'
import rawCards from '../data/cards.json'
import binderOrder from '../data/binder-order.json'

/**
 * @typedef {import('../lib/sync.js').CollectionMap} CollectionMap
 */

import { CollectionContext } from './CollectionContext.js'

const STORAGE_KEY = 'glaceon-collection-v1'
const LAYOUT_KEY = 'glaceon-layout-v1'
const SYNC_STATE_KEY = 'glaceon-sync-state-v1'
const MIGRATION_KEY = 'glaceon-migration-v1'
const DEBOUNCE_MS = 1200

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e)
    return false
  }
}

/**
 * Remove `undefined` values from a collection so Firestore never receives them.
 * @param {CollectionMap} collection
 * @returns {CollectionMap}
 */
function sanitizeCollectionForFirestore(collection) {
  const cleaned = {}
  for (const [cardId, state] of Object.entries(collection)) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      continue
    }
    const entry = {}
    for (const [key, value] of Object.entries(state)) {
      if (value !== undefined) {
        entry[key] = value
      }
    }
    cleaned[cardId] = entry
  }
  return cleaned
}

function getKnownCardIds(cards) {
  return new Set(cards.map((c) => c.id))
}

function migrateV1ToV2(collection) {
  let changed = false
  const migrated = {}
  for (const [cardId, state] of Object.entries(collection)) {
    if (state && state.want === true && !state.ordered) {
      changed = true
      const { want: _want, ...rest } = state
      migrated[cardId] = {
        ...rest,
        ordered: true,
        orderedAt: state.orderedAt || state.updatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    } else {
      migrated[cardId] = state
    }
  }
  return changed ? migrated : collection
}

export function CollectionProvider({ children }) {
  const cards = useMemo(() => {
    const order = new Map(binderOrder.map((cardId, index) => [cardId, index]))
    return [...rawCards].sort((a, b) => {
      const aOrder = order.get(a.id) ?? Number.POSITIVE_INFINITY
      const bOrder = order.get(b.id) ?? Number.POSITIVE_INFINITY
      return aOrder - bOrder || a.releaseOrder - b.releaseOrder
    })
  }, [])
  const cardIdsRef = useRef(getKnownCardIds(cards))

  const [collection, setCollection] = useState(() => {
    const saved = loadJson(STORAGE_KEY, {})
    const migrated = loadJson(MIGRATION_KEY, null) ? saved : migrateV1ToV2(saved)
    if (migrated !== saved) {
      saveJson(STORAGE_KEY, migrated)
    }
    saveJson(MIGRATION_KEY, { version: 2, migratedAt: new Date().toISOString() })
    return migrated
  })
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('local')
  const [lastError, setLastError] = useState(null)
  const [layout, _setLayout] = useState(() => {
    const saved = loadJson(LAYOUT_KEY, null)
    return LAYOUT_OPTIONS.includes(saved) ? saved : '4x3'
  })
  const [pendingRemoteVersion, setPendingRemoteVersion] = useState(null)

  const timeoutRef = useRef(null)
  const flushRef = useRef(null)
  const localVersionRef = useRef(
    loadJson(SYNC_STATE_KEY, { version: 0 }).version || 0
  )

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // Subscribe to Firestore doc when signed in; never let an older snapshot
  // overwrite newer local edits.
  useEffect(() => {
    if (!user) {
      setSyncStatus('local')
      setPendingRemoteVersion(null)
      return
    }

    setSyncStatus('syncing')
    const ref = doc(db, 'users', user.uid, 'collection', 'state')
    const unsub = onSnapshot(ref, (snap) => {
      setLastError(null)
      if (!snap.exists()) {
        setSyncStatus('synced')
        setPendingRemoteVersion(null)
        return
      }

      const data = snap.data()
      const remoteVersion = data.version || 0
      const remoteCards = data.cards || {}

      setCollection((prev) => {
        const localVersion = localVersionRef.current
        let merged
        try {
          const result = mergeRemoteCollection({
            localCollection: prev,
            localVersion,
            remoteCollection: remoteCards,
            remoteVersion,
          })
          merged = result.merged
          if (!result.changed) {
            return prev
          }
        } catch (err) {
          setLastError(err)
          setSyncStatus('error')
          return prev
        }

        saveJson(STORAGE_KEY, merged)
        return merged
      })

      // Advance the local version baseline so future local edits do not
      // overwrite a newer remote snapshot.
      localVersionRef.current = Math.max(localVersionRef.current, remoteVersion)
      saveJson(SYNC_STATE_KEY, { version: localVersionRef.current, updatedAt: new Date().toISOString() })

      setPendingRemoteVersion(remoteVersion)
      setSyncStatus('synced')
    }, (err) => {
      console.error('Firestore subscription error', err)
      setLastError(err)
      setSyncStatus('error')
    })

    return () => unsub()
  }, [user])

  // Persist to localStorage and Firestore (debounced)
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      saveJson(STORAGE_KEY, collection)

      if (user) {
        const version = bumpVersion(localVersionRef.current, pendingRemoteVersion)
        localVersionRef.current = version
        saveJson(SYNC_STATE_KEY, { version, updatedAt: new Date().toISOString() })

        const ref = doc(db, 'users', user.uid, 'collection', 'state')
        const cardsForFirestore = sanitizeCollectionForFirestore(collection)

        setDoc(
          ref,
          {
            cards: cardsForFirestore,
            version,
            updatedAt: serverTimestamp(),
          }
        )
          .then(() => {
            setSyncStatus('synced')
            setLastError(null)
            return undefined
          })
          .catch((err) => {
            console.error('Firestore save error', err)
            setLastError(err)
            setSyncStatus('error')
          })
      }
    }, DEBOUNCE_MS)

    flushRef.current = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [collection, user, pendingRemoteVersion])

  // Flush pending writes before unload
  useEffect(() => {
    const handler = () => {
      if (flushRef.current) flushRef.current()
      saveJson(STORAGE_KEY, collection)
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [collection])

  const updateCard = useCallback((cardId, patch) => {
    setCollection((prev) => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }))
  }, [])

  const toggleOwned = useCallback((cardId) => {
    setCollection((prev) => {
      const existing = prev[cardId] || {}
      const owned = !existing.owned
      const next = {
        ...existing,
        owned,
        ownedAt: owned ? new Date().toISOString() : existing.ownedAt,
        // Clear ordered state when the card arrives
        ordered: owned ? false : existing.ordered,
        updatedAt: new Date().toISOString(),
      }
      if (!owned) {
        next.purchaseLocation = existing.purchaseLocation
        next.orderedAt = existing.orderedAt
      }
      return {
        ...prev,
        [cardId]: next,
      }
    })
  }, [])

  const markManyOwned = useCallback((cardIds) => {
    const now = new Date().toISOString()
    setCollection((prev) => {
      const next = { ...prev }
      cardIds.forEach((cardId) => {
        const existing = prev[cardId] || {}
        next[cardId] = {
          ...existing,
          owned: true,
          ownedAt: existing.ownedAt || now,
          ordered: false,
          updatedAt: now,
        }
      })
      return next
    })
  }, [])

  const markManyNotOwned = useCallback((cardIds) => {
    const now = new Date().toISOString()
    setCollection((prev) => {
      const next = { ...prev }
      cardIds.forEach((cardId) => {
        const existing = prev[cardId] || {}
        next[cardId] = {
          ...existing,
          owned: false,
          ordered: false,
          orderedAt: existing.orderedAt,
          updatedAt: now,
        }
      })
      return next
    })
  }, [])

  const toggleOrdered = useCallback((cardId) => {
    setCollection((prev) => {
      const existing = prev[cardId] || {}
      const ordered = !existing.ordered
      const next = {
        ...existing,
        ordered,
        updatedAt: new Date().toISOString(),
      }
      if (ordered) {
        next.purchaseLocation = existing.purchaseLocation
        next.orderedAt = new Date().toISOString()
      }
      return {
        ...prev,
        [cardId]: next,
      }
    })
  }, [])

  const setPurchaseLocation = useCallback(
    (cardId, purchaseLocation) => updateCard(cardId, { purchaseLocation: purchaseLocation || '' }),
    [updateCard]
  )

  const setNote = useCallback(
    (cardId, note) => updateCard(cardId, { note: note || '' }),
    [updateCard]
  )

  const setGrade = useCallback(
    (cardId, grade) => updateCard(cardId, { grade: grade || '' }),
    [updateCard]
  )

  const setLayout = useCallback((newLayout) => {
    if (LAYOUT_OPTIONS.includes(newLayout)) {
      _setLayout(newLayout)
      saveJson(LAYOUT_KEY, newLayout)
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Google sign-in error', err)
      setLastError(err)
    }
  }, [])

  const signInAsGuest = useCallback(async () => {
    try {
      await signInAnonymously(auth)
    } catch (err) {
      console.error('Preview sign-in error', err)
      setLastError(err)
    }
  }, [])

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error', err)
      setLastError(err)
    }
  }, [])

  const exportJson = useCallback(() => {
    const payload = createBackupPayload(collection)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glaceon-collection-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [collection])

  const importJson = useCallback(
    async (file, options = {}) => {
      validateBackupFile(file)

      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Failed to read backup file'))
        reader.readAsText(file)
      })

      let payload
      try {
        payload = JSON.parse(text)
      } catch (parseErr) {
        throw new Error('Invalid backup: file is not valid JSON', { cause: parseErr })
      }

      const { cards: importedCards, ignored } = validateBackupPayload(
        payload,
        cardIdsRef.current
      )

      const preview = computeImportPreview(collection, importedCards)

      if (!options.dryRun) {
        const merged = { ...collection, ...importedCards }
        setCollection(merged)
        saveJson(STORAGE_KEY, merged)
      }

      return { imported: Object.keys(importedCards).length, ignored, preview }
    },
    [collection]
  )

  const acknowledgeError = useCallback(() => {
    setLastError(null)
  }, [])

  const getCardState = useCallback(
    (cardId) => collection[cardId] || { owned: false, ordered: false, note: '', grade: '', purchaseLocation: '' },
    [collection]
  )

  const stats = useMemo(() => {
    const owned = cards.filter((c) => collection[c.id]?.owned).length
    const ordered = cards.filter((c) => {
      const state = collection[c.id]
      return state?.ordered && !state?.owned
    }).length
    return {
      total: cards.length,
      owned,
      ordered,
      remaining: cards.length - owned,
      inTransit: ordered,
    }
  }, [cards, collection])

  const value = useMemo(
    () => ({
      cards,
      collection,
      user,
      authLoading,
      syncStatus,
      lastError,
      pendingRemoteVersion,
      stats,
      layout,
      setLayout,
      toggleOwned,
      markManyOwned,
      markManyNotOwned,
      toggleOrdered,
      setPurchaseLocation,
      setNote,
      setGrade,
      getCardState,
      signInWithGoogle,
      signInAsGuest,
      signOutUser,
      exportJson,
      importJson,
      acknowledgeError,
      BACKUP_VERSION,
      MAX_BACKUP_SIZE_BYTES,
    }),
    [
      cards,
      collection,
      user,
      authLoading,
      syncStatus,
      lastError,
      pendingRemoteVersion,
      stats,
      layout,
      setLayout,
      toggleOwned,
      markManyOwned,
      markManyNotOwned,
      toggleOrdered,
      setPurchaseLocation,
      setNote,
      setGrade,
      getCardState,
      signInWithGoogle,
      signInAsGuest,
      signOutUser,
      exportJson,
      importJson,
      acknowledgeError,
    ]
  )

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  )
}
