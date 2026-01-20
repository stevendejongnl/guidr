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

  const isPreviousDisabled = disabled || isFirstStep
  const isNextDisabled = disabled || isLastStep

  return (
    <View
      style={styles.container}
      testID={testID}
      accessible
      accessibilityLabel="Step navigation"
    >
      <TouchableOpacity
        style={[
          styles.button,
          isPreviousDisabled && styles.buttonDisabled,
        ]}
        onPress={handlePrevious}
        disabled={isPreviousDisabled}
        testID="previous-button"
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Previous step${isPreviousDisabled ? ', disabled on first step' : ''}`}
      >
        <Text
          style={[
            styles.buttonText,
            isPreviousDisabled && styles.buttonTextDisabled,
          ]}
        >
          ← Previous
        </Text>
      </TouchableOpacity>

      <View
        style={styles.stepIndicator}
        accessible
        accessibilityLabel={`Step ${currentStepIndex + 1} of ${totalSteps}`}
      >
        <Text style={styles.stepText} testID="step-indicator">
          {currentStepIndex + 1} of {totalSteps}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isNextDisabled && styles.buttonDisabled,
        ]}
        onPress={handleNext}
        disabled={isNextDisabled}
        testID="next-button"
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Next step${isNextDisabled ? ', disabled on last step' : ''}`}
      >
        <Text
          style={[
            styles.buttonText,
            isNextDisabled && styles.buttonTextDisabled,
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
    backgroundColor: colors.buttonPrimary,
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
