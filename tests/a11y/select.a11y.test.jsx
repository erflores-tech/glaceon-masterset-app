import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

describe('Select accessibility', () => {
  function Select({ label, value, options, onChange }) {
    const id = `filter-${label.toLowerCase()}`
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-xs font-medium">{label}</label>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-sm"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    )
  }

  it('has no detectable a11y violations', async () => {
    const { container } = render(
      <Select
        label="Set"
        value="All"
        options={['All', 'Set A', 'Set B']}
        onChange={() => {}}
      />
    )

    expect(screen.getByLabelText(/Set/)).toBeInTheDocument()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
