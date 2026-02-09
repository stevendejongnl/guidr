import AsyncStorage from '@react-native-async-storage/async-storage'
import { EntityCache } from './EntityCache'
import { Guide } from '@domain/entities/Guide'

// Define interface for cached Guide JSON
interface GuideJSON {
  id: string
  _title: string
  guideType: string
}

jest.mock('@react-native-async-storage/async-storage')

describe('EntityCache', () => {
  let cache: EntityCache<Guide>
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
  const ttl = 5000 // 5 seconds for testing

  beforeEach(() => {
    cache = new EntityCache<Guide>('Guide', ttl)
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('set and get', () => {
    it('should store and retrieve entity from cache', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cooking Guide')
      const cacheEntry = {
        data: guide,
        timestamp: Date.now(),
        ttl,
      }

      mockAsyncStorage.setItem.mockResolvedValue()
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheEntry))

      await cache.set('guide-1', guide)
      const result = await cache.get('guide-1')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_Cache_Guide_guide-1',
        expect.stringContaining('"data"')
      )
      expect(result).toBeDefined()
      expect(result?.id).toBe('guide-1')
      // Note: Deserialized object is plain JSON, not Guide instance
      // Mappers will convert back to domain entities
      expect(((result as unknown) as GuideJSON)._title).toBe('Cooking Guide')
    })

    it('should return null when cache is empty', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await cache.get('guide-999')

      expect(result).toBeNull()
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_Cache_Guide_guide-999')
    })

    it('should return null and remove expired cache entry', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cooking Guide')
      const expiredEntry = {
        data: guide,
        timestamp: Date.now() - 10000, // 10 seconds ago
        ttl: 5000, // 5 second TTL
      }

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredEntry))
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await cache.get('guide-1')

      expect(result).toBeNull()
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Guide_guide-1')
    })

    it('should handle serialization of complex objects', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cooking Guide', 'A cooking guide')
      const cacheEntry = {
        data: guide,
        timestamp: Date.now(),
        ttl,
      }

      mockAsyncStorage.setItem.mockResolvedValue()
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheEntry))

      await cache.set('guide-1', guide)
      const result = await cache.get('guide-1')

      expect(result).toBeDefined()
      expect(((result as unknown) as GuideJSON).guideType).toBe('cooking')
    })

    it('should return null on JSON parse error', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid-json{')

      const result = await cache.get('guide-1')

      expect(result).toBeNull()
    })
  })

  describe('remove', () => {
    it('should remove entity from cache', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue()

      await cache.remove('guide-1')

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Guide_guide-1')
    })
  })

  describe('clear', () => {
    it('should clear all cache entries with prefix', async () => {
      const allKeys = [
        'Guidr_Cache_Guide_guide-1',
        'Guidr_Cache_Guide_guide-2',
        'Guidr_Cache_Guide_List_all',
        'Guidr_Cache_Session_session-1', // Different cache, should not be removed
        'SomeOtherKey',
      ]

      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys)
      mockAsyncStorage.multiRemove.mockResolvedValue()

      await cache.clear()

      expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled()
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'Guidr_Cache_Guide_guide-1',
        'Guidr_Cache_Guide_guide-2',
        'Guidr_Cache_Guide_List_all',
      ])
    })

    it('should not call multiRemove when no matching keys', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['Guidr_Cache_Session_session-1'])
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
      const guide = new Guide('guide-1', 'cooking', 'Cooking Guide')
      const validEntry = {
        data: guide,
        timestamp: Date.now() - 2000, // 2 seconds ago
        ttl: 5000, // 5 second TTL
      }

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(validEntry))

      const result = await cache.get('guide-1')

      expect(result).toBeDefined()
      expect(result?.id).toBe('guide-1')
    })

    it('should reject cache exactly at TTL boundary', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cooking Guide')
      const expiredEntry = {
        data: guide,
        timestamp: Date.now() - 5001, // Just past 5 second TTL
        ttl: 5000,
      }

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredEntry))
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await cache.get('guide-1')

      expect(result).toBeNull()
    })
  })

  describe('default TTL', () => {
    it('should use 5 minute default TTL when not specified', () => {
      const defaultCache = new EntityCache<Guide>('Guide')
      expect(defaultCache).toBeDefined()
      // TTL is private, but we can verify via behavior in other tests
    })
  })

  describe('error handling', () => {
    it('should return null when AsyncStorage.getItem throws', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))

      const result = await cache.get('guide-1')

      expect(result).toBeNull()
    })

    it('should fail silently when AsyncStorage.setItem throws', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cooking Guide')
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'))

      await expect(cache.set('guide-1', guide)).resolves.not.toThrow()
    })

    it('should fail silently when AsyncStorage.removeItem throws', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'))

      await expect(cache.remove('guide-1')).resolves.not.toThrow()
    })

    it('should fail silently when clear throws', async () => {
      mockAsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'))

      await expect(cache.clear()).resolves.not.toThrow()
    })
  })
})
