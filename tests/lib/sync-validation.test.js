import { describe, it, expect } from 'vitest'
import { mergeRemoteCollection, bumpVersion } from '../../src/lib/sync.js'

describe('mergeRemoteCollection validation', () => {
  it('rejects non-numeric localVersion', () => {
    expect(() =>
      mergeRemoteCollection({
        localCollection: {},
        localVersion: '1',
        remoteCollection: {},
        remoteVersion: 1,
      })
    ).toThrow('Invalid sync version')
  })

  it('rejects non-numeric remoteVersion', () => {
    expect(() =>
      mergeRemoteCollection({
        localCollection: {},
        localVersion: 1,
        remoteCollection: {},
        remoteVersion: null,
      })
    ).toThrow('Invalid sync version')
  })

  it('ignores invalid remote state entries', () => {
    const { merged, changed } = mergeRemoteCollection({
      localCollection: {},
      localVersion: 1,
      remoteCollection: { c1: null, c2: 'bad', c3: [], c4: { owned: true } },
      remoteVersion: 2,
    })
    expect(merged).toEqual({ c4: { owned: true } })
    expect(changed).toBe(true)
  })

  it('treats missing local updatedAt as always losing', () => {
    const { merged } = mergeRemoteCollection({
      localCollection: { c1: { owned: true } },
      localVersion: 1,
      remoteCollection: { c1: { owned: false, updatedAt: '2026-01-01T00:00:00.000Z' } },
      remoteVersion: 1,
    })
    expect(merged.c1.owned).toBe(false)
  })

  it('ignores malformed timestamps and falls back to version comparison', () => {
    const { merged } = mergeRemoteCollection({
      localCollection: { c1: { owned: true, updatedAt: 'not-a-date' } },
      localVersion: 1,
      remoteCollection: { c1: { owned: false, updatedAt: 'also-bad' } },
      remoteVersion: 2,
    })
    expect(merged.c1.owned).toBe(false)
  })
})

describe('bumpVersion', () => {
  it('advances past both local and remote versions', () => {
    expect(bumpVersion(3, 5)).toBe(6)
    expect(bumpVersion(7, 2)).toBe(8)
  })

  it('handles zero and null safely', () => {
    expect(bumpVersion(0, 0)).toBe(1)
    expect(bumpVersion(null, null)).toBe(1)
    expect(bumpVersion(null, 4)).toBe(5)
  })

  it('throws on overflow', () => {
    expect(() => bumpVersion(Number.MAX_SAFE_INTEGER, 0)).toThrow('Sync version overflow')
  })
})
