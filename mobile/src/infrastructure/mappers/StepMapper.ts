import { Step } from '@domain/entities/Step'
import type { StepDto, StepCreateRequest, StepUpdateRequest } from '../api/dtos/StepDto'

/**
 * Mapper for converting between Step domain entity and API DTOs.
 *
 * NOTE: Domain entities set createdAt/updatedAt in constructor.
 * When mapping from API DTO to domain entity, timestamps will be reset to current time.
 * This is a known limitation - functional behavior is unaffected (all business data preserved).
 */
export class StepMapper {
  /**
   * Convert API DTO to domain entity.
   * Note: timestamps will be reset to current time due to entity constructor behavior.
   * Duration defaults to 0 if null in API response.
   */
  static toDomain(dto: StepDto): Step {
    return new Step(
      dto.id,
      dto.guideId,
      dto.order,
      dto.title,
      dto.duration ?? 0, // Default to 0 if null
      dto.description ?? undefined
    )
  }

  /**
   * Convert domain entity to API DTO format.
   * Used for caching and verification.
   */
  static toDto(step: Step): StepDto {
    const dur = step.duration ?? null
    return {
      id: step.id,
      guideId: step.guideId,
      order: step.order,
      title: step.title,
      description: step.description ?? null,
      duration: dur,
      durationMinutes: dur != null ? Math.floor(dur / 60) : null,
      durationSecondsRemainder: dur != null ? dur % 60 : null,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    }
  }

  /**
   * Convert to API create request format.
   */
  static toCreateRequest(
    guideId: string,
    order: number,
    title: string,
    description?: string,
    duration?: number
  ): StepCreateRequest {
    return {
      guideId,
      order,
      title,
      description: description ?? null,
      duration: duration ?? null,
    }
  }

  /**
   * Convert step to API update request format.
   * Only includes mutable fields.
   */
  static toUpdateRequest(step: Step): StepUpdateRequest {
    return {
      order: step.order,
      title: step.title,
      description: step.description ?? null,
      duration: step.duration ?? null,
    }
  }
}
