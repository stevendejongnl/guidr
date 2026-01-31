/**
 * Motion/Animation design tokens
 * Durations in milliseconds
 */

export const motionTokens = {
  fast: 120,
  base: 180,
  slow: 240,
} as const

export type MotionToken = keyof typeof motionTokens
