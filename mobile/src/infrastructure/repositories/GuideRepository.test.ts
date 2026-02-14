import { GuideRepository } from './GuideRepository'
import { Guide } from '@domain/entities/Guide'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { GuideDto } from '../api/dtos/GuideDto'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage')

// Mock global fetch
global.fetch = jest.fn()

describe('GuideRepository', () => {
  const serverUrl = 'http://localhost:8000'
  const authToken = 'mock-auth-token'
  let repository: GuideRepository

  const mockGuideDto: GuideDto = {
    id: 'guide-1',
    guideType: 'cooking',
    title: 'Chocolate Chip Cookies',
    description: 'Classic recipe',
    metadata: { ingredients: ['flour', 'sugar'] },
    stepIds: ['step-1', 'step-2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdByUserId: 'user-1',
    isPublic: true,
    isHighlighted: false,
  }

  const mockGuideDto2: GuideDto = {
    id: 'guide-2',
    guideType: 'workout',
    title: 'Brownies',
    description: 'Fudgy brownies',
    metadata: null,
    stepIds: ['step-3'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdByUserId: 'user-2',
    isPublic: false,
    isHighlighted: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)
    repository = new GuideRepository(serverUrl)
  })

  describe('constructor', () => {
    it('should create repository with valid server URL', () => {
      expect(() => new GuideRepository('http://localhost:8000')).not.toThrow()
    })

    it('should remove trailing slash from server URL', async () => {
      const repo = new GuideRepository('http://localhost:8000/')
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGuideDto,
      })

      await repo.findById('guide-1', authToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guides/guide-1',
        expect.any(Object)
      )
    })

    it('should throw error if server URL is empty', () => {
      expect(() => new GuideRepository('')).toThrow('Server URL cannot be empty')
    })

    it('should throw error if server URL is whitespace', () => {
      expect(() => new GuideRepository('   ')).toThrow('Server URL cannot be empty')
    })
  })

  describe('findById', () => {
    it('should return guide from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Guide_guide-1'
      const cachedData = {
        data: mockGuideDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findById('guide-1', authToken)

      expect(result).toBeInstanceOf(Guide)
      expect(result?.id).toBe('guide-1')
      expect(result?.title).toBe('Chocolate Chip Cookies')
      expect(result?.stepIds).toEqual(['step-1', 'step-2'])
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGuideDto,
      })

      const result = await repository.findById('guide-1', authToken)

      expect(result).toBeInstanceOf(Guide)
      expect(result?.id).toBe('guide-1')
      expect(result?.title).toBe('Chocolate Chip Cookies')
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guides/guide-1',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
      expect(AsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should return null if guide not found (404)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await repository.findById('guide-999', authToken)

      expect(result).toBeNull()
    })

    it('should throw error on API failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      })

      await expect(repository.findById('guide-1', authToken)).rejects.toThrow(
        'Internal server error'
      )
    })

    it('should throw generic error if detail not provided', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      await expect(repository.findById('guide-1', authToken)).rejects.toThrow(
        'Failed to fetch guide'
      )
    })
  })

  describe('findAll', () => {
    it('should return all guides from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Guide_List_all'
      const cachedData = {
        data: [mockGuideDto, mockGuideDto2],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Guide)
      expect(result[0]!.id).toBe('guide-1')
      expect(result[1]!.id).toBe('guide-2')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch all guides from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockGuideDto, mockGuideDto2],
      })

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/guides', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('should cache individual items after fetching all', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockGuideDto, mockGuideDto2],
      })

      await repository.findAll(authToken)

      // Should cache the list + 2 individual items = 3 setItem calls
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Guide_List_all',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Guide_guide-1',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Guide_guide-2',
        expect.any(String)
      )
    })

    it('should throw error on API failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      })

      await expect(repository.findAll(authToken)).rejects.toThrow('Unauthorized')
    })
  })

  describe('findByType', () => {
    it('should return guides by type from cache', async () => {
      const cacheKey = 'Guidr_Cache_Guide_List_type_cooking'
      const cachedData = {
        data: [mockGuideDto],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findByType('cooking', authToken)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('guide-1')
      expect(result[0]!.guideType).toBe('cooking')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch guides by type from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockGuideDto],
      })

      const result = await repository.findByType('cooking', authToken)

      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guides?guideType=cooking',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
          }),
        })
      )
    })

    it('should cache individual items after fetching by type', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockGuideDto],
      })

      await repository.findByType('cooking', authToken)

      // Should cache the list + 1 individual item = 2 setItem calls
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Guide_List_type_cooking',
        expect.any(String)
      )
    })
  })

  describe('findMyGuides', () => {
    it('should return my guides from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Guide_List_myGuides'
      const cachedData = {
        data: [mockGuideDto],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findMyGuides(authToken)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('guide-1')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch my guides from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockGuideDto],
      })

      const result = await repository.findMyGuides(authToken)

      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guides?my_guides=true',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
          }),
        })
      )
    })

    it('should throw error on API failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      })

      await expect(repository.findMyGuides(authToken)).rejects.toThrow('Unauthorized')
    })
  })

  describe('findPublicGuides', () => {
    it('should return public guides from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Guide_List_publicGuides'
      const cachedData = {
        data: [mockGuideDto],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findPublicGuides(authToken)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('guide-1')
      expect(result[0]!.isPublic).toBe(true)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch public guides from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockGuideDto],
      })

      const result = await repository.findPublicGuides(authToken)

      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guides?public=true',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
          }),
        })
      )
    })

    it('should throw error on API failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' }),
      })

      await expect(repository.findPublicGuides(authToken)).rejects.toThrow('Server error')
    })
  })

  describe('findHighlightedGuides', () => {
    it('should return highlighted guides from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Guide_List_highlightedGuides'
      const cachedData = {
        data: [mockGuideDto2],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findHighlightedGuides(authToken)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('guide-2')
      expect(result[0]!.isHighlighted).toBe(true)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch highlighted guides from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockGuideDto2],
      })

      const result = await repository.findHighlightedGuides(authToken)

      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guides?highlighted=true',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
          }),
        })
      )
    })

    it('should throw error on API failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      })

      await expect(repository.findHighlightedGuides(authToken)).rejects.toThrow('Forbidden')
    })
  })

  describe('save', () => {
    it('should create new guide via POST', async () => {
      const newGuide = new Guide('guide-3', 'cooking', 'New Recipe')

      // findById returns null (doesn't exist)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // findById check
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: 'guide-3',
            guideType: 'cooking',
            title: 'New Recipe',
            description: null,
            metadata: null,
            stepIds: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        })

      await repository.save(newGuide, authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/guides', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guideType: 'cooking',
          title: 'New Recipe',
          description: null,
          metadata: null,
          isPublic: false,
          language: 'en',
        }),
      })
    })

    it('should update existing guide via PATCH', async () => {
      const existingGuide = new Guide('guide-1', 'cooking', 'Updated Title')

      // findById returns existing (cache hit)
      const cachedData = {
        data: mockGuideDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'guide-1',
          guideType: 'cooking',
          title: 'Updated Title',
          description: null,
          metadata: null,
          stepIds: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        }),
      })

      await repository.save(existingGuide, authToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guides/guide-1',
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Updated Title',
            description: null,
            metadata: null,
            isPublic: false,
            isHighlighted: false,
            language: 'en',
          }),
        }
      )
    })

    it('should invalidate cache on save', async () => {
      const newGuide = new Guide('guide-3', 'cooking', 'New Recipe')

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockGuideDto,
        })

      await repository.save(newGuide, authToken)

      // Should remove List_all and List_type caches
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Guide_List_all')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'Guidr_Cache_Guide_List_type_cooking'
      )
    })

    it('should throw error on create failure', async () => {
      const newGuide = new Guide('guide-3', 'cooking', 'New Recipe')

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ detail: 'Invalid guide title' }),
        })

      await expect(repository.save(newGuide, authToken)).rejects.toThrow('Invalid guide title')
    })
  })

  describe('delete', () => {
    it('should delete guide by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await repository.delete('guide-1', authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/guides/guide-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('should handle 404 gracefully on delete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(repository.delete('guide-999', authToken)).resolves.not.toThrow()
    })

    it('should invalidate cache on delete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await repository.delete('guide-1', authToken)

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Guide_guide-1')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Guide_List_all')
    })

    it('should throw error on delete failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Permission denied' }),
      })

      await expect(repository.delete('guide-1', authToken)).rejects.toThrow('Permission denied')
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

      await expect(repository.findById('guide-1', authToken)).rejects.toThrow('Network failure')
    })

    it('should handle non-Error exceptions', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce('String error')

      await expect(repository.findById('guide-1', authToken)).rejects.toThrow(
        'An unexpected error occurred while fetching guide'
      )
    })
  })
})
