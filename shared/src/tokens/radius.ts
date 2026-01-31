/**
 * Border radius design tokens
 * Mobile-first: values in dp/px
 */

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const

export type BorderRadiusToken = keyof typeof borderRadius
