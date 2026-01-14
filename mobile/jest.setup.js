/**
 * Jest Setup - Test Environment Configuration
 *
 * Suppresses known, expected console output that doesn't represent actual errors:
 * 1. react-test-renderer deprecation (external dependency issue)
 * 2. ConfigLoader error logs (intentional error handling tests)
 * 3. React act() warnings (testing library noise in React Native)
 * 4. Expected error handling test outputs
 *
 * Real, unexpected errors will still be logged and visible.
 */

const originalError = console.error
const originalWarn = console.warn
const originalLog = console.log

console.error = (...args) => {
  const message = args[0]

  // Suppress react-test-renderer deprecation warning
  if (
    typeof message === 'string' &&
    message.includes('react-test-renderer is deprecated')
  ) {
    return
  }

  // Suppress expected ConfigLoader error logs in tests
  if (
    typeof message === 'string' &&
    message.includes('Failed to load configuration file:')
  ) {
    return
  }

  // Suppress expected ApkInstaller error logs in tests
  if (
    typeof message === 'string' &&
    (message.includes('Failed to delete downloaded APK:') ||
     message.includes('Failed to get free space:'))
  ) {
    return
  }

  // Suppress expected UpdateService error logs in tests
  if (
    typeof message === 'string' &&
    (message.includes('Update check failed:') ||
     message.includes('Failed to compare versions for mandatory check:'))
  ) {
    return
  }

  // Suppress expected ErrorReporter logs in tests (error handling tests)
  if (
    typeof message === 'string' &&
    message.includes('[ErrorReporter]')
  ) {
    return
  }

  // Suppress expected UpdateCheckStorage error logs in tests
  if (
    typeof message === 'string' &&
    (message.includes('Failed to get last update check timestamp:') ||
     message.includes('Failed to set last update check timestamp:') ||
     message.includes('Failed to clear last update check:'))
  ) {
    return
  }

  // Suppress expected logout error logs in tests
  if (
    typeof message === 'string' &&
    message.includes('Logout error:')
  ) {
    return
  }

  // Suppress expected home screen data loading errors in tests
  if (
    typeof message === 'string' &&
    message.includes('Failed to load home screen data:')
  ) {
    return
  }

  // Suppress expected profile loading errors in tests
  if (
    typeof message === 'string' &&
    message.includes('Failed to fetch profile:')
  ) {
    return
  }

  // Suppress React act() warnings - these are testing library noise
  // in React Native where proper act() wrapping is often impractical
  if (
    typeof message === 'string' &&
    message.includes('An update to') &&
    message.includes('inside a test was not wrapped in act(...)')
  ) {
    return
  }

  // Pass through all other errors
  originalError(...args)
}

console.warn = (...args) => {
  const message = args[0]

  // Suppress fake timers warning when advanceTimersByTime is called without useFakeTimers
  if (
    typeof message === 'string' &&
    message.includes('A function to advance timers was called but the timers APIs are not replaced with fake timers')
  ) {
    return
  }

  // Pass through all other warnings
  originalWarn(...args)
}

console.log = (...args) => {
  // Suppress all console.log() calls during tests
  // Real errors will still appear via console.error() and console.warn()
  return
}

