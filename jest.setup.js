/**
 * Jest Setup - Test Environment Configuration
 *
 * Suppresses known, expected console output that doesn't represent actual errors:
 * 1. react-test-renderer deprecation (external dependency issue)
 * 2. ConfigLoader error logs (intentional error handling tests)
 * 3. React act() warnings (testing library noise in React Native)
 *
 * Real, unexpected errors will still be logged and visible.
 */

const originalError = console.error

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
