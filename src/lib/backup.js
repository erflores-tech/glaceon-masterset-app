export const BACKUP_VERSION = 1
export const MAX_BACKUP_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_NOTE_LENGTH = 5000
export const MAX_ENTRIES = 10000

const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype']
const VALID_GRADES = new Set(['', 'NM', 'LP', 'MP', 'HP', 'PSA 10', 'PSA 9', 'PSA 8', 'CGC 10', 'BGS 9.5'])

export function isValidCardId(cardId) {
  return typeof cardId === 'string' && cardId.length > 0 && cardId.length <= 128 && !FORBIDDEN_KEYS.includes(cardId)
}

export function sanitizeCardState(state) {
  if (!state || typeof state !== 'object') return null
  const sanitized = {}

  if (typeof state.owned === 'boolean') sanitized.owned = state.owned
  if (typeof state.want === 'boolean') sanitized.want = state.want

  if (state.note !== undefined) {
    const note = String(state.note).slice(0, MAX_NOTE_LENGTH)
    if (note) sanitized.note = note
  }

  if (state.grade !== undefined) {
    const grade = String(state.grade)
    if (VALID_GRADES.has(grade)) sanitized.grade = grade
  }

  if (state.ownedAt !== undefined && typeof state.ownedAt === 'string') {
    sanitized.ownedAt = state.ownedAt.slice(0, 64)
  }

  if (state.updatedAt !== undefined && typeof state.updatedAt === 'string') {
    sanitized.updatedAt = state.updatedAt.slice(0, 64)
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

  if (payload.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${payload.version}. Expected ${BACKUP_VERSION}.`)
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

    const sanitized = sanitizeCardState(payload.cards[cardId])
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
      current.want !== state.want ||
      current.note !== state.note ||
      current.grade !== state.grade
    ) {
      updated.push(cardId)
    } else {
      unchanged.push(cardId)
    }
  }

  return { added, updated, unchanged }
}
