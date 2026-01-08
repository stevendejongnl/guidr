import { StyleSheet } from 'react-native'

// =============================================================================
// Design Tokens (Root Variables)
// =============================================================================

// Dark mode colors (default theme)
// To add light mode later: create lightColors object and switch via settings
export const colors = {
  // Backgrounds
  background: '#121212',
  surface: '#1e1e1e',
  surfaceLight: '#2a2a2a',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#b3b3b3',
  textMuted: '#808080',

  // Interactive
  primary: '#2196f3',
  primaryDisabled: '#1565c0',
  danger: '#f44336',
  success: '#4caf50',
  warning: '#ff9800',

  // Inputs & Borders
  inputBackground: '#2a2a2a',
  border: '#404040',
  borderError: '#f44336',

  // Buttons
  buttonSecondary: '#757575',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
}

export const typography = {
  // Font sizes
  sizeXs: 12,
  sizeSm: 14,
  sizeMd: 16,
  sizeLg: 18,
  sizeXl: 24,
  sizeXxl: 28,
  sizeXxxl: 32,

  // Font weights
  weightNormal: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: 'bold' as const,
}

// =============================================================================
// Common Styles
// =============================================================================

export const commonStyles = StyleSheet.create({
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
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
})

