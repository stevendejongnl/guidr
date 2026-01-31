/**
 * Platform-agnostic form style definitions
 */

import { colors, spacing, typography, borderRadius } from '../../tokens'

export const formDefinitions = {
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
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  singlelineInput: {
    minHeight: 44,
  },

  // Read-only display containers
  readOnlyContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'center',
  },
  categoryReadOnly: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    justifyContent: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    backgroundColor: colors.background,
  },
  formContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  // Centered form layouts
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}

export type FormFieldSize = 'small' | 'medium' | 'large'
