import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useStepTimers, calculateDisplay } from './useStepTimers'
import { StepTimerDto } from '../../infrastructure/api/dtos/StepTimerDto'
import { StepTimerClient } from '../../infrastructure/api/StepTimerClient'

const createMockStepTimerClient = (): jest.Mocked<StepTimerClient> =>
  ({
    getTimersByGuide: jest.fn().mockResolvedValue([]),
    startTimer: jest.fn(),
    pauseTimer: jest.fn(),
    resetTimer: jest.fn(),
  }) as unknown as jest.Mocked<StepTimerClient>

describe('useStepTimers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns loading=true initially then false after API call', async () => {
    const mockClient = createMockStepTimerClient()
    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', mockClient),
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockClient.getTimersByGuide).toHaveBeenCalledWith('guide-1', 'test-token')
  })

  it('loads timers from API and maps to display state', async () => {
    const mockTimers: StepTimerDto[] = [
      {
        id: 'timer-1',
        stepId: 'step-1',
        guideId: 'guide-1',
        userId: 'user-1',
        status: 'paused',
        startedAt: null,
        accumulatedSeconds: 60,
        durationSeconds: 300,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    const mockClient = createMockStepTimerClient()
    mockClient.getTimersByGuide.mockResolvedValue(mockTimers)

    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', mockClient),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const display = result.current.timers['step-1']!
    expect(display).toBeDefined()
    expect(display.timerId).toBe('timer-1')
    expect(display.mode).toBe('countdown')
    expect(display.displaySeconds).toBe(240) // 300 - 60
    expect(display.isPaused).toBe(true)
    expect(display.isRunning).toBe(false)
  })

  it('startTimer calls client and updates state', async () => {
    const newTimer: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'running',
      startedAt: new Date().toISOString(),
      accumulatedSeconds: 0,
      durationSeconds: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockClient = createMockStepTimerClient()
    mockClient.startTimer.mockResolvedValue(newTimer)

    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', mockClient),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.startTimer('step-1', 5) // 5 minutes
    })

    expect(mockClient.startTimer).toHaveBeenCalledWith(
      'step-1',
      'guide-1',
      300, // 5 * 60
      'test-token',
    )
    expect(result.current.timers['step-1']).toBeDefined()
    expect(result.current.timers['step-1']!.isRunning).toBe(true)
  })

  it('pauseTimer calls client and updates state', async () => {
    const runningTimer: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'running',
      startedAt: new Date().toISOString(),
      accumulatedSeconds: 60,
      durationSeconds: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const pausedTimer: StepTimerDto = {
      ...runningTimer,
      status: 'paused',
      startedAt: null,
      accumulatedSeconds: 120,
    }

    const mockClient = createMockStepTimerClient()
    mockClient.getTimersByGuide.mockResolvedValue([runningTimer])
    mockClient.pauseTimer.mockResolvedValue(pausedTimer)

    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', mockClient),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.pauseTimer('step-1')
    })

    expect(mockClient.pauseTimer).toHaveBeenCalledWith('timer-1', 'test-token')
    expect(result.current.timers['step-1']!.isPaused).toBe(true)
  })

  it('resetTimer calls client and updates state', async () => {
    const pausedTimer: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'paused',
      startedAt: null,
      accumulatedSeconds: 120,
      durationSeconds: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const resetTimer: StepTimerDto = {
      ...pausedTimer,
      status: 'idle',
      accumulatedSeconds: 0,
    }

    const mockClient = createMockStepTimerClient()
    mockClient.getTimersByGuide.mockResolvedValue([pausedTimer])
    mockClient.resetTimer.mockResolvedValue(resetTimer)

    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', mockClient),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.resetTimer('step-1')
    })

    expect(mockClient.resetTimer).toHaveBeenCalledWith('timer-1', 'test-token')
    expect(result.current.timers['step-1']!.displaySeconds).toBe(300) // countdown: 300-0=300
  })

  it('does not call API when authToken is null', async () => {
    const mockClient = createMockStepTimerClient()
    const { result } = renderHook(() =>
      useStepTimers('guide-1', null, mockClient),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockClient.getTimersByGuide).not.toHaveBeenCalled()
    expect(result.current.timers).toEqual({})
  })

  it('does not call API when client is null', async () => {
    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', null),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.timers).toEqual({})
  })

  it('stopwatch mode counts up from zero', async () => {
    const idleTimer: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'paused',
      startedAt: null,
      accumulatedSeconds: 45,
      durationSeconds: 0, // stopwatch mode
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockClient = createMockStepTimerClient()
    mockClient.getTimersByGuide.mockResolvedValue([idleTimer])

    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', mockClient),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const display = result.current.timers['step-1']!
    expect(display.mode).toBe('stopwatch')
    expect(display.displaySeconds).toBe(45) // counts up
    expect(display.isComplete).toBe(false) // never complete in stopwatch
  })

  it('running timer loaded from API shows correct countdown, not completed', async () => {
    // Simulate a timer started 10 seconds ago — as returned by the API
    // with a proper UTC ISO string (the fix ensures +00:00 suffix)
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString()

    const runningTimer: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'running',
      startedAt: tenSecondsAgo,
      accumulatedSeconds: 0,
      durationSeconds: 300, // 5 minute countdown
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockClient = createMockStepTimerClient()
    mockClient.getTimersByGuide.mockResolvedValue([runningTimer])

    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', mockClient),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const display = result.current.timers['step-1']!
    expect(display).toBeDefined()
    expect(display.isRunning).toBe(true)
    expect(display.isComplete).toBe(false)
    // Should show ~290 seconds remaining (300 - ~10), allow some tolerance
    expect(display.displaySeconds).toBeGreaterThan(280)
    expect(display.displaySeconds).toBeLessThanOrEqual(300)
  })

  it('marks countdown timer as complete when elapsed >= duration', async () => {
    const completedTimer: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'paused',
      startedAt: null,
      accumulatedSeconds: 300,
      durationSeconds: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockClient = createMockStepTimerClient()
    mockClient.getTimersByGuide.mockResolvedValue([completedTimer])

    const { result } = renderHook(() =>
      useStepTimers('guide-1', 'test-token', mockClient),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const display = result.current.timers['step-1']!
    expect(display.isComplete).toBe(true)
    expect(display.displaySeconds).toBe(0)
  })
})

