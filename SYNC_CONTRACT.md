# Collection Sync Contract

The app stores collection state in two places:

1. **Local** — `localStorage` under `glaceon-collection-v1`.
2. **Cloud** — Firestore at `users/{uid}/collection/state`.

Both copies contain a `cards` object keyed by card ID. The Firestore document also
contains a monotonic `version` integer that tracks the last local write that was
successfully pushed.

## Merge rules

When the provider receives a Firestore snapshot, it calls `mergeRemoteCollection`:

1. If `remoteVersion < localVersion`, the snapshot is older than the newest local
   edit. The local collection is kept unchanged and the debounced write path will
   eventually push the newer state to Firestore.
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

`localVersionRef` starts from the value saved in `glaceon-sync-state-v1` and is
incremented every time a debounced local write is sent to Firestore. It is a
client-side logical clock; it never decrements and is reset only when the
stored sync state is cleared.

## Important edge cases

- **Offline edits**: A user edits while offline. `localVersion` increments on the
  next debounced write attempt. The write fails silently and `syncStatus` becomes
  `error`. When the device comes back online, the pending write retries, the
  remote version catches up, and subsequent snapshots merge correctly.
- **Multiple tabs**: Each tab maintains its own `localVersionRef`. The last tab to
  write wins at the Firestore level. Tabs receive snapshots via `onSnapshot` and
  apply the merge rules above.
- **Multiple devices**: Same as multiple tabs. The device with the highest
  `localVersion` at write time dominates until another device writes.
- **Remote doc missing**: Treated as an empty remote collection. The merge is a
  no-op; the local collection remains and will be written to Firestore on the next
  debounced save.
