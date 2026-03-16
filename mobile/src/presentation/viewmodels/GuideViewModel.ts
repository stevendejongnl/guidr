import { Guide } from '../../domain/entities/Guide'
import { GUIDE_TYPE_LABELS, type GuideType } from '../../domain/constants/GuideTypes'

export interface GuideViewModel {
  // Domain fields
  id: string
  guideType: string
  title: string
  description?: string
  stepCount: number
  createdAt: Date
  updatedAt: Date
  createdByUserId: string | undefined
  isPublic: boolean
  isHighlighted: boolean

  // UI-specific fields
  guideTypeLabel: string
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

export function createGuideViewModel(guide: Guide): GuideViewModel {
  const guideTypeLabel = GUIDE_TYPE_LABELS[guide.guideType as GuideType] || guide.guideType

  const vm: GuideViewModel = {
    // Domain fields
    id: guide.id,
    guideType: guide.guideType,
    title: guide.title,
    stepCount: guide.stepCount,
    createdAt: guide.createdAt,
    updatedAt: guide.updatedAt,
    createdByUserId: guide.createdByUserId,
    isPublic: guide.isPublic,
    isHighlighted: guide.isHighlighted,

    // UI-specific fields
    guideTypeLabel,
    thumbnailEmoji: generateThumbnailEmoji(guide.title),
  }

  if (guide.description !== undefined) {
    vm.description = guide.description
  }

  if (guide.totalDuration !== undefined && guide.totalDuration > 0) {
    vm.duration = Math.round(guide.totalDuration / 60)
  }

  return vm
}
