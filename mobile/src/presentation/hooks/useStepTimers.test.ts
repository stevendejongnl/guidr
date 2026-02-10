import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useStepTimers } from './useStepTimers'
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
