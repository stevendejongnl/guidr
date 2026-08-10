import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppSettingsStorage } from './AppSettingsStorage'

jest.mock('@react-native-async-storage/async-storage')

describe('AppSettingsStorage', () => {
  let storage: AppSettingsStorage
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

  beforeEach(() => {
    storage = new AppSettingsStorage()
    jest.clearAllMocks()
  })

  describe('resetToDefaults', () => {
    it('should remove all resettable preference keys', async () => {
      await storage.resetToDefaults()

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'Guidr_TimerNotificationsEnabled',
        'Guidr_CriticalNotificationsEnabled',
        'Guidr_DebugMode',
        'Guidr_SessionPreference_AutoAdvance',
        'Guidr_LastUpdateCheck',
      ])
    })

    it('should not remove account or server connection keys', async () => {
      await storage.resetToDefaults()

      const removedKeys = mockAsyncStorage.multiRemove.mock.calls[0]?.[0] ?? []
      expect(removedKeys).not.toContain('Guidr_ServerUrl')
      expect(removedKeys).not.toContain('Guidr_AuthToken')
      expect(removedKeys).not.toContain('Guidr_RefreshToken')
    })
  })
})
