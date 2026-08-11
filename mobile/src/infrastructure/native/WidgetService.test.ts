import { Platform, NativeModules } from 'react-native'
import { WidgetService, WidgetTimerData } from './WidgetService'

describe('WidgetService', () => {
  let service: WidgetService

  const data: WidgetTimerData = {
    stepId: 'step-1',
    guideTitle: 'Pasta',
    stepTitle: 'Boil water',
    totalDurationSeconds: 300,
    remainingSeconds: 180,
    isPaused: false,
    isComplete: false,
  }

  beforeEach(() => {
    service = new WidgetService()
    jest.clearAllMocks()
    Platform.OS = 'android'
  })

  describe('updateWidget', () => {
    it('should call the native module with the timer data on Android', async () => {
      const mock = NativeModules['WidgetModule'].updateWidget as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.updateWidget(data)

      expect(mock).toHaveBeenCalledWith(
        'step-1',
        'Pasta',
        'Boil water',
        300,
        180,
        false,
        false,
      )
    })

    it('should not call the native module on non-Android platforms', async () => {
      Platform.OS = 'web'

      await service.updateWidget(data)

      expect(NativeModules['WidgetModule'].updateWidget).not.toHaveBeenCalled()
    })

    it('should silently catch errors', async () => {
      const mock = NativeModules['WidgetModule'].updateWidget as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(service.updateWidget(data)).resolves.toBeUndefined()
    })
  })

  describe('clearWidget', () => {
    it('should call the native module on Android', async () => {
      const mock = NativeModules['WidgetModule'].clearWidget as jest.Mock
      mock.mockResolvedValue(undefined)

      await service.clearWidget()

      expect(mock).toHaveBeenCalled()
    })

    it('should not call the native module on non-Android platforms', async () => {
      Platform.OS = 'web'

      await service.clearWidget()

      expect(NativeModules['WidgetModule'].clearWidget).not.toHaveBeenCalled()
    })

    it('should silently catch errors', async () => {
      const mock = NativeModules['WidgetModule'].clearWidget as jest.Mock
      mock.mockRejectedValue(new Error('Failed'))

      await expect(service.clearWidget()).resolves.toBeUndefined()
    })
  })
})
