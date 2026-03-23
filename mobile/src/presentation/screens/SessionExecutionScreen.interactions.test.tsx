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
import { CountdownTimer } from '../components/CountdownTimer'
import { StepNavigationControls } from '../components/StepNavigationControls'
import { AutoAdvanceToggle } from '../components/AutoAdvanceToggle'

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

describe('SessionExecutionScreen - user interactions', () => {
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

  it('calls sessionService.startSession when "Start Session" is pressed', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Start Session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Start Session'))

    await waitFor(() => {
      expect(mockSessionService.startSession).toHaveBeenCalledWith('session-123', 'test-token')
    })
  })

  it('calls sessionService.resumeSession when "Resume" is pressed', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.Paused))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Resume')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Resume'))

    await waitFor(() => {
      expect(mockSessionService.resumeSession).toHaveBeenCalledWith('session-123', 'test-token')
    })
  })

  it('calls sessionService.completeSession when "Complete Session" is pressed', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Complete Session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Complete Session'))

    await waitFor(() => {
      expect(mockSessionService.completeSession).toHaveBeenCalledWith('session-123', 'test-token')
    })
  })

  it('calls onComplete callback after session is completed', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Complete Session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Complete Session'))

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  it('calls onBack when "Back" is pressed (with no running timer)', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Back')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Back'))

    await waitFor(() => {
      expect(mockOnBack).toHaveBeenCalled()
    })
  })

  it('calls onBack when "Go Back" is pressed from error state', async () => {
    mockSessionService.getSessionById.mockResolvedValue(null)

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Go Back')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Go Back'))
    expect(mockOnBack).toHaveBeenCalled()
  })
})

describe('SessionExecutionScreen - multi-step navigation', () => {
  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: ReturnType<typeof createMockStepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
  const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

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
    mockSessionService.getSessionById.mockResolvedValue(createSession())
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])
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

  it('does not show "Complete Session" when not on last step', async () => {
    renderScreen()
    await waitFor(() => {
      expect(screen.queryByText('First Step')).toBeTruthy()
    })
    expect(screen.queryByText('Complete Session')).toBeFalsy()
  })

  it('calls moveToStep with next step id when onNext is invoked', async () => {
    renderScreen()
    await waitFor(() => {
      expect(jest.mocked(StepNavigationControls)).toHaveBeenCalled()
    })

    const props = jest.mocked(StepNavigationControls).mock.calls[0]![0]
    props.onNext()

    await waitFor(() => {
      expect(mockSessionService.moveToStep).toHaveBeenCalledWith('session-123', 'step-2', 'test-token')
    })
  })

  it('does not call moveToStep when onPrevious is invoked on first step', async () => {
    renderScreen()
    await waitFor(() => {
      expect(jest.mocked(StepNavigationControls)).toHaveBeenCalled()
    })

    const props = jest.mocked(StepNavigationControls).mock.calls[0]![0]
    props.onPrevious()
    expect(mockSessionService.moveToStep).not.toHaveBeenCalled()
  })

  it('passes correct currentStepIndex and totalSteps to navigation controls', async () => {
    renderScreen()
    await waitFor(() => {
      expect(jest.mocked(StepNavigationControls)).toHaveBeenCalled()
    })

    const props = jest.mocked(StepNavigationControls).mock.calls[0]![0]
    expect(props['currentStepIndex']).toBe(0)
    expect(props['totalSteps']).toBe(2)
  })
})

