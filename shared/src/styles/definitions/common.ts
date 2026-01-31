/**
 * Platform-agnostic common/global style definitions
 * These are the most frequently used styles across the app
 */

import { colors, spacing, typography, borderRadius, componentDefaults } from '../../tokens'

export const commonDefinitions = {
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  containerTop: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  contentCentered: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  // Typography
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  titleLarge: {
    fontSize: typography.sizeXxxl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizeLg,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  descriptionCentered: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },

  // Inputs
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizeMd,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.borderError,
  },

  // Buttons
  button: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.md,
    minHeight: componentDefaults.buttonHeight,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  buttonSecondary: {
    backgroundColor: colors.buttonSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.textMuted,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  buttonTextMuted: {
    color: colors.textSecondary,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },

  // Feedback
  errorText: {
    color: colors.danger,
    fontSize: typography.sizeSm,
    marginBottom: spacing.lg,
  },
  successText: {
    color: colors.success,
    fontSize: typography.sizeSm,
    marginTop: spacing.sm,
  },
  warningText: {
    color: colors.warning,
    fontSize: typography.sizeSm,
  },

  // Loading
  activityIndicator: {
    marginRight: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  // Sections
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: componentDefaults.cardPadding,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Links
  link: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.sizeSm,
    textDecorationLine: 'underline',
  },
}
