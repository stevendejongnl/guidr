/**
 * Typography component styles for React Native
 * Provides common text styling patterns
 */

import { StyleSheet } from 'react-native'
import { colors, spacing, typography } from '../../tokens'

export const typographyStyles = StyleSheet.create({
  // Headings
  h1: {
    fontSize: typography.sizeXxxl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: typography.sizeXxl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  h4: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  h5: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },

  // Body text
  bodyLarge: {
    fontSize: typography.sizeLg,
    color: colors.textPrimary,
    fontWeight: typography.weightNormal,
  },
  body: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    fontWeight: typography.weightNormal,
  },
  bodySmall: {
    fontSize: typography.sizeSm,
    color: colors.textPrimary,
    fontWeight: typography.weightNormal,
  },

  // Secondary text
  secondaryLarge: {
    fontSize: typography.sizeLg,
    color: colors.textSecondary,
    fontWeight: typography.weightNormal,
  },
  secondary: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    fontWeight: typography.weightNormal,
  },
  secondarySmall: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    fontWeight: typography.weightNormal,
  },

  // Muted text
  muted: {
    fontSize: typography.sizeMd,
    color: colors.textTertiary,
    fontWeight: typography.weightNormal,
  },
  mutedSmall: {
    fontSize: typography.sizeSm,
    color: colors.textTertiary,
    fontWeight: typography.weightNormal,
  },

  // Feedback text
  error: {
    fontSize: typography.sizeSm,
    color: colors.danger,
    fontWeight: typography.weightNormal,
  },
  success: {
    fontSize: typography.sizeSm,
    color: colors.success,
    fontWeight: typography.weightNormal,
  },
  warning: {
    fontSize: typography.sizeSm,
    color: colors.warning,
    fontWeight: typography.weightNormal,
  },

  // Margins
  marginBottom: {
    marginBottom: spacing.md,
  },
  marginBottomSmall: {
    marginBottom: spacing.sm,
  },
})
