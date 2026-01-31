import React from 'react'
import { View, Text } from 'react-native'
import {
  getStatusBadgeStyle,
  getStatusBadgeLabel,
  type StatusBadgeStatus,
} from '@guidr/shared/styles/react-native'

interface StatusBadgeProps {
  status: StatusBadgeStatus
  variant?: 'solid' | 'outline'
  testID?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'solid',
  testID,
}) => {
  const label = getStatusBadgeLabel(status)
  const styles = getStatusBadgeStyle(status, variant)

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}
