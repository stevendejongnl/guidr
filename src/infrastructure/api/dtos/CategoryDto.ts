/**
 * API DTO for Category entity.
 * Matches the api-server response format (camelCase).
 */
export interface CategoryDto {
  id: string
  name: string
  parentId: string | null
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

/**
 * Request body for creating a new category.
 */
export interface CategoryCreateRequest {
  name: string
  parentId: string | null
}

/**
 * Request body for updating an existing category.
 * All fields are optional (PATCH).
 */
export interface CategoryUpdateRequest {
  name?: string
}
