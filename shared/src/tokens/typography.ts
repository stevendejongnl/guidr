/**
 * Typography design tokens
 * Font sizes, weights, and families
 */

export const typography = {
  // Font family
  fontFamily: 'Inter',

  // Font sizes (in dp/px)
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
} as const

export type TypographyToken = keyof typeof typography
export type FontWeightToken =
  | typeof typography.weightNormal
  | typeof typography.weightMedium
  | typeof typography.weightSemibold
  | typeof typography.weightBold
