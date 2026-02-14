export interface Guide {
  id: string
  guideType: string
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  stepIds: string[]
  createdByUserId: string | null
  isPublic: boolean
  isHighlighted: boolean
  language?: string
  createdAt: string
  updatedAt: string
}

export interface CreateGuideRequest {
  guideType: string
  title: string
  description?: string
  isPublic?: boolean
  language?: string
}

export interface UpdateGuideRequest {
  title?: string
  description?: string
  isPublic?: boolean
  isHighlighted?: boolean
  guideType?: string
  createdByUserId?: string
  language?: string
  metadata?: Record<string, unknown> | null
}
