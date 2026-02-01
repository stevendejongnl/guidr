/**
 * Platform-agnostic badge style definitions
 */

import { colors, spacing, borderRadius, typography } from '../../tokens'

export const badgeDefinitions = {
  base: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  solid: {
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },

  text: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },

  small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
}

export const statusBadgeColorMap = {
  completed: colors.success,
  'in-progress': colors.buttonPrimary,
  paused: colors.paused,
  'not-started': colors.textTertiary,
} as const

export const statusBadgeLabels = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  paused: 'Paused',
  'not-started': 'Not Started',
} as const

export type BadgeVariant = 'solid' | 'outline'
export type BadgeSize = 'small' | 'medium'
export type StatusBadgeStatus = keyof typeof statusBadgeColorMap
