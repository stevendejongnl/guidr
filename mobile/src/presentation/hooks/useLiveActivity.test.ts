import { renderHook, act } from '@testing-library/react-native'
import { useLiveActivity } from './useLiveActivity'
import { LiveActivityService } from '../../infrastructure/native/LiveActivityService'

function createMockService(): LiveActivityService {
  return {
    isAvailable: jest.fn().mockResolvedValue(true),
    startLiveActivity: jest.fn().mockResolvedValue('activity-123'),
    updateLiveActivity: jest.fn().mockResolvedValue(undefined),
    removeLiveActivityTimer: jest.fn().mockResolvedValue(undefined),
    endLiveActivity: jest.fn().mockResolvedValue(undefined),
  } as unknown as LiveActivityService
}

const timerData = {
  stepId: 'step-1',
  guideTitle: 'My Guide',
  stepTitle: 'Step 1',
  totalDurationSeconds: 300,
  remainingSeconds: 300,
}

describe('useLiveActivity', () => {
  describe('addTimer', () => {
    it('should start a live activity for countdown steps', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.addTimer(timerData)
      })

      expect(mockService.startLiveActivity).toHaveBeenCalledWith(timerData)
    })

    it('should not start for stopwatch steps (duration 0)', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.addTimer({
          ...timerData,
          totalDurationSeconds: 0,
          remainingSeconds: 0,
        })
      })

      expect(mockService.startLiveActivity).not.toHaveBeenCalled()
    })
  })

  describe('updateTimer', () => {
    it('should pass through update calls to native service', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.updateTimer('step-1', 250, true, false)
      })

      expect(mockService.updateLiveActivity).toHaveBeenCalledWith('step-1', 250, true, false)
    })

    it('should pass through updates for any stepId', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.updateTimer('unknown-step', 250, true, false)
      })

      expect(mockService.updateLiveActivity).toHaveBeenCalledWith('unknown-step', 250, true, false)
    })
  })

  describe('removeTimer', () => {
    it('should pass through remove calls to native service', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.removeTimer('step-1')
      })

      expect(mockService.removeLiveActivityTimer).toHaveBeenCalledWith('step-1')
    })

    it('should pass through removal for any stepId', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.removeTimer('unknown-step')
      })

      expect(mockService.removeLiveActivityTimer).toHaveBeenCalledWith('unknown-step')
    })
  })

  describe('endAllTimers', () => {
    it('should pass through end call to native service', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.endAllTimers()
      })

      expect(mockService.endLiveActivity).toHaveBeenCalled()
    })
  })

  describe('multi-timer operations', () => {
    it('should support adding multiple timers', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      const timer2 = {
        stepId: 'step-2',
        guideTitle: 'My Guide',
        stepTitle: 'Step 2',
        totalDurationSeconds: 600,
        remainingSeconds: 600,
      }

      await act(async () => {
        await result.current.addTimer(timerData)
        await result.current.addTimer(timer2)
      })

      expect(mockService.startLiveActivity).toHaveBeenCalledTimes(2)
    })

    it('should allow updates after removal (native handles gracefully)', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.removeTimer('step-1')
      })

      await act(async () => {
        await result.current.updateTimer('step-1', 100, false, false)
      })

      expect(mockService.updateLiveActivity).toHaveBeenCalledWith('step-1', 100, false, false)
    })
  })

  describe('unmount behavior', () => {
    it('should not end live activity on unmount', async () => {
      const mockService = createMockService()
      const { result, unmount } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.addTimer(timerData)
      })

      unmount()

      expect(mockService.endLiveActivity).not.toHaveBeenCalled()
    })
  })
})
