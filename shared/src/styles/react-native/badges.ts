/**
 * Badge component styles for React Native
 * Includes status badges for guide progress states
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { colors, spacing, borderRadius, typography } from '../../tokens'

export const badgeStyles = StyleSheet.create({
  // Base badge
  base: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  // Variants
  solid: {
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },

  // Text styles
  text: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },

  // Size variants
  small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
})

export type BadgeVariant = 'solid' | 'outline'
export type BadgeSize = 'small' | 'medium'
export type StatusBadgeStatus = 'completed' | 'in-progress' | 'paused' | 'not-started'

/**
 * Status badge colors mapping
 */
export const statusBadgeColors: Record<StatusBadgeStatus, string> = {
  completed: colors.success,
  'in-progress': colors.buttonPrimary,
  paused: colors.paused,
  'not-started': colors.textTertiary,
} as const

/**
 * Get status badge label
 */
export const getStatusBadgeLabel = (status: StatusBadgeStatus): string => {
  const labels: Record<StatusBadgeStatus, string> = {
    completed: 'Completed',
    'in-progress': 'In Progress',
    paused: 'Paused',
    'not-started': 'Not Started',
  }
  return labels[status]
}

/**
 * Get complete style object for status badge
 * Returns container and text styles for a given status and variant
 */
export const getStatusBadgeStyle = (
  status: StatusBadgeStatus,
  variant: BadgeVariant = 'solid',
  size: BadgeSize = 'small'
) => {
  const statusColor = statusBadgeColors[status]

  const containerStyles: ViewStyle[] = [
    badgeStyles.base,
    variant === 'solid' ? badgeStyles.solid : badgeStyles.outline,
    size === 'small' ? badgeStyles.small : badgeStyles.medium,
  ]

  if (variant === 'solid') {
    containerStyles.push({ backgroundColor: statusColor })
  } else {
    containerStyles.push({ borderColor: statusColor })
  }

  const textStyles: TextStyle[] = [badgeStyles.text]
  if (variant === 'solid') {
    textStyles.push({ color: colors.textPrimary })
  } else {
    textStyles.push({ color: statusColor })
  }

  return {
    container: containerStyles,
    text: textStyles,
  }
}

/**
 * Simple status color getter for advanced styling
 */
export const getStatusColor = (status: StatusBadgeStatus): string => {
  return statusBadgeColors[status]
}
