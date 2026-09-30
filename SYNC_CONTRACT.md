# Collection Sync Contract

The app stores collection state in two places:

1. **Local** — `localStorage` under `glaceon-collection-v1`.
2. **Cloud** — Firestore at `users/{uid}/collection/state`.

Both copies contain a `cards` object keyed by card ID. The Firestore document also
contains a monotonic `version` integer and an `updatedAt` server timestamp.

## Write path

Local mutations are **not** written to Firestore as whole-document overwrites.
Instead, each mutation queues a per-card patch in `pendingCardUpdatesRef`. A
debounced timer (1200 ms) fires `syncPendingCards`, which opens a Firestore
`runTransaction`:

1. Read the current document at `users/{uid}/collection/state`.
2. Apply **all** pending card updates on top of the current Firestore `cards`
   using `applyCardUpdates()`. This merges field-level patches (e.g. `owned`,
   `note`) onto each card's existing remote state.
3. Write back `{ cards, version: remoteVersion + 1, updatedAt: serverTimestamp() }`.

Firestore retries the transaction automatically if another client wrote between
the read and the commit. On retry, the transaction re-reads the latest document
and re-applies the same pending patches, so no data is lost. On success, the
pending updates are cleared. On failure, the pending updates remain queued and
will be included in the next transaction attempt.

Multiple rapid edits (e.g. toggling five cards in succession) are coalesced into
a single transaction by the debounce timer.

## Merge rules (incoming snapshots)

When the provider receives a Firestore snapshot (via `onSnapshot` or a
`visibilitychange` re-fetch), it calls `mergeRemoteCollection`:

1. If `remoteVersion < localVersion`, the snapshot is older than the newest
   remote version we have seen. The local collection is kept unchanged; the next
   transaction will push the newer local state.
2. Otherwise the remote document is equal or newer. For every card in the remote
   snapshot:
   - If the card does not exist locally, use the remote state.
   - If the card exists locally, compare `updatedAt` timestamps.
     - If `remoteUpdatedAt >= localUpdatedAt`, use the remote state.
     - If `remoteVersion > localVersion` (strictly newer), also use the remote
       state, even if the local timestamp is later. This resolves cases where
       timestamps were generated on different clocks.
   - Otherwise keep the local state.

## Version counter

The Firestore document's `version` field is the authoritative sync version. It is
incremented inside each transaction as `remoteVersion + 1`. There is no
client-side write version counter.

`localVersionRef` tracks the highest remote version seen so far. It is persisted
to `glaceon-sync-state-v1` and is used only by the merge logic to decide whether
an incoming snapshot is stale.

## Visibility re-sync

A `visibilitychange` listener re-fetches the Firestore document when the app
regains focus and a user is signed in. This catches mobile browsers that
disconnect the `onSnapshot` listener while backgrounded. The fetched snapshot is
processed through the same merge rules as `onSnapshot`.

## Important edge cases

- **Concurrent edits on two devices**: Each device's transaction reads the
  current Firestore state, applies its own pending card patches, and writes back.
  If two transactions overlap, Firestore retries the losing one. Both devices'
  card changes survive because each transaction merges onto the latest state.
- **Offline edits**: A user edits while offline. The pending card updates
  accumulate in `pendingCardUpdatesRef`. When the device comes back online, the
  debounced sync fires a transaction that reads the current Firestore state,
  applies all accumulated patches, and writes back. `syncStatus` becomes `error`
  if the transaction fails and the pending updates retry on the next mutation.
- **Multiple tabs**: Each tab maintains its own `pendingCardUpdatesRef`. Tabs
  write independently via transactions. Each tab receives snapshots via
  `onSnapshot` and applies the merge rules above.
- **Remote doc missing**: Treated as an empty remote collection with version 0.
  The transaction writes the pending cards as the initial document state.
