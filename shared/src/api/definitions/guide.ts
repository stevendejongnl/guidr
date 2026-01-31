/**
 * Guide API type definitions and validators
 */

import typia from 'typia'

/**
 * Guide DTO (API response)
 */
export interface GuideDto {
  id: string
  categoryId: string
  title: string
  description: string | null
  stepIds: string[]
  createdAt: string
  updatedAt: string
  createdByUserId: string | undefined
  isPublic: boolean
  isHighlighted: boolean
}

/**
 * Guide create request
 */
export interface GuideCreateRequest {
  categoryId: string
  title: string
  description: string | null
  isPublic: boolean
  isHighlighted: boolean
}

/**
 * Guide update request (partial)
 */
export interface GuideUpdateRequest {
  title?: string
  description?: string | null
  categoryId?: string
  isPublic?: boolean
  isHighlighted?: boolean
}

/**
 * Typia validators (compile-time generated)
 */
export const validateGuideDto = typia.createAssert<GuideDto>()
export const validateGuideList = typia.createAssert<GuideDto[]>()
export const validateGuideCreateRequest = typia.createAssert<GuideCreateRequest>()
export const validateGuideUpdateRequest = typia.createAssert<GuideUpdateRequest>()

/**
 * Type guards
 */
export const isGuideDto = typia.createIs<GuideDto>()
