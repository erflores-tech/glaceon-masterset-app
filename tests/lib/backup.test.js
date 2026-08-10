import { describe, it, expect } from 'vitest'
import {
  validateBackupPayload,
  validateBackupFile,
  sanitizeCardState,
  computeImportPreview,
  createBackupPayload,
  isValidCardId,
  BACKUP_VERSION,
  MAX_LOCATION_LENGTH,
  MAX_BACKUP_SIZE_BYTES,
  MAX_ENTRIES,
} from '../../src/lib/backup'

describe('backup validation', () => {
  const knownIds = new Set(['card-1', 'card-2', 'card-3'])

  it('accepts a valid v2 backup', () => {
    const payload = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      cards: {
        'card-1': { owned: true, ordered: false, purchaseLocation: 'Local shop', note: 'Bought on eBay', grade: 'NM' },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(result.ignored).toBe(0)
    expect(result.cards['card-1']).toEqual({
      owned: true,
      ordered: false,
      purchaseLocation: 'Local shop',
      note: 'Bought on eBay',
      grade: 'NM',
    })
  })

  it('migrates v1 want to v2 ordered', () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cards: {
        'card-1': { owned: false, want: true },
        'card-2': { owned: true, want: true },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(result.cards['card-1']).toEqual({
      owned: false,
      ordered: true,
      orderedAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(result.cards['card-2']).toEqual({
      owned: true,
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
      ordered: 'yes',
      note: 'a'.repeat(6000),
      grade: 'INVALID',
      purchaseLocation: 'a'.repeat(120),
      extraField: 'ignore',
    })
    expect(state.owned).toBe(true)
    expect(state.ordered).toBeUndefined()
    expect(state.note).toHaveLength(5000)
    expect(state.grade).toBeUndefined()
    expect(state.purchaseLocation).toHaveLength(MAX_LOCATION_LENGTH)
    expect(state.extraField).toBeUndefined()
  })

  it('strips want from v2 backups', () => {
    const state = sanitizeCardState({
      owned: false,
      want: true,
      ordered: true,
    }, 2)
    expect(state.want).toBeUndefined()
    expect(state.ordered).toBe(true)
  })

  it('computes import preview correctly', () => {
    const current = {
      'card-1': { owned: true },
      'card-2': { owned: false, ordered: true },
    }
    const imported = {
      'card-1': { owned: true },
      'card-2': { owned: true, ordered: true },
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

  it('sanitizes script-injection-like notes and locations', () => {
    const payload = {
      version: BACKUP_VERSION,
      cards: {
        'card-1': {
          owned: true,
          note: "<script>alert('xss)</script>",
          purchaseLocation: "eBay<script>alert('loc')</script>",
        },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(result.cards['card-1'].note).toBe("<script>alert('xss)</script>")
    expect(result.cards['card-1'].purchaseLocation).toBe("eBay<script>alert('loc')</script>")
  })

  it('ignores prototype pollution style card entries', () => {
    const payload = JSON.parse(
      '{"version":2,"cards":{"__proto__":{"polluted":true},"card-1":{"owned":true}}}'
    )
    const result = validateBackupPayload(payload, knownIds)
    expect(Object.prototype.hasOwnProperty.call(result.cards, '__proto__')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(result.cards, 'polluted')).toBe(false)
    expect(result.cards['card-1']).toBeDefined()
  })

  it('throws when cards exceeds maximum entries', () => {
    const cards = {}
    for (let i = 0; i < MAX_ENTRIES + 1; i++) {
      cards[`card-${i}`] = { owned: true }
    }
    expect(() =>
      validateBackupPayload({ version: BACKUP_VERSION, cards }, knownIds)
    ).toThrow('too many entries')
  })

  it('throws when backup file exceeds size limit', () => {
    const file = { size: MAX_BACKUP_SIZE_BYTES + 1 }
    expect(() => validateBackupFile(file)).toThrow('too large')
  })

  it('returns null for completely invalid card state', () => {
    expect(sanitizeCardState(null)).toBeNull()
    expect(sanitizeCardState('not an object')).toBeNull()
    expect(sanitizeCardState({ ordered: 'maybe' })).toEqual({})
  })

  it('preserves exportedAt and ownedAt timestamps', () => {
    const ts = '2023-08-01T12:00:00.000Z'
    const payload = {
      version: BACKUP_VERSION,
      exportedAt: ts,
      cards: {
        'card-1': { owned: true, ownedAt: ts, updatedAt: ts },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(result.cards['card-1'].ownedAt).toBe(ts)
    expect(result.cards['card-1'].updatedAt).toBe(ts)
  })

  it('does not migrate want when card is already owned in v1', () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cards: {
        'card-1': { owned: true, want: true },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(result.cards['card-1']).toEqual({
      owned: true,
    })
  })

  it('leaves v2 ordered without orderedAt as-is', () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      cards: {
        'card-1': { owned: false, ordered: true },
      },
    }
    const result = validateBackupPayload(payload, knownIds)
    expect(result.cards['card-1'].orderedAt).toBeUndefined()
    expect(result.cards['card-1'].updatedAt).toBeUndefined()
  })
})
