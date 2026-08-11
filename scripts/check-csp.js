#!/usr/bin/env node
/**
 * Static check that the Firebase Hosting CSP headers in firebase.json do not
 * include unsafe inline sources or unnecessarily broad wildcards.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const firebaseConfig = JSON.parse(readFileSync(resolve(ROOT, 'firebase.json'), 'utf8'))

const headers = firebaseConfig?.hosting?.headers || []
const cspHeader = headers
  .flatMap((h) => h.headers)
  .find((h) => h?.key?.toLowerCase() === 'content-security-policy')

if (!cspHeader) {
  console.error('No Content-Security-Policy header found in firebase.json')
  process.exit(1)
}

const csp = cspHeader.value
const forbidden = ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "* "]
const errors = []

for (const token of forbidden) {
  if (csp.includes(token)) {
    errors.push(`CSP contains forbidden source: ${token}`)
  }
}

if (csp.includes('https:') && csp.includes('http:')) {
  errors.push('CSP mixes https: and http:')
}

if (errors.length) {
  errors.forEach((e) => console.error(e))
  process.exit(1)
}

console.log('CSP policy passes static security checks')
