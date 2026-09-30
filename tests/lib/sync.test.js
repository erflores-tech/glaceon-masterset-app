import { describe, it, expect } from 'vitest'
import { mergeRemoteCollection, applyCardUpdates } from '../../src/lib/sync.js'

describe('mergeRemoteCollection', () => {
  it('keeps local state when remote version is older', () => {
    const localCollection = { c1: { owned: true, updatedAt: '2026-01-02T00:00:00.000Z' } }
    const { merged, changed } = mergeRemoteCollection({
      localCollection,
      localVersion: 5,
      remoteCollection: { c1: { owned: false, updatedAt: '2026-01-01T00:00:00.000Z' } },
      remoteVersion: 3,
    })
    expect(merged).toEqual(localCollection)
    expect(changed).toBe(false)
  })

  it('accepts remote state for a new local card', () => {
    const { merged, changed } = mergeRemoteCollection({
      localCollection: {},
      localVersion: 1,
      remoteCollection: { c1: { owned: true, updatedAt: '2026-01-01T00:00:00.000Z' } },
      remoteVersion: 2,
    })
    expect(merged.c1.owned).toBe(true)
    expect(changed).toBe(true)
  })

  it('prefers remote when remote timestamp is newer', () => {
    const { merged, changed } = mergeRemoteCollection({
      localCollection: { c1: { owned: false, updatedAt: '2026-01-01T00:00:00.000Z' } },
      localVersion: 1,
      remoteCollection: { c1: { owned: true, updatedAt: '2026-01-02T00:00:00.000Z' } },
      remoteVersion: 2,
    })
    expect(merged.c1.owned).toBe(true)
    expect(changed).toBe(true)
  })

  it('prefers local when local timestamp is newer and versions are equal', () => {
    const { merged, changed } = mergeRemoteCollection({
      localCollection: { c1: { owned: true, updatedAt: '2026-01-02T00:00:00.000Z' } },
      localVersion: 2,
      remoteCollection: { c1: { owned: false, updatedAt: '2026-01-01T00:00:00.000Z' } },
      remoteVersion: 2,
    })
    expect(merged.c1.owned).toBe(true)
    expect(changed).toBe(false)
  })

  it('lets strictly newer remote version override even with older timestamp', () => {
    const { merged, changed } = mergeRemoteCollection({
      localCollection: { c1: { owned: true, updatedAt: '2026-01-02T00:00:00.000Z' } },
      localVersion: 2,
      remoteCollection: { c1: { owned: false, updatedAt: '2026-01-01T00:00:00.000Z' } },
      remoteVersion: 3,
    })
    expect(merged.c1.owned).toBe(false)
    expect(changed).toBe(true)
  })

  it('keeps local-only cards not present in remote', () => {
    const { merged, changed } = mergeRemoteCollection({
      localCollection: { c1: { owned: true, updatedAt: '2026-01-02T00:00:00.000Z' } },
      localVersion: 1,
      remoteCollection: {},
      remoteVersion: 2,
    })
    expect(merged.c1.owned).toBe(true)
    expect(changed).toBe(false)
  })

  it('handles cards without updatedAt gracefully', () => {
    const { merged, changed } = mergeRemoteCollection({
      localCollection: { c1: { owned: false } },
      localVersion: 1,
      remoteCollection: { c1: { owned: true } },
      remoteVersion: 2,
    })
    expect(merged.c1.owned).toBe(true)
    expect(changed).toBe(true)
  })

  it('does not mutate the input localCollection', () => {
    const localCollection = { c1: { owned: false, updatedAt: '2026-01-01T00:00:00.000Z' } }
    const { merged } = mergeRemoteCollection({
      localCollection,
      localVersion: 1,
      remoteCollection: { c1: { owned: true, updatedAt: '2026-01-02T00:00:00.000Z' } },
      remoteVersion: 2,
    })
    expect(merged).not.toBe(localCollection)
    expect(localCollection.c1.owned).toBe(false)
  })
})

describe('applyCardUpdates', () => {
  it('applies updates to existing cards', () => {
    const remote = { c1: { owned: false, note: 'test', updatedAt: '2026-01-01T00:00:00.000Z' } }
    const updates = { c1: { owned: true, updatedAt: '2026-01-02T00:00:00.000Z' } }
    const result = applyCardUpdates(remote, updates)
    expect(result.c1.owned).toBe(true)
    expect(result.c1.note).toBe('test')
    expect(result.c1.updatedAt).toBe('2026-01-02T00:00:00.000Z')
  })

  it('adds new cards not present in remote', () => {
    const result = applyCardUpdates({}, { c1: { owned: true, updatedAt: '2026-01-01T00:00:00.000Z' } })
    expect(result.c1.owned).toBe(true)
  })

  it('handles multiple card updates', () => {
    const remote = { c1: { owned: false }, c2: { owned: false } }
    const updates = {
      c1: { owned: true, updatedAt: '2026-01-01T00:00:00.000Z' },
      c2: { ordered: true, updatedAt: '2026-01-01T00:00:00.000Z' },
    }
    const result = applyCardUpdates(remote, updates)
    expect(result.c1.owned).toBe(true)
    expect(result.c2.ordered).toBe(true)
    expect(result.c2.owned).toBe(false)
  })

  it('skips invalid update entries', () => {
    const remote = { c1: { owned: false } }
    const updates = { c1: null, c2: [1, 2], c3: { owned: true } }
    const result = applyCardUpdates(remote, updates)
    expect(result.c1.owned).toBe(false)
    expect(result.c2).toBeUndefined()
    expect(result.c3.owned).toBe(true)
  })

  it('does not mutate the remote cards', () => {
    const remote = { c1: { owned: false, note: 'original' } }
    const updates = { c1: { owned: true } }
    const result = applyCardUpdates(remote, updates)
    expect(result).not.toBe(remote)
    expect(remote.c1.owned).toBe(false)
    expect(result.c1.owned).toBe(true)
  })

  it('preserves remote fields not in the update', () => {
    const remote = { c1: { owned: false, note: 'keep me', grade: 'NM' } }
    const updates = { c1: { owned: true, updatedAt: '2026-01-01T00:00:00.000Z' } }
    const result = applyCardUpdates(remote, updates)
    expect(result.c1.note).toBe('keep me')
    expect(result.c1.grade).toBe('NM')
    expect(result.c1.owned).toBe(true)
  })
})
