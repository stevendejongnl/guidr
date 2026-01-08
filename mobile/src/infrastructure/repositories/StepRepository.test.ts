import { StepRepository } from './StepRepository'
import { Step } from '@domain/entities/Step'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StepDto } from '../api/dtos/StepDto'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage')

// Mock global fetch
global.fetch = jest.fn()

describe('StepRepository', () => {
  const serverUrl = 'http://localhost:8000'
  const authToken = 'mock-auth-token'
  let repository: StepRepository

  const mockStepDto: StepDto = {
    id: 'step-1',
    guideId: 'guide-1',
    order: 1,
    title: 'Mix ingredients',
    description: 'Mix all dry ingredients',
    duration: 180,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockStepDto2: StepDto = {
    id: 'step-2',
    guideId: 'guide-1',
    order: 2,
    title: 'Bake',
    description: 'Bake for 15 minutes',
    duration: 900,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)
    repository = new StepRepository(serverUrl)
  })

  describe('constructor', () => {
    it('should create repository with valid server URL', () => {
      expect(() => new StepRepository('http://localhost:8000')).not.toThrow()
    })

    it('should remove trailing slash from server URL', async () => {
      const repo = new StepRepository('http://localhost:8000/')
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockStepDto,
      })

      await repo.findById('step-1', authToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/steps/step-1',
        expect.any(Object)
      )
    })

    it('should throw error if server URL is empty', () => {
      expect(() => new StepRepository('')).toThrow('Server URL cannot be empty')
    })

    it('should throw error if server URL is whitespace', () => {
      expect(() => new StepRepository('   ')).toThrow('Server URL cannot be empty')
    })
  })

  describe('findById', () => {
    it('should return step from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Step_step-1'
      const cachedData = {
        data: mockStepDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findById('step-1', authToken)

      expect(result).toBeInstanceOf(Step)
      expect(result?.id).toBe('step-1')
      expect(result?.title).toBe('Mix ingredients')
      expect(result?.duration).toBe(180)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockStepDto,
      })

      const result = await repository.findById('step-1', authToken)

      expect(result).toBeInstanceOf(Step)
      expect(result?.id).toBe('step-1')
      expect(result?.title).toBe('Mix ingredients')
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/steps/step-1', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })
      expect(AsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should return null if step not found (404)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await repository.findById('step-999', authToken)

      expect(result).toBeNull()
    })

    it('should throw error on API failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      })

      await expect(repository.findById('step-1', authToken)).rejects.toThrow(
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

      await expect(repository.findById('step-1', authToken)).rejects.toThrow('Failed to fetch step')
    })
  })

  describe('findAll', () => {
    it('should return all steps from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Step_List_all'
      const cachedData = {
        data: [mockStepDto, mockStepDto2],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Step)
      expect(result[0]!.id).toBe('step-1')
      expect(result[1]!.id).toBe('step-2')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch all steps from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockStepDto, mockStepDto2],
      })

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/steps', {
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
        json: async () => [mockStepDto, mockStepDto2],
      })

      await repository.findAll(authToken)

      // Should cache the list + 2 individual items = 3 setItem calls
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Step_List_all',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Step_step-1',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Step_step-2',
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

  describe('findByGuideId', () => {
    it('should return steps by guide ID from cache', async () => {
      const cacheKey = 'Guidr_Cache_Step_List_guide_guide-1'
      const cachedData = {
        data: [mockStepDto, mockStepDto2],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findByGuideId('guide-1', authToken)

      expect(result).toHaveLength(2)
      expect(result[0]!.id).toBe('step-1')
      expect(result[0]!.guideId).toBe('guide-1')
      expect(result[1]!.id).toBe('step-2')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch steps by guide ID from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockStepDto, mockStepDto2],
      })

      const result = await repository.findByGuideId('guide-1', authToken)

      expect(result).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/steps?guideId=guide-1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
          }),
        })
      )
    })

    it('should cache individual items after fetching by guide', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockStepDto, mockStepDto2],
      })

      await repository.findByGuideId('guide-1', authToken)

      // Should cache the list + 2 individual items = 3 setItem calls
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Step_List_guide_guide-1',
        expect.any(String)
      )
    })
  })

  describe('save', () => {
    it('should create new step via POST', async () => {
      const newStep = new Step('step-3', 'guide-2', 1, 'New Step', 120, 'A new step')

      // findById returns null (doesn't exist)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // findById check
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: 'step-3',
            guideId: 'guide-2',
            order: 1,
            title: 'New Step',
            description: 'A new step',
            duration: 120,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        })

      await repository.save(newStep, authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/steps', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guideId: 'guide-2',
          order: 1,
          title: 'New Step',
          description: 'A new step',
          duration: 120,
        }),
      })
    })

    it('should update existing step via PATCH', async () => {
      const existingStep = new Step('step-1', 'guide-1', 1, 'Updated Title', 240)

      // findById returns existing (cache hit)
      const cachedData = {
        data: mockStepDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'step-1',
          guideId: 'guide-1',
          order: 1,
          title: 'Updated Title',
          description: null,
          duration: 240,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        }),
      })

      await repository.save(existingStep, authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/steps/step-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: 1,
          title: 'Updated Title',
          description: null,
          duration: 240,
        }),
      })
    })

    it('should invalidate cache on save', async () => {
      const newStep = new Step('step-3', 'guide-2', 1, 'New Step', 120)

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockStepDto,
        })

      await repository.save(newStep, authToken)

      // Should remove List_all and List_guide caches
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Step_List_all')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Step_List_guide_guide-2')
    })

    it('should throw error on create failure', async () => {
      const newStep = new Step('step-3', 'guide-2', 1, 'New Step', 120)

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ detail: 'Invalid step title' }),
        })

      await expect(repository.save(newStep, authToken)).rejects.toThrow('Invalid step title')
    })
  })

  describe('delete', () => {
    it('should delete step by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await repository.delete('step-1', authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/steps/step-1', {
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

      await expect(repository.delete('step-999', authToken)).resolves.not.toThrow()
    })

    it('should invalidate cache on delete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await repository.delete('step-1', authToken)

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Step_step-1')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Step_List_all')
    })

    it('should throw error on delete failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Permission denied' }),
      })

      await expect(repository.delete('step-1', authToken)).rejects.toThrow('Permission denied')
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

      await expect(repository.findById('step-1', authToken)).rejects.toThrow('Network failure')
    })

    it('should handle non-Error exceptions', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce('String error')

      await expect(repository.findById('step-1', authToken)).rejects.toThrow(
        'An unexpected error occurred while fetching step'
      )
    })
  })
})
