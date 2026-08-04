import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const includeRules = !!process.env.FIRESTORE_EMULATOR_HOST

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: includeRules
      ? ['tests/**/*.test.{js,jsx}']
      : ['tests/**/!(firestore.rules.emulator).test.{js,jsx}'],
  },
})
