import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigator } from './navigation/AppNavigator'
import * as Sentry from '@sentry/react-native'

// Only initialize Sentry in production/development, not during tests
if (process.env['JEST_WORKER_ID'] === undefined) {
  Sentry.init({
    dsn: 'https://46265225d779c5a032c1bcf0dd9bb468@o257363.ingest.us.sentry.io/4510629687394304',

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

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
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
