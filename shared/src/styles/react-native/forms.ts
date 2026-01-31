/**
 * Form component styles for React Native
 * Reusable form patterns for input groups, toggles, labels, etc.
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native'
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../../tokens'

export const formStyles = StyleSheet.create({
  // Form screen/container
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  // Form groups and sections
  formGroup: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  formGroupCompact: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  toggleGroup: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Labels
  label: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  labelSmall: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  labelSecondary: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flex: 1,
  },

  // Input variations
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
    paddingTop: spacing.md,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  singlelineInput: {
    minHeight: 44,
  },

  // Read-only display containers
  readOnlyContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'center' as const,
  },
  categoryReadOnly: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    justifyContent: 'center' as const,
  },
  readOnlyText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
  },
  categoryReadOnlyText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
  },

  // Toggle/switch containers
  toggleContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  toggleLabel: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    flex: 1,
  },
  toggleHint: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flex: 1,
  },

  // Button groups
  buttonGroup: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  buttonGroupCompact: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  buttonInGroup: {
    marginTop: 0,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.md,
  },

  // Helper text and errors
  helperText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorHelper: {
    fontSize: typography.sizeSm,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  successHelper: {
    fontSize: typography.sizeSm,
    color: colors.success,
    marginTop: spacing.sm,
  },

  // Form container
  formContainer: {
    flex: 1 as const,
    backgroundColor: colors.background,
  },
  formContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  // Centered form layouts
  centerContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
})

export type FormFieldSize = 'small' | 'medium' | 'large'

/**
 * Get label style with optional sizing
 */
export const getLabelStyle = (
  size: FormFieldSize = 'medium'
): TextStyle => {
  switch (size) {
    case 'small':
      return formStyles.labelSmall as TextStyle
    case 'large':
      return formStyles.label as TextStyle
    default:
      return formStyles.label as TextStyle
  }
}

/**
 * Get input style with multiline support
 */
export const getInputFormStyle = (multiline: boolean = false): ViewStyle[] => {
  const styles: ViewStyle[] = []
  if (multiline) {
    styles.push(formStyles.multilineInput as ViewStyle)
  } else {
    styles.push(formStyles.singlelineInput as ViewStyle)
  }
  return styles
}

/**
 * Get form group spacing based on density
 */
export const getFormGroupStyle = (compact: boolean = false): ViewStyle => {
  return (compact ? formStyles.formGroupCompact : formStyles.formGroup) as ViewStyle
}

/**
 * Get button group spacing based on density
 */
export const getButtonGroupStyle = (compact: boolean = false): ViewStyle => {
  return (compact ? formStyles.buttonGroupCompact : formStyles.buttonGroup) as ViewStyle
}
