import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography, borderRadius } from '../theme'

interface StepNavigationControlsProps {
  /**
   * Current step index (0-based)
   */
  currentStepIndex: number

  /**
   * Total number of steps in guide
   */
  totalSteps: number

  /**
   * Called when user taps previous button
   */
  onPrevious: () => void

  /**
   * Called when user taps next button
   */
  onNext: () => void

  /**
   * Whether controls are disabled
   */
  disabled?: boolean

  /**
   * Test identifier
   */
  testID?: string
}

/**
 * StepNavigationControls Component
 *
 * Navigation buttons for moving between steps in a session.
 * Displays: [< Previous]   N of M   [Next >]
 *
 * Previous button is disabled on first step.
 * Next button is disabled on last step.
 */
export const StepNavigationControls: React.FC<StepNavigationControlsProps> = ({
  currentStepIndex,
  totalSteps,
  onPrevious,
  onNext,
  disabled = false,
  testID,
}) => {
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1

  const handlePrevious = () => {
    if (!disabled && !isFirstStep) {
      onPrevious()
    }
  }

  const handleNext = () => {
    if (!disabled && !isLastStep) {
      onNext()
    }
  }

  return (
    <View style={styles.container} testID={testID}>
      <TouchableOpacity
        style={[
          styles.button,
          (disabled || isFirstStep) && styles.buttonDisabled,
        ]}
        onPress={handlePrevious}
        disabled={disabled || isFirstStep}
        testID="previous-button"
      >
        <Text
          style={[
            styles.buttonText,
            (disabled || isFirstStep) && styles.buttonTextDisabled,
          ]}
        >
          ← Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.stepIndicator}>
        <Text style={styles.stepText} testID="step-indicator">
          {currentStepIndex + 1} of {totalSteps}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (disabled || isLastStep) && styles.buttonDisabled,
        ]}
        onPress={handleNext}
        disabled={disabled || isLastStep}
        testID="next-button"
      >
        <Text
          style={[
            styles.buttonText,
            (disabled || isLastStep) && styles.buttonTextDisabled,
          ]}
        >
          Next →
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    backgroundColor: colors.primaryDisabled,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textSecondary,
  },
})
