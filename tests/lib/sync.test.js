import { describe, it, expect } from 'vitest'
import { mergeRemoteCollection } from '../../src/lib/sync.js'

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
