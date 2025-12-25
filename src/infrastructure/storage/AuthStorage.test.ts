import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthStorage } from './AuthStorage'

jest.mock('@react-native-async-storage/async-storage')

describe('AuthStorage', () => {
  let storage: AuthStorage
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

  beforeEach(() => {
    storage = new AuthStorage()
    jest.clearAllMocks()
  })

  describe('getAuthToken', () => {
    it('should return null when no token is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await storage.getAuthToken()

      expect(result).toBeNull()
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_AuthToken')
    })

    it('should return stored token when token exists', async () => {
      const token = 'mock-jwt-token-123'
      mockAsyncStorage.getItem.mockResolvedValue(token)

      const result = await storage.getAuthToken()

      expect(result).toBe(token)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_AuthToken')
    })
  })

  describe('setAuthToken', () => {
    it('should store auth token', async () => {
      const token = 'mock-jwt-token-123'
      mockAsyncStorage.setItem.mockResolvedValue()

      await storage.setAuthToken(token)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('Guidr_AuthToken', token)
    })

    it('should throw error for empty token', async () => {
      await expect(storage.setAuthToken('')).rejects.toThrow('Auth token cannot be empty')
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only token', async () => {
      await expect(storage.setAuthToken('   ')).rejects.toThrow('Auth token cannot be empty')
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('hasAuthToken', () => {
    it('should return false when no token is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await storage.hasAuthToken()

      expect(result).toBe(false)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_AuthToken')
    })

    it('should return true when token exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('mock-jwt-token-123')

      const result = await storage.hasAuthToken()

      expect(result).toBe(true)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_AuthToken')
    })
  })

  describe('clearAuthToken', () => {
    it('should remove auth token from storage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue()

      await storage.clearAuthToken()

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_AuthToken')
    })
  })

  describe('getUserEmail', () => {
    it('should return null when no email is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await storage.getUserEmail()

      expect(result).toBeNull()
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_UserEmail')
    })

    it('should return stored email when email exists', async () => {
      const email = 'test@example.com'
      mockAsyncStorage.getItem.mockResolvedValue(email)

      const result = await storage.getUserEmail()

      expect(result).toBe(email)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_UserEmail')
    })
  })

  describe('setUserEmail', () => {
    it('should store user email', async () => {
      const email = 'test@example.com'
      mockAsyncStorage.setItem.mockResolvedValue()

      await storage.setUserEmail(email)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('Guidr_UserEmail', email)
    })

    it('should throw error for empty email', async () => {
      await expect(storage.setUserEmail('')).rejects.toThrow('User email cannot be empty')
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only email', async () => {
      await expect(storage.setUserEmail('   ')).rejects.toThrow('User email cannot be empty')
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('clearUserEmail', () => {
    it('should remove user email from storage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue()

      await storage.clearUserEmail()

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_UserEmail')
    })
  })

  describe('clearAll', () => {
    it('should remove both auth token and user email from storage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue()

      await storage.clearAll()

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_AuthToken')
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_UserEmail')
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(2)
    })
  })
})
