export const BACKUP_VERSION = 2
export const MAX_BACKUP_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_NOTE_LENGTH = 5000
export const MAX_LOCATION_LENGTH = 80
export const MAX_ENTRIES = 10000

const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype']
const VALID_GRADES = new Set(['', 'NM', 'LP', 'MP', 'HP', 'PSA 10', 'PSA 9', 'PSA 8', 'CGC 10', 'BGS 9.5'])

export function isValidCardId(cardId) {
  return typeof cardId === 'string' && cardId.length > 0 && cardId.length <= 128 && !FORBIDDEN_KEYS.includes(cardId)
}

export function sanitizeCardState(state, sourceVersion = BACKUP_VERSION) {
  if (!state || typeof state !== 'object') return null
  const sanitized = {}

  // Legacy v1 migration: want becomes ordered, unless the card is already owned
  let ordered = state.ordered
  if (sourceVersion < 2 && state.want === true && state.owned !== true) {
    ordered = true
  }

  if (typeof ordered === 'boolean') sanitized.ordered = ordered
  if (typeof state.owned === 'boolean') sanitized.owned = state.owned

  if (state.note !== undefined) {
    const note = String(state.note).slice(0, MAX_NOTE_LENGTH)
    if (note) sanitized.note = note
  }

  if (state.grade !== undefined) {
    const grade = String(state.grade)
    if (VALID_GRADES.has(grade)) sanitized.grade = grade
  }

  if (state.purchaseLocation !== undefined) {
    const location = String(state.purchaseLocation).slice(0, MAX_LOCATION_LENGTH)
    if (location) sanitized.purchaseLocation = location
  }

  const now = new Date().toISOString()
  if (state.orderedAt !== undefined && typeof state.orderedAt === 'string') {
    sanitized.orderedAt = state.orderedAt.slice(0, 64)
  } else if (ordered && sourceVersion < 2) {
    sanitized.orderedAt = now
  }

  if (state.ownedAt !== undefined && typeof state.ownedAt === 'string') {
    sanitized.ownedAt = state.ownedAt.slice(0, 64)
  }

  if (state.updatedAt !== undefined && typeof state.updatedAt === 'string') {
    sanitized.updatedAt = state.updatedAt.slice(0, 64)
  } else if (sourceVersion < 2 && ordered) {
    sanitized.updatedAt = now
  }

  return sanitized
}

export function validateBackupFile(file) {
  if (!file || typeof file !== 'object') {
    throw new Error('Invalid backup file: expected object')
  }

  if (file.size && file.size > MAX_BACKUP_SIZE_BYTES) {
    throw new Error(`Backup file too large: ${file.size} bytes exceeds ${MAX_BACKUP_SIZE_BYTES} bytes`)
  }
}

export function validateBackupPayload(payload, knownCardIds) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backup: expected JSON object')
  }

  if (![1, 2].includes(payload.version)) {
    throw new Error(`Unsupported backup version: ${payload.version}. Expected 1 or 2.`)
  }

  if (!payload.cards || typeof payload.cards !== 'object' || Array.isArray(payload.cards)) {
    throw new Error('Invalid backup: missing or malformed "cards" object')
  }

  const entries = Object.keys(payload.cards)
  if (entries.length > MAX_ENTRIES) {
    throw new Error(`Backup contains too many entries: ${entries.length}. Maximum is ${MAX_ENTRIES}.`)
  }

  const result = {}
  let ignored = 0

  for (const cardId of entries) {
    if (!isValidCardId(cardId)) {
      ignored++
      continue
    }

    if (knownCardIds && !knownCardIds.has(cardId)) {
      ignored++
      continue
    }

    const sanitized = sanitizeCardState(payload.cards[cardId], payload.version)
    if (sanitized) {
      result[cardId] = sanitized
    } else {
      ignored++
    }
  }

  return { cards: result, ignored }
}

export function createBackupPayload(collection) {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    cards: collection,
  }
}

export function computeImportPreview(currentCollection, importedCards) {
  const added = []
  const updated = []
  const unchanged = []

  for (const [cardId, state] of Object.entries(importedCards)) {
    const current = currentCollection[cardId]
    if (!current) {
      added.push(cardId)
    } else if (
      current.owned !== state.owned ||
      current.ordered !== state.ordered ||
      current.note !== state.note ||
      current.grade !== state.grade ||
      current.purchaseLocation !== state.purchaseLocation
    ) {
      updated.push(cardId)
    } else {
      unchanged.push(cardId)
    }
  }

  return { added, updated, unchanged }
}
