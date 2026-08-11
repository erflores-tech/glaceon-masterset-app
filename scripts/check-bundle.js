#!/usr/bin/env node
/**
 * Verifies that the production bundle does not exceed configured limits.
 * Defaults: 500 kB for the main JS chunk, 100 kB for CSS.
 */

import { readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = resolve(ROOT, 'dist')
const JS_LIMIT_KB = Number(process.env.GLACEON_JS_LIMIT_KB || 500)
const CSS_LIMIT_KB = Number(process.env.GLACEON_CSS_LIMIT_KB || 100)

function sizeKB(file) {
  return statSync(file).size / 1024
}

const files = readdirSync(DIST)
const jsFiles = files.filter((f) => f.endsWith('.js') && f.startsWith('assets/'))
const cssFiles = files.filter((f) => f.endsWith('.css') && f.startsWith('assets/'))

let exit = 0

for (const file of jsFiles) {
  const kb = sizeKB(resolve(DIST, file))
  if (kb > JS_LIMIT_KB) {
    console.error(`JS chunk exceeds limit: ${file} (${kb.toFixed(2)} kB > ${JS_LIMIT_KB} kB)`)
    exit = 1
  }
}

for (const file of cssFiles) {
  const kb = sizeKB(resolve(DIST, file))
  if (kb > CSS_LIMIT_KB) {
    console.error(`CSS chunk exceeds limit: ${file} (${kb.toFixed(2)} kB > ${CSS_LIMIT_KB} kB)`)
    exit = 1
  }
}

if (exit === 0) {
  console.log(`Bundle within limits: JS ≤ ${JS_LIMIT_KB} kB, CSS ≤ ${CSS_LIMIT_KB} kB`)
}

process.exit(exit)
