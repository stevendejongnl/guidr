/**
 * Component-specific design tokens
 * Commonly used dimensions and defaults for UI components
 */

export const componentDefaults = {
  cardPadding: 16,
  chipHeight: 28,
  buttonHeight: 44,
  listItemMinHeight: 72,
} as const

export type ComponentDefaultToken = keyof typeof componentDefaults

/**
 * Icon design tokens
 */
export const iconTokens = {
  sizeSm: 16,
  sizeMd: 20,
  sizeLg: 24,
  strokeWidth: 1.5,
} as const

export type IconToken = keyof typeof iconTokens

/**
 * Node/Path design tokens (for progress indicators)
 */
export const nodeTokens = {
  size: 6,
  activeSize: 8,
  spacing: 8,
  lineWidth: 1.5,
} as const

export type NodeToken = keyof typeof nodeTokens
