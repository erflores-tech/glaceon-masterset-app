import '@testing-library/jest-dom' // eslint-disable-line import/no-unassigned-import
import { expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'
import { configureAxe } from 'vitest-axe'

configureAxe({
  globalOptions: {
    rules: [
      {
        id: 'color-contrast',
        enabled: false,
      },
    ],
  },
})

expect.extend(matchers)
