/**
 * Platform-agnostic card style definitions
 */

import { colors, borderRadius, spacing, componentDefaults } from '../../tokens'

export const cardDefinitions = {
  base: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: componentDefaults.cardPadding,
  },

  elevated: {
    backgroundColor: colors.cardElevated,
  },

  withMargin: {
    marginBottom: spacing.md,
  },
  compactMargin: {
    marginBottom: spacing.sm,
  },

  shadowSmall: {
    elevation: 2,
  },
  shadowMedium: {
    elevation: 4,
  },
}

export type CardVariant = 'base' | 'elevated'
