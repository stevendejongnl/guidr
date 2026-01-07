export interface Guide {
  id: string
  name: string
  description: string
  category_id: string
  step_ids: string[]
}

export interface CreateGuideRequest {
  name: string
  description: string
  category_id: string
}

export interface UpdateGuideRequest {
  name?: string
  description?: string
  category_id?: string
}
