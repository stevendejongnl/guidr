export interface Step {
  id: string
  guideId: string
  order: number
  title: string
  description: string | null
  duration: number | null // seconds
  durationMinutes: number | null // floor(duration / 60)
  durationSecondsRemainder: number | null // duration % 60
  createdAt: string
  updatedAt: string
}

export interface CreateStepRequest {
  guideId: string
  order: number
  title: string
  description?: string | null
  duration?: number | null
}

export interface UpdateStepRequest {
  order?: number
  title?: string
  description?: string | null
  duration?: number | null
}
