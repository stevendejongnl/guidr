import React from 'react'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@guidr/shared/tokens'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { InfoBanner } from './InfoBanner'

interface SafeScreenProps {
  children: React.ReactNode
  testID?: string
}

// Wraps every screen's content in a KeyboardAvoidingView so a focused input near the
// bottom of a scrollable form never ends up hidden behind the keyboard with no way to
// scroll to it — screens don't each need to remember to add this themselves.
export const SafeScreen: React.FC<SafeScreenProps> = ({ children, testID }) => {
  const { isOnline } = useNetworkStatus()

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']} testID={testID}>
      <InfoBanner
        visible={!isOnline}
        message="No internet connection"
        variant="warning"
        testID="offline-banner"
      />
      <KeyboardAvoidingView behavior="height" style={styles.container}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

