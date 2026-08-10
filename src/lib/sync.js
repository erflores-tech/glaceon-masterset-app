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
 * @param {Object} params.localCollection - Current local collection state.
 * @param {number} params.localVersion - Current local sync version.
 * @param {Object} params.remoteCollection - `cards` field from the Firestore doc.
 * @param {number} params.remoteVersion - `version` field from the Firestore doc.
 * @returns {{ merged: Object, changed: boolean }} The merged collection and
 *   whether any field changed.
 */
export function mergeRemoteCollection({
  localCollection,
  localVersion,
  remoteCollection,
  remoteVersion,
}) {
  if (remoteVersion < localVersion) {
    return { merged: localCollection, changed: false }
  }

  const merged = { ...localCollection }
  let changed = false

  for (const [cardId, remoteState] of Object.entries(remoteCollection)) {
    const localState = merged[cardId]
    if (!localState) {
      merged[cardId] = remoteState
      changed = true
      continue
    }

    const localUpdated = localState.updatedAt
      ? Date.parse(localState.updatedAt)
      : Infinity
    const remoteUpdated = remoteState.updatedAt
      ? Date.parse(remoteState.updatedAt)
      : 0

    if (remoteUpdated >= localUpdated || remoteVersion > localVersion) {
      merged[cardId] = remoteState
      changed = true
    }
  }

  return { merged, changed }
}
