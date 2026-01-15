import { Category } from '@domain/entities/Category'
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository'
import { EntityCache } from '../storage/EntityCache'
import { CategoryMapper } from '../mappers/CategoryMapper'
import type { CategoryDto, CategoryCreateRequest, CategoryUpdateRequest } from '../api/dtos/CategoryDto'

/**
 * HTTP-based implementation of ICategoryRepository with AsyncStorage caching.
 *
 * Features:
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
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    this.apiBaseUrl = `${serverUrl.replace(/\/$/, '')}/api/v1`
    this.cache = new EntityCache<CategoryDto>('Category', 5 * 60 * 1000) // 5 min TTL
  }

  async findById(id: string, authToken: string): Promise<Category | null> {
    // Check cache first
    const cached = await this.cache.get(id)
    if (cached) {
      return CategoryMapper.toDomain(cached)
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/categories/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch category')
      }

      const dto: CategoryDto = await response.json()

      // Cache the result
      await this.cache.set(id, dto)

      return CategoryMapper.toDomain(dto)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching category')
    }
  }

  async findAll(authToken: string): Promise<Category[]> {
    // Check cache first
    const cached = await this.cache.get('List_all')
    if (cached) {
      return (cached as unknown as CategoryDto[]).map(dto => CategoryMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch categories')
      }

      const dtos: CategoryDto[] = await response.json()

      // Cache the list
      await this.cache.set('List_all', dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => CategoryMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching categories')
    }
  }

  async findByParentId(parentId: string | null, authToken: string): Promise<Category[]> {
    const cacheKey = `List_parent_${parentId ?? 'null'}`

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as CategoryDto[]).map(dto => CategoryMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const url = parentId === null
        ? `${this.apiBaseUrl}/categories?parentId=null`
        : `${this.apiBaseUrl}/categories?parentId=${parentId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch categories by parent')
      }

      const dtos: CategoryDto[] = await response.json()

      // Cache the list
      await this.cache.set(cacheKey, dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => CategoryMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching categories by parent')
    }
  }

  async save(category: Category, authToken: string): Promise<void> {
    try {
      // Check if category exists
      const existing = await this.findById(category.id, authToken)

      if (existing) {
        // Update existing category (PATCH)
        const updateRequest: CategoryUpdateRequest = CategoryMapper.toUpdateRequest(category)

        const response = await fetch(`${this.apiBaseUrl}/categories/${category.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to update category')
        }

        const dto: CategoryDto = await response.json()

        // Update cache
        await this.cache.set(category.id, dto)
      } else {
        // Create new category (POST)
        const createRequest: CategoryCreateRequest = CategoryMapper.toCreateRequest(
          category.name,
          category.parentId
        )

        const response = await fetch(`${this.apiBaseUrl}/categories`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to create category')
        }

        const dto: CategoryDto = await response.json()

        // Cache the new category
        await this.cache.set(category.id, dto)
      }

      // Invalidate list caches
      await this.cache.remove('List_all')
      await this.cache.remove(`List_parent_${category.parentId ?? 'null'}`)
      await this.cache.remove('List_parent_null')
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while saving category')
    }
  }

  async delete(id: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      // 404 is acceptable - category already deleted
      if (response.status === 404) {
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete category')
      }

      // Invalidate caches
      await this.cache.remove(id)
      await this.cache.remove('List_all')
      // Note: We don't know the parentId, so we can't specifically invalidate that list
      // The TTL will eventually clear stale data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while deleting category')
    }
  }
}
