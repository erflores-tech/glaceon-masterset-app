import { describe, it, expect } from 'vitest'
import {
  validateBackupPayload,
  sanitizeCardState,
  computeImportPreview,
  createBackupPayload,
  isValidCardId,
  BACKUP_VERSION,
} from '../../src/lib/backup'

describe('backup validation', () => {
  const knownIds = new Set(['card-1', 'card-2', 'card-3'])

  it('accepts a valid backup', () => {
    const payload = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      cards: {
        'card-1': { owned: true, want: false, note: 'Bought on eBay', grade: 'NM' },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(result.ignored).toBe(0)
    expect(result.cards['card-1']).toEqual({
      owned: true,
      want: false,
      note: 'Bought on eBay',
      grade: 'NM',
    })
  })

  it('rejects wrong version', () => {
    expect(() =>
      validateBackupPayload({ version: 99, cards: {} }, knownIds)
    ).toThrow('Unsupported backup version')
  })

  it('rejects missing cards', () => {
    expect(() => validateBackupPayload({ version: BACKUP_VERSION }, knownIds)).toThrow(
      'missing or malformed "cards"'
    )
  })

  it('ignores unknown card IDs', () => {
    const payload = {
      version: BACKUP_VERSION,
      cards: {
        'card-1': { owned: true },
        'unknown-card': { owned: true },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(Object.keys(result.cards)).toEqual(['card-1'])
    expect(result.ignored).toBe(1)
  })

  it('ignores forbidden object keys', () => {
    const payload = {
      version: BACKUP_VERSION,
      cards: {
        __proto__: { owned: true },
        constructor: { owned: true },
        prototype: { owned: true },
        'card-1': { owned: true },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(Object.keys(result.cards)).toEqual(['card-1'])
    // __proto__ is not enumerable, so only constructor and prototype are counted
    expect(result.ignored).toBe(2)
  })

  it('sanitizes invalid state fields', () => {
    const state = sanitizeCardState({
      owned: true,
      want: 'yes',
      note: 'a'.repeat(6000),
      grade: 'INVALID',
      extraField: 'ignore',
    })
    expect(state.owned).toBe(true)
    expect(state.want).toBeUndefined()
    expect(state.note).toHaveLength(5000)
    expect(state.grade).toBeUndefined()
    expect(state.extraField).toBeUndefined()
  })

  it('computes import preview correctly', () => {
    const current = {
      'card-1': { owned: true },
      'card-2': { owned: false, want: true },
    }
    const imported = {
      'card-1': { owned: true },
      'card-2': { owned: true, want: true },
      'card-3': { owned: true },
    }
    const preview = computeImportPreview(current, imported)
    expect(preview.unchanged).toEqual(['card-1'])
    expect(preview.updated).toEqual(['card-2'])
    expect(preview.added).toEqual(['card-3'])
  })

  it('creates a valid backup payload', () => {
    const collection = { 'card-1': { owned: true } }
    const payload = createBackupPayload(collection)
    expect(payload.version).toBe(BACKUP_VERSION)
    expect(payload.exportedAt).toBeDefined()
    expect(payload.cards).toEqual(collection)
  })

  it('rejects forbidden card IDs', () => {
    expect(isValidCardId('__proto__')).toBe(false)
    expect(isValidCardId('constructor')).toBe(false)
    expect(isValidCardId('prototype')).toBe(false)
    expect(isValidCardId('')).toBe(false)
    expect(isValidCardId('card-1')).toBe(true)
  })
})
