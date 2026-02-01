import React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@guidr/shared/tokens'

interface SafeScreenProps {
  children: React.ReactNode
  testID?: string
}

export const SafeScreen: React.FC<SafeScreenProps> = ({ children, testID }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']} testID={testID}>
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

