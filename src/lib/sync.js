/**
 * @typedef {Object} CardState
 * @property {boolean} [owned]
 * @property {boolean} [ordered]
 * @property {string} [note]
 * @property {string} [grade]
 * @property {string} [purchaseLocation]
 * @property {string} [orderedAt]
 * @property {string} [ownedAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object.<string, CardState>} CollectionMap
 */

/**
 * Merge a remote Firestore collection snapshot into the local collection.
 *
 * Merge contract:
 * - The local collection always wins if the local sync version is newer than
 *   the remote sync version. This prevents an older snapshot from overwriting
 *   recent local edits.
 * - When the remote version is equal or newer, remote entries win by default.
 * - A local-only entry is preserved if it has a more recent `updatedAt` than
 *   the remote state it would replace, unless the remote version is strictly
 *   newer. This guards against a stale remote document clobbering data that
 *   was created or edited while offline.
 *
 * @param {Object} params
 * @param {CollectionMap} params.localCollection - Current local collection state.
 * @param {number} params.localVersion - Current local sync version.
 * @param {CollectionMap} params.remoteCollection - `cards` field from the Firestore doc.
 * @param {number} params.remoteVersion - `version` field from the Firestore doc.
 * @returns {{ merged: CollectionMap, changed: boolean }} The merged collection and
 *   whether any field changed.
 */

const MAX_VERSION = Number.MAX_SAFE_INTEGER

function isPositiveInteger(n) {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && Number.isInteger(n)
}

function parseTimestamp(ts) {
  if (typeof ts !== 'string' || ts.length === 0) return null
  const parsed = Date.parse(ts)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Validate a collection entry. Rejects arrays, null, or non-object values.
 * @param {unknown} state
 * @returns {state is CardState}
 */
function isValidEntry(state) {
  return state !== null && typeof state === 'object' && !Array.isArray(state)
}

export function mergeRemoteCollection({
  localCollection,
  localVersion,
  remoteCollection,
  remoteVersion,
}) {
  if (!isPositiveInteger(localVersion) || !isPositiveInteger(remoteVersion)) {
    throw new Error(
      `Invalid sync version(s): local=${localVersion}, remote=${remoteVersion}`
    )
  }

  if (remoteVersion < localVersion) {
    return { merged: localCollection, changed: false }
  }

  const merged = { ...localCollection }
  let changed = false

  for (const [cardId, remoteState] of Object.entries(remoteCollection)) {
    if (!isValidEntry(remoteState)) {
      continue
    }

    const localState = merged[cardId]
    if (!localState) {
      merged[cardId] = remoteState
      changed = true
      continue
    }

    const localUpdated = parseTimestamp(localState.updatedAt)
    const remoteUpdated = parseTimestamp(remoteState.updatedAt)

    const newerOrEqualTimestamp =
      remoteUpdated !== null && (localUpdated === null || remoteUpdated >= localUpdated)
    const newerVersion = remoteVersion > localVersion

    if (newerOrEqualTimestamp || newerVersion) {
      merged[cardId] = remoteState
      changed = true
    }
  }

  return { merged, changed }
}

export function bumpVersion(localVersion, remoteVersion) {
  const safeLocal = isPositiveInteger(localVersion) ? localVersion : 0
  const safeRemote = isPositiveInteger(remoteVersion) ? remoteVersion : 0
  const next = Math.max(safeLocal, safeRemote) + 1
  if (next > MAX_VERSION) {
    throw new Error('Sync version overflow')
  }
  return next
}
