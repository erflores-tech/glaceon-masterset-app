import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { CollectionProvider } from '../../src/context/CollectionProvider.jsx'
import Dashboard from '../../src/components/Dashboard.jsx'
import { axe } from 'vitest-axe'

describe('Dashboard accessibility', () => {
  it('has no detectable a11y violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <CollectionProvider>
          <Dashboard />
        </CollectionProvider>
      </BrowserRouter>
    )

    await screen.findByText('Collection Dashboard')
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
