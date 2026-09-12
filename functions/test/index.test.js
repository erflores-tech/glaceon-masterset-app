import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from 'firebase-functions/v2'
import { handleAuditCollectionWrite } from '../src/index.js'

describe('handleAuditCollectionWrite', () => {
  let infoSpy

  beforeEach(() => {
    infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    infoSpy.mockRestore()
  })

  function makeEvent({ beforeExists = false, afterExists = true, userId = 'user-123' } = {}) {
    return {
      eventId: 'evt-1',
      time: '2026-08-22T18:40:00.000Z',
      params: { userId },
      data: {
        before: { exists: beforeExists },
        after: { exists: afterExists },
      },
    }
  }

  it('logs a create operation', async () => {
    await handleAuditCollectionWrite(makeEvent({ beforeExists: false, afterExists: true }))

    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(infoSpy).toHaveBeenCalledWith(
      'collection-state-audit',
      expect.objectContaining({
        userId: 'user-123',
        operation: 'create',
        documentPath: 'users/user-123/collection/state',
        eventId: 'evt-1',
        timestamp: '2026-08-22T18:40:00.000Z',
      })
    )
  })

  it('logs an update operation', async () => {
    await handleAuditCollectionWrite(makeEvent({ beforeExists: true, afterExists: true }))

    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(infoSpy).toHaveBeenCalledWith(
      'collection-state-audit',
      expect.objectContaining({
        operation: 'update',
        userId: 'user-123',
      })
    )
  })

  it('logs a delete operation', async () => {
    await handleAuditCollectionWrite(makeEvent({ beforeExists: true, afterExists: false }))

    expect(infoSpy).toHaveBeenCalledWith(
      'collection-state-audit',
      expect.objectContaining({
        operation: 'delete',
        userId: 'user-123',
      })
    )
  })

  it('handles missing event.time gracefully', async () => {
    const event = makeEvent({ beforeExists: false, afterExists: true })
    delete event.time

    await handleAuditCollectionWrite(event)

    expect(infoSpy).toHaveBeenCalledWith(
      'collection-state-audit',
      expect.objectContaining({
        operation: 'create',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      })
    )
  })
})
