import React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@guidr/shared/tokens'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { InfoBanner } from './InfoBanner'

interface SafeScreenProps {
  children: React.ReactNode
  testID?: string
}

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
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

