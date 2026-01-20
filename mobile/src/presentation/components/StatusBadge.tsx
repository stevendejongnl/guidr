import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../theme'

type BadgeStatus = 'completed' | 'in-progress' | 'paused' | 'not-started'
type BadgeVariant = 'solid' | 'outline'

interface StatusBadgeProps {
  status: BadgeStatus
  variant?: BadgeVariant
  testID?: string
}

const getStatusColor = (status: BadgeStatus): string => {
  switch (status) {
    case 'completed':
      return colors.success
    case 'in-progress':
      return colors.primary
    case 'paused':
      return colors.paused
    case 'not-started':
    default:
      return colors.textTertiary
  }
}

const getStatusLabel = (status: BadgeStatus): string => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'in-progress':
      return 'In Progress'
    case 'paused':
      return 'Paused'
    case 'not-started':
    default:
      return 'Not Started'
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'solid',
  testID,
}) => {
  const statusColor = getStatusColor(status)
  const statusLabel = getStatusLabel(status)

  const styles = StyleSheet.create({
    badge: {
      borderRadius: borderRadius.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor:
        variant === 'solid' ? statusColor : 'transparent',
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: statusColor,
    } as ViewStyle,
    text: {
      fontSize: typography.sizeXs,
      fontWeight: typography.weightMedium,
      color:
        variant === 'solid'
          ? colors.textPrimary
          : statusColor,
    } as TextStyle,
  })

  return (
    <View style={styles.badge} testID={testID}>
      <Text style={styles.text}>{statusLabel}</Text>
    </View>
  )
}
