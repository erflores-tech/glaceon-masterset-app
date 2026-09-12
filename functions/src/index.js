import { logger } from 'firebase-functions/v2'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'

/**
 * Handles the audit logging for a Firestore collection state write event.
 *
 * @param {object} event
 * @param {object} event.data
 * @param {{ exists: boolean }} event.data.before
 * @param {{ exists: boolean }} event.data.after
 * @param {{ userId: string }} event.params
 * @param {string} [event.eventId]
 * @param {string} [event.time]
 */
export async function handleAuditCollectionWrite(event) {
  const { before, after } = event.data
  const operation = before.exists
    ? (after.exists ? 'update' : 'delete')
    : 'create'

  logger.info('collection-state-audit', {
    userId: event.params.userId,
    operation,
    documentPath: `users/${event.params.userId}/collection/state`,
    eventId: event.eventId,
    timestamp: event.time || new Date().toISOString(),
  })
}

/**
 * Cloud Function triggered by writes to a user's collection state document.
 *
 * @type {import('firebase-functions/v2/firestore').CloudFunction<import('firebase-functions/v2/firestore').FirestoreEvent<import('firebase-functions/v2/firestore').Change<import('firebase-admin/firestore').DocumentSnapshot>>>}
 */
export const auditCollectionWrites = onDocumentWritten(
  'users/{userId}/collection/state',
  handleAuditCollectionWrite
)

