import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { onAuthStateChanged, signInWithPopup, signInAnonymously, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import rawCards from '../data/cards.json'

const STORAGE_KEY = 'glaceon-collection-v1'
const LAYOUT_KEY = 'glaceon-layout-v1'
const DEBOUNCE_MS = 1200
export const LAYOUT_OPTIONS = ['2x2', '3x3', '4x3', '4x4']

const CollectionContext = createContext(null)

export function CollectionProvider({ children }) {
  const cards = rawCards
  const [collection, setCollection] = useState({})
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('local') // 'local' | 'syncing' | 'synced' | 'error'
  const [layout, _setLayout] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) || '4x3'
    } catch {
      return '4x3'
    }
  })
  const dirtyRef = useRef(false)
  const timeoutRef = useRef(null)

  // Load from localStorage on mount (before auth resolves for speed)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setCollection(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load collection from localStorage', e)
    }
  }, [])

  // Watch auth and subscribe to Firestore doc when signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) {
      setSyncStatus('local')
      return
    }
    const ref = doc(db, 'users', user.uid, 'collection', 'state')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setCollection((prev) => {
          const merged = { ...prev, ...(data.cards || {}) }
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          } catch {}
          return merged
        })
      }
      setSyncStatus('synced')
    }, (err) => {
      console.error('Firestore subscription error', err)
      setSyncStatus('error')
    })
    return () => unsub()
  }, [user])

  // Persist to localStorage and Firestore (debounced)
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      // Always save locally
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(collection))
      } catch (e) {
        console.error('Failed to save collection to localStorage', e)
      }

      // Save to Firestore if signed in
      if (user) {
        setSyncStatus('syncing')
        const ref = doc(db, 'users', user.uid, 'collection', 'state')
        setDoc(ref, { cards: collection, updatedAt: new Date().toISOString() }, { merge: true })
          .then(() => setSyncStatus('synced'))
          .catch((err) => {
            console.error('Firestore save error', err)
            setSyncStatus('error')
          })
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [collection, user])

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
      return {
        ...prev,
        [cardId]: {
          ...existing,
          owned,
          ownedAt: owned ? new Date().toISOString() : existing.ownedAt,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }, [])

  const toggleWant = useCallback((cardId) => {
    setCollection((prev) => {
      const existing = prev[cardId] || {}
      return {
        ...prev,
        [cardId]: {
          ...existing,
          want: !existing.want,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }, [])

  const setNote = useCallback((cardId, note) => {
    updateCard(cardId, { note })
  }, [updateCard])

  const setGrade = useCallback((cardId, grade) => {
    updateCard(cardId, { grade })
  }, [updateCard])

  const setLayout = useCallback((newLayout) => {
    if (LAYOUT_OPTIONS.includes(newLayout)) {
      _setLayout(newLayout)
      try {
        localStorage.setItem(LAYOUT_KEY, newLayout)
      } catch (e) {
        console.error('Failed to save layout to localStorage', e)
      }
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Google sign-in error', err)
      alert('Sign-in failed. Please try again.')
    }
  }, [])

  const signInAsGuest = useCallback(async () => {
    try {
      await signInAnonymously(auth)
    } catch (err) {
      console.error('Anonymous sign-in error', err)
      alert('Guest sign-in failed. Please try again.')
    }
  }, [])

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error', err)
    }
  }, [])

  const exportJson = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cards: collection,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glaceon-collection-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [collection])

  const importJson = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const payload = JSON.parse(e.target.result)
          if (!payload || typeof payload.cards !== 'object') {
            throw new Error('Invalid backup file')
          }
          const merged = { ...collection, ...payload.cards }
          setCollection(merged)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          resolve(Object.keys(payload.cards).length)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }, [collection])

  const getCardState = useCallback((cardId) => {
    return collection[cardId] || { owned: false, want: false, note: '', grade: '' }
  }, [collection])

  const stats = {
    total: cards.length,
    owned: cards.filter((c) => (collection[c.id]?.owned)).length,
    wanted: cards.filter((c) => (collection[c.id]?.want)).length,
    remaining: cards.length - cards.filter((c) => (collection[c.id]?.owned)).length,
  }

  const value = {
    cards,
    collection,
    user,
    authLoading,
    syncStatus,
    stats,
    layout,
    setLayout,
    toggleOwned,
    toggleWant,
    setNote,
    setGrade,
    getCardState,
    signInWithGoogle,
    signInAsGuest,
    signOutUser,
    exportJson,
    importJson,
  }

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  )
}

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection must be used inside CollectionProvider')
  return ctx
}
