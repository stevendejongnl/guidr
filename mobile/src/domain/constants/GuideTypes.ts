export const GUIDE_TYPES = {
  COOKING: 'cooking',
  WORKOUT: 'workout',
  GENERAL: 'general',
} as const

export type GuideType = (typeof GUIDE_TYPES)[keyof typeof GUIDE_TYPES]

export const ALL_GUIDE_TYPES: GuideType[] = [
  GUIDE_TYPES.COOKING,
  GUIDE_TYPES.WORKOUT,
  GUIDE_TYPES.GENERAL,
]

export const GUIDE_TYPE_LABELS: Record<GuideType, string> = {
  [GUIDE_TYPES.COOKING]: 'Cooking',
  [GUIDE_TYPES.WORKOUT]: 'Workout',
  [GUIDE_TYPES.GENERAL]: 'General',
}

export function isValidGuideType(value: string): value is GuideType {
  return ALL_GUIDE_TYPES.includes(value as GuideType)
}
