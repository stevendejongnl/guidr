import AsyncStorage from '@react-native-async-storage/async-storage'
import { ServerConfigStorage } from './ServerConfigStorage'
import { ConfigLoader } from '../config/ConfigLoader'

jest.mock('@react-native-async-storage/async-storage')
jest.mock('../config/ConfigLoader')

describe('ServerConfigStorage', () => {
  let storage: ServerConfigStorage
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
  const mockConfigLoader = ConfigLoader as jest.Mocked<typeof ConfigLoader>

  beforeEach(() => {
    storage = new ServerConfigStorage()
    jest.clearAllMocks()
    mockConfigLoader.getServerUrl.mockResolvedValue('https://guidr.madebysteven.nl')
  })

  describe('getServerUrl', () => {
    it('should return null when no URL is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await storage.getServerUrl()

      expect(result).toBeNull()
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_ServerUrl')
    })

    it('should return stored URL', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('https://api.example.com')

      const result = await storage.getServerUrl()

      expect(result).toBe('https://api.example.com')
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_ServerUrl')
    })
  })

  describe('setServerUrl', () => {
    it('should store valid HTTP URL', async () => {
      await storage.setServerUrl('http://localhost:3000')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'http://localhost:3000'
      )
    })

    it('should store valid HTTPS URL', async () => {
      await storage.setServerUrl('https://api.example.com')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'https://api.example.com'
      )
    })

    it('should store URL with port', async () => {
      await storage.setServerUrl('http://192.168.1.100:8080')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'http://192.168.1.100:8080'
      )
    })

    it('should store URL with path', async () => {
      await storage.setServerUrl('https://api.example.com/v1')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'https://api.example.com/v1'
      )
    })

    it('should throw error for invalid URL format', async () => {
      await expect(storage.setServerUrl('not a url')).rejects.toThrow(
        'Invalid server URL format'
      )
    })

    it('should throw error for empty URL', async () => {
      await expect(storage.setServerUrl('')).rejects.toThrow('Server URL cannot be empty')
    })

    it('should throw error for FTP protocol', async () => {
      await expect(storage.setServerUrl('ftp://example.com')).rejects.toThrow(
        'Server URL must use HTTP or HTTPS protocol'
      )
    })

    it('should strip /api/v1 suffix when setting URL', async () => {
      await storage.setServerUrl('https://example.com/api/v1')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'https://example.com'
      )
    })

    it('should strip /api/v1/ with trailing slash', async () => {
      await storage.setServerUrl('https://example.com/api/v1/')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'https://example.com'
      )
    })

    it('should handle URLs already without /api/v1', async () => {
      await storage.setServerUrl('https://example.com')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'https://example.com'
      )
    })

    it('should not strip /api/v1 from path segments', async () => {
      await storage.setServerUrl('https://example.com/api/v1/foo')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'https://example.com/api/v1/foo'
      )
    })

    it('should strip trailing slash', async () => {
      await storage.setServerUrl('https://example.com/')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'https://example.com'
      )
    })
  })

  describe('hasServerUrl', () => {
    it('should return false when no URL is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await storage.hasServerUrl()

      expect(result).toBe(false)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_ServerUrl')
    })

    it('should return true when URL is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('https://api.example.com')

      const result = await storage.hasServerUrl()

      expect(result).toBe(true)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_ServerUrl')
    })
  })

  describe('clearServerUrl', () => {
    it('should remove stored URL', async () => {
      await storage.clearServerUrl()

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_ServerUrl')
    })
  })

  describe('initializeDefaultServerUrl', () => {
    it('should set default URL from config when no URL is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      await storage.initializeDefaultServerUrl()

      expect(mockConfigLoader.getServerUrl).toHaveBeenCalled()
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_ServerUrl',
        'https://guidr.madebysteven.nl'
      )
    })

    it('should not override existing URL', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('https://custom.server.com')

      await storage.initializeDefaultServerUrl()

      expect(mockConfigLoader.getServerUrl).not.toHaveBeenCalled()
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('getDefaultServerUrl', () => {
    it('should return default server URL from config', async () => {
      const result = await storage.getDefaultServerUrl()

      expect(mockConfigLoader.getServerUrl).toHaveBeenCalled()
      expect(result).toBe('https://guidr.madebysteven.nl')
    })
  })
})
