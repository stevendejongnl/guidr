import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors, spacing, borderRadius, typography } from '../theme'

interface QuickActionButtonProps {
  icon: string
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  testID?: string
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onPress,
  variant = 'primary',
  testID,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant]]}
      onPress={onPress}
      testID={testID}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 80,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  primary: {
    backgroundColor: colors.buttonPrimary,
  },
  secondary: {
    backgroundColor: colors.buttonSecondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
})
