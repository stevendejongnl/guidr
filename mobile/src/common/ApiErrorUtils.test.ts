import { extractErrorMessage, AuthenticationError, ServerMaintenanceError, checkForMaintenanceError } from './ApiErrorUtils'
import { MaintenanceEventEmitter } from './MaintenanceEventEmitter'

describe('ServerMaintenanceError', () => {
  it('should be an instance of Error', () => {
    const error = new ServerMaintenanceError()
    expect(error).toBeInstanceOf(Error)
  })

  it('should have name ServerMaintenanceError', () => {
    const error = new ServerMaintenanceError()
    expect(error.name).toBe('ServerMaintenanceError')
  })

  it('should have default message', () => {
    const error = new ServerMaintenanceError()
    expect(error.message).toBe('Server is under maintenance')
  })

  it('should accept custom message', () => {
    const error = new ServerMaintenanceError('Custom maintenance message')
    expect(error.message).toBe('Custom maintenance message')
  })

  it('should be distinguishable from regular Error via instanceof', () => {
    const maintenanceError = new ServerMaintenanceError()
    const regularError = new Error('some error')
    expect(maintenanceError instanceof ServerMaintenanceError).toBe(true)
    expect(regularError instanceof ServerMaintenanceError).toBe(false)
  })
})

describe('checkForMaintenanceError', () => {
  beforeEach(() => {
    MaintenanceEventEmitter.setListener(null)
  })

  it('should throw ServerMaintenanceError on 503', () => {
    expect(() => checkForMaintenanceError({ status: 503 })).toThrow(ServerMaintenanceError)
  })

  it('should emit maintenance event on 503', () => {
    const listener = jest.fn()
    MaintenanceEventEmitter.setListener(listener)
    expect(() => checkForMaintenanceError({ status: 503 })).toThrow()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should not throw on non-503 status', () => {
    expect(() => checkForMaintenanceError({ status: 500 })).not.toThrow()
    expect(() => checkForMaintenanceError({ status: 404 })).not.toThrow()
    expect(() => checkForMaintenanceError({ status: 401 })).not.toThrow()
  })

  it('should not emit event on non-503 status', () => {
    const listener = jest.fn()
    MaintenanceEventEmitter.setListener(listener)
    checkForMaintenanceError({ status: 500 })
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('AuthenticationError', () => {
  it('should be an instance of Error', () => {
    const error = new AuthenticationError()
    expect(error).toBeInstanceOf(Error)
  })

  it('should have name AuthenticationError', () => {
    const error = new AuthenticationError()
    expect(error.name).toBe('AuthenticationError')
  })

  it('should have default message', () => {
    const error = new AuthenticationError()
    expect(error.message).toBe('Authentication failed')
  })

  it('should accept custom message', () => {
    const error = new AuthenticationError('Token expired')
    expect(error.message).toBe('Token expired')
  })

  it('should be distinguishable from regular Error via instanceof', () => {
    const authError = new AuthenticationError()
    const regularError = new Error('some error')
    expect(authError instanceof AuthenticationError).toBe(true)
    expect(regularError instanceof AuthenticationError).toBe(false)
  })
})

describe('ApiErrorUtils', () => {
  describe('extractErrorMessage', () => {
    it('should return string detail directly', () => {
      const result = extractErrorMessage(
        { detail: 'Invalid credentials' },
        'Fallback message'
      )
      expect(result).toBe('Invalid credentials')
    })

    it('should extract first error message from validation error array', () => {
      const result = extractErrorMessage(
        {
          detail: [
            {
              loc: ['body', 'email'],
              msg: 'value is not a valid email address',
              type: 'value_error.email',
            },
          ],
        },
        'Fallback message'
      )
      expect(result).toBe('email: value is not a valid email address')
    })

    it('should include field name from validation error array', () => {
      const result = extractErrorMessage(
        {
          detail: [
            {
              loc: ['body', 'password'],
              msg: 'ensure this value has at least 6 characters',
              type: 'value_error.string.min_length',
            },
          ],
        },
        'Fallback message'
      )
      expect(result).toBe('password: ensure this value has at least 6 characters')
    })

    it('should return fallback when validation error array is empty', () => {
      const result = extractErrorMessage(
        { detail: [] },
        'Fallback message'
      )
      expect(result).toBe('Fallback message')
    })

    it('should return fallback when errorData is null', () => {
      const result = extractErrorMessage(null, 'Fallback message')
      expect(result).toBe('Fallback message')
    })

    it('should return fallback when errorData is undefined', () => {
      const result = extractErrorMessage(undefined, 'Fallback message')
      expect(result).toBe('Fallback message')
    })

    it('should return fallback when errorData is a string', () => {
      const result = extractErrorMessage('Some error', 'Fallback message')
      expect(result).toBe('Fallback message')
    })

    it('should return fallback when errorData has no detail or message property', () => {
      const result = extractErrorMessage(
        { error: 'Some error' },
        'Fallback message'
      )
      expect(result).toBe('Fallback message')
    })

    it('should return message property when detail is missing', () => {
      const result = extractErrorMessage(
        { message: 'Alternative error message' },
        'Fallback message'
      )
      expect(result).toBe('Alternative error message')
    })

    it('should return fallback when detail is null', () => {
      const result = extractErrorMessage(
        { detail: null },
        'Fallback message'
      )
      expect(result).toBe('Fallback message')
    })

    it('should return fallback when detail is an empty object', () => {
      const result = extractErrorMessage(
        { detail: {} },
        'Fallback message'
      )
      expect(result).toBe('Fallback message')
    })

    it('should handle validation error with only msg (no field location)', () => {
      const result = extractErrorMessage(
        {
          detail: [
            {
              loc: [],
              msg: 'invalid request',
              type: 'value_error',
            },
          ],
        },
        'Fallback message'
      )
      expect(result).toBe('invalid request')
    })
  })
})
