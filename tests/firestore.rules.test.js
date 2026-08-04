import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ID = 'glaceon-master-set'
const RULES_PATH = resolve(__dirname, '..', 'firestore.rules')

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
    },
  })
})

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  await testEnv?.clearFirestore()
})

describe('Firestore security rules', () => {
  const alice = { uid: 'alice' }
  const bob = { uid: 'bob' }

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
    const ref = doc(db, 'users', 'alice', 'profile')
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
