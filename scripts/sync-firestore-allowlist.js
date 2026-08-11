/**
 * Synchronizes the allowed card-ID allowlist in firestore.rules with the
 * current src/data/cards.json catalog.
 *
 * Run this script whenever the card catalog changes:
 *   node scripts/sync-firestore-allowlist.js
 *
 * It replaces the contents of the `cards.keys().hasOnly(...)` array in
 * firestore.rules with the up-to-date list of card IDs.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const CARDS_PATH = resolve(ROOT, 'src/data/cards.json')
const RULES_PATH = resolve(ROOT, 'firestore.rules')

const cards = JSON.parse(readFileSync(CARDS_PATH, 'utf8'))
const ids = cards.map((card) => card.id)

if (!ids.length) {
  throw new Error('No card IDs found in catalog')
}

if (new Set(ids).size !== ids.length) {
  throw new Error('Duplicate card IDs detected in catalog')
}

const idsPerLine = 5
let arrayBody = ''
for (let i = 0; i < ids.length; i += idsPerLine) {
  const chunk = ids.slice(i, i + idsPerLine)
  const line = chunk.map((id) => `'${id}'`).join(',')
  const terminator = i + idsPerLine >= ids.length ? '' : ','
  const indent = i === 0 ? '' : '            '
  arrayBody += `${indent}${line}${terminator}\n`
}

const hasOnlyPattern = /cards\.keys\(\)\.hasOnly\(\s*\[[\s\S]*?\]\s*\)/

let rules = readFileSync(RULES_PATH, 'utf8')
const replacement = `cards.keys().hasOnly(\n          [\n${arrayBody}          ]\n        )`

if (!hasOnlyPattern.test(rules)) {
  throw new Error('Could not locate cards.keys().hasOnly(...) block in firestore.rules')
}

rules = rules.replace(hasOnlyPattern, replacement)
writeFileSync(RULES_PATH, rules, 'utf8')

// Also keep the JS test helper in sync.
const TEST_HELPER_PATH = resolve(ROOT, 'tests/data/allowed-card-ids.js')
const helperContent = `export const ALLOWED_CARD_IDS = [\n${ids.map((id) => `  '${id}'`).join(',\n')}\n]\n`
writeFileSync(TEST_HELPER_PATH, helperContent, 'utf8')

console.log(`Updated firestore.rules allowlist with ${ids.length} card IDs`)
