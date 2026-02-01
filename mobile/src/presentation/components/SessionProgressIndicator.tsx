import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@guidr/shared/tokens'

interface SessionProgressIndicatorProps {
  currentStepIndex: number
  totalSteps: number
  guideTitle: string
  testID?: string
}

/**
 * SessionProgressIndicator Component
 *
 * Displays session progress with:
 * - Guide title
 * - Progress bar visualization
 * - Step count (current of total)
 * - Percentage complete
 *
 * Provides visual feedback of progress through the guided session
 */
export const SessionProgressIndicator: React.FC<SessionProgressIndicatorProps> = ({
  currentStepIndex,
  totalSteps,
  guideTitle,
  testID,
}) => {
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100
  const isComplete = currentStepIndex === totalSteps - 1

  return (
    <View style={styles.container} testID={testID} accessible accessibilityRole="progressbar">
      <View style={styles.header}>
        <Text
          style={styles.guideTitle}
          numberOfLines={1}
          accessibilityLabel={`Guide: ${guideTitle}`}
        >
          {guideTitle}
        </Text>
        <Text
          style={styles.stepCount}
          accessibilityLabel={`Step ${currentStepIndex + 1} of ${totalSteps}`}
        >
          {currentStepIndex + 1}/{totalSteps}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer} accessible={false}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progressPercent}%`,
              backgroundColor: isComplete ? colors.success : colors.primary,
            },
          ]}
          accessibilityLabel={`${progressPercent.toFixed(0)}% complete`}
        />
      </View>

      {/* Percentage Text */}
      <Text
        style={styles.percentText}
        accessibilityLabel={`${progressPercent.toFixed(0)} percent complete`}
      >
        {progressPercent.toFixed(0)}% Complete
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  guideTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  stepCount: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    textAlign: 'right',
  },
})
