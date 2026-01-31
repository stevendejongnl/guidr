/**
 * Platform-agnostic button style definitions
 * These are converted to platform-specific styles by adapters
 */

import { colors, spacing, borderRadius, typography } from '../../tokens'

export const buttonDefinitions = {
  // Base button style
  base: {
    borderRadius: borderRadius.md,
    minHeight: 44,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline'
export type ButtonSize = 'small' | 'normal' | 'large'
