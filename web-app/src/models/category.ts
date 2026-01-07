export interface Category {
  id: string
  name: string
  parent_id: string | null
}

export interface CreateCategoryRequest {
  name: string
  parent_id?: string | null
}

export interface UpdateCategoryRequest {
  name?: string
  parent_id?: string | null
}