describe('SessionExecutionScreen - timer completion', () => {
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
    jest.mocked(CountdownTimer).mockClear()
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

  it('auto-advances to next step when timer completes and autoAdvance is enabled', async () => {
    const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
    const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.InProgress))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])

    renderScreen()

    await waitFor(() => {
      expect(jest.mocked(CountdownTimer)).toHaveBeenCalled()
    })

    const timerProps = jest.mocked(CountdownTimer).mock.calls[0]![0]

    await act(async () => {
      timerProps.onComplete?.()
    })

    await waitFor(() => {
      expect(mockSessionService.moveToStep).toHaveBeenCalledWith('session-123', 'step-2', 'test-token')
    })
  })

  it('completes session when timer finishes on last step and autoAdvance is enabled', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.InProgress))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    renderScreen()

    await waitFor(() => {
      expect(jest.mocked(CountdownTimer)).toHaveBeenCalled()
    })

    const timerProps = jest.mocked(CountdownTimer).mock.calls[0]![0]

    await act(async () => {
      timerProps.onComplete?.()
    })

    await waitFor(() => {
      expect(mockSessionService.completeSession).toHaveBeenCalledWith('session-123', 'test-token')
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  it('does not auto-advance when autoAdvance is disabled via toggle', async () => {
    let capturedOnValueChange: ((v: boolean) => void) | undefined
    jest.mocked(AutoAdvanceToggle).mockImplementation(
      ({ onValueChange }: { onValueChange?: (v: boolean) => void }) => {
        capturedOnValueChange = onValueChange
        return null
      },
    )

    const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
    const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.InProgress))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])

    jest.mocked(CountdownTimer).mockClear()
    renderScreen()

    await waitFor(() => {
      expect(jest.mocked(CountdownTimer)).toHaveBeenCalled()
      expect(capturedOnValueChange).toBeDefined()
    })

    await act(async () => {
      capturedOnValueChange!(false)
    })

    const allCalls = jest.mocked(CountdownTimer).mock.calls
    const timerProps = allCalls[allCalls.length - 1]![0]

    await act(async () => {
      timerProps.onComplete?.()
    })

    expect(mockSessionService.moveToStep).not.toHaveBeenCalled()
    expect(mockSessionService.completeSession).not.toHaveBeenCalled()
  })

  it('calls onSecondsChange handler from CountdownTimer', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.InProgress))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep({ duration: 600 })])

    renderScreen()

    await waitFor(() => {
      expect(jest.mocked(CountdownTimer)).toHaveBeenCalled()
    })

    const timerProps = jest.mocked(CountdownTimer).mock.calls[0]![0]
    expect(() => timerProps.onSecondsChange?.(300)).not.toThrow()
  })
})

describe('SessionExecutionScreen - pause button', () => {
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

  it('shows "Pause" button while timer is running after start', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Start Session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Start Session'))

    await waitFor(() => {
      expect(mockSessionService.startSession).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.queryByText('Pause')).toBeTruthy()
    })
  })

  it('calls pauseSession when Pause is pressed', async () => {
    mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
    mockGuideService.getGuideById.mockResolvedValue(createGuide())
    mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Start Session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Start Session'))

    await waitFor(() => {
      expect(screen.queryByText('Pause')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Pause'))

    await waitFor(() => {
      expect(mockSessionService.pauseSession).toHaveBeenCalledWith('session-123', 'test-token')
    })
  })
})

describe('SessionExecutionScreen - cancel session', () => {
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

  it('shows Alert when Cancel Session is pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Cancel Session')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Cancel Session'))

    expect(alertSpy).toHaveBeenCalledWith(
      'Cancel Session',
      expect.any(String),
      expect.any(Array),
    )

    alertSpy.mockRestore()
  })

  it('calls cancelSession and onCancel when alert confirmed', async () => {
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _msg, buttons) => {
        const cancelBtn = buttons?.find(b => b.text === 'Cancel Session')
        cancelBtn?.onPress?.()
      })

    renderScreen()

    await waitFor(() => {
      expect(screen.queryByText('Cancel Session')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Cancel Session'))
    })

    await waitFor(() => {
      expect(mockSessionService.cancelSession).toHaveBeenCalledWith('session-123', 'test-token')
      expect(mockOnCancel).toHaveBeenCalled()
    })

    alertSpy.mockRestore()
  })
})
