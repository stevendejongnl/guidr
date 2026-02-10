import { renderHook, waitFor } from '@testing-library/react-native'
import { useActiveTimers } from './useActiveTimers'
import { createMockStepTimerClient } from '../testUtils'
import { ActiveStepTimerDto } from '../../infrastructure/api/dtos/ActiveStepTimerDto'

describe('useActiveTimers', () => {
  let mockClient: ReturnType<typeof createMockStepTimerClient>

  beforeEach(() => {
    mockClient = createMockStepTimerClient()
  })

  it('should return loading true initially then false after fetch', async () => {
    const { result } = renderHook(() => useActiveTimers('test-token', mockClient))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should return empty activeTimers when API returns empty list', async () => {
    mockClient.getActiveTimers.mockResolvedValue([])

    const { result } = renderHook(() => useActiveTimers('test-token', mockClient))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.activeTimers).toEqual([])
    })
  })

  it('should map DTOs to ActiveTimerItems with display values', async () => {
    const dto: ActiveStepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'paused',
      startedAt: null,
      accumulatedSeconds: 45,
      durationSeconds: 120,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      guideTitle: 'My Cooking Guide',
      stepTitle: 'Preheat Oven',
    }
    mockClient.getActiveTimers.mockResolvedValue([dto])

    const { result } = renderHook(() => useActiveTimers('test-token', mockClient))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.activeTimers).toHaveLength(1)
      const timer = result.current.activeTimers[0]!
      expect(timer.timerId).toBe('timer-1')
      expect(timer.guideId).toBe('guide-1')
      expect(timer.guideTitle).toBe('My Cooking Guide')
      expect(timer.stepTitle).toBe('Preheat Oven')
      expect(timer.display.mode).toBe('countdown')
      expect(timer.display.displaySeconds).toBe(75) // 120 - 45
      expect(timer.display.isPaused).toBe(true)
      expect(timer.display.isRunning).toBe(false)
    })
  })

  it('should not fetch when authToken is null', async () => {
    const { result } = renderHook(() => useActiveTimers(null, mockClient))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.activeTimers).toEqual([])
    })
    expect(mockClient.getActiveTimers).not.toHaveBeenCalled()
  })

  it('should not fetch when client is null', async () => {
    const { result } = renderHook(() => useActiveTimers('test-token', null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.activeTimers).toEqual([])
    })
  })

  it('should handle fetch errors gracefully', async () => {
    mockClient.getActiveTimers.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useActiveTimers('test-token', mockClient))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.activeTimers).toEqual([])
    })
  })
})
