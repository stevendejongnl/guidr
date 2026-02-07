import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigator } from './navigation/AppNavigator'
import * as Sentry from '@sentry/react-native'
import { SENTRY_DSN } from '@env'

// Only initialize Sentry in production builds (not in tests or local development)
// This ensures Sentry is only active for release APKs and TestFlight builds
if (process.env['JEST_WORKER_ID'] === undefined && !__DEV__ && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Configure Session Replay
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1,
    integrations: [
      // Sentry.mobileReplayIntegration(),
      // Sentry.feedbackIntegration()
    ],
  })
}

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(App)
