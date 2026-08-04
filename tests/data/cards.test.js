import { describe, it, expect } from 'vitest'
import cards from '../../src/data/cards.json'
import { readdirSync } from 'fs'
import { resolve } from 'path'

describe('cards.json data integrity', () => {
  const webpFiles = new Set(readdirSync(resolve(__dirname, '..', '..', 'public', 'cards')))

  it('has 149 cards', () => {
    expect(cards).toHaveLength(149)
  })

  it('uses bundled WebP as the primary image source for every card', () => {
    for (const card of cards) {
      expect(card.imageSources, `${card.id} is missing imageSources`).toBeDefined()
      expect(card.imageSources.length, `${card.id} has no imageSources`).toBeGreaterThan(0)
      const primary = card.imageSources[0]
      expect(primary, `${card.id} primary source`).toMatch(/^\/cards\/.+\.webp$/)

      const fileName = primary.replace('/cards/', '')
      expect(webpFiles.has(fileName), `${card.id} missing ${fileName}`).toBe(true)
    }
  })

  it('keeps a CDN fallback after the bundled source', () => {
    for (const card of cards) {
      const fallback = card.imageSources.slice(1)
      const hasHttps = fallback.some((url) => url.startsWith('https://'))
      expect(hasHttps, `${card.id} has no https fallback`).toBe(true)
    }
  })

  it('has unique card IDs', () => {
    const ids = cards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
