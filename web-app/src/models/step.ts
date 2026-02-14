export interface Step {
  id: string
  guideId: string
  order: number
  title: string
  description: string | null
  duration: number | null // seconds
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
