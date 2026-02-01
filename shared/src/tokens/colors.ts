/**
 * Color design tokens
 * Dark mode theme for Guidr
 * All colors are exported as const for type safety and IntelliSense
 */

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
} as const

export type ColorToken = keyof typeof colors
