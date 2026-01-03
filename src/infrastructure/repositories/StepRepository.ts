import { Step } from '@domain/entities/Step'
import { IStepRepository } from '@domain/repositories/IStepRepository'
import { EntityCache } from '../storage/EntityCache'
import { StepMapper } from '../mappers/StepMapper'
import type { StepDto, StepCreateRequest, StepUpdateRequest } from '../api/dtos/StepDto'

/**
 * HTTP-based implementation of IStepRepository with AsyncStorage caching.
 *
 * Features:
 * - AsyncStorage caching with 5-minute TTL
 * - JWT authentication via Bearer token
 * - Automatic cache invalidation on writes
 * - Preserves step order from API (sorted by order field)
 *
 * Cache keys:
 * - Single: Guidr_Cache_Step_{id}
 * - List all: Guidr_Cache_Step_List_all
 * - List by guide: Guidr_Cache_Step_List_guide_{guideId}
 */
export class StepRepository implements IStepRepository {
  private readonly cache: EntityCache<StepDto>
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    this.apiBaseUrl = `${serverUrl.replace(/\/$/, '')}/api/v1`
    this.cache = new EntityCache<StepDto>('Step', 5 * 60 * 1000) // 5 min TTL
  }

  async findById(id: string, authToken: string): Promise<Step | null> {
    // Check cache first
    const cached = await this.cache.get(id)
    if (cached) {
      return StepMapper.toDomain(cached)
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/steps/${id}`, {
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
        throw new Error(errorData.detail || 'Failed to fetch step')
      }

      const dto: StepDto = await response.json()

      // Cache the result
      await this.cache.set(id, dto)

      return StepMapper.toDomain(dto)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching step')
    }
  }

  async findAll(authToken: string): Promise<Step[]> {
    // Check cache first
    const cached = await this.cache.get('List_all')
    if (cached) {
      return (cached as unknown as StepDto[]).map(dto => StepMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/steps`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch steps')
      }

      const dtos: StepDto[] = await response.json()

      // Cache the list
      await this.cache.set('List_all', dtos as any)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => StepMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching steps')
    }
  }

  async findByGuideId(guideId: string, authToken: string): Promise<Step[]> {
    const cacheKey = `List_guide_${guideId}`

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as StepDto[]).map(dto => StepMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/steps?guideId=${guideId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch steps by guide')
      }

      const dtos: StepDto[] = await response.json()

      // Cache the list (API returns sorted by order field)
      await this.cache.set(cacheKey, dtos as any)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => StepMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching steps by guide')
    }
  }

  async save(step: Step, authToken: string): Promise<void> {
    try {
      // Check if step exists
      const existing = await this.findById(step.id, authToken)

      if (existing) {
        // Update existing step (PATCH)
        const updateRequest: StepUpdateRequest = StepMapper.toUpdateRequest(step)

        const response = await fetch(`${this.apiBaseUrl}/steps/${step.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to update step')
        }

        const dto: StepDto = await response.json()

        // Update cache
        await this.cache.set(step.id, dto)
      } else {
        // Create new step (POST)
        const createRequest: StepCreateRequest = StepMapper.toCreateRequest(
          step.guideId,
          step.order,
          step.title,
          step.description,
          step.duration
        )

        const response = await fetch(`${this.apiBaseUrl}/steps`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to create step')
        }

        const dto: StepDto = await response.json()

        // Cache the new step
        await this.cache.set(step.id, dto)
      }

      // Invalidate list caches
      await this.cache.remove('List_all')
      await this.cache.remove(`List_guide_${step.guideId}`)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while saving step')
    }
  }

  async delete(id: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/steps/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      // 404 is acceptable - step already deleted
      if (response.status === 404) {
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete step')
      }

      // Invalidate caches
      await this.cache.remove(id)
      await this.cache.remove('List_all')
      // Note: We don't know the guideId, so we can't specifically invalidate that list
      // The TTL will eventually clear stale data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while deleting step')
    }
  }
}
