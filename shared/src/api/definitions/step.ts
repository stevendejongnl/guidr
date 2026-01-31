/**
 * Step API type definitions and validators
 */

import typia from 'typia'

/**
 * Step DTO (API response)
 */
export interface StepDto {
  id: string
  guideId: string
  title: string
  description: string | null
  duration: number  // in minutes
  position: number
  createdAt: string
  updatedAt: string
}

/**
 * Step create request
 */
export interface StepCreateRequest {
  guideId: string
  title: string
  description: string | null
  duration: number
  position: number
}

/**
 * Step update request (partial)
 */
export interface StepUpdateRequest {
  title?: string
  description?: string | null
  duration?: number
  position?: number
}

/**
 * Typia validators
 */
export const validateStepDto = typia.createAssert<StepDto>()
export const validateStepList = typia.createAssert<StepDto[]>()
export const validateStepCreateRequest = typia.createAssert<StepCreateRequest>()
export const validateStepUpdateRequest = typia.createAssert<StepUpdateRequest>()

/**
 * Type guards
 */
export const isStepDto = typia.createIs<StepDto>()
