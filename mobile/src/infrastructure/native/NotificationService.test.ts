import { Platform, NativeModules, PermissionsAndroid } from 'react-native'
import { NotificationService } from './NotificationService'

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    service = new NotificationService()
    jest.clearAllMocks()
    Platform.OS = 'android'
  })

  describe('requestPermission', () => {
    it('should request POST_NOTIFICATIONS on Android 33+', async () => {
      Platform.Version = 33
      const mock = PermissionsAndroid.request as jest.Mock
      mock.mockResolvedValue('granted')

      const result = await service.requestPermission()

      expect(result).toBe(true)
      expect(mock).toHaveBeenCalledWith('android.permission.POST_NOTIFICATIONS')
    })

    it('should return true on Android < 33 without requesting', async () => {
      Platform.Version = 32

      const result = await service.requestPermission()

      expect(result).toBe(true)
      expect(PermissionsAndroid.request).not.toHaveBeenCalled()
    })

    it('should return false when permission denied', async () => {
      Platform.Version = 33
      const mock = PermissionsAndroid.request as jest.Mock
      mock.mockResolvedValue('denied')

      const result = await service.requestPermission()

      expect(result).toBe(false)
    })

    it('should return false when the permission request throws', async () => {
      Platform.Version = 33
      const mock = PermissionsAndroid.request as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      const result = await service.requestPermission()

      expect(result).toBe(false)
    })
  })

  describe('scheduleTimerNotification', () => {
    it('should call native module', async () => {
      const mock = NativeModules['NotificationModule'].scheduleNotification as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.scheduleTimerNotification('step-1', 'Boil water', 'Pasta', 300, false)

      expect(mock).toHaveBeenCalledWith('step-1', 'Boil water', 'Pasta', 300, false)
    })

    it('should pass critical flag', async () => {
      const mock = NativeModules['NotificationModule'].scheduleNotification as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.scheduleTimerNotification('step-1', 'Boil water', 'Pasta', 300, true)

      expect(mock).toHaveBeenCalledWith('step-1', 'Boil water', 'Pasta', 300, true)
    })

    it('should silently catch errors', async () => {
      const mock = NativeModules['NotificationModule'].scheduleNotification as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(
        service.scheduleTimerNotification('step-1', 'Boil water', 'Pasta', 300, false),
      ).resolves.toBeUndefined()
    })
  })

  describe('cancelTimerNotification', () => {
    it('should call native module', async () => {
      const mock = NativeModules['NotificationModule'].cancelNotification as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.cancelTimerNotification('step-1')

      expect(mock).toHaveBeenCalledWith('step-1')
    })

    it('should silently catch errors', async () => {
      const mock = NativeModules['NotificationModule'].cancelNotification as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(service.cancelTimerNotification('step-1')).resolves.toBeUndefined()
    })
  })

  describe('cancelAllTimerNotifications', () => {
    it('should call native module', async () => {
      const mock = NativeModules['NotificationModule'].cancelAllNotifications as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.cancelAllTimerNotifications()

      expect(mock).toHaveBeenCalled()
    })

    it('should silently catch errors', async () => {
      const mock = NativeModules['NotificationModule'].cancelAllNotifications as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(service.cancelAllTimerNotifications()).resolves.toBeUndefined()
    })
  })

  describe('showImmediateNotification', () => {
    it('should call native module on Android', async () => {
      const mock = NativeModules['NotificationModule'].showNotification as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.showImmediateNotification('step-1', 'Boil water', 'Pasta', false)

      expect(mock).toHaveBeenCalledWith('step-1', 'Boil water', 'Pasta', false)
    })

    it('should not call native module on non-Android platforms', async () => {
      Platform.OS = 'web'

      await service.showImmediateNotification('step-1', 'Boil water', 'Pasta', false)

      expect(NativeModules['NotificationModule'].showNotification).not.toHaveBeenCalled()
    })

    it('should silently catch errors on Android', async () => {
      const mock = NativeModules['NotificationModule'].showNotification as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(
        service.showImmediateNotification('step-1', 'Boil water', 'Pasta', false),
      ).resolves.toBeUndefined()
    })
  })
})
