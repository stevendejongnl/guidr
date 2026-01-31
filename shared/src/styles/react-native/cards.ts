/**
 * Card component styles for React Native
 */

import { StyleSheet, ViewStyle } from 'react-native'
import { colors, borderRadius, spacing, componentDefaults } from '../../tokens'

export const cardStyles = StyleSheet.create({
  // Base card style
  base: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: componentDefaults.cardPadding,
  },

  // Variants
  elevated: {
    backgroundColor: colors.cardElevated,
  },

  // Spacing
  withMargin: {
    marginBottom: spacing.md,
  },
  compactMargin: {
    marginBottom: spacing.sm,
  },

  // Elevation/shadow (platform-specific)
  shadowSmall: {
    elevation: 2,
  },
  shadowMedium: {
    elevation: 4,
  },
})

export type CardVariant = 'base' | 'elevated'

/**
 * Get card style array based on variant and options
 */
export const getCardStyle = (
  variant: CardVariant = 'base',
  hasMargin: boolean = true
): ViewStyle[] => {
  const styles: ViewStyle[] = [cardStyles.base]

  if (variant === 'elevated') {
    styles.push(cardStyles.elevated as ViewStyle)
  }

  if (hasMargin) {
    styles.push(cardStyles.withMargin as ViewStyle)
  }

  return styles
}
