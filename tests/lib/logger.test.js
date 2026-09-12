import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, addRemoteTransport } from '../../src/lib/logger.js'

describe('logger', () => {
  let debugSpy
  let infoSpy
  let warnSpy
  let errorSpy

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    debugSpy.mockRestore()
    infoSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('emits a debug message with context', () => {
    logger.debug('hello', { foo: 'bar' })

    expect(debugSpy).toHaveBeenCalledWith('hello', { context: { foo: 'bar' }, timestamp: expect.any(String) })
  })

  it('emits an info message', () => {
    logger.info('sync started')

    expect(infoSpy).toHaveBeenCalledWith('sync started', { timestamp: expect.any(String) })
  })

  it('emits a warning message', () => {
    logger.warn('retrying')

    expect(warnSpy).toHaveBeenCalledWith('retrying', { timestamp: expect.any(String) })
  })

  it('emits an error with the original Error', () => {
    const err = new Error('boom')
    logger.error('save failed', err)

    expect(errorSpy).toHaveBeenCalledWith(
      'save failed',
      expect.objectContaining({ timestamp: expect.any(String) }),
      err
    )
  })

  it('forwards structured entries to registered transports', () => {
    const transport = vi.fn()
    addRemoteTransport(transport)

    logger.error('remote test', new Error('remote'))

    expect(transport).toHaveBeenCalledTimes(1)
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'remote test',
        error: expect.any(Error),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      })
    )
  })

  it('ignores transport failures so the app keeps running', () => {
    addRemoteTransport(() => {
      throw new Error('transport down')
    })

    expect(() => logger.info('still works')).not.toThrow()
    expect(infoSpy).toHaveBeenCalledWith('still works', { timestamp: expect.any(String) })
  })
})
