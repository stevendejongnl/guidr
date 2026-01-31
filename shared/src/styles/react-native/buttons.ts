/**
 * Button component styles for React Native
 * Provides base styles and helper functions for button variants
 */

import { StyleSheet, ViewStyle } from 'react-native'
import {
  colors,
  spacing,
  borderRadius,
  typography,
  componentDefaults,
} from '../../tokens'

export const buttonStyles = StyleSheet.create({
  // Base button style
  base: {
    borderRadius: borderRadius.md,
    minHeight: componentDefaults.buttonHeight,
    padding: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  },

  // Button variants
  primary: {
    backgroundColor: colors.buttonPrimary,
  },
  secondary: {
    backgroundColor: colors.buttonSecondary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textTertiary,
  },

  // States
  disabled: {
    backgroundColor: colors.primaryDisabled,
  },

  // Text styles
  text: {
    color: colors.textPrimary,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  textMuted: {
    color: colors.textSecondary,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },

  // Size variants
  small: {
    minHeight: 32,
    padding: spacing.md,
  },
  large: {
    minHeight: 56,
    padding: spacing.xl,
  },

  // Spacing
  marginTop: {
    marginTop: spacing.sm,
  },
})

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline'
export type ButtonSize = 'small' | 'normal' | 'large'

/**
 * Get button style array based on variant and state
 * @param variant - Button variant (primary, secondary, danger, outline)
 * @param disabled - Whether button is disabled
 * @param size - Button size (small, normal, large)
 * @returns Array of styles to apply
 */
export const getButtonStyle = (
  variant: ButtonVariant,
  disabled: boolean = false,
  size: ButtonSize = 'normal'
): ViewStyle[] => {
  const styles: ViewStyle[] = [buttonStyles.base]

  // Add variant style
  if (variant === 'primary') {
    styles.push(buttonStyles.primary as ViewStyle)
  } else if (variant === 'secondary') {
    styles.push(buttonStyles.secondary as ViewStyle)
  } else if (variant === 'danger') {
    styles.push(buttonStyles.danger as ViewStyle)
  } else if (variant === 'outline') {
    styles.push(buttonStyles.outline as ViewStyle)
  }

  // Add size style
  if (size === 'small') {
    styles.push(buttonStyles.small as ViewStyle)
  } else if (size === 'large') {
    styles.push(buttonStyles.large as ViewStyle)
  }

  // Add disabled style if needed
  if (disabled) {
    styles.push(buttonStyles.disabled as ViewStyle)
  }

  return styles
}
