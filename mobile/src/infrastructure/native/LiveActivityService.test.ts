import { Platform, NativeModules } from 'react-native'
import { LiveActivityService } from './LiveActivityService'

jest.mock('../monitoring/ErrorReporter')

describe('LiveActivityService', () => {
  let service: LiveActivityService

  beforeEach(() => {
    service = new LiveActivityService()
    jest.clearAllMocks()
    Platform.OS = 'ios'
  })

  describe('isAvailable', () => {
    it('should return true when native module reports available', async () => {
      const mock = NativeModules['LiveActivityModule'].isAvailable as jest.Mock
      mock.mockResolvedValue(true)

      const result = await service.isAvailable()

      expect(result).toBe(true)
    })

    it('should return false on Android', async () => {
      Platform.OS = 'android'

      const result = await service.isAvailable()

      expect(result).toBe(false)
      expect(NativeModules['LiveActivityModule'].isAvailable).not.toHaveBeenCalled()
    })

    it('should return false when native module throws', async () => {
      const mock = NativeModules['LiveActivityModule'].isAvailable as jest.Mock
      mock.mockRejectedValue(new Error('Not supported'))

      const result = await service.isAvailable()

      expect(result).toBe(false)
    })
  })

  describe('startLiveActivity', () => {
    const data = {
      stepId: 'step-1',
      guideTitle: 'My Guide',
      stepTitle: 'Step 1',
      totalDurationSeconds: 300,
      remainingSeconds: 300,
    }

    it('should call native module with stepId as first parameter', async () => {
      const isAvailableMock = NativeModules['LiveActivityModule'].isAvailable as jest.Mock
      isAvailableMock.mockResolvedValue(true)
      const mock = NativeModules['LiveActivityModule'].startActivity as jest.Mock
      mock.mockResolvedValue('activity-123')

      const result = await service.startLiveActivity(data)

      expect(result).toBe('activity-123')
      expect(NativeModules['LiveActivityModule'].startActivity).toHaveBeenCalledWith(
        'step-1',
        'My Guide',
        'Step 1',
        300,
        300,
      )
    })

    it('should return null on Android', async () => {
      Platform.OS = 'android'

      const result = await service.startLiveActivity(data)

      expect(result).toBeNull()
      expect(NativeModules['LiveActivityModule'].startActivity).not.toHaveBeenCalled()
    })

    it('should return null when native module throws', async () => {
      const isAvailableMock = NativeModules['LiveActivityModule'].isAvailable as jest.Mock
      isAvailableMock.mockResolvedValue(true)
      const mock = NativeModules['LiveActivityModule'].startActivity as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      const result = await service.startLiveActivity(data)

      expect(result).toBeNull()
    })
  })

  describe('updateLiveActivity', () => {
    it('should call native module with stepId as first parameter', async () => {
      const mock = NativeModules['LiveActivityModule'].updateActivity as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.updateLiveActivity('step-1', 120, true, false)

      expect(NativeModules['LiveActivityModule'].updateActivity).toHaveBeenCalledWith(
        'step-1',
        120,
        true,
        false,
      )
    })

    it('should not call native module on Android', async () => {
      Platform.OS = 'android'

      await service.updateLiveActivity('step-1', 120, true, false)

      expect(NativeModules['LiveActivityModule'].updateActivity).not.toHaveBeenCalled()
    })

    it('should silently catch errors', async () => {
      const mock = NativeModules['LiveActivityModule'].updateActivity as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(service.updateLiveActivity('step-1', 120, true, false)).resolves.toBeUndefined()
    })
  })

  describe('removeLiveActivityTimer', () => {
    it('should call native removeTimer with stepId', async () => {
      const mock = NativeModules['LiveActivityModule'].removeTimer as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.removeLiveActivityTimer('step-1')

      expect(NativeModules['LiveActivityModule'].removeTimer).toHaveBeenCalledWith('step-1')
    })

    it('should not call native module on Android', async () => {
      Platform.OS = 'android'

      await service.removeLiveActivityTimer('step-1')

      expect(NativeModules['LiveActivityModule'].removeTimer).not.toHaveBeenCalled()
    })

    it('should silently catch errors', async () => {
      const mock = NativeModules['LiveActivityModule'].removeTimer as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(service.removeLiveActivityTimer('step-1')).resolves.toBeUndefined()
    })
  })

  describe('endLiveActivity', () => {
    it('should call native module', async () => {
      const mock = NativeModules['LiveActivityModule'].endActivity as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.endLiveActivity()

      expect(NativeModules['LiveActivityModule'].endActivity).toHaveBeenCalled()
    })

    it('should not call native module on Android', async () => {
      Platform.OS = 'android'

      await service.endLiveActivity()

      expect(NativeModules['LiveActivityModule'].endActivity).not.toHaveBeenCalled()
    })

    it('should silently catch errors', async () => {
      const mock = NativeModules['LiveActivityModule'].endActivity as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(service.endLiveActivity()).resolves.toBeUndefined()
    })
  })
})
