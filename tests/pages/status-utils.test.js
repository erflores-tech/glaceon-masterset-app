import { describe, it, expect } from 'vitest'
import { sortCards } from '../../src/pages/status/utils.js'
import { ownedConfig } from '../../src/pages/status/configs.js'

const cards = [
  { id: 'c1', releaseOrder: 1, pokemon: 'Glaceon', set: 'Set A', cardNumber: '1', language: 'English', variant: 'Standard' },
  { id: 'c2', releaseOrder: 2, pokemon: 'Glaceon V', set: 'Set B', cardNumber: '2', language: 'English', variant: 'Holo' },
  { id: 'c3', releaseOrder: 3, pokemon: 'Glaceon VMAX', set: 'Set C', cardNumber: '3', language: 'English', variant: 'Reverse' },
]

const collection = {
  c1: { owned: true, grade: 'PSA 10' },
  c2: { owned: true, grade: 'LP' },
  c3: { owned: true, grade: 'NM' },
}

describe('sortCards', () => {
  it('sorts by grade from collection state, not card fields', () => {
    const gradeIndex = ownedConfig.sortOptions.findIndex((o) => o.key === 'grade')
    const sorted = sortCards({
      cards,
      sortOptions: ownedConfig.sortOptions,
      sortIndex: gradeIndex,
      collection,
      allCards: cards,
      dateField: 'ownedAt',
    })
    expect(sorted.map((c) => c.id)).toEqual(['c2', 'c3', 'c1'])
  })

  it('sorts ungraded cards first when ascending', () => {
    const gradeIndex = ownedConfig.sortOptions.findIndex((o) => o.key === 'grade')
    const sorted = sortCards({
      cards,
      sortOptions: ownedConfig.sortOptions,
      sortIndex: gradeIndex,
      collection: { c1: { grade: 'NM' } },
      allCards: cards,
      dateField: 'ownedAt',
    })
    expect(sorted.map((c) => c.id)).toEqual(['c2', 'c3', 'c1'])
  })
})
