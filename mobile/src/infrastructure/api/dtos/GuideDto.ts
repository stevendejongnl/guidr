/**
 * API DTO for Guide entity.
 * Matches the api-server response format (camelCase).
 */
export interface GuideDto {
  id: string
  categoryId: string
  title: string
  description: string | null
  stepIds: string[]
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

/**
 * Request body for creating a new guide.
 */
export interface GuideCreateRequest {
  categoryId: string
  title: string
  description?: string | null
}

/**
 * Request body for updating an existing guide.
 * All fields are optional (PATCH).
 */
export interface GuideUpdateRequest {
  title?: string
  description?: string | null
}
