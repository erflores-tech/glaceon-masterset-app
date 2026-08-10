import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CollectionContext } from '../../src/context/CollectionContext.js'
import Owned from '../../src/pages/Owned.jsx'

const mockCards = [
  { id: 'c1', releaseOrder: 1, cardNumber: '1', pokemon: 'Glaceon', set: 'Set A', variant: 'Standard', language: 'Japanese', imageSources: [] },
  { id: 'c2', releaseOrder: 2, cardNumber: '2', pokemon: 'Glaceon V', set: 'Set B', variant: 'Holo', language: 'English', imageSources: [] },
  { id: 'c3', releaseOrder: 3, cardNumber: '3', pokemon: 'Leafeon', set: 'Set C', variant: 'Reverse', language: 'Japanese', imageSources: [] },
  { id: 'c4', releaseOrder: 4, cardNumber: '4', pokemon: 'Glaceon VSTAR', set: 'Set D', variant: 'Jumbo', language: 'English', imageSources: [] },
]

function renderWithCtx({ collection = {}, toggleOwned = vi.fn(), markManyNotOwned = vi.fn() } = {}) {
  const value = {
    cards: mockCards,
    collection,
    stats: { owned: Object.values(collection).filter((s) => s?.owned).length },
    toggleOwned,
    markManyNotOwned,
  }
  return render(
    <MemoryRouter>
      <CollectionContext.Provider value={value}>
        <Owned />
      </CollectionContext.Provider>
    </MemoryRouter>
  )
}

describe('Owned page', () => {
  it('shows empty state when no owned cards', () => {
    renderWithCtx({ collection: {} })
    expect(screen.getByText(/Nothing owned yet/)).toBeInTheDocument()
    expect(screen.getByText(/Back/)).toBeInTheDocument()
  })

  it('lists owned cards and hides non-owned cards', () => {
    const collection = {
      c1: { owned: true, ownedAt: '2026-01-01T00:00:00.000Z', grade: 'NM' },
      c2: { owned: false },
      c3: { owned: true, ownedAt: '2026-01-03T00:00:00.000Z' },
    }
    renderWithCtx({ collection })
    expect(screen.getAllByText('Glaceon').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Set A').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Glaceon V').length).toBe(0)
    expect(screen.getAllByText('NM').length).toBeGreaterThan(0)
  })

  it('filters by language', () => {
    const collection = {
      c1: { owned: true, ownedAt: '2026-01-01T00:00:00.000Z' },
      c2: { owned: true, ownedAt: '2026-01-02T00:00:00.000Z' },
    }
    renderWithCtx({ collection })
    fireEvent.change(screen.getByLabelText(/Language/), { target: { value: 'English' } })
    expect(screen.queryAllByText('Glaceon').length).toBe(0)
    expect(screen.getAllByText('Glaceon V').length).toBeGreaterThan(0)
  })

  it('filters by grade', () => {
    const collection = {
      c1: { owned: true, ownedAt: '2026-01-01T00:00:00.000Z', grade: 'NM' },
      c2: { owned: true, ownedAt: '2026-01-02T00:00:00.000Z', grade: 'PSA 10' },
    }
    renderWithCtx({ collection })
    fireEvent.change(screen.getByLabelText(/Grade/), { target: { value: 'PSA 10' } })
    expect(screen.queryAllByText('Glaceon').length).toBe(0)
    expect(screen.getAllByText('Glaceon V').length).toBeGreaterThan(0)
  })

  it('calls toggleOwned when row action clicked', () => {
    const toggleOwned = vi.fn()
    const collection = {
      c1: { owned: true, ownedAt: '2026-01-01T00:00:00.000Z' },
    }
    renderWithCtx({ collection, toggleOwned })
    const buttons = screen.getAllByText(/Not Owned/)
    fireEvent.click(buttons[0])
    expect(toggleOwned).toHaveBeenCalledWith('c1')
  })

  it('bulk marks selected cards via markManyNotOwned', () => {
    const markManyNotOwned = vi.fn()
    const collection = {
      c1: { owned: true, ownedAt: '2026-01-01T00:00:00.000Z' },
      c2: { owned: true, ownedAt: '2026-01-02T00:00:00.000Z' },
    }
    renderWithCtx({ collection, markManyNotOwned })
    const [selectAll] = screen.getAllByLabelText(/Select all/)
    fireEvent.click(selectAll)
    fireEvent.click(screen.getByText(/Mark selected not owned/))
    expect(markManyNotOwned).toHaveBeenCalledTimes(1)
    const calledWith = markManyNotOwned.mock.calls[0][0]
    expect(new Set(calledWith)).toEqual(new Set(['c1', 'c2']))
  })

  it('separates Jumbo cards into their own section at the end', () => {
    const collection = {
      c2: { owned: true, ownedAt: '2026-01-02T00:00:00.000Z' },
      c4: { owned: true, ownedAt: '2026-01-04T00:00:00.000Z' },
    }
    renderWithCtx({ collection })
    expect(screen.getByText(/Jumbo Cards/)).toBeInTheDocument()
    expect(screen.getAllByText(/Glaceon VSTAR/).length).toBeGreaterThan(0)
  })

  it('excludes Jumbo cards from select-all and bulk actions', () => {
    const markManyNotOwned = vi.fn()
    const collection = {
      c1: { owned: true, ownedAt: '2026-01-01T00:00:00.000Z' },
      c4: { owned: true, ownedAt: '2026-01-04T00:00:00.000Z' },
    }
    renderWithCtx({ collection, markManyNotOwned })
    const [selectAll] = screen.getAllByLabelText(/Select all/)
    fireEvent.click(selectAll)
    fireEvent.click(screen.getByText(/Mark selected not owned/))
    const calledWith = markManyNotOwned.mock.calls[0][0]
    expect(calledWith).toEqual(['c1'])
  })
})
