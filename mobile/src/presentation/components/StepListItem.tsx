import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Step } from '../../domain/entities/Step'
import { colors, spacing, typography } from '../theme'

interface StepListItemProps {
  step: Step
  stepNumber: number
  isFirst: boolean
  isLast: boolean
  onMoveUp: (stepId: string) => void
  onMoveDown: (stepId: string) => void
  onEdit: (stepId: string) => void
  onDelete: (stepId: string) => void
  canEdit?: boolean
  testID?: string
}

export const StepListItem: React.FC<StepListItemProps> = ({
  step,
  stepNumber,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  canEdit = true,
  testID,
}) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <View style={styles.container} {...(testID && { testID })}>
      {/* Step Number Badge */}
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{stepNumber}</Text>
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.duration}>{formatDuration(step.duration)}</Text>
        {step.description && (
          <Text style={styles.description} numberOfLines={1}>
            {step.description}
          </Text>
        )}
      </View>

      {/* Reorder Controls */}
      {canEdit && (
        <View style={styles.reorderControls}>
          <TouchableOpacity
            style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
            onPress={() => onMoveUp(step.id)}
            disabled={isFirst}
            testID={`${testID}:move-up`}
          >
            <Text style={[styles.reorderButtonText, isFirst && styles.reorderButtonTextDisabled]}>
              ↑
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
            onPress={() => onMoveDown(step.id)}
            disabled={isLast}
            testID={`${testID}:move-down`}
          >
            <Text style={[styles.reorderButtonText, isLast && styles.reorderButtonTextDisabled]}>
              ↓
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      {canEdit && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(step.id)}
            testID={`${testID}:edit`}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(step.id)}
            testID={`${testID}:delete`}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  numberText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  duration: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizeSm,
    color: colors.textTertiary,
  },
  reorderControls: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 0,
  },
  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  reorderButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.background,
  },
  reorderButtonTextDisabled: {
    color: colors.textTertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 0,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.background,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  deleteButtonText: {
    color: colors.textPrimary,
  },
})
