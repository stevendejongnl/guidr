import { Guide } from '@domain/entities/Guide'
import type { GuideDto, GuideCreateRequest, GuideUpdateRequest } from '../api/dtos/GuideDto'

/**
 * Mapper for converting between Guide domain entity and API DTOs.
 *
 * NOTE: Domain entities set createdAt/updatedAt in constructor.
 * When mapping from API DTO to domain entity, timestamps will be reset to current time.
 * This is a known limitation - functional behavior is unaffected (all business data preserved).
 */
export class GuideMapper {
  /**
   * Convert API DTO to domain entity.
   * Reconstructs stepIds array from API response.
   * Note: timestamps will be reset to current time due to entity constructor behavior.
   */
  static toDomain(dto: GuideDto): Guide {
    const guide = new Guide(
      dto.id,
      dto.guideType,
      dto.title,
      dto.description ?? undefined,
      dto.createdByUserId,
      dto.isPublic,
      dto.isHighlighted,
      dto.metadata ?? undefined,
      dto.language ?? 'en',
      dto.totalDuration ?? undefined
    )

    // Reconstruct stepIds array
    dto.stepIds.forEach(stepId => {
      guide.addStep(stepId)
    })

    return guide
  }

  /**
   * Convert domain entity to API DTO format.
   * Used for caching and verification.
   */
  static toDto(guide: Guide): GuideDto {
    return {
      id: guide.id,
      guideType: guide.guideType,
      title: guide.title,
      description: guide.description ?? null,
      metadata: guide.metadata ?? null,
      stepIds: guide.stepIds,
      createdAt: guide.createdAt.toISOString(),
      updatedAt: guide.updatedAt.toISOString(),
      createdByUserId: guide.createdByUserId,
      isPublic: guide.isPublic,
      isHighlighted: guide.isHighlighted,
      language: guide.language,
      totalDuration: guide.totalDuration ?? null,
    }
  }

  /**
   * Convert to API create request format.
   */
  static toCreateRequest(
    guideType: string,
    title: string,
    description?: string,
    isPublic: boolean = false,
    metadata?: Record<string, unknown>,
    language: string = 'en'
  ): GuideCreateRequest {
    return {
      guideType,
      title,
      description: description ?? null,
      metadata: metadata ?? null,
      isPublic,
      language,
    }
  }

  /**
   * Convert guide to API update request format.
   * Only includes mutable fields.
   */
  static toUpdateRequest(guide: Guide): GuideUpdateRequest {
    return {
      title: guide.title,
      description: guide.description ?? null,
      metadata: guide.metadata ?? null,
      isPublic: guide.isPublic,
      isHighlighted: guide.isHighlighted,
      language: guide.language,
    }
  }
}
