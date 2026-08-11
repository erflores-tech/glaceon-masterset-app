import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ALLOWED_CARD_IDS } from '../data/allowed-card-ids.js'

const RULES = readFileSync(
  resolve(import.meta.dirname, '..', '..', 'firestore.rules'),
  'utf8'
)

describe('firestore.rules static validation', () => {
  it('contains all current card IDs in the allowlist', () => {
    for (const id of ALLOWED_CARD_IDS) {
      expect(RULES).toContain(`'${id}'`)
    }
  })

  it('does not contain duplicate card IDs', () => {
    const matches = [...RULES.matchAll(/'([a-f0-9]{12})'/g)].map((m) => m[1])
    expect(new Set(matches).size).toBe(matches.length)
  })

  it('enforces schema-only top-level fields', () => {
    expect(RULES).toContain("data.keys().hasOnly(['cards', 'version', 'updatedAt'])")
    expect(RULES).toContain('allow delete: if false')
  })

  it('requires authentication and ownership', () => {
    expect(RULES).toContain('request.auth != null')
    expect(RULES).toContain('request.auth.uid == userId')
  })

  it('limits card count to catalog size', () => {
    expect(RULES).toContain(`cards.keys().size() <= ${ALLOWED_CARD_IDS.length}`)
  })

  it('validates grade and timestamp fields', () => {
    expect(RULES).toContain('isValidGrade')
    expect(RULES).toContain('isValidTimestamp')
    expect(RULES).toContain('isValidCardState')
  })
})
