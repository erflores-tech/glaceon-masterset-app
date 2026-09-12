import '@testing-library/jest-dom' // eslint-disable-line import/no-unassigned-import
import { expect, vi } from 'vitest'
import * as matchers from 'vitest-axe/matchers'
import { configureAxe } from 'vitest-axe'

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  signInWithPopup: vi.fn(() => Promise.resolve({})),
  signInAnonymously: vi.fn(() => Promise.resolve({})),
  signOut: vi.fn(() => Promise.resolve()),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  enableIndexedDbPersistence: vi.fn(() => Promise.resolve()),
  doc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(() => () => {}),
  serverTimestamp: vi.fn(),
}))

vi.mock('firebase/analytics', () => ({
  isSupported: vi.fn(() => Promise.resolve(false)),
  getAnalytics: vi.fn(),
}))

configureAxe({
  globalOptions: {
    rules: [
      {
        id: 'color-contrast',
        enabled: false,
      },
    ],
  },
})

expect.extend(matchers)
