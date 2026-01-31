/**
 * Spacing design tokens
 * Mobile-first: values in dp/px
 * Web CSS units: use spacingWeb for CSS-in-JS
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

export type SpacingToken = keyof typeof spacing

/**
 * Web-friendly spacing tokens (CSS units as strings)
 * Use this in Lit components and web CSS
 */
export const spacingWeb = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
} as const
