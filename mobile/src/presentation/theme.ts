import { StyleSheet } from 'react-native'

// =============================================================================
// Design Tokens (Root Variables)
// =============================================================================

// Dark mode colors (default theme)
// To add light mode later: create lightColors object and switch via settings
export const colors = {
  // Backgrounds
  background: '#0B0F14',
  surface: '#121923',
  card: '#182233',
  cardElevated: '#1E2A3A',

  // Legacy aliases (deprecated, use above)
  surfaceLight: '#182233',

  // Brand
  primary: '#9AF5CF', // Mint green
  primaryMuted: '#5F8F7C',
  primarySubtle: '#3E5F54',
  primaryDisabled: '#5F8F7C',

  // Text
  textPrimary: '#E6EDF3',
  textSecondary: '#9AA4B2',
  textTertiary: '#6B7280',
  textDisabled: '#4B5563',

  // Legacy alias (deprecated, use textTertiary)
  textMuted: '#6B7280',

  // States
  success: '#4ADE80',
  danger: '#f44336',
  warning: '#FBBF24',
  paused: '#F59E0B',
  info: '#60A5FA',

  // Inputs & Borders
  inputBackground: '#182233',
  border: '#2A3A4D',
  borderError: '#f44336',

  // Buttons
  buttonPrimary: '#2E7D5C', // Darker green for button backgrounds (better contrast with white text)
  buttonSecondary: '#5F8F7C',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
}

export const typography = {
  // Font family
  fontFamily: 'Inter',

  // Font sizes
  sizeXs: 12,
  sizeSm: 14,
  sizeMd: 16,
  sizeLg: 18,
  sizeXl: 22,
  sizeXxl: 28,
  sizeDisplay: 28, // Alias for sizeXxl
  sizeXxxl: 32,

  // Font weights
  weightNormal: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: 'bold' as const,
}

// Icon design tokens
export const iconTokens = {
  sizeSm: 16,
  sizeMd: 20,
  sizeLg: 24,
  strokeWidth: 1.5,
}

// Node/Path design tokens (for progress indicators)
export const nodeTokens = {
  size: 6,
  activeSize: 8,
  spacing: 8,
  lineWidth: 1.5,
}

// Motion design tokens
export const motionTokens = {
  fast: 120,
  base: 180,
  slow: 240,
}

// Component defaults
export const componentDefaults = {
  cardPadding: 16,
  chipHeight: 28,
  buttonHeight: 44,
  listItemMinHeight: 72,
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
})

