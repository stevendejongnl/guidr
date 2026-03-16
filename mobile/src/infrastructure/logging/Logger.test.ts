/**
 * Logger tests.
 *
 * DiagnosticLogService calls NativeModules.DiagnosticLogModule.log which is
 * mocked in __mocks__/react-native.js (NativeModules is provided).
 * Platform.OS is set to 'ios' in that same mock, so the service will attempt
 * to call the native module. Since DiagnosticLogModule is undefined in that
 * mock, all native calls will throw internally and be swallowed — this is
 * the correct best-effort behaviour.
 *
 * We test the Logger singleton's public API in isolation. Because jest.setup.js
 * suppresses all console.log output, we spy on the originals at the module level.
 */

// Restore console methods so we can spy on them without jest.setup suppression.
// We need to capture calls before the suppressor swallows them.
const realConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
const realConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
const realConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

import { Logger } from './Logger'

describe('Logger', () => {
  beforeEach(() => {
    Logger.setDebugMode(false)
    jest.clearAllMocks()
  })

  afterAll(() => {
    realConsoleLog.mockRestore()
    realConsoleWarn.mockRestore()
    realConsoleError.mockRestore()
  })

  describe('setDebugMode / isDebugMode', () => {
    it('defaults to debug mode off', () => {
      expect(Logger.isDebugMode()).toBe(false)
    })

    it('enables debug mode when set to true', () => {
      Logger.setDebugMode(true)
      expect(Logger.isDebugMode()).toBe(true)
    })

    it('disables debug mode when set to false', () => {
      Logger.setDebugMode(true)
      Logger.setDebugMode(false)
      expect(Logger.isDebugMode()).toBe(false)
    })
  })

  describe('debug', () => {
    it('does not call console.log when debug mode is off', () => {
      Logger.debug('Tag', 'a debug message')
      expect(realConsoleLog).not.toHaveBeenCalled()
    })

    it('calls console.log with formatted message when debug mode is on', () => {
      Logger.setDebugMode(true)

      Logger.debug('MyTag', 'hello debug')

      expect(realConsoleLog).toHaveBeenCalledWith('[DEBUG][MyTag] hello debug')
    })

    it('appends serialized data when provided in debug mode', () => {
      Logger.setDebugMode(true)

      Logger.debug('Tag', 'with data', { key: 'value' })

      expect(realConsoleLog).toHaveBeenCalledWith('[DEBUG][Tag] with data {"key":"value"}')
    })

    it('does not call console.log when debug mode is off even with data', () => {
      Logger.debug('Tag', 'silent', { x: 1 })
      expect(realConsoleLog).not.toHaveBeenCalled()
    })
  })

  describe('info', () => {
    it('always calls console.log regardless of debug mode', () => {
      Logger.info('Tag', 'an info message')

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] an info message')
    })

    it('calls console.log in debug mode too', () => {
      Logger.setDebugMode(true)

      Logger.info('Tag', 'info in debug')

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] info in debug')
    })

    it('appends serialized data to the message', () => {
      Logger.info('Tag', 'with payload', [1, 2, 3])

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] with payload [1,2,3]')
    })

    it('omits data suffix when data is undefined', () => {
      Logger.info('Tag', 'no data')

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] no data')
    })
  })

  describe('warn', () => {
    it('calls console.warn regardless of debug mode', () => {
      Logger.warn('Tag', 'a warning')

      expect(realConsoleWarn).toHaveBeenCalledWith('[WARN][Tag] a warning')
    })

    it('calls console.warn in debug mode', () => {
      Logger.setDebugMode(true)

      Logger.warn('Tag', 'warn in debug')

      expect(realConsoleWarn).toHaveBeenCalledWith('[WARN][Tag] warn in debug')
    })

    it('appends serialized data to the warning', () => {
      Logger.warn('Tag', 'with context', { code: 42 })

      expect(realConsoleWarn).toHaveBeenCalledWith('[WARN][Tag] with context {"code":42}')
    })
  })

  describe('error', () => {
    it('calls console.error with formatted message', () => {
      Logger.error('Tag', 'something failed')

      expect(realConsoleError).toHaveBeenCalledWith('[ERROR][Tag] something failed')
    })

    it('appends Error message when err is an Error instance', () => {
      Logger.error('Tag', 'operation error', new Error('disk full'))

      expect(realConsoleError).toHaveBeenCalledWith('[ERROR][Tag] operation error disk full')
    })

    it('appends string representation when err is a non-Error value', () => {
      Logger.error('Tag', 'unexpected', 'some string error')

      expect(realConsoleError).toHaveBeenCalledWith('[ERROR][Tag] unexpected some string error')
    })

    it('appends string representation when err is a number', () => {
      Logger.error('Tag', 'error code', 404)

      expect(realConsoleError).toHaveBeenCalledWith('[ERROR][Tag] error code 404')
    })

    it('does not append anything when err is undefined', () => {
      Logger.error('Tag', 'plain error')

      expect(realConsoleError).toHaveBeenCalledWith('[ERROR][Tag] plain error')
    })

    it('calls console.error regardless of debug mode', () => {
      Logger.setDebugMode(true)

      Logger.error('Tag', 'error in debug')

      expect(realConsoleError).toHaveBeenCalledWith('[ERROR][Tag] error in debug')
    })
  })

  describe('safeSerialize (tested indirectly via log methods)', () => {
    it('returns empty string suffix for undefined data', () => {
      Logger.info('Tag', 'message', undefined)

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] message')
    })

    it('returns [unserializable] for circular objects', () => {
      const circular: Record<string, unknown> = {}
      circular['self'] = circular

      Logger.info('Tag', 'circular', circular)

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] circular [unserializable]')
    })

    it('serializes null data as "null"', () => {
      Logger.info('Tag', 'null data', null)

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] null data null')
    })

    it('serializes number data', () => {
      Logger.info('Tag', 'number', 123)

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] number 123')
    })

    it('serializes boolean data', () => {
      Logger.info('Tag', 'flag', true)

      expect(realConsoleLog).toHaveBeenCalledWith('[INFO][Tag] flag true')
    })
  })
})
