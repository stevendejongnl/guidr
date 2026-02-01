/**
 * Session API type definitions and validators
 */

import typia from 'typia'

/**
 * Session status type
 */
export type SessionStatus = 'not-started' | 'in-progress' | 'paused' | 'completed'

/**
 * Session DTO (API response)
 */
export interface SessionDto {
  id: string
  guideId: string
  userId: string
  status: SessionStatus
  currentStepPosition: number | null
  totalDuration: number
  completedDuration: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Session create request
 */
export interface SessionCreateRequest {
  guideId: string
}

/**
 * Session update request (partial)
 */
export interface SessionUpdateRequest {
  status?: SessionStatus
  currentStepPosition?: number | null
  completedDuration?: number
  completedAt?: string | null
}

/**
 * Typia validators
 */
export const validateSessionDto = typia.createAssert<SessionDto>()
export const validateSessionList = typia.createAssert<SessionDto[]>()
export const validateSessionCreateRequest = typia.createAssert<SessionCreateRequest>()
export const validateSessionUpdateRequest = typia.createAssert<SessionUpdateRequest>()

/**
 * Type guards
 */
export const isSessionDto = typia.createIs<SessionDto>()