describe('calculateDisplay', () => {
  it('uses drift-resistant calculation when serverTime and receivedAt present', () => {
    const now = Date.now()
    // Server says timer started 30s ago (server clock)
    const serverNow = new Date(now).toISOString()
    const startedAt = new Date(now - 30_000).toISOString()

    const dto: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'running',
      startedAt,
      accumulatedSeconds: 0,
      durationSeconds: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverTime: serverNow,
      receivedAt: now, // received just now
    }

    const display = calculateDisplay(dto)
    // serverElapsed = 30s, localElapsed ≈ 0s → remaining ≈ 270
    expect(display.displaySeconds).toBeGreaterThanOrEqual(269)
    expect(display.displaySeconds).toBeLessThanOrEqual(271)
    expect(display.isRunning).toBe(true)
  })

  it('eliminates clock drift when client clock is behind server', () => {
    const now = Date.now()
    // Server started 10s ago, server says "now" is 10s after start
    const serverStart = new Date(now - 10_000).toISOString()
    const serverNow = new Date(now).toISOString()

    const dto: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'running',
      startedAt: serverStart,
      accumulatedSeconds: 0,
      durationSeconds: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverTime: serverNow,
      // Client received 2 seconds ago (simulates network delay)
      receivedAt: now - 2000,
    }

    const display = calculateDisplay(dto)
    // serverElapsed=10, localElapsed≈2 → total≈12 → remaining≈48
    expect(display.displaySeconds).toBeGreaterThanOrEqual(47)
    expect(display.displaySeconds).toBeLessThanOrEqual(49)
  })

  it('falls back to Date.now() - startedAt when serverTime is missing', () => {
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString()

    const dto: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'running',
      startedAt: tenSecondsAgo,
      accumulatedSeconds: 0,
      durationSeconds: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // No serverTime or receivedAt — backwards compat
    }

    const display = calculateDisplay(dto)
    expect(display.displaySeconds).toBeGreaterThan(280)
    expect(display.displaySeconds).toBeLessThanOrEqual(300)
    expect(display.isRunning).toBe(true)
  })

  it('does not add running elapsed for paused timers', () => {
    const dto: StepTimerDto = {
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-1',
      status: 'paused',
      startedAt: null,
      accumulatedSeconds: 100,
      durationSeconds: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverTime: new Date().toISOString(),
      receivedAt: Date.now(),
    }

    const display = calculateDisplay(dto)
    expect(display.displaySeconds).toBe(200) // 300 - 100
    expect(display.isPaused).toBe(true)
  })
})
