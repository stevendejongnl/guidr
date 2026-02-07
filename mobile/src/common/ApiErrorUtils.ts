/**
 * Error thrown when an API call receives a 401 Unauthorized response.
 * Used to trigger token refresh flows.
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * FastAPI validation error structure
 * Ensures proper error handling across API calls
 */
interface FastAPIValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

/**
 * Type guard to check if an object is a FastAPI validation error
 */
function isValidationError(value: unknown): value is FastAPIValidationError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'loc' in value &&
    'msg' in value &&
    'type' in value &&
    Array.isArray((value as Record<string, unknown>)['loc']) &&
    typeof (value as Record<string, unknown>)['msg'] === 'string' &&
    typeof (value as Record<string, unknown>)['type'] === 'string'
  )
}

/**
 * Extracts a human-readable error message from a FastAPI error response.
 *
 * Handles multiple FastAPI error formats:
 * 1. String detail: { "detail": "Invalid credentials" }
 * 2. Validation error array: { "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }
 * 3. Message property: { "message": "Error message" }
 *
 * @param errorData - The parsed error response from the API
 * @param fallbackMessage - The message to return if error cannot be extracted
 * @returns A human-readable error message
 */
export function extractErrorMessage(
  errorData: unknown,
  fallbackMessage: string
): string {
  // Check if errorData is a valid object
  if (!errorData || typeof errorData !== 'object') {
    return fallbackMessage
  }

  // Check for 'detail' property
  if ('detail' in errorData) {
    const detail = (errorData as Record<string, unknown>)['detail']

    // String detail - return directly
    if (typeof detail === 'string') {
      return detail
    }

    // Array of validation errors - extract first error's message
    if (Array.isArray(detail) && detail.length > 0) {
      const firstError = detail[0]
      if (isValidationError(firstError)) {
        // Include field name from loc array if available
        const fieldName = firstError['loc'][firstError['loc'].length - 1]
        if (fieldName && fieldName !== 'body') {
          return `${fieldName}: ${firstError['msg']}`
        }
        return firstError['msg']
      }
    }
  }

  // Check for 'message' property (alternative format)
  if ('message' in errorData) {
    const message = (errorData as Record<string, unknown>)['message']
    if (typeof message === 'string') {
      return message
    }
  }

  // Fallback to default message
  return fallbackMessage
}
