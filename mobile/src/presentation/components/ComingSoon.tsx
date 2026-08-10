import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { colors, typography } from '@guidr/shared/tokens'

interface ComingSoonProps {
  children: React.ReactNode
  testID?: string
}

/**
 * Higher-Order Component that wraps a component with a greyed-out effect
 * and "Coming Soon" overlay. Disables user interactions with the wrapped component.
 *
 * @example
 * <ComingSoon>
 *   <MyComponent />
 * </ComingSoon>
 */
export const ComingSoon: React.FC<ComingSoonProps> = ({ children, testID }) => {
  return (
    <View style={styles.container} testID={testID}>
      {/* Child component with reduced opacity */}
      <View style={styles.contentWrapper} pointerEvents="none">
        {children}
      </View>

      {/* Overlay with "Coming Soon" text */}
      <View style={styles.overlay}>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  contentWrapper: {
    opacity: 0.45,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 15, 20, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textSecondary,
  },
})
