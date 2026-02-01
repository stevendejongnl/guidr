import { Category } from '@domain/entities/Category'
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository'
import { EntityCache } from '../storage/EntityCache'
import { CategoryMapper } from '../mappers/CategoryMapper'
import { ValidatedHttpClient, ApiError, ValidationError } from '@guidr/shared/api/adapters/fetch'
import {
  validateCategoryDto,
  validateCategoryList,
  validateCategoryCreateRequest,
  validateCategoryUpdateRequest,
} from '@guidr/shared/api/definitions'
import type { CategoryDto, CategoryCreateRequest, CategoryUpdateRequest } from '@guidr/shared/api/definitions'

/**
 * HTTP-based implementation of ICategoryRepository with AsyncStorage caching.
 *
 * Features:
 * - ValidatedHttpClient with Typia runtime validation
 * - AsyncStorage caching with 5-minute TTL
 * - JWT authentication via Bearer token
 * - Automatic cache invalidation on writes
 *
 * Cache keys:
 * - Single: Guidr_Cache_Category_{id}
 * - List all: Guidr_Cache_Category_List_all
 * - List by parent: Guidr_Cache_Category_List_parent_{parentId}
 */
export class CategoryRepository implements ICategoryRepository {
  private readonly cache: EntityCache<CategoryDto>
  private readonly httpClient: ValidatedHttpClient

  constructor(serverUrl: string, getAuthToken?: () => Promise<string | null>) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }

    const apiBaseUrl = `${serverUrl.replace(/\/$/, '')}/api/v1`

    // Initialize HTTP client with auth callback
    this.httpClient = new ValidatedHttpClient({
      baseUrl: apiBaseUrl,
      getAuthToken: getAuthToken ?? (async () => null),
    })

    this.cache = new EntityCache<CategoryDto>('Category', 5 * 60 * 1000) // 5 min TTL
  }

  async findById(id: string, _authToken?: string): Promise<Category | null> {
    // Check cache first
    const cached = await this.cache.get(id)
    if (cached) {
      return CategoryMapper.toDomain(cached)
    }

    // Fetch from API with validation
    try {
      const dto = await this.httpClient.get(
        `/categories/${id}`,
        validateCategoryDto
      )

      // Cache the result
      await this.cache.set(id, dto)

      return CategoryMapper.toDomain(dto)
    } catch (error) {
      // 404 is handled as not found
      if (error instanceof ApiError && error.status === 404) {
        return null
      }

      if (error instanceof ValidationError) {
        throw new Error(`Invalid category data from API: ${error.message}`)
      }

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while fetching category')
    }
  }

  async findAll(_authToken?: string): Promise<Category[]> {
    // Check cache first
    const cached = await this.cache.get('List_all')
    if (cached) {
      return (cached as unknown as CategoryDto[]).map(dto => CategoryMapper.toDomain(dto))
    }

    // Fetch from API with validation
    try {
      const dtos = await this.httpClient.get(
        '/categories',
        validateCategoryList
      )

      // Cache the list
      await this.cache.set('List_all', dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => CategoryMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`Invalid category list from API: ${error.message}`)
      }

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while fetching categories')
    }
  }

  async findByParentId(parentId: string | null, _authToken?: string): Promise<Category[]> {
    const cacheKey = `List_parent_${parentId ?? 'null'}`

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as CategoryDto[]).map(dto => CategoryMapper.toDomain(dto))
    }

    // Fetch from API with validation
    try {
      const queryParam = parentId === null ? 'null' : parentId
      const dtos = await this.httpClient.get(
        `/categories?parentId=${queryParam}`,
        validateCategoryList
      )

      // Cache the list
      await this.cache.set(cacheKey, dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => CategoryMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`Invalid category list from API: ${error.message}`)
      }

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while fetching categories by parent')
    }
  }

  async save(category: Category, _authToken?: string): Promise<void> {
    try {
      // Check if category exists
      const existing = await this.findById(category.id)

      if (existing) {
        // Update existing category (PATCH)
        const updateRequest: CategoryUpdateRequest = CategoryMapper.toUpdateRequest(category)

        const dto = await this.httpClient.patch(
          `/categories/${category.id}`,
          updateRequest,
          validateCategoryUpdateRequest,
          validateCategoryDto
        )

        // Update cache
        await this.cache.set(category.id, dto)
      } else {
        // Create new category (POST)
        const createRequest: CategoryCreateRequest = CategoryMapper.toCreateRequest(
          category.name,
          category.parentId
        )

        const dto = await this.httpClient.post(
          '/categories',
          createRequest,
          validateCategoryCreateRequest,
          validateCategoryDto
        )

        // Cache the new category
        await this.cache.set(category.id, dto)
      }

      // Invalidate list caches
      await this.cache.remove('List_all')
      await this.cache.remove(`List_parent_${category.parentId ?? 'null'}`)
      await this.cache.remove('List_parent_null')
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`Invalid category data from API: ${error.message}`)
      }

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while saving category')
    }
  }

  async delete(id: string, _authToken?: string): Promise<void> {
    try {
      // DELETE endpoint typically returns no content
      await this.httpClient.delete(`/categories/${id}`)

      // Invalidate caches
      await this.cache.remove(id)
      await this.cache.remove('List_all')
      // Note: We don't know the parentId, so we can't specifically invalidate that list
      // The TTL will eventually clear stale data
    } catch (error) {
      // 404 is acceptable - category already deleted
      if (error instanceof ApiError && error.status === 404) {
        return
      }

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while deleting category')
    }
  }
}
