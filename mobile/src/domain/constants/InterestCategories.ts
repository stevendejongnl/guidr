/**
 * Interest categories for user profile.
 *
 * These categories help personalize the app experience based on user use cases.
 * Categories are synchronized with the backend (api-server/src/domain/constants.py).
 */

export interface InterestCategory {
  id: string
  label: string
}

export const INTEREST_CATEGORIES: readonly InterestCategory[] = [
  { id: 'baking', label: 'Baking' },
  { id: 'cooking', label: 'Cooking' },
  { id: 'sports', label: 'Sports & Fitness' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'crafts', label: 'Arts & Crafts' },
  { id: 'diy', label: 'DIY & Home Improvement' },
  { id: 'beauty', label: 'Beauty & Skincare' },
  { id: 'music', label: 'Music Practice' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'meditation', label: 'Meditation & Wellness' },
  { id: 'study', label: 'Study & Learning' },
] as const

/**
 * Get label for an interest category ID.
 *
 * @param id Interest category ID
 * @returns Label or undefined if not found
 */
export function getInterestLabel(id: string): string | undefined {
  return INTEREST_CATEGORIES.find(category => category.id === id)?.label
}

/**
 * Validate if an ID is a valid interest category.
 *
 * @param id Interest category ID to validate
 * @returns true if valid
 */
export function isValidInterestId(id: string): boolean {
  return INTEREST_CATEGORIES.some(category => category.id === id)
}
