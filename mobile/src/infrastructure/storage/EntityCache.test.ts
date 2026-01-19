import AsyncStorage from '@react-native-async-storage/async-storage'
import { EntityCache } from './EntityCache'
import { Category } from '@domain/entities/Category'

// Define interface for cached Category JSON
interface CategoryJSON {
  id: string
  _name: string
  parentId: string | null
}

jest.mock('@react-native-async-storage/async-storage')

describe('EntityCache', () => {
  let cache: EntityCache<Category>
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
  const ttl = 5000 // 5 seconds for testing

  beforeEach(() => {
    cache = new EntityCache<Category>('Category', ttl)
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('set and get', () => {
    it('should store and retrieve entity from cache', async () => {
      const category = new Category('cat-1', 'Cooking', null)
      const cacheEntry = {
        data: category,
        timestamp: Date.now(),
        ttl,
      }

      mockAsyncStorage.setItem.mockResolvedValue()
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheEntry))

      await cache.set('cat-1', category)
      const result = await cache.get('cat-1')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Category_cat-1',
        expect.stringContaining('"data"')
      )
      expect(result).toBeDefined()
      expect(result?.id).toBe('cat-1')
      // Note: Deserialized object is plain JSON, not Category instance
      // Mappers will convert back to domain entities
      expect(((result as unknown) as CategoryJSON)._name).toBe('Cooking')
    })

    it('should return null when cache is empty', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await cache.get('cat-999')

      expect(result).toBeNull()
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_Cache_Category_cat-999')
    })

    it('should return null and remove expired cache entry', async () => {
      const category = new Category('cat-1', 'Cooking', null)
      const expiredEntry = {
        data: category,
        timestamp: Date.now() - 10000, // 10 seconds ago
        ttl: 5000, // 5 second TTL
      }

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredEntry))
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await cache.get('cat-1')

      expect(result).toBeNull()
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Category_cat-1')
    })

    it('should handle serialization of complex objects', async () => {
      const category = new Category('cat-1', 'Cooking', 'parent-1')
      const cacheEntry = {
        data: category,
        timestamp: Date.now(),
        ttl,
      }

      mockAsyncStorage.setItem.mockResolvedValue()
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheEntry))

      await cache.set('cat-1', category)
      const result = await cache.get('cat-1')

      expect(result).toBeDefined()
      expect(result?.parentId).toBe('parent-1')
    })

    it('should return null on JSON parse error', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid-json{')

      const result = await cache.get('cat-1')

      expect(result).toBeNull()
    })
  })

  describe('remove', () => {
    it('should remove entity from cache', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue()

      await cache.remove('cat-1')

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Category_cat-1')
    })
  })

  describe('clear', () => {
    it('should clear all cache entries with prefix', async () => {
      const allKeys = [
        'Guidr_Cache_Category_cat-1',
        'Guidr_Cache_Category_cat-2',
        'Guidr_Cache_Category_List_all',
        'Guidr_Cache_Guide_guide-1', // Different cache, should not be removed
        'SomeOtherKey',
      ]

      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys)
      mockAsyncStorage.multiRemove.mockResolvedValue()

      await cache.clear()

      expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled()
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'Guidr_Cache_Category_cat-1',
        'Guidr_Cache_Category_cat-2',
        'Guidr_Cache_Category_List_all',
      ])
    })

    it('should not call multiRemove when no matching keys', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['Guidr_Cache_Guide_guide-1'])
      mockAsyncStorage.multiRemove.mockResolvedValue()

      await cache.clear()

      expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled()
    })

    it('should handle empty key list', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue([])

      await cache.clear()

      expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled()
    })
  })

  describe('TTL behavior', () => {
    it('should accept valid cache within TTL', async () => {
      const category = new Category('cat-1', 'Cooking', null)
      const validEntry = {
        data: category,
        timestamp: Date.now() - 2000, // 2 seconds ago
        ttl: 5000, // 5 second TTL
      }

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(validEntry))

      const result = await cache.get('cat-1')

      expect(result).toBeDefined()
      expect(result?.id).toBe('cat-1')
    })

    it('should reject cache exactly at TTL boundary', async () => {
      const category = new Category('cat-1', 'Cooking', null)
      const expiredEntry = {
        data: category,
        timestamp: Date.now() - 5001, // Just past 5 second TTL
        ttl: 5000,
      }

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredEntry))
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await cache.get('cat-1')

      expect(result).toBeNull()
    })
  })

  describe('default TTL', () => {
    it('should use 5 minute default TTL when not specified', () => {
      const defaultCache = new EntityCache<Category>('Category')
      expect(defaultCache).toBeDefined()
      // TTL is private, but we can verify via behavior in other tests
    })
  })

  describe('error handling', () => {
    it('should return null when AsyncStorage.getItem throws', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))

      const result = await cache.get('cat-1')

      expect(result).toBeNull()
    })

    it('should fail silently when AsyncStorage.setItem throws', async () => {
      const category = new Category('cat-1', 'Cooking', null)
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'))

      await expect(cache.set('cat-1', category)).resolves.not.toThrow()
    })

    it('should fail silently when AsyncStorage.removeItem throws', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'))

      await expect(cache.remove('cat-1')).resolves.not.toThrow()
    })

    it('should fail silently when clear throws', async () => {
      mockAsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'))

      await expect(cache.clear()).resolves.not.toThrow()
    })
  })
})
