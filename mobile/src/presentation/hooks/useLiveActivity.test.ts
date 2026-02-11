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
    it('should update live activity when timer is tracked', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.addTimer(timerData)
      })

      await act(async () => {
        await result.current.updateTimer('step-1', 250, true, false)
      })

      expect(mockService.updateLiveActivity).toHaveBeenCalledWith('step-1', 250, true, false)
    })

    it('should not update when stepId is not tracked', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.updateTimer('unknown-step', 250, true, false)
      })

      expect(mockService.updateLiveActivity).not.toHaveBeenCalled()
    })
  })

  describe('removeTimer', () => {
    it('should remove a tracked timer', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.addTimer(timerData)
      })

      await act(async () => {
        await result.current.removeTimer('step-1')
      })

      expect(mockService.removeLiveActivityTimer).toHaveBeenCalledWith('step-1')
    })

    it('should not remove an untracked timer', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.removeTimer('unknown-step')
      })

      expect(mockService.removeLiveActivityTimer).not.toHaveBeenCalled()
    })

    it('should not allow updates after removal', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.addTimer(timerData)
      })

      await act(async () => {
        await result.current.removeTimer('step-1')
      })

      jest.clearAllMocks()

      await act(async () => {
        await result.current.updateTimer('step-1', 100, false, false)
      })

      expect(mockService.updateLiveActivity).not.toHaveBeenCalled()
    })
  })

  describe('endAllTimers', () => {
    it('should end all live activities', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.addTimer(timerData)
      })

      await act(async () => {
        await result.current.endAllTimers()
      })

      expect(mockService.endLiveActivity).toHaveBeenCalled()
    })

    it('should not call end when no timers are tracked', async () => {
      const mockService = createMockService()
      const { result } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.endAllTimers()
      })

      expect(mockService.endLiveActivity).not.toHaveBeenCalled()
    })
  })

  describe('multi-timer tracking', () => {
    it('should track multiple timers independently', async () => {
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

      // Remove first timer, second should still be updatable
      await act(async () => {
        await result.current.removeTimer('step-1')
      })

      jest.clearAllMocks()

      await act(async () => {
        await result.current.updateTimer('step-2', 500, false, false)
      })

      expect(mockService.updateLiveActivity).toHaveBeenCalledWith('step-2', 500, false, false)

      // First timer should no longer be updatable
      await act(async () => {
        await result.current.updateTimer('step-1', 200, false, false)
      })

      expect(mockService.updateLiveActivity).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup on unmount', () => {
    it('should end live activity on unmount when timers are active', async () => {
      const mockService = createMockService()
      const { result, unmount } = renderHook(() => useLiveActivity(mockService))

      await act(async () => {
        await result.current.addTimer(timerData)
      })

      unmount()

      expect(mockService.endLiveActivity).toHaveBeenCalled()
    })

    it('should not end on unmount when no timers are active', () => {
      const mockService = createMockService()
      const { unmount } = renderHook(() => useLiveActivity(mockService))

      unmount()

      expect(mockService.endLiveActivity).not.toHaveBeenCalled()
    })
  })
})
