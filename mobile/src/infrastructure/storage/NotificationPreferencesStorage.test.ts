import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform, NativeModules } from 'react-native'
import { NotificationPreferencesStorage } from './NotificationPreferencesStorage'

jest.mock('@react-native-async-storage/async-storage')

describe('NotificationPreferencesStorage', () => {
  let storage: NotificationPreferencesStorage
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

  beforeEach(() => {
    storage = new NotificationPreferencesStorage()
    jest.clearAllMocks()
    Platform.OS = 'ios'
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
      mockAsyncStorage.getItem.mockResolvedValue('false')

      await storage.setTimerNotificationsEnabled(true)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_TimerNotificationsEnabled',
        'true',
      )
    })

    it('should sync preferences to native on iOS', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('false')

      await storage.setTimerNotificationsEnabled(true)

      expect(NativeModules['NotificationModule'].syncPreferences).toHaveBeenCalledWith(
        true,
        false,
      )
    })

    it('should not sync to native on Android', async () => {
      Platform.OS = 'android'
      mockAsyncStorage.getItem.mockResolvedValue('false')

      await storage.setTimerNotificationsEnabled(true)

      expect(NativeModules['NotificationModule'].syncPreferences).not.toHaveBeenCalled()
    })

    it('should not throw when native sync fails', async () => {
      const mock = NativeModules['NotificationModule'].syncPreferences as jest.Mock
      mock.mockRejectedValue(new Error('Native error'))
      mockAsyncStorage.getItem.mockResolvedValue('false')

      await expect(storage.setTimerNotificationsEnabled(true)).resolves.toBeUndefined()
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
      mockAsyncStorage.getItem.mockResolvedValue('false')

      await storage.setCriticalNotificationsEnabled(true)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_CriticalNotificationsEnabled',
        'true',
      )
    })

    it('should sync preferences to native on iOS', async () => {
      // First getItem call is for setCritical's setItem, second is for getTimerNotifications
      mockAsyncStorage.getItem.mockResolvedValue('true')

      await storage.setCriticalNotificationsEnabled(true)

      expect(NativeModules['NotificationModule'].syncPreferences).toHaveBeenCalledWith(
        true,
        true,
      )
    })

    it('should not sync to native on Android', async () => {
      Platform.OS = 'android'
      mockAsyncStorage.getItem.mockResolvedValue('false')

      await storage.setCriticalNotificationsEnabled(true)

      expect(NativeModules['NotificationModule'].syncPreferences).not.toHaveBeenCalled()
    })
  })
})
