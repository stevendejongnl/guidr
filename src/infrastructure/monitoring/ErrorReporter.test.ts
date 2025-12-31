import * as Sentry from '@sentry/react-native'
import { ErrorReporter } from './ErrorReporter'

jest.mock('@sentry/react-native')

describe('ErrorReporter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('capture', () => {
    it('should capture Error objects', () => {
      const error = new Error('Test error')
      ErrorReporter.capture(error)

      expect(Sentry.captureException).toHaveBeenCalledWith(error)
    })

    it('should convert unknown errors to Error objects', () => {
      ErrorReporter.capture('String error')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'String error' })
      )
    })

    it('should add context tags when provided', () => {
      const error = new Error('Test error')
      const mockScope = {
        setTag: jest.fn(),
      }
      ;(Sentry.withScope as jest.Mock).mockImplementation((callback) => {
        callback(mockScope)
      })

      ErrorReporter.capture(error, {
        component: 'TestComponent',
        action: 'testAction',
        userId: '123',
      })

      expect(Sentry.withScope).toHaveBeenCalled()
      expect(mockScope.setTag).toHaveBeenCalledWith('component', 'TestComponent')
      expect(mockScope.setTag).toHaveBeenCalledWith('action', 'testAction')
      expect(mockScope.setTag).toHaveBeenCalledWith('userId', '123')
    })

    it('should filter out undefined context values', () => {
      const error = new Error('Test error')
      const mockScope = { setTag: jest.fn() }
      ;(Sentry.withScope as jest.Mock).mockImplementation((callback) => {
        callback(mockScope)
      })

      // Test runtime behavior with undefined value (use any to bypass strict typing)
      ErrorReporter.capture(error, {
        component: 'Test',
        userId: undefined,
      } as any)

      expect(mockScope.setTag).toHaveBeenCalledWith('component', 'Test')
      expect(mockScope.setTag).not.toHaveBeenCalledWith('userId', expect.anything())
    })
  })

  describe('captureMessage', () => {
    it('should capture messages with default info level', () => {
      ErrorReporter.captureMessage('Test message')

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info')
    })

    it('should capture messages with specified level', () => {
      ErrorReporter.captureMessage('Warning message', 'warning')

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Warning message', 'warning')
    })

    it('should add context tags to messages', () => {
      const mockScope = { setTag: jest.fn() }
      ;(Sentry.withScope as jest.Mock).mockImplementation((callback) => {
        callback(mockScope)
      })

      ErrorReporter.captureMessage('Test', 'error', { component: 'Test' })

      expect(mockScope.setTag).toHaveBeenCalledWith('component', 'Test')
    })
  })
})
