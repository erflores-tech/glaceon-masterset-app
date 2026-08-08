import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CollectionContext } from '../../src/context/CollectionContext.js'
import Ordered from '../../src/pages/Ordered.jsx'

const mockCards = [
  { id: 'c1', releaseOrder: 1, cardNumber: '1', pokemon: 'Glaceon', set: 'Set A', variant: 'Standard', language: 'Japanese', imageSources: [] },
  { id: 'c2', releaseOrder: 2, cardNumber: '2', pokemon: 'Glaceon V', set: 'Set B', variant: 'Holo', language: 'English', imageSources: [] },
  { id: 'c3', releaseOrder: 3, cardNumber: '3', pokemon: 'Leafeon', set: 'Set C', variant: 'Reverse', language: 'Japanese', imageSources: [] },
  { id: 'c4', releaseOrder: 4, cardNumber: '4', pokemon: 'Glaceon VSTAR', set: 'Set D', variant: 'Jumbo', language: 'English', imageSources: [] },
]

function renderWithCtx({ collection = {}, toggleOwned = vi.fn(), markManyOwned = vi.fn() } = {}) {
  const value = {
    cards: mockCards,
    collection,
    stats: { inTransit: Object.values(collection).filter((s) => s?.ordered && !s?.owned).length },
    toggleOwned,
    markManyOwned,
  }
  return render(
    <MemoryRouter>
      <CollectionContext.Provider value={value}>
        <Ordered />
      </CollectionContext.Provider>
    </MemoryRouter>
  )
}

describe('Ordered page', () => {
  it('shows empty state when no ordered cards', () => {
    renderWithCtx({ collection: {} })
    expect(screen.getByText(/Nothing on the way/)).toBeInTheDocument()
    expect(screen.getByText(/Back/)).toBeInTheDocument()
  })

  it('lists ordered cards and hides owned cards', () => {
    const collection = {
      c1: { ordered: true, owned: false, orderedAt: '2026-01-01T00:00:00.000Z', purchaseLocation: 'eBay' },
      c2: { ordered: true, owned: true, orderedAt: '2026-01-02T00:00:00.000Z' },
      c3: { owned: true },
    }
    renderWithCtx({ collection })
    expect(screen.getAllByText('Glaceon').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Set A').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Glaceon V').length).toBe(0)
    expect(screen.getAllByText('eBay').length).toBeGreaterThan(0)
  })

  it('filters by language', () => {
    const collection = {
      c1: { ordered: true, owned: false, orderedAt: '2026-01-01T00:00:00.000Z' },
      c2: { ordered: true, owned: false, orderedAt: '2026-01-02T00:00:00.000Z' },
    }
    renderWithCtx({ collection })
    fireEvent.change(screen.getByLabelText(/Language/), { target: { value: 'English' } })
    expect(screen.queryAllByText('Glaceon').length).toBe(0)
    expect(screen.getAllByText('Glaceon V').length).toBeGreaterThan(0)
  })

  it('filters by purchase location', () => {
    const collection = {
      c1: { ordered: true, owned: false, purchaseLocation: 'eBay', orderedAt: '2026-01-01T00:00:00.000Z' },
      c2: { ordered: true, owned: false, purchaseLocation: 'TCGplayer', orderedAt: '2026-01-02T00:00:00.000Z' },
    }
    renderWithCtx({ collection })
    fireEvent.change(screen.getByLabelText(/Purchase Location/), { target: { value: 'TCGplayer' } })
    expect(screen.queryAllByText('Glaceon').length).toBe(0)
    expect(screen.getAllByText('Glaceon V').length).toBeGreaterThan(0)
  })

  it('calls toggleOwned when row action clicked', () => {
    const toggleOwned = vi.fn()
    const collection = {
      c1: { ordered: true, owned: false, orderedAt: '2026-01-01T00:00:00.000Z' },
    }
    renderWithCtx({ collection, toggleOwned })
    const buttons = screen.getAllByText(/Owned/)
    fireEvent.click(buttons[0])
    expect(toggleOwned).toHaveBeenCalledWith('c1')
  })

  it('bulk marks selected cards via markManyOwned', () => {
    const markManyOwned = vi.fn()
    const collection = {
      c1: { ordered: true, owned: false, orderedAt: '2026-01-01T00:00:00.000Z' },
      c2: { ordered: true, owned: false, orderedAt: '2026-01-02T00:00:00.000Z' },
    }
    renderWithCtx({ collection, markManyOwned })
    const [selectAll] = screen.getAllByLabelText(/Select all/)
    fireEvent.click(selectAll)
    fireEvent.click(screen.getByText(/Mark selected owned/))
    expect(markManyOwned).toHaveBeenCalledTimes(1)
    const calledWith = markManyOwned.mock.calls[0][0]
    expect(new Set(calledWith)).toEqual(new Set(['c1', 'c2']))
  })

  it('separates Jumbo cards into their own section at the end', () => {
    const collection = {
      c2: { ordered: true, owned: false, orderedAt: '2026-01-02T00:00:00.000Z' },
      c4: { ordered: true, owned: false, orderedAt: '2026-01-04T00:00:00.000Z', purchaseLocation: 'eBay' },
    }
    renderWithCtx({ collection })
    expect(screen.getByText(/Jumbo Cards/)).toBeInTheDocument()
    expect(screen.getAllByText(/Glaceon VSTAR/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/eBay/).length).toBeGreaterThan(0)
  })

  it('excludes Jumbo cards from select-all and bulk actions', () => {
    const markManyOwned = vi.fn()
    const collection = {
      c1: { ordered: true, owned: false, orderedAt: '2026-01-01T00:00:00.000Z' },
      c4: { ordered: true, owned: false, orderedAt: '2026-01-04T00:00:00.000Z' },
    }
    renderWithCtx({ collection, markManyOwned })
    const [selectAll] = screen.getAllByLabelText(/Select all/)
    fireEvent.click(selectAll)
    fireEvent.click(screen.getByText(/Mark selected owned/))
    const calledWith = markManyOwned.mock.calls[0][0]
    expect(calledWith).toEqual(['c1'])
  })
})
