import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CollectionContext } from '../../src/context/CollectionContext.js'
import CardList from '../../src/components/CardList.jsx'

const mockCards = [
  { id: 'c1', releaseOrder: 1, cardNumber: '070/DP-P', pokemon: 'Glaceon', set: 'Diamond & Pearl Promos', variant: 'Standard', language: 'Japanese', imageSources: [] },
  { id: 'c2', releaseOrder: 2, cardNumber: 'DP4', pokemon: 'Glaceon LV.X', set: 'Dawn Dash', variant: 'Holo', language: 'Japanese', imageSources: [] },
  { id: 'c3', releaseOrder: 3, cardNumber: '024090', pokemon: 'Leafeon', set: 'Set C', variant: 'Reverse', language: 'English', imageSources: [] },
]

function renderWithCtx({ collection = {}, layout = '4x3' } = {}) {
  const value = {
    cards: mockCards,
    collection,
    layout,
    stats: { total: mockCards.length, owned: 0, inTransit: 0, remaining: mockCards.length },
    toggleOwned: vi.fn(),
    toggleOrdered: vi.fn(),
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

describe('CardList search', () => {
  it('shows all cards by default', () => {
    renderWithCtx()
    expect(screen.getAllByText(/Glaceon/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Leafeon/).length).toBeGreaterThan(0)
  })

  it('filters by pokemon name', () => {
    renderWithCtx()
    const input = screen.getByPlaceholderText(/Search cards, sets, numbers/)
    fireEvent.change(input, { target: { value: 'Leafeon' } })
    expect(screen.queryAllByText(/Glaceon/).length).toBe(0)
    expect(screen.getAllByText(/Leafeon/).length).toBeGreaterThan(0)
  })

  it('filters by card number', () => {
    renderWithCtx()
    const input = screen.getByPlaceholderText(/Search cards, sets, numbers/)
    fireEvent.change(input, { target: { value: 'DP4' } })
    expect(screen.queryAllByText(/Leafeon/).length).toBe(0)
    expect(screen.getAllByText(/Glaceon LV.X/).length).toBeGreaterThan(0)
  })

  it('filters by set name', () => {
    renderWithCtx()
    const input = screen.getByPlaceholderText(/Search cards, sets, numbers/)
    fireEvent.change(input, { target: { value: 'Dawn Dash' } })
    expect(screen.queryAllByText(/Leafeon/).length).toBe(0)
    expect(screen.getAllByText(/Glaceon LV.X/).length).toBeGreaterThan(0)
  })

  it('shows empty state when search has no matches', () => {
    renderWithCtx()
    const input = screen.getByPlaceholderText(/Search cards, sets, numbers/)
    fireEvent.change(input, { target: { value: 'Pikachu' } })
    expect(screen.getByText(/No cards match your filters/)).toBeInTheDocument()
  })

  it('clears search and restores all cards', () => {
    renderWithCtx()
    const input = screen.getByPlaceholderText(/Search cards, sets, numbers/)
    fireEvent.change(input, { target: { value: 'Leafeon' } })
    expect(screen.queryAllByText(/Glaceon/).length).toBe(0)

    const clear = screen.getByLabelText(/Clear search/)
    fireEvent.click(clear)
    expect(screen.getAllByText(/Glaceon/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Leafeon/).length).toBeGreaterThan(0)
  })
})
