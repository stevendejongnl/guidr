/**
 * API DTO for Guide entity.
 * Matches the api-server response format (camelCase).
 */
export interface GuideDto {
  id: string
  guideType: string
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  stepIds: string[]
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  createdByUserId: string | undefined // Optional for backward compatibility
  isPublic: boolean
  isHighlighted: boolean
}

/**
 * Request body for creating a new guide.
 */
export interface GuideCreateRequest {
  guideType: string
  title: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  isPublic?: boolean // Default: false
}

/**
 * Request body for updating an existing guide.
 * All fields are optional (PATCH).
 */
export interface GuideUpdateRequest {
  title?: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  isPublic?: boolean
  isHighlighted?: boolean
}
