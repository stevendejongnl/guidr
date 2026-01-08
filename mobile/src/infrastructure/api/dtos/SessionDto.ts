/**
 * API DTO for Session entity.
 * Matches the api-server response format (camelCase).
 */
export interface SessionDto {
  id: string
  guideId: string
  status: 'NotStarted' | 'InProgress' | 'Paused' | 'Completed' | 'Cancelled'
  startedAt: string | null // ISO 8601
  completedAt: string | null // ISO 8601
  currentStepId: string | null
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

/**
 * Request body for creating a new session.
 */
export interface SessionCreateRequest {
  guideId: string
}

/**
 * Request body for moveToStep action.
 */
export interface MoveToStepRequest {
  stepId: string
}
