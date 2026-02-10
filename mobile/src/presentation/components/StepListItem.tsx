import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Step } from '../../domain/entities/Step'
import { colors, spacing, typography } from '@guidr/shared/tokens'

export interface StepTimerProps {
  displaySeconds: number
  isRunning: boolean
  isPaused: boolean
  isComplete: boolean
  mode: 'countdown' | 'stopwatch'
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

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
  timer?: StepTimerProps
  testID?: string
}

function formatTimerSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function getTimerColor(
  mode: 'countdown' | 'stopwatch',
  displaySeconds: number,
  durationMinutes: number,
): string {
  if (mode === 'stopwatch') {
    return colors.textPrimary
  }
  const totalSeconds = durationMinutes * 60
  if (totalSeconds === 0) return colors.textPrimary
  const ratio = displaySeconds / totalSeconds
  if (ratio > 0.5) return colors.success
  if (ratio > 0.25) return colors.warning
  return colors.danger
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
  timer,
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
        {step.duration > 0 && (
          <Text style={styles.duration}>{formatDuration(step.duration)}</Text>
        )}
        {step.description && (
          <Text style={styles.description} numberOfLines={1}>
            {step.description}
          </Text>
        )}

        {/* Timer Controls */}
        {timer && (
          <View style={styles.timerContainer} testID={`${testID}:timer`}>
            {timer.isComplete ? (
              <>
                <Text
                  style={styles.timerComplete}
                  testID={`${testID}:timer-complete`}
                >
                  Complete!
                </Text>
                <TouchableOpacity
                  style={styles.timerButton}
                  onPress={timer.onReset}
                  testID={`${testID}:timer-reset`}
                >
                  <Text style={styles.timerButtonText}>Reset</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.timerDisplay,
                    {
                      color: getTimerColor(
                        timer.mode,
                        timer.displaySeconds,
                        step.duration,
                      ),
                    },
                  ]}
                  testID={`${testID}:timer-display`}
                >
                  {formatTimerSeconds(timer.displaySeconds)}
                </Text>
                {timer.isRunning ? (
                  <TouchableOpacity
                    style={styles.timerButton}
                    onPress={timer.onPause}
                    testID={`${testID}:timer-pause`}
                  >
                    <Text style={styles.timerButtonText}>Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.timerButton}
                    onPress={timer.onStart}
                    testID={`${testID}:timer-start`}
                  >
                    <Text style={styles.timerButtonText}>
                      {timer.isPaused ? 'Resume' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.timerButton}
                  onPress={timer.onReset}
                  testID={`${testID}:timer-reset`}
                >
                  <Text style={styles.timerButtonText}>Reset</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  timerDisplay: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    minWidth: 56,
  },
  timerComplete: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.success,
  },
  timerButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  timerButtonText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.background,
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
