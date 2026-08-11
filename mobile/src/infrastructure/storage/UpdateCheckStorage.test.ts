import AsyncStorage from '@react-native-async-storage/async-storage'
import { UpdateCheckStorage } from './UpdateCheckStorage'
import { UpdateCheckCache, CachedUpdateInfo } from './UpdateCheckCache'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

describe('UpdateCheckStorage', () => {
  let storage: UpdateCheckStorage

  beforeEach(() => {
    storage = new UpdateCheckStorage()
    jest.clearAllMocks()
  })

  describe('getLastCheckTimestamp', () => {
    it('should return null when no timestamp is stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await storage.getLastCheckTimestamp()
      expect(result).toBeNull()
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('Guidr_LastUpdateCheck')
    })

    it('should return Date object when timestamp is stored', async () => {
      const testDate = new Date('2025-01-15T10:00:00Z')
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        testDate.toISOString()
      )

      const result = await storage.getLastCheckTimestamp()
      expect(result).toEqual(testDate)
    })

    it('should return null on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      )

      const result = await storage.getLastCheckTimestamp()
      expect(result).toBeNull()
    })
  })

  describe('setLastCheckTimestamp', () => {
    it('should store timestamp in AsyncStorage', async () => {
      const testDate = new Date('2025-01-15T10:00:00Z')
      ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

      await storage.setLastCheckTimestamp(testDate)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_LastUpdateCheck',
        testDate.toISOString()
      )
    })

    it('should throw error on AsyncStorage failure', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      )

      const testDate = new Date()
      await expect(storage.setLastCheckTimestamp(testDate)).rejects.toThrow(
        'Failed to save update check timestamp'
      )
    })
  })

  describe('shouldCheckForUpdates', () => {
    it('should return true when never checked before', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await storage.shouldCheckForUpdates()
      expect(result).toBe(true)
    })

    it('should return false when checked within 24 hours', async () => {
      const recentDate = new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        recentDate.toISOString()
      )

      const result = await storage.shouldCheckForUpdates()
      expect(result).toBe(false)
    })

    it('should return true when checked more than 24 hours ago', async () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        oldDate.toISOString()
      )

      const result = await storage.shouldCheckForUpdates()
      expect(result).toBe(true)
    })

    it('should return true on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      )

      const result = await storage.shouldCheckForUpdates()
      expect(result).toBe(true)
    })

    it('should return true when exactly at 24 hour boundary', async () => {
      const exactlyOneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        exactlyOneDayAgo.toISOString()
      )

      const result = await storage.shouldCheckForUpdates()
      expect(result).toBe(true)
    })
  })

  describe('clearLastCheck', () => {
    it('should remove timestamp from AsyncStorage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)

      await storage.clearLastCheck()
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'Guidr_LastUpdateCheck'
      )
    })

    it('should throw error on AsyncStorage failure', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      )

      await expect(storage.clearLastCheck()).rejects.toThrow(
        'Failed to clear update check data'
      )
    })
  })

  describe('getLastNotifiedVersion', () => {
    it('should return null when no version is stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await storage.getLastNotifiedVersion()
      expect(result).toBeNull()
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('Guidr_LastNotifiedUpdateVersion')
    })

    it('should return the stored version', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1.15.0')

      const result = await storage.getLastNotifiedVersion()
      expect(result).toBe('1.15.0')
    })

    it('should return null on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      )

      const result = await storage.getLastNotifiedVersion()
      expect(result).toBeNull()
    })
  })

  describe('setLastNotifiedVersion', () => {
    it('should store the version in AsyncStorage', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

      await storage.setLastNotifiedVersion('1.15.0')

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_LastNotifiedUpdateVersion',
        '1.15.0'
      )
    })

    it('should throw error on AsyncStorage failure', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      )

      await expect(storage.setLastNotifiedVersion('1.15.0')).rejects.toThrow(
        'Failed to save last notified update version'
      )
    })
  })
})

describe('UpdateCheckCache', () => {
  beforeEach(() => {
    UpdateCheckCache.clearCache()
  })

  describe('setCache and getCache', () => {
    it('should store and retrieve cache', () => {
      const cacheInfo: CachedUpdateInfo = {
        latestVersion: '1.15.0',
        currentVersion: '1.14.0',
        updateAvailable: true,
        isMandatory: false,
        release: {
          version: '1.15.0',
          tagName: 'v1.15.0',
          name: 'Version 1.15.0',
          body: 'Release notes',
          publishedAt: '2025-01-15T10:00:00Z',
          apkUrl:
            'https://github.com/example/app/releases/download/v1.15.0/app.apk',
          isPrerelease: false,
        },
        checkedAt: new Date('2025-01-15T10:00:00Z'),
      }

      UpdateCheckCache.setCache(cacheInfo)
      const result = UpdateCheckCache.getCache()

      expect(result).toEqual(cacheInfo)
    })

    it('should return null when no cache is set', () => {
      const result = UpdateCheckCache.getCache()
      expect(result).toBeNull()
    })
  })

  describe('hasCache', () => {
    it('should return false when cache is empty', () => {
      expect(UpdateCheckCache.hasCache()).toBe(false)
    })

    it('should return true when cache exists', () => {
      const cacheInfo: CachedUpdateInfo = {
        latestVersion: '1.15.0',
        currentVersion: '1.14.0',
        updateAvailable: true,
        isMandatory: false,
        release: null,
        checkedAt: new Date(),
      }

      UpdateCheckCache.setCache(cacheInfo)
      expect(UpdateCheckCache.hasCache()).toBe(true)
    })
  })

  describe('isCacheValid', () => {
    it('should return false when cache is empty', () => {
      expect(UpdateCheckCache.isCacheValid()).toBe(false)
    })

    it('should return true when cache is fresh (within 24h)', () => {
      const cacheInfo: CachedUpdateInfo = {
        latestVersion: '1.15.0',
        currentVersion: '1.14.0',
        updateAvailable: true,
        isMandatory: false,
        release: null,
        checkedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      }

      UpdateCheckCache.setCache(cacheInfo)
      expect(UpdateCheckCache.isCacheValid()).toBe(true)
    })

    it('should return false when cache is stale (over 24h)', () => {
      const cacheInfo: CachedUpdateInfo = {
        latestVersion: '1.15.0',
        currentVersion: '1.14.0',
        updateAvailable: true,
        isMandatory: false,
        release: null,
        checkedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      }

      UpdateCheckCache.setCache(cacheInfo)
      expect(UpdateCheckCache.isCacheValid()).toBe(false)
    })

    it('should return false when cache is exactly 24h old', () => {
      const cacheInfo: CachedUpdateInfo = {
        latestVersion: '1.15.0',
        currentVersion: '1.14.0',
        updateAvailable: true,
        isMandatory: false,
        release: null,
        checkedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      }

      UpdateCheckCache.setCache(cacheInfo)
      expect(UpdateCheckCache.isCacheValid()).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('should clear the cache', () => {
      const cacheInfo: CachedUpdateInfo = {
        latestVersion: '1.15.0',
        currentVersion: '1.14.0',
        updateAvailable: true,
        isMandatory: false,
        release: null,
        checkedAt: new Date(),
      }

      UpdateCheckCache.setCache(cacheInfo)
      expect(UpdateCheckCache.hasCache()).toBe(true)

      UpdateCheckCache.clearCache()
      expect(UpdateCheckCache.hasCache()).toBe(false)
      expect(UpdateCheckCache.getCache()).toBeNull()
    })
  })
})
