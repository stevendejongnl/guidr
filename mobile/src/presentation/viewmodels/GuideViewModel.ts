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
  createdByName?: string
  isPublic: boolean
  isHighlighted: boolean

  // UI-specific fields
  guideTypeLabel: string

  // Future features (currently optional)
  duration?: number
  imageUrl?: string
  rating?: number
  ratingCount?: number
  currentStep?: number
  status?: 'completed' | 'in-progress' | 'paused' | 'not-started'
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
  }

  if (guide.description !== undefined) {
    vm.description = guide.description
  }

  if (guide.createdByName !== undefined) {
    vm.createdByName = guide.createdByName
  }

  if (guide.totalDuration !== undefined && guide.totalDuration > 0) {
    vm.duration = Math.round(guide.totalDuration / 60)
  }

  return vm
}
