import AsyncStorage from '@react-native-async-storage/async-storage'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Generic AsyncStorage cache with TTL (Time To Live) support.
 *
 * Features:
 * - Type-safe caching for any entity type
 * - TTL-based expiration (configurable per cache instance)
 * - Automatic serialization/deserialization with JSON
 * - Cache key pattern: Guidr_Cache_{prefix}_{key}
 *
 * @example
 * const cache = new EntityCache<Guide>('Guide', 5 * 60 * 1000) // 5 min TTL
 * await cache.set('guide-1', guide)
 * const guide = await cache.get('guide-1')
 */
export class EntityCache<T> {
  constructor(
    private readonly cachePrefix: string,
    private readonly ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ) {}

  /**
   * Get entity from cache. Returns null if not found or expired.
   */
  async get(key: string): Promise<T | null> {
    try {
      const cacheKey = this.buildCacheKey(key)
      const cachedData = await AsyncStorage.getItem(cacheKey)

      if (!cachedData) {
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(cachedData)

      // Check if expired
      if (!this.isValid(entry)) {
        await this.remove(key)
        return null
      }

      return entry.data
    } catch (_error) {
      // Ignore cache errors, return null as cache miss
      return null
    }
  }

  /**
   * Store entity or array of entities in cache with timestamp and TTL.
   * Supports both single items (T) and arrays (T[]) for convenience.
   */
  async set(key: string, value: T | T[]): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(key)
      const entry: CacheEntry<T | T[]> = {
        data: value,
        timestamp: Date.now(),
        ttl: this.ttlMs,
      }

      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry))
    } catch (_error) {
      // Ignore cache errors, fail silently
    }
  }

  /**
   * Remove entity from cache.
   */
  async remove(key: string): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(key)
      await AsyncStorage.removeItem(cacheKey)
    } catch (_error) {
      // Ignore cache errors
    }
  }

  /**
   * Clear all cache entries for this cache instance.
   */
  async clear(): Promise<void> {
    try {
      const prefix = `Guidr_Cache_${this.cachePrefix}_`
      const allKeys = await AsyncStorage.getAllKeys()
      const keysToRemove = allKeys.filter(key => key.startsWith(prefix))

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove)
      }
    } catch (_error) {
      // Ignore cache errors
    }
  }

  /**
   * Check if cache entry is still valid based on TTL.
   */
  private isValid(entry: CacheEntry<T>): boolean {
    const now = Date.now()
    const age = now - entry.timestamp
    return age < entry.ttl
  }

  /**
   * Build full cache key with prefix.
   */
  private buildCacheKey(key: string): string {
    return `Guidr_Cache_${this.cachePrefix}_${key}`
  }
}
