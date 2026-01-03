import { UserRepository } from './UserRepository'
import { User } from '@domain/entities/User'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { UserDto } from '../api/dtos/UserDto'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage')

// Mock global fetch
global.fetch = jest.fn()

describe('UserRepository', () => {
  const serverUrl = 'http://localhost:8000/api/v1'
  const authToken = 'mock-auth-token'
  let repository: UserRepository

  const mockUserDto: UserDto = {
    id: 'user-1',
    email: 'test@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockUserDto2: UserDto = {
    id: 'user-2',
    email: 'another@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)
    repository = new UserRepository(serverUrl)
  })

  describe('constructor', () => {
    it('should create repository with valid server URL', () => {
      expect(() => new UserRepository('http://localhost:8000')).not.toThrow()
    })

    it('should throw error if server URL is empty', () => {
      expect(() => new UserRepository('')).toThrow('Server URL cannot be empty')
    })
  })

  describe('findById', () => {
    it('should return user from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_User_user-1'
      const cachedData = {
        data: mockUserDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findById('user-1', authToken)

      expect(result).toBeInstanceOf(User)
      expect(result?.id).toBe('user-1')
      expect(result?.email).toBe('test@example.com')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch from API on cache miss and cache by ID and email', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUserDto,
      })

      const result = await repository.findById('user-1', authToken)

      expect(result).toBeInstanceOf(User)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/users/user-1', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })
      // Should cache by both ID and email
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_user-1',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_email_test@example.com',
        expect.any(String)
      )
    })

    it('should return null if user not found (404)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await repository.findById('user-999', authToken)

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all users from cache if available', async () => {
      const cachedData = {
        data: [mockUserDto, mockUserDto2],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(User)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch all users from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockUserDto, mockUserDto2],
      })

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('should cache individual items by ID and email after fetching all', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockUserDto, mockUserDto2],
      })

      await repository.findAll(authToken)

      // Should cache the list + 2 users (ID + email each) = 5 setItem calls
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_List_all',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_user-1',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_email_test@example.com',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_user-2',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_email_another@example.com',
        expect.any(String)
      )
    })
  })

  describe('findByEmail', () => {
    it('should return user from email cache if available', async () => {
      const cacheKey = 'Guidr_Cache_User_email_test@example.com'
      const cachedData = {
        data: mockUserDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findByEmail('test@example.com', authToken)

      expect(result).toBeInstanceOf(User)
      expect(result?.email).toBe('test@example.com')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch all users and filter by email on cache miss', async () => {
      // Cache misses
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      // API call for findAll
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockUserDto, mockUserDto2],
      })

      const result = await repository.findByEmail('test@example.com', authToken)

      expect(result).toBeInstanceOf(User)
      expect(result?.email).toBe('test@example.com')
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('should be case insensitive when finding by email', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockUserDto],
      })

      const result = await repository.findByEmail('TEST@EXAMPLE.COM', authToken)

      expect(result).toBeInstanceOf(User)
      expect(result?.email).toBe('test@example.com')
    })

    it('should return null if email not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockUserDto],
      })

      const result = await repository.findByEmail('notfound@example.com', authToken)

      expect(result).toBeNull()
    })
  })

  describe('save', () => {
    it('should update existing user via PATCH when email changes', async () => {
      const updatedUser = new User('user-1', 'newemail@example.com', 'hash')

      // findById returns existing (cache hit)
      const cachedData = {
        data: mockUserDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'user-1',
          email: 'newemail@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        }),
      })

      await repository.save(updatedUser, authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/users/user-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newemail@example.com',
        }),
      })

      // Should remove old email cache
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_email_test@example.com'
      )
    })

    it('should create new user via POST', async () => {
      const newUser = new User('user-3', 'new@example.com', 'hash')

      // findById returns null (doesn't exist)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // findById check
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: 'user-3',
            email: 'new@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        })

      await repository.save(newUser, authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/users', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'new@example.com',
          password: '[password_not_available]',
        }),
      })
    })

    it('should invalidate cache on save', async () => {
      const newUser = new User('user-3', 'new@example.com', 'hash')

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockUserDto,
        })

      await repository.save(newUser, authToken)

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_User_List_all')
    })
  })

  describe('delete', () => {
    it('should delete user by ID and clear email cache', async () => {
      // findById returns user to get email for cache clearing
      const cachedData = {
        data: mockUserDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await repository.delete('user-1', authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/users/user-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_User_user-1')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'Guidr_Cache_User_email_test@example.com'
      )
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_User_List_all')
    })

    it('should handle 404 gracefully on delete', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // findById
        .mockResolvedValueOnce({ ok: false, status: 404 }) // delete

      await expect(repository.delete('user-999', authToken)).resolves.not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

      await expect(repository.findById('user-1', authToken)).rejects.toThrow('Network failure')
    })

    it('should handle errors in findByEmail', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

      await expect(repository.findByEmail('test@example.com', authToken)).rejects.toThrow(
        'Network failure'
      )
    })
  })
})
