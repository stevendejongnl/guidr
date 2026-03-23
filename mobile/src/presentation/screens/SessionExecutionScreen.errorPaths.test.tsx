import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { SessionExecutionScreen } from './SessionExecutionScreen'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockSessionService,
  createMockGuideService,
  createMockStepService,
} from '../testUtils'
import { Session, SessionStatus } from '../../domain/entities/Session'
import { Guide } from '../../domain/entities/Guide'
import { Step } from '../../domain/entities/Step'
import { StepNavigationControls } from '../components/StepNavigationControls'

jest.mock('../../infrastructure/monitoring/ErrorReporter')
jest.mock('../components/SafeScreen', () => ({
  SafeScreen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../components/CountdownTimer', () => ({
  CountdownTimer: jest.fn(() => null),
}))
jest.mock('../components/StepNavigationControls', () => ({
  StepNavigationControls: jest.fn(() => null),
}))
jest.mock('../components/AutoAdvanceToggle', () => ({
  AutoAdvanceToggle: jest.fn(() => null),
}))
jest.mock('../components/SessionProgressIndicator', () => ({
  SessionProgressIndicator: jest.fn(() => null),
}))

const createSession = (status: SessionStatus = SessionStatus.NotStarted): Session => {
  const session = new Session('session-123', 'guide-456')
  if (status === SessionStatus.InProgress) {
    session.start()
  } else if (status === SessionStatus.Paused) {
    session.start()
    session.pause()
  }
  return session
}

const createGuide = (): Guide => new Guide('guide-456', 'cooking', 'Test Guide')

const createStep = (overrides: { duration?: number; description?: string } = {}): Step =>
  new Step(
    'step-1',
    'guide-456',
    0,
    'Step Title',
    overrides.duration ?? 600,
    overrides.description ?? 'Step description',
  )

describe('SessionExecutionScreen - error dismissal', () => {
  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: ReturnType<typeof createMockStepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockSessionService = createMockSessionService()
    mockGuideService = createMockGuideService()
    mockStepService = createMockStepService()
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
  })

  const renderScreen = () =>
    render(
      <SessionExecutionScreen
        sessionId="session-123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />,
    )

  it('shows error when start session fails', async () => {
    mockSessionService.startSession.mockRejectedValue(new Error('Start failed'))

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Start Session')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Start Session'))
    })

    await waitFor(() => {
      expect(screen.queryByText('Failed to start session')).toBeTruthy()
    })
  })

  it('can dismiss inline error', async () => {
    mockSessionService.startSession.mockRejectedValue(new Error('Start failed'))

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Start Session')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Start Session'))
    })

    await waitFor(() => {
      expect(screen.queryByText('Failed to start session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Dismiss'))

    await waitFor(() => {
      expect(screen.queryByText('Failed to start session')).toBeFalsy()
    })
  })
})

describe('SessionExecutionScreen - back button with running timer', () => {
  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: ReturnType<typeof createMockStepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockSessionService = createMockSessionService()
    mockGuideService = createMockGuideService()
    mockStepService = createMockStepService()
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
  })

  const renderScreen = () =>
    render(
      <SessionExecutionScreen
        sessionId="session-123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />,
    )

  it('pauses session before calling onBack when timer is running', async () => {
    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Start Session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Start Session'))

    await waitFor(() => {
      expect(screen.queryByText('Pause')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Back'))
    })

    await waitFor(() => {
      expect(mockSessionService.pauseSession).toHaveBeenCalled()
      expect(mockOnBack).toHaveBeenCalled()
    })
  })
})

describe('SessionExecutionScreen - previous step navigation', () => {
  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: ReturnType<typeof createMockStepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockSessionService = createMockSessionService()
    mockGuideService = createMockGuideService()
    mockStepService = createMockStepService()
    jest.mocked(StepNavigationControls).mockClear()
  })

  const renderScreen = () =>
    render(
      <SessionExecutionScreen
        sessionId="session-123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />,
    )

  it('calls moveToStep with previous step id when onPrevious is invoked from index > 0', async () => {
    const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
    const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

    mockSessionService.getSessionById.mockResolvedValue(createSession())
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])

    renderScreen()

    await waitFor(() => {
      expect(jest.mocked(StepNavigationControls)).toHaveBeenCalled()
    })

    const propsAfterLoad = jest.mocked(StepNavigationControls).mock.calls[0]![0]
    await act(async () => {
      propsAfterLoad.onNext()
    })

    await waitFor(() => {
      expect(mockSessionService.moveToStep).toHaveBeenCalledWith('session-123', 'step-2', 'test-token')
    })

    const allCalls = jest.mocked(StepNavigationControls).mock.calls
    const latestProps = allCalls[allCalls.length - 1]![0]

    await act(async () => {
      latestProps.onPrevious()
    })

    await waitFor(() => {
      expect(mockSessionService.moveToStep).toHaveBeenCalledWith('session-123', 'step-1', 'test-token')
    })
  })
})

