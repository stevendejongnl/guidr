import { CategoryRepository } from './CategoryRepository'
import { Category } from '@domain/entities/Category'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CategoryDto } from '../api/dtos/CategoryDto'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage')

// Mock global fetch
global.fetch = jest.fn()

describe('CategoryRepository', () => {
  const serverUrl = 'http://localhost:8000'
  const authToken = 'mock-auth-token'
  let repository: CategoryRepository

  const mockCategoryDto: CategoryDto = {
    id: 'cat-1',
    name: 'Cooking',
    parentId: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockChildCategoryDto: CategoryDto = {
    id: 'cat-2',
    name: 'Baking',
    parentId: 'cat-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)
    repository = new CategoryRepository(serverUrl)
  })

  describe('constructor', () => {
    it('should create repository with valid server URL', () => {
      expect(() => new CategoryRepository('http://localhost:8000')).not.toThrow()
    })

    it('should remove trailing slash from server URL', async () => {
      const repo = new CategoryRepository('http://localhost:8000/')
      // Verify by making a call and checking the URL
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCategoryDto,
      })

      await repo.findById('cat-1', authToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/categories/cat-1',
        expect.any(Object)
      )
    })

    it('should throw error if server URL is empty', () => {
      expect(() => new CategoryRepository('')).toThrow('Server URL cannot be empty')
    })

    it('should throw error if server URL is whitespace', () => {
      expect(() => new CategoryRepository('   ')).toThrow('Server URL cannot be empty')
    })
  })

  describe('findById', () => {
    it('should return category from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Category_cat-1'
      const cachedData = {
        data: mockCategoryDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findById('cat-1', authToken)

      expect(result).toBeInstanceOf(Category)
      expect(result?.id).toBe('cat-1')
      expect(result?.name).toBe('Cooking')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCategoryDto,
      })

      const result = await repository.findById('cat-1', authToken)

      expect(result).toBeInstanceOf(Category)
      expect(result?.id).toBe('cat-1')
      expect(result?.name).toBe('Cooking')
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/categories/cat-1',
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

    it('should return null if category not found (404)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await repository.findById('cat-999', authToken)

      expect(result).toBeNull()
    })

    it('should throw error on API failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      })

      await expect(repository.findById('cat-1', authToken)).rejects.toThrow(
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

      await expect(repository.findById('cat-1', authToken)).rejects.toThrow(
        'Failed to fetch category'
      )
    })
  })

  describe('findAll', () => {
    it('should return all categories from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Category_List_all'
      const cachedData = {
        data: [mockCategoryDto, mockChildCategoryDto],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Category)
      expect(result[0]!.id).toBe('cat-1')
      expect(result[1]!.id).toBe('cat-2')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch all categories from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockCategoryDto, mockChildCategoryDto],
      })

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/categories',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('should cache individual items after fetching all', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockCategoryDto, mockChildCategoryDto],
      })

      await repository.findAll(authToken)

      // Should cache the list + 2 individual items = 3 setItem calls
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Category_List_all',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Category_cat-1',
        expect.any(String)
      )
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Category_cat-2',
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

  describe('findByParentId', () => {
    it('should return categories by parent ID from cache', async () => {
      const cacheKey = 'Guidr_Cache_Category_List_parent_cat-1'
      const cachedData = {
        data: [mockChildCategoryDto],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findByParentId('cat-1', authToken)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('cat-2')
      expect(result[0]!.parentId).toBe('cat-1')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch categories by parent ID from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockChildCategoryDto],
      })

      const result = await repository.findByParentId('cat-1', authToken)

      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/categories?parentId=cat-1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
          }),
        })
      )
    })

    it('should handle null parent ID (root categories)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockCategoryDto],
      })

      const result = await repository.findByParentId(null, authToken)

      expect(result).toHaveLength(1)
      expect(result[0]!.parentId).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/categories?parentId=null',
        expect.any(Object)
      )
    })

    it('should cache results with correct key for null parent', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockCategoryDto],
      })

      await repository.findByParentId(null, authToken)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Category_List_parent_null',
        expect.any(String)
      )
    })
  })

  describe('save', () => {
    it('should create new category via POST', async () => {
      const newCategory = new Category('cat-3', 'Desserts', null)

      // findById returns null (doesn't exist)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // findById check
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: 'cat-3',
            name: 'Desserts',
            parentId: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        }) // POST create

      await repository.save(newCategory, authToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/categories',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Desserts',
            parentId: null,
          }),
        }
      )
    })

    it('should update existing category via PATCH', async () => {
      const existingCategory = new Category('cat-1', 'Cooking Updated', null)

      // findById returns existing (cache hit)
      const cachedData = {
        data: mockCategoryDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))
      // Mock fetch for PATCH request
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'cat-1',
          name: 'Cooking Updated',
          parentId: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        }),
      })

      await repository.save(existingCategory, authToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/categories/cat-1',
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Cooking Updated',
          }),
        }
      )
    })

    it('should invalidate cache on save', async () => {
      const newCategory = new Category('cat-3', 'Desserts', null)

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockCategoryDto,
        })

      await repository.save(newCategory, authToken)

      // Should remove List_all and List_parent caches
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Category_List_all')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Category_List_parent_null')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Category_List_parent_null')
    })

    it('should throw error on create failure', async () => {
      const newCategory = new Category('cat-3', 'Desserts', null)

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ detail: 'Invalid category name' }),
        })

      await expect(repository.save(newCategory, authToken)).rejects.toThrow(
        'Invalid category name'
      )
    })
  })

  describe('delete', () => {
    it('should delete category by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await repository.delete('cat-1', authToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/categories/cat-1',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('should handle 404 gracefully on delete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(repository.delete('cat-999', authToken)).resolves.not.toThrow()
    })

    it('should invalidate cache on delete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await repository.delete('cat-1', authToken)

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Category_cat-1')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Category_List_all')
    })

    it('should throw error on delete failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Permission denied' }),
      })

      await expect(repository.delete('cat-1', authToken)).rejects.toThrow('Permission denied')
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

      await expect(repository.findById('cat-1', authToken)).rejects.toThrow('Network failure')
    })

    it('should handle non-Error exceptions', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce('String error')

      await expect(repository.findById('cat-1', authToken)).rejects.toThrow(
        'An unexpected error occurred while fetching category'
      )
    })
  })
})
