import { Guide } from '@domain/entities/Guide'
import { IGuideRepository, GuideWithStepsResult } from '@domain/repositories/IGuideRepository'
import { EntityCache } from '../storage/EntityCache'
import { GuideMapper } from '../mappers/GuideMapper'
import { StepMapper } from '../mappers/StepMapper'
import type { GuideDto, GuideCreateRequest, GuideUpdateRequest } from '../api/dtos/GuideDto'
import type { StepDto } from '../api/dtos/StepDto'

/**
 * HTTP-based implementation of IGuideRepository with AsyncStorage caching.
 *
 * Features:
 * - AsyncStorage caching with 5-minute TTL
 * - JWT authentication via Bearer token
 * - Automatic cache invalidation on writes
 *
 * Cache keys:
 * - Single: Guidr_Cache_Guide_{id}
 * - List all: Guidr_Cache_Guide_List_all
 * - List by type: Guidr_Cache_Guide_List_type_{guideType}
 */
export class GuideRepository implements IGuideRepository {
  private readonly cache: EntityCache<GuideDto>
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    this.apiBaseUrl = `${serverUrl.replace(/\/$/, '')}/api/v1`
    this.cache = new EntityCache<GuideDto>('Guide', 5 * 60 * 1000) // 5 min TTL
  }

  async findById(id: string, authToken: string): Promise<Guide | null> {
    // Check cache first
    const cached = await this.cache.get(id)
    if (cached) {
      return GuideMapper.toDomain(cached)
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/guides/${id}`, {
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
        throw new Error(errorData.detail || 'Failed to fetch guide')
      }

      const dto: GuideDto = await response.json()

      // Cache the result
      await this.cache.set(id, dto)

      return GuideMapper.toDomain(dto)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching guide')
    }
  }

  async findAll(authToken: string): Promise<Guide[]> {
    // Check cache first
    const cached = await this.cache.get('List_all')
    if (cached) {
      return (cached as unknown as GuideDto[]).map(dto => GuideMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/guides`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch guides')
      }

      const dtos: GuideDto[] = await response.json()

      // Cache the list
      await this.cache.set('List_all', dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => GuideMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching guides')
    }
  }

  async findByType(guideType: string, authToken: string): Promise<Guide[]> {
    const cacheKey = `List_type_${guideType}`

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as GuideDto[]).map(dto => GuideMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/guides?guideType=${guideType}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch guides by type')
      }

      const dtos: GuideDto[] = await response.json()

      // Cache the list
      await this.cache.set(cacheKey, dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => GuideMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching guides by type')
    }
  }

  async save(guide: Guide, authToken: string): Promise<void> {
    try {
      // Check if guide exists
      const existing = await this.findById(guide.id, authToken)

      if (existing) {
        // Update existing guide (PATCH)
        const updateRequest: GuideUpdateRequest = GuideMapper.toUpdateRequest(guide)

        const response = await fetch(`${this.apiBaseUrl}/guides/${guide.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to update guide')
        }

        const dto: GuideDto = await response.json()

        // Update cache
        await this.cache.set(guide.id, dto)
      } else {
        // Create new guide (POST)
        const createRequest: GuideCreateRequest = GuideMapper.toCreateRequest(
          guide.guideType,
          guide.title,
          guide.description,
          guide.isPublic,
          guide.metadata,
          guide.language
        )

        const response = await fetch(`${this.apiBaseUrl}/guides`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to create guide')
        }

        const dto: GuideDto = await response.json()

        // Cache the new guide
        await this.cache.set(guide.id, dto)
      }

      // Invalidate list caches
      await this.cache.remove('List_all')
      await this.cache.remove(`List_type_${guide.guideType}`)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while saving guide')
    }
  }

  async delete(id: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/guides/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      // 404 is acceptable - guide already deleted
      if (response.status === 404) {
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete guide')
      }

      // Invalidate caches
      await this.cache.remove(id)
      await this.cache.remove('List_all')
      // Note: We don't know the guideType, so we can't specifically invalidate that list
      // The TTL will eventually clear stale data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while deleting guide')
    }
  }

  async findMyGuides(authToken: string): Promise<Guide[]> {
    const cacheKey = 'List_myGuides'

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as GuideDto[]).map(dto => GuideMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/guides?my_guides=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch my guides')
      }

      const dtos: GuideDto[] = await response.json()

      // Cache the list
      await this.cache.set(cacheKey, dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => GuideMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching my guides')
    }
  }

  async findPublicGuides(authToken: string): Promise<Guide[]> {
    const cacheKey = 'List_publicGuides'

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as GuideDto[]).map(dto => GuideMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/guides?public=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch public guides')
      }

      const dtos: GuideDto[] = await response.json()

      // Cache the list
      await this.cache.set(cacheKey, dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => GuideMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching public guides')
    }
  }

  async findHighlightedGuides(authToken: string): Promise<Guide[]> {
    const cacheKey = 'List_highlightedGuides'

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as GuideDto[]).map(dto => GuideMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/guides?highlighted=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch highlighted guides')
      }

      const dtos: GuideDto[] = await response.json()

      // Cache the list
      await this.cache.set(cacheKey, dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => GuideMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching highlighted guides')
    }
  }

  async copyToLanguage(
    guideId: string,
    targetLanguage: string,
    authToken: string
  ): Promise<GuideWithStepsResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/guides/${guideId}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetLanguage }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to copy guide')
      }

      const data: { guide: GuideDto; steps: StepDto[] } = await response.json()

      await this.cache.remove('List_all')
      await this.cache.remove('List_myGuides')

      return {
        guide: GuideMapper.toDomain(data.guide),
        steps: data.steps.map(s => StepMapper.toDomain(s)),
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while copying guide')
    }
  }

  async translateToLanguage(
    guideId: string,
    targetLanguage: string,
    authToken: string
  ): Promise<GuideWithStepsResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/guides/${guideId}/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetLanguage }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to translate guide')
      }

      const data: { guide: GuideDto; steps: StepDto[] } = await response.json()

      await this.cache.remove('List_all')
      await this.cache.remove('List_myGuides')

      return {
        guide: GuideMapper.toDomain(data.guide),
        steps: data.steps.map(s => StepMapper.toDomain(s)),
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while translating guide')
    }
  }
}
