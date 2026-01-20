import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, borderRadius, typography, componentDefaults } from '../theme'

interface StatCardProps {
  icon: string
  label: string
  value: number | string
  testID?: string
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, testID }) => {
  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: componentDefaults.cardPadding,
    marginRight: spacing.md,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
