/**
 * Input component styles for React Native
 */

import { StyleSheet, ViewStyle } from 'react-native'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../tokens'

export const inputStyles = StyleSheet.create({
  // Base input
  base: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },

  // States
  error: {
    borderColor: colors.borderError,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: colors.surface,
  },
  focused: {
    borderColor: colors.primary,
  },

  // Variants
  outline: {
    borderWidth: 1,
  },
  underline: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
  },

  // Spacing
  withMargin: {
    marginBottom: spacing.md,
  },

  // Size variants
  small: {
    minHeight: 32,
    padding: spacing.sm,
  },
  large: {
    minHeight: 56,
    padding: spacing.lg,
  },
})

/**
 * Input placeholder text style
 */
export const inputPlaceholderColor = colors.textTertiary

/**
 * Get input style array based on state and options
 */
export const getInputStyle = (options: {
  error?: boolean
  disabled?: boolean
  focused?: boolean
  withMargin?: boolean
  variant?: 'outline' | 'underline'
  size?: 'small' | 'normal' | 'large'
} = {}): ViewStyle[] => {
  const {
    error = false,
    disabled = false,
    focused = false,
    withMargin = true,
    variant = 'outline',
    size = 'normal',
  } = options

  const styles: ViewStyle[] = [inputStyles.base]

  // Add state styles
  if (error) {
    styles.push(inputStyles.error as ViewStyle)
  }
  if (disabled) {
    styles.push(inputStyles.disabled as ViewStyle)
  }
  if (focused && !error) {
    styles.push(inputStyles.focused as ViewStyle)
  }

  // Add variant style
  if (variant === 'underline') {
    styles.push(inputStyles.underline as ViewStyle)
  } else {
    styles.push(inputStyles.outline as ViewStyle)
  }

  // Add size style
  if (size === 'small') {
    styles.push(inputStyles.small as ViewStyle)
  } else if (size === 'large') {
    styles.push(inputStyles.large as ViewStyle)
  }

  // Add margin if needed
  if (withMargin) {
    styles.push(inputStyles.withMargin as ViewStyle)
  }

  return styles
}
