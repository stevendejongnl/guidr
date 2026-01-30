import { Guide } from '../../domain/entities/Guide'

export interface GuideViewModel {
  // Domain fields
  id: string
  categoryId: string
  title: string
  description?: string
  stepCount: number
  createdAt: Date
  updatedAt: Date
  createdByUserId: string | undefined
  isPublic: boolean
  isHighlighted: boolean

  // UI-specific fields
  categoryName: string
  thumbnailEmoji: string

  // Future features (currently optional)
  duration?: number
  imageUrl?: string
  rating?: number
  ratingCount?: number
  currentStep?: number
  status?: 'completed' | 'in-progress' | 'paused' | 'not-started'
}

/**
 * Generate a consistent emoji for a guide title based on hash
 */
function generateThumbnailEmoji(title: string): string {
  const emojis = [
    '📚', '🎓', '🧑‍🎓', '📖', '✏️', '📝', '📋', '🎯', '🏆', '⭐',
    '🔥', '💡', '🌟', '🎨', '🎭', '🎬', '🎪', '🎸', '🎹', '🎺',
    '🏃', '🧘', '🏋️', '⚽', '🏀', '🎾', '🏐', '🏈', '⛳', '🏊',
    '👨‍💻', '👩‍💻', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '🚀', '✈️', '🚁', '🚂',
  ]

  // Simple hash function based on title
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  const index = Math.abs(hash) % emojis.length
  return emojis[index] ?? '📚'
}

export function createGuideViewModel(guide: Guide, categoryName: string): GuideViewModel {
  const vm: GuideViewModel = {
    // Domain fields
    id: guide.id,
    categoryId: guide.categoryId,
    title: guide.title,
    stepCount: guide.stepCount,
    createdAt: guide.createdAt,
    updatedAt: guide.updatedAt,
    createdByUserId: guide.createdByUserId,
    isPublic: guide.isPublic,
    isHighlighted: guide.isHighlighted,

    // UI-specific fields
    categoryName,
    thumbnailEmoji: generateThumbnailEmoji(guide.title),
  }

  if (guide.description !== undefined) {
    vm.description = guide.description
  }

  return vm
}
