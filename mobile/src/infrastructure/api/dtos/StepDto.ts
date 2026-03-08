/**
 * API DTO for Step entity.
 * Matches the api-server response format (camelCase).
 */
export interface StepDto {
  id: string
  guideId: string
  order: number
  title: string
  description: string | null
  duration: number | null // seconds
  durationMinutes: number | null // floor(duration / 60)
  durationSecondsRemainder: number | null // duration % 60
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

/**
 * Request body for creating a new step.
 */
export interface StepCreateRequest {
  guideId: string
  order: number
  title: string
  description?: string | null
  duration?: number | null
}

/**
 * Request body for updating an existing step.
 * All fields are optional (PATCH).
 */
export interface StepUpdateRequest {
  order?: number
  title?: string
  description?: string | null
  duration?: number | null
}
