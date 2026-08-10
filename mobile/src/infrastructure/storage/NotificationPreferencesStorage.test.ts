import AsyncStorage from '@react-native-async-storage/async-storage'
import { NotificationPreferencesStorage } from './NotificationPreferencesStorage'

jest.mock('@react-native-async-storage/async-storage')

describe('NotificationPreferencesStorage', () => {
  let storage: NotificationPreferencesStorage
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

  beforeEach(() => {
    storage = new NotificationPreferencesStorage()
    jest.clearAllMocks()
  })

  describe('getTimerNotificationsEnabled', () => {
    it('should return true when no value stored (default)', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await storage.getTimerNotificationsEnabled()

      expect(result).toBe(true)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_TimerNotificationsEnabled')
    })

    it('should return true when stored as "true"', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true')

      const result = await storage.getTimerNotificationsEnabled()

      expect(result).toBe(true)
    })

    it('should return false when stored as "false"', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('false')

      const result = await storage.getTimerNotificationsEnabled()

      expect(result).toBe(false)
    })
  })

  describe('setTimerNotificationsEnabled', () => {
    it('should store value in AsyncStorage', async () => {
      await storage.setTimerNotificationsEnabled(true)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_TimerNotificationsEnabled',
        'true',
      )
    })
  })

  describe('getCriticalNotificationsEnabled', () => {
    it('should return false when no value stored (default)', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await storage.getCriticalNotificationsEnabled()

      expect(result).toBe(false)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('Guidr_CriticalNotificationsEnabled')
    })

    it('should return true when stored as "true"', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true')

      const result = await storage.getCriticalNotificationsEnabled()

      expect(result).toBe(true)
    })

    it('should return false when stored as "false"', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('false')

      const result = await storage.getCriticalNotificationsEnabled()

      expect(result).toBe(false)
    })
  })

  describe('setCriticalNotificationsEnabled', () => {
    it('should store value in AsyncStorage', async () => {
      await storage.setCriticalNotificationsEnabled(true)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_CriticalNotificationsEnabled',
        'true',
      )
    })
  })
})
