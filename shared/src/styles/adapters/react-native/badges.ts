/**
 * React Native adapter for badge styles
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native'
import {
  badgeDefinitions,
  statusBadgeColorMap,
  statusBadgeLabels,
  type BadgeVariant,
  type BadgeSize,
  type StatusBadgeStatus,
} from '../../definitions/badges'

export const badgeStyles = StyleSheet.create({
  base: badgeDefinitions.base as ViewStyle,
  solid: badgeDefinitions.solid as ViewStyle,
  outline: badgeDefinitions.outline as ViewStyle,
  text: badgeDefinitions.text,
  small: badgeDefinitions.small as ViewStyle,
  medium: badgeDefinitions.medium as ViewStyle,
})

export const statusBadgeColors = statusBadgeColorMap
export type { BadgeVariant, BadgeSize, StatusBadgeStatus }

export const getStatusBadgeLabel = (status: StatusBadgeStatus): string => {
  return statusBadgeLabels[status]
}

export const getStatusColor = (status: StatusBadgeStatus): string => {
  return statusBadgeColors[status]
}

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
    containerStyles.push({ backgroundColor: statusColor } as ViewStyle)
  } else {
    containerStyles.push({ borderColor: statusColor } as ViewStyle)
  }

  const textStyles: TextStyle[] = [badgeStyles.text]
  const textColor = variant === 'solid' ? '#E6EDF3' : statusColor
  textStyles.push({ color: textColor } as TextStyle)

  return {
    container: containerStyles,
    text: textStyles,
  }
}
