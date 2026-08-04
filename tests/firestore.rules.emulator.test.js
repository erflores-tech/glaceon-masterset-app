import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST
const PROJECT_ID = 'glaceon-master-set'
const RULES_PATH = resolve(import.meta.dirname, '..', 'firestore.rules')

if (!EMULATOR_HOST) {
  throw new Error(
    'Firestore rules tests require the emulator. ' +
      'Set FIRESTORE_EMULATOR_HOST or run `npm run test:emulator`.'
  )
}

const [host, port] = EMULATOR_HOST.split(':')
let testEnv
let assertSucceeds
let assertFails

describe('Firestore security rules', () => {
  const alice = { sub: 'alice' }
  const bob = { sub: 'bob' }

  beforeAll(async () => {
    const rules = readFileSync(RULES_PATH, 'utf8')
    const { initializeTestEnvironment, assertSucceeds: as, assertFails: af } = await import(
      '@firebase/rules-unit-testing'
    )
    assertSucceeds = as
    assertFails = af

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host,
        port: parseInt(port, 10),
        rules,
      },
    })
  })

  afterAll(async () => {
    await testEnv?.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  it('allows users to write their own collection state', async () => {
    const db = testEnv.authenticatedContext('alice', alice).firestore()
    const ref = doc(db, 'users', 'alice', 'collection', 'state')
    await assertSucceeds(
      setDoc(ref, { cards: { 'card-1': { owned: true } }, updatedAt: new Date() })
    )
  })

  it('allows users to read their own collection state', async () => {
    const aliceDb = testEnv.authenticatedContext('alice', alice).firestore()
    await setDoc(doc(aliceDb, 'users', 'alice', 'collection', 'state'), {
      cards: { 'card-1': { owned: true } },
    })

    const db = testEnv.authenticatedContext('alice', alice).firestore()
    const ref = doc(db, 'users', 'alice', 'collection', 'state')
    await assertSucceeds(getDoc(ref))
  })

  it('denies reading another user collection state', async () => {
    const aliceDb = testEnv.authenticatedContext('alice', alice).firestore()
    await setDoc(doc(aliceDb, 'users', 'alice', 'collection', 'state'), {
      cards: { 'card-1': { owned: true } },
    })

    const db = testEnv.authenticatedContext('bob', bob).firestore()
    const ref = doc(db, 'users', 'alice', 'collection', 'state')
    await assertFails(getDoc(ref))
  })

  it('denies writing another user collection state', async () => {
    const db = testEnv.authenticatedContext('bob', bob).firestore()
    const ref = doc(db, 'users', 'alice', 'collection', 'state')
    await assertFails(
      setDoc(ref, { cards: { 'card-1': { owned: true } } })
    )
  })

  it('denies unauthenticated access', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    const ref = doc(db, 'users', 'alice', 'collection', 'state')
    await assertFails(getDoc(ref))
    await assertFails(setDoc(ref, { cards: {} }))
  })

  it('denies writing outside the expected document path', async () => {
    const db = testEnv.authenticatedContext('alice', alice).firestore()
    const ref = doc(db, 'users', 'alice', 'collection', 'other')
    await assertFails(setDoc(ref, { name: 'Alice' }))
  })

  it('denies deleting the collection state', async () => {
    const db = testEnv.authenticatedContext('alice', alice).firestore()
    const ref = doc(db, 'users', 'alice', 'collection', 'state')
    await assertFails(deleteDoc(ref))
  })

  it('allows updating own collection state', async () => {
    const db = testEnv.authenticatedContext('alice', alice).firestore()
    const ref = doc(db, 'users', 'alice', 'collection', 'state')
    await setDoc(ref, { cards: { 'card-1': { owned: false } } })
    await assertSucceeds(updateDoc(ref, { 'cards.card-1.owned': true }))
  })
})
