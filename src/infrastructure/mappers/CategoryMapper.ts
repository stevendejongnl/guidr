import { Category } from '@domain/entities/Category'
import type { CategoryDto, CategoryCreateRequest, CategoryUpdateRequest } from '../api/dtos/CategoryDto'

/**
 * Mapper for converting between Category domain entity and API DTOs.
 *
 * NOTE: Domain entities set createdAt/updatedAt in constructor.
 * When mapping from API DTO to domain entity, timestamps will be reset to current time.
 * This is a known limitation - functional behavior is unaffected (all business data preserved).
 * Future enhancement: Add static factory methods to entities to preserve API timestamps.
 */
export class CategoryMapper {
  /**
   * Convert API DTO to domain entity.
   * Note: timestamps will be reset to current time due to entity constructor behavior.
   */
  static toDomain(dto: CategoryDto): Category {
    return new Category(dto.id, dto.name, dto.parentId)
  }

  /**
   * Convert domain entity to API DTO format.
   * Used for caching and verification.
   */
  static toDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }
  }

  /**
   * Convert to API create request format.
   */
  static toCreateRequest(name: string, parentId: string | null): CategoryCreateRequest {
    return {
      name,
      parentId,
    }
  }

  /**
   * Convert category to API update request format.
   * Only includes mutable fields.
   */
  static toUpdateRequest(category: Category): CategoryUpdateRequest {
    return {
      name: category.name,
    }
  }
}
