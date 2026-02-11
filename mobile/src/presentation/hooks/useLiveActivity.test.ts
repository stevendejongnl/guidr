import { renderHook, act } from '@testing-library/react-native'
import { useLiveActivity } from './useLiveActivity'
import { LiveActivityService } from '../../infrastructure/native/LiveActivityService'

function createMockService(): LiveActivityService {
  return {
    isAvailable: jest.fn().mockResolvedValue(true),
    startLiveActivity: jest.fn().mockResolvedValue('activity-123'),
    updateLiveActivity: jest.fn().mockResolvedValue(undefined),
    endLiveActivity: jest.fn().mockResolvedValue(undefined),
  } as unknown as LiveActivityService
}

describe('useLiveActivity', () => {
  it('should start a live activity for countdown steps', async () => {
    const mockService = createMockService()
    const { result } = renderHook(() => useLiveActivity(mockService))

    await act(async () => {
      await result.current.startLiveActivity({
        guideTitle: 'My Guide',
        stepTitle: 'Step 1',
        totalDurationSeconds: 300,
        remainingSeconds: 300,
      })
    })

    expect(mockService.startLiveActivity).toHaveBeenCalledWith({
      guideTitle: 'My Guide',
      stepTitle: 'Step 1',
      totalDurationSeconds: 300,
      remainingSeconds: 300,
    })
  })

  it('should not start for stopwatch steps (duration 0)', async () => {
    const mockService = createMockService()
    const { result } = renderHook(() => useLiveActivity(mockService))

    await act(async () => {
      await result.current.startLiveActivity({
        guideTitle: 'My Guide',
        stepTitle: 'Step 1',
        totalDurationSeconds: 0,
        remainingSeconds: 0,
      })
    })

    expect(mockService.startLiveActivity).not.toHaveBeenCalled()
  })

  it('should update live activity when active', async () => {
    const mockService = createMockService()
    const { result } = renderHook(() => useLiveActivity(mockService))

    await act(async () => {
      await result.current.startLiveActivity({
        guideTitle: 'My Guide',
        stepTitle: 'Step 1',
        totalDurationSeconds: 300,
        remainingSeconds: 300,
      })
    })

    await act(async () => {
      await result.current.updateLiveActivity(250, true, false)
    })

    expect(mockService.updateLiveActivity).toHaveBeenCalledWith(250, true, false)
  })

  it('should not update when no activity is active', async () => {
    const mockService = createMockService()
    const { result } = renderHook(() => useLiveActivity(mockService))

    await act(async () => {
      await result.current.updateLiveActivity(250, true, false)
    })

    expect(mockService.updateLiveActivity).not.toHaveBeenCalled()
  })

  it('should end live activity', async () => {
    const mockService = createMockService()
    const { result } = renderHook(() => useLiveActivity(mockService))

    await act(async () => {
      await result.current.startLiveActivity({
        guideTitle: 'My Guide',
        stepTitle: 'Step 1',
        totalDurationSeconds: 300,
        remainingSeconds: 300,
      })
    })

    await act(async () => {
      await result.current.endLiveActivity()
    })

    expect(mockService.endLiveActivity).toHaveBeenCalled()
  })

  it('should end live activity on unmount', async () => {
    const mockService = createMockService()
    const { result, unmount } = renderHook(() => useLiveActivity(mockService))

    await act(async () => {
      await result.current.startLiveActivity({
        guideTitle: 'My Guide',
        stepTitle: 'Step 1',
        totalDurationSeconds: 300,
        remainingSeconds: 300,
      })
    })

    unmount()

    expect(mockService.endLiveActivity).toHaveBeenCalled()
  })

  it('should not end on unmount when no activity is active', () => {
    const mockService = createMockService()
    const { unmount } = renderHook(() => useLiveActivity(mockService))

    unmount()

    expect(mockService.endLiveActivity).not.toHaveBeenCalled()
  })

  it('should not update after end', async () => {
    const mockService = createMockService()
    const { result } = renderHook(() => useLiveActivity(mockService))

    await act(async () => {
      await result.current.startLiveActivity({
        guideTitle: 'My Guide',
        stepTitle: 'Step 1',
        totalDurationSeconds: 300,
        remainingSeconds: 300,
      })
    })

    await act(async () => {
      await result.current.endLiveActivity()
    })

    jest.clearAllMocks()

    await act(async () => {
      await result.current.updateLiveActivity(100, false, false)
    })

    expect(mockService.updateLiveActivity).not.toHaveBeenCalled()
  })
})
