import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography, commonStyles } from '@guidr/shared/tokens'

interface EmptyStateProps {
  icon: string
  message: string
  actionLabel?: string | undefined
  onAction?: (() => void) | undefined
  testID?: string | undefined
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  message,
  actionLabel,
  onAction,
  testID,
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.icon} testID={testID ? `${testID}-icon` : undefined}>
        {icon}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={[commonStyles.button, styles.actionButton]} onPress={onAction}>
          <Text style={commonStyles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionButton: {
    marginTop: spacing.lg,
    minWidth: 120,
  },
})
