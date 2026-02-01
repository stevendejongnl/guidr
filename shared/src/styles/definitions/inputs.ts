/**
 * Platform-agnostic input style definitions
 */

import { colors, spacing, borderRadius, typography } from '../../tokens'

export const inputDefinitions = {
  base: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },

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

  outline: {
    borderWidth: 1,
  },
  underline: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
  },

  withMargin: {
    marginBottom: spacing.md,
  },

  small: {
    minHeight: 32,
    padding: spacing.sm,
  },
  large: {
    minHeight: 56,
    padding: spacing.lg,
  },
}

export const inputPlaceholderColor = colors.textTertiary
