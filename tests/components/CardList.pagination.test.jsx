import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CollectionContext } from '../../src/context/CollectionContext.js'
import CardList from '../../src/components/CardList.jsx'
import CardDetail from '../../src/components/CardDetail.jsx'

function makeCard(id, number, name, setName, variant = 'Standard', language = 'Japanese') {
  return { id, releaseOrder: Number(id.slice(1)), cardNumber: number, pokemon: name, set: setName, variant, language, imageSources: [] }
}

function renderCardList({ cards, layout = '2x2', collection = {} } = {}) {
  const value = {
    cards,
    collection,
    layout,
    stats: { total: cards.length, owned: 0, inTransit: 0, remaining: cards.length },
    toggleOwned: vi.fn(),
    toggleOrdered: vi.fn(),
    setPurchaseLocation: vi.fn(),
    setNote: vi.fn(),
    setGrade: vi.fn(),
    getCardState: (cardId) => collection[cardId] || { owned: false, ordered: false, note: '', grade: '', purchaseLocation: '' },
  }
  return render(
    <MemoryRouter>
      <CollectionContext.Provider value={value}>
        <CardList />
      </CollectionContext.Provider>
    </MemoryRouter>
  )
}

function renderCardListWithDetail({ cards, layout = '2x2', collection = {}, initialEntries = ['/'] } = {}) {
  const value = {
    cards,
    collection,
    layout,
    stats: { total: cards.length, owned: 0, inTransit: 0, remaining: cards.length },
    toggleOwned: vi.fn(),
    toggleOrdered: vi.fn(),
    setPurchaseLocation: vi.fn(),
    setNote: vi.fn(),
    setGrade: vi.fn(),
    getCardState: (cardId) => collection[cardId] || { owned: false, ordered: false, note: '', grade: '', purchaseLocation: '' },
  }
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <CollectionContext.Provider value={value}>
        <Routes>
          <Route path="/" element={<CardList />} />
          <Route path="/card/:cardId" element={<CardDetail />} />
        </Routes>
      </CollectionContext.Provider>
    </MemoryRouter>
  )
}

describe('CardList pagination persistence', () => {
  it('updates URL when navigating to a different page', () => {
    const cards = Array.from({ length: 8 }, (_, i) => makeCard(`c${i + 1}`, `0${i + 1}`, `Pokemon ${i + 1}`, 'Set A'))
    const { container } = renderCardList({ cards, layout: '2x2' })

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/Next page/))

    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument()
    // Page 2 cards should be rendered (page size 2x2 = 4, so card c5 is first on page 2).
    expect(container.querySelector('a[href="/card/c5"]')).toBeInTheDocument()
  })

  it('restores page from URL on initial render', () => {
    const cards = Array.from({ length: 12 }, (_, i) => makeCard(`c${i + 1}`, `0${i + 1}`, `Pokemon ${i + 1}`, 'Set A'))
    render(
      <MemoryRouter initialEntries={['/?page=3']}>
        <CollectionContext.Provider
          value={{
            cards,
            collection: {},
            layout: '2x2',
            stats: { total: cards.length, owned: 0, inTransit: 0, remaining: cards.length },
            toggleOwned: vi.fn(),
            toggleOrdered: vi.fn(),
            getCardState: () => ({ owned: false, ordered: false, note: '', grade: '', purchaseLocation: '' }),
          }}
        >
          <CardList />
        </CollectionContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText(/Page 3 of 3/)).toBeInTheDocument()
  })

  it('clamps out-of-range page values to totalPages', () => {
    const cards = Array.from({ length: 4 }, (_, i) => makeCard(`c${i + 1}`, `0${i + 1}`, `Pokemon ${i + 1}`, 'Set A'))
    render(
      <MemoryRouter initialEntries={['/?page=99']}>
        <CollectionContext.Provider
          value={{
            cards,
            collection: {},
            layout: '2x2',
            stats: { total: cards.length, owned: 0, inTransit: 0, remaining: cards.length },
            toggleOwned: vi.fn(),
            toggleOrdered: vi.fn(),
            getCardState: () => ({ owned: false, ordered: false, note: '', grade: '', purchaseLocation: '' }),
          }}
        >
          <CardList />
        </CollectionContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument()
  })

  it('resets page to 1 when a filter changes', () => {
    const cards = [
      ...Array.from({ length: 6 }, (_, i) => makeCard(`a${i + 1}`, `0${i + 1}`, `Alpha ${i + 1}`, 'Set A')),
      ...Array.from({ length: 6 }, (_, i) => makeCard(`b${i + 1}`, `1${i + 1}`, `Beta ${i + 1}`, 'Set B')),
    ]
    renderCardList({ cards, layout: '2x2' })

    // Go to page 2
    fireEvent.click(screen.getByLabelText(/Next page/))
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument()

    // Open filters and apply set filter
    fireEvent.click(screen.getByLabelText(/Toggle filters/))
    const setFilter = screen.getByLabelText(/Set/)
    fireEvent.change(setFilter, { target: { value: 'Set B' } })

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
    const url = new URL(window.location.href)
    expect(url.searchParams.get('page')).toBeNull()
  })
})

describe('CardList back navigation', () => {
  it('returns to the previous page after viewing a card detail', () => {
    const cards = Array.from({ length: 8 }, (_, i) => makeCard(`c${i + 1}`, `0${i + 1}`, `Pokemon ${i + 1}`, 'Set A'))
    renderCardListWithDetail({ cards, layout: '2x2', initialEntries: ['/'] })

    // Navigate to page 2
    fireEvent.click(screen.getByLabelText(/Next page/))
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument()

    // Click a card on page 2
    fireEvent.click(screen.getByRole('link', { name: /Pokemon 5/ }))

    // Detail view should be shown
    expect(screen.getByRole('heading', { name: /Pokemon 5/ })).toBeInTheDocument()

    // Use the detail back button (browser back)
    fireEvent.click(screen.getByLabelText(/Back to card list/))

    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument()
  })
})
