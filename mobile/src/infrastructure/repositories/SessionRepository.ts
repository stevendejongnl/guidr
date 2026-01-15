import { Session, SessionStatus } from '@domain/entities/Session'
import { ISessionRepository } from '@domain/repositories/ISessionRepository'
import { EntityCache } from '../storage/EntityCache'
import { SessionMapper } from '../mappers/SessionMapper'
import type { SessionDto, SessionCreateRequest, MoveToStepRequest } from '../api/dtos/SessionDto'

/**
 * HTTP-based implementation of ISessionRepository with AsyncStorage caching.
 *
 * Features:
 * - AsyncStorage caching with 5-minute TTL
 * - JWT authentication via Bearer token
 * - Automatic cache invalidation on writes
 * - Dedicated action endpoints for state transitions
 *
 * Cache keys:
 * - Single: Guidr_Cache_Session_{id}
 * - List all: Guidr_Cache_Session_List_all
 * - List by guide: Guidr_Cache_Session_List_guide_{guideId}
 * - List by status: Guidr_Cache_Session_List_status_{status}
 */
export class SessionRepository implements ISessionRepository {
  private readonly cache: EntityCache<SessionDto>
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    this.apiBaseUrl = `${serverUrl.replace(/\/$/, '')}/api/v1`
    this.cache = new EntityCache<SessionDto>('Session', 5 * 60 * 1000) // 5 min TTL
  }

  async findById(id: string, authToken: string): Promise<Session | null> {
    // Check cache first
    const cached = await this.cache.get(id)
    if (cached) {
      return SessionMapper.toDomain(cached)
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${id}`, {
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
        throw new Error(errorData.detail || 'Failed to fetch session')
      }

      const dto: SessionDto = await response.json()

      // Cache the result
      await this.cache.set(id, dto)

      return SessionMapper.toDomain(dto)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching session')
    }
  }

  async findAll(authToken: string): Promise<Session[]> {
    // Check cache first
    const cached = await this.cache.get('List_all')
    if (cached) {
      return (cached as unknown as SessionDto[]).map(dto => SessionMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch sessions')
      }

      const dtos: SessionDto[] = await response.json()

      // Cache the list
      await this.cache.set('List_all', dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => SessionMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching sessions')
    }
  }

  async findByGuideId(guideId: string, authToken: string): Promise<Session[]> {
    const cacheKey = `List_guide_${guideId}`

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as SessionDto[]).map(dto => SessionMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions?guideId=${guideId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch sessions by guide')
      }

      const dtos: SessionDto[] = await response.json()

      // Cache the list
      await this.cache.set(cacheKey, dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => SessionMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching sessions by guide')
    }
  }

  async findByStatus(status: SessionStatus, authToken: string): Promise<Session[]> {
    const cacheKey = `List_status_${status}`

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return (cached as unknown as SessionDto[]).map(dto => SessionMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions?status=${status}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch sessions by status')
      }

      const dtos: SessionDto[] = await response.json()

      // Cache the list
      await this.cache.set(cacheKey, dtos)

      // Also cache individual items
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
      }

      return dtos.map(dto => SessionMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching sessions by status')
    }
  }

  async save(session: Session, authToken: string): Promise<void> {
    try {
      // Check if session exists
      const existing = await this.findById(session.id, authToken)

      if (existing) {
        // Session update not allowed via PATCH - use action methods instead
        throw new Error('Cannot update session via save - use action methods instead')
      } else {
        // Create new session (POST)
        const createRequest: SessionCreateRequest = SessionMapper.toCreateRequest(session.guideId)

        const response = await fetch(`${this.apiBaseUrl}/sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to create session')
        }

        const dto: SessionDto = await response.json()

        // Cache the new session
        await this.cache.set(session.id, dto)
      }

      // Invalidate list caches
      await this.cache.remove('List_all')
      await this.cache.remove(`List_guide_${session.guideId}`)
      await this.cache.remove(`List_status_${session.status}`)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while saving session')
    }
  }

  async delete(id: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      // 404 is acceptable - session already deleted
      if (response.status === 404) {
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete session')
      }

      // Invalidate caches
      await this.cache.remove(id)
      await this.cache.remove('List_all')
      // Note: We don't know the guideId or status, so we can't specifically invalidate those lists
      // The TTL will eventually clear stale data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while deleting session')
    }
  }

  /**
   * Start a session using the dedicated action endpoint.
   * POST /sessions/{id}/start
   */
  async start(id: string, authToken: string): Promise<Session> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to start session')
      }

      const dto: SessionDto = await response.json()
      const session = SessionMapper.toDomain(dto)

      // Update cache
      await this.cache.set(id, dto)
      await this.invalidateListCaches()

      return session
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while starting session')
    }
  }

  /**
   * Pause a session using the dedicated action endpoint.
   * POST /sessions/{id}/pause
   */
  async pause(id: string, authToken: string): Promise<Session> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${id}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to pause session')
      }

      const dto: SessionDto = await response.json()
      const session = SessionMapper.toDomain(dto)

      // Update cache
      await this.cache.set(id, dto)
      await this.invalidateListCaches()

      return session
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while pausing session')
    }
  }

  /**
   * Resume a session using the dedicated action endpoint.
   * POST /sessions/{id}/resume
   */
  async resume(id: string, authToken: string): Promise<Session> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${id}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to resume session')
      }

      const dto: SessionDto = await response.json()
      const session = SessionMapper.toDomain(dto)

      // Update cache
      await this.cache.set(id, dto)
      await this.invalidateListCaches()

      return session
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while resuming session')
    }
  }

  /**
   * Complete a session using the dedicated action endpoint.
   * POST /sessions/{id}/complete
   */
  async complete(id: string, authToken: string): Promise<Session> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to complete session')
      }

      const dto: SessionDto = await response.json()
      const session = SessionMapper.toDomain(dto)

      // Update cache
      await this.cache.set(id, dto)
      await this.invalidateListCaches()

      return session
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while completing session')
    }
  }

  /**
   * Cancel a session using the dedicated action endpoint.
   * POST /sessions/{id}/cancel
   */
  async cancel(id: string, authToken: string): Promise<Session> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to cancel session')
      }

      const dto: SessionDto = await response.json()
      const session = SessionMapper.toDomain(dto)

      // Update cache
      await this.cache.set(id, dto)
      await this.invalidateListCaches()

      return session
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while cancelling session')
    }
  }

  /**
   * Move session to a specific step using the dedicated action endpoint.
   * POST /sessions/{id}/move-to-step
   */
  async moveToStep(id: string, stepId: string, authToken: string): Promise<Session> {
    try {
      const request: MoveToStepRequest = { stepId }

      const response = await fetch(`${this.apiBaseUrl}/sessions/${id}/move-to-step`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to move session to step')
      }

      const dto: SessionDto = await response.json()
      const session = SessionMapper.toDomain(dto)

      // Update cache (no need to invalidate list caches - status unchanged)
      await this.cache.set(id, dto)

      return session
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while moving session to step')
    }
  }

  /**
   * Invalidate all list caches (status may have changed).
   */
  private async invalidateListCaches(): Promise<void> {
    await this.cache.remove('List_all')
    // Remove all status caches
    for (const status of Object.values(SessionStatus)) {
      await this.cache.remove(`List_status_${status}`)
    }
  }
}