describe('SessionExecutionScreen - error paths in service calls', () => {
  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: ReturnType<typeof createMockStepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockSessionService = createMockSessionService()
    mockGuideService = createMockGuideService()
    mockStepService = createMockStepService()
  })

  const renderScreen = () =>
    render(
      <SessionExecutionScreen
        sessionId="session-123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />,
    )

  it('shows error when pauseSession fails', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
    mockSessionService.pauseSession.mockRejectedValue(new Error('Pause failed'))

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Start Session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Start Session'))

    await waitFor(() => {
      expect(screen.queryByText('Pause')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Pause'))
    })

    await waitFor(() => {
      expect(screen.queryByText('Failed to pause session')).toBeTruthy()
    })
  })

  it('shows error when cancelSession fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const cancelBtn = buttons?.find(b => b.text === 'Cancel Session')
      cancelBtn?.onPress?.()
    })

    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
    mockSessionService.cancelSession.mockRejectedValue(new Error('Cancel failed'))

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Cancel Session')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Cancel Session'))
    })

    await waitFor(() => {
      expect(screen.queryByText('Failed to cancel session')).toBeTruthy()
    })

    alertSpy.mockRestore()
  })

  it('shows error when resumeSession fails', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.Paused))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
    mockSessionService.resumeSession.mockRejectedValue(new Error('Resume failed'))

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Resume')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Resume'))
    })

    await waitFor(() => {
      expect(screen.queryByText('Failed to resume session')).toBeTruthy()
    })
  })

  it('shows error when completeSession fails', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
    mockSessionService.completeSession.mockRejectedValue(new Error('Complete failed'))

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Complete Session')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete Session'))
    })

    await waitFor(() => {
      expect(screen.queryByText('Failed to complete session')).toBeTruthy()
    })
  })

  it('shows error when moveToStep fails during navigation', async () => {
    jest.mocked(StepNavigationControls).mockClear()

    const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
    const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

    mockSessionService.getSessionById.mockResolvedValue(createSession())
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])
    mockSessionService.moveToStep.mockRejectedValue(new Error('Move failed'))

    renderScreen()

    await waitFor(() => {
      expect(jest.mocked(StepNavigationControls)).toHaveBeenCalled()
    })

    const props = jest.mocked(StepNavigationControls).mock.calls[0]![0]

    await act(async () => {
      props.onNext()
    })

    await waitFor(() => {
      expect(screen.queryByText('Failed to move to step')).toBeTruthy()
    })
  })
})

describe('SessionExecutionScreen - error paths during load', () => {
  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: ReturnType<typeof createMockStepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockSessionService = createMockSessionService()
    mockGuideService = createMockGuideService()
    mockStepService = createMockStepService()
  })

  it('shows error when auth token is null', async () => {
    mockAuthStorage = createMockAuthStorage({
      getAuthToken: jest.fn().mockResolvedValue(null),
    })

    render(
      <SessionExecutionScreen
        sessionId="session-123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText('Session Not Found')).toBeTruthy()
    })
  })

  it('shows error when server URL is null', async () => {
    mockServerConfigStorage = createMockServerConfigStorage({
      getServerUrl: jest.fn().mockResolvedValue(null),
    })

    render(
      <SessionExecutionScreen
        sessionId="session-123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText('Session Not Found')).toBeTruthy()
    })
  })

  it('shows error when guide is not found', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession())
    mockGuideService.getGuideById.mockResolvedValue(null)
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    render(
      <SessionExecutionScreen
        sessionId="session-123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText('Session Not Found')).toBeTruthy()
    })
  })
})

describe('SessionExecutionScreen - session starting from currentStepId', () => {
  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: ReturnType<typeof createMockStepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockSessionService = createMockSessionService()
    mockGuideService = createMockGuideService()
    mockStepService = createMockStepService()
    jest.mocked(StepNavigationControls).mockClear()
  })

  it('sets currentStepIndex from session currentStepId', async () => {
    const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
    const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

    const sessionWithStep = new Session('session-123', 'guide-456')
    sessionWithStep.start()
    Object.defineProperty(sessionWithStep, 'currentStepId', { get: () => 'step-2' })

    mockSessionService.getSessionById.mockResolvedValue(sessionWithStep)
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])

    render(
      <SessionExecutionScreen
        sessionId="session-123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />,
    )

    await waitFor(() => {
      expect(jest.mocked(StepNavigationControls)).toHaveBeenCalled()
    })

    const props = jest.mocked(StepNavigationControls).mock.calls[0]![0]
    expect(props['currentStepIndex']).toBe(1)
  })
})
