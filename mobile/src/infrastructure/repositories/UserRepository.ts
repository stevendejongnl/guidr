import { User } from '@domain/entities/User'
import { IUserRepository } from '@domain/repositories/IUserRepository'
import { EntityCache } from '../storage/EntityCache'
import { UserMapper } from '../mappers/UserMapper'
import type { UserDto, UserCreateRequest, UserUpdateRequest } from '../api/dtos/UserDto'
import { checkForMaintenanceError } from '../../common/ApiErrorUtils'

/**
 * HTTP-based implementation of IUserRepository with AsyncStorage caching.
 *
 * Features:
 * - AsyncStorage caching with 5-minute TTL
 * - JWT authentication via Bearer token
 * - Automatic cache invalidation on writes
 * - Email lookup via in-memory filtering (no dedicated API endpoint)
 *
 * Cache keys:
 * - Single: Guidr_Cache_User_{id}
 * - Email: Guidr_Cache_User_email_{email}
 * - List all: Guidr_Cache_User_List_all
 */
export class UserRepository implements IUserRepository {
  private readonly cache: EntityCache<UserDto>
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    this.apiBaseUrl = `${serverUrl.replace(/\/$/, '')}/api/v1`
    this.cache = new EntityCache<UserDto>('User', 5 * 60 * 1000) // 5 min TTL
  }

  async findById(id: string, authToken: string): Promise<User | null> {
    // Check cache first
    const cached = await this.cache.get(id)
    if (cached) {
      return UserMapper.toDomain(cached)
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${id}`, {
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
        checkForMaintenanceError(response)
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch user')
      }

      const dto: UserDto = await response.json()

      // Cache the result
      await this.cache.set(id, dto)
      // Also cache by email
      await this.cache.set(`email_${dto.email}`, dto)

      return UserMapper.toDomain(dto)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching user')
    }
  }

  async findAll(authToken: string): Promise<User[]> {
    // Check cache first
    const cached = await this.cache.get('List_all')
    if (cached) {
      return (cached as unknown as UserDto[]).map(dto => UserMapper.toDomain(dto))
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        checkForMaintenanceError(response)
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch users')
      }

      const dtos: UserDto[] = await response.json()

      // Cache the list
      await this.cache.set('List_all', dtos)

      // Also cache individual items (by ID and email)
      for (const dto of dtos) {
        await this.cache.set(dto.id, dto)
        await this.cache.set(`email_${dto.email}`, dto)
      }

      return dtos.map(dto => UserMapper.toDomain(dto))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching users')
    }
  }

  /**
   * Find user by email.
   * NOTE: No dedicated API endpoint exists, so we fetch all users and filter in-memory.
   * This is acceptable for MVP with low user count.
   */
  async findByEmail(email: string, authToken: string): Promise<User | null> {
    const emailCacheKey = `email_${email}`

    // Check cache first
    const cached = await this.cache.get(emailCacheKey)
    if (cached) {
      return UserMapper.toDomain(cached as UserDto)
    }

    // Fetch all users and filter in-memory (no dedicated endpoint)
    try {
      const allUsers = await this.findAll(authToken)
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())

      if (user) {
        // Cache the result for future lookups
        const dto = UserMapper.toDto(user)
        await this.cache.set(emailCacheKey, dto)
      }

      return user ?? null
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while finding user by email')
    }
  }

  async save(user: User, authToken: string): Promise<void> {
    try {
      // Check if user exists
      const existing = await this.findById(user.id, authToken)

      if (existing) {
        // Update existing user (PATCH)
        // Only send email if it changed (password cannot be updated via User entity)
        const updateRequest: UserUpdateRequest = UserMapper.toUpdateRequest(
          existing.email !== user.email ? user.email : undefined
        )

        const response = await fetch(`${this.apiBaseUrl}/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to update user')
        }

        const dto: UserDto = await response.json()

        // Update cache (by ID and email)
        await this.cache.set(user.id, dto)
        await this.cache.set(`email_${dto.email}`, dto)

        // Invalidate old email cache if email changed
        if (existing.email !== user.email) {
          await this.cache.remove(`email_${existing.email}`)
        }
      } else {
        // User creation is typically done via register endpoint, not save
        // But we'll support it for consistency
        const createRequest: UserCreateRequest = UserMapper.toCreateRequest(
          user.email,
          '[password_not_available]' // Placeholder - real password should come from UI
        )

        const response = await fetch(`${this.apiBaseUrl}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to create user')
        }

        const dto: UserDto = await response.json()

        // Cache the new user (by ID and email)
        await this.cache.set(user.id, dto)
        await this.cache.set(`email_${dto.email}`, dto)
      }

      // Invalidate list cache
      await this.cache.remove('List_all')
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while saving user')
    }
  }

  async delete(id: string, authToken: string): Promise<void> {
    try {
      // Get user first to know which email cache to clear
      const user = await this.findById(id, authToken)

      const response = await fetch(`${this.apiBaseUrl}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      // 404 is acceptable - user already deleted
      if (response.status === 404) {
        return
      }

      if (!response.ok) {
        checkForMaintenanceError(response)
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete user')
      }

      // Invalidate caches
      await this.cache.remove(id)
      if (user) {
        await this.cache.remove(`email_${user.email}`)
      }
      await this.cache.remove('List_all')
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while deleting user')
    }
  }
}
