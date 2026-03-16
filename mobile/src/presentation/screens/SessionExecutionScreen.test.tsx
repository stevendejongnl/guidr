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

// Mock infrastructure
jest.mock('../../infrastructure/monitoring/ErrorReporter')

// Mock components that have side effects or complex rendering
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

// --- Test Factories ---

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

const createGuide = (): Guide =>
  new Guide('guide-456', 'cooking', 'Test Guide')

const createStep = (overrides: { duration?: number; description?: string } = {}): Step =>
  new Step(
    'step-1',
    'guide-456',
    0,
    'Step Title',
    overrides.duration ?? 600,
    overrides.description ?? 'Step description',
  )

// --- Tests ---

describe('SessionExecutionScreen', () => {
  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()

  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: ReturnType<typeof createMockStepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

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

  describe('loading state', () => {
    it('shows loading indicator on initial render', () => {
      renderScreen()
      expect(screen.queryByText('Loading session...')).toBeTruthy()
    })

    it('hides loading indicator after data loads', async () => {
      mockSessionService.getSessionById.mockResolvedValue(createSession())
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Loading session...')).toBeFalsy()
      })
    })
  })

  describe('error state', () => {
    it('shows "Session Not Found" when session returns null', async () => {
      mockSessionService.getSessionById.mockResolvedValue(null)

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Session Not Found')).toBeTruthy()
      })
    })

    it('shows "Session Not Found" when loading throws', async () => {
      mockSessionService.getSessionById.mockRejectedValue(new Error('Network error'))

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Session Not Found')).toBeTruthy()
      })
    })

    it('shows Go Back button in error state', async () => {
      mockSessionService.getSessionById.mockResolvedValue(null)

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Go Back')).toBeTruthy()
      })
    })
  })

  describe('session content', () => {
    beforeEach(() => {
      mockSessionService.getSessionById.mockResolvedValue(createSession())
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
    })

    it('displays the current step title', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Step Title')).toBeTruthy()
      })
    })

    it('displays the step description when provided', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Step description')).toBeTruthy()
      })
    })

    it('does not show description when step has none', async () => {
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep({ description: '' })])

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Step Title')).toBeTruthy()
      })
      expect(screen.queryByText('Step description')).toBeFalsy()
    })

  })

  describe('countdown timer', () => {
    beforeEach(() => {
      jest.mocked(CountdownTimer).mockClear()
    })

    it('renders CountdownTimer for steps with duration > 0', async () => {
      mockSessionService.getSessionById.mockResolvedValue(createSession())
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep({ duration: 600 })])

      renderScreen()

      await waitFor(() => {
        expect(jest.mocked(CountdownTimer)).toHaveBeenCalled()
      })
    })

    it('does not render CountdownTimer for steps with zero duration', async () => {
      mockSessionService.getSessionById.mockResolvedValue(createSession())
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep({ duration: 0 })])

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Step Title')).toBeTruthy()
      })

      expect(jest.mocked(CountdownTimer)).not.toHaveBeenCalled()
    })
  })

  describe('session controls — NotStarted', () => {
    beforeEach(() => {
      mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
    })

    it('shows "Start Session" button', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Start Session')).toBeTruthy()
      })
    })

    it('does not show "Pause" or "Resume" buttons', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Start Session')).toBeTruthy()
      })

      expect(screen.queryByText('Pause')).toBeFalsy()
      expect(screen.queryByText('Resume')).toBeFalsy()
    })

    it('shows "Complete Session" when on last step', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Complete Session')).toBeTruthy()
      })
    })

    it('shows "Cancel Session" button', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Cancel Session')).toBeTruthy()
      })
    })

    it('shows "Back" button', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Back')).toBeTruthy()
      })
    })
  })

  describe('session controls — Paused', () => {
    beforeEach(() => {
      mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.Paused))
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
    })

    it('shows "Resume" button', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Resume')).toBeTruthy()
      })
    })

    it('does not show "Start Session" button', async () => {
      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Resume')).toBeTruthy()
      })

      expect(screen.queryByText('Start Session')).toBeFalsy()
    })
  })

  describe('user interactions', () => {
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

  describe('multi-step navigation', () => {
    const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
    const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

    beforeEach(() => {
      jest.mocked(StepNavigationControls).mockClear()
      mockSessionService.getSessionById.mockResolvedValue(createSession())
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])
    })

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

  describe('timer completion', () => {
    beforeEach(() => {
      jest.mocked(CountdownTimer).mockClear()
    })

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
      // Capture the onValueChange callback so we can invoke it after initial render
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

      // Disable auto-advance
      await act(async () => {
        capturedOnValueChange!(false)
      })

      // Capture latest timer props (after re-render from state change)
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

      // Should not throw
      expect(() => timerProps.onSecondsChange?.(300)).not.toThrow()
    })
  })

  describe('pause button', () => {
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

  describe('cancel session', () => {
    it('shows Alert when Cancel Session is pressed', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert')

      mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

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

      mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

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

  describe('error dismissal', () => {
    it('shows error when start session fails', async () => {
      mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
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
      mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
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

  describe('back button with running timer', () => {
    it('pauses session before calling onBack when timer is running', async () => {
      mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Start Session')).toBeTruthy()
      })

      // Start the session so timer is running
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

  describe('previous step navigation', () => {
    it('calls moveToStep with previous step id when onPrevious is invoked from index > 0', async () => {
      jest.mocked(StepNavigationControls).mockClear()

      const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
      const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

      mockSessionService.getSessionById.mockResolvedValue(createSession())
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])

      renderScreen()

      await waitFor(() => {
        expect(jest.mocked(StepNavigationControls)).toHaveBeenCalled()
      })

      // Move to step 2 first
      const propsAfterLoad = jest.mocked(StepNavigationControls).mock.calls[0]![0]
      await act(async () => {
        propsAfterLoad.onNext()
      })

      await waitFor(() => {
        expect(mockSessionService.moveToStep).toHaveBeenCalledWith('session-123', 'step-2', 'test-token')
      })

      // Now move back — get latest props after re-render
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

  describe('error paths in service calls', () => {
    it('shows error when pauseSession fails', async () => {
      mockSessionService.getSessionById.mockResolvedValue(createSession(SessionStatus.NotStarted))
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([createStep()])
      mockSessionService.pauseSession.mockRejectedValue(new Error('Pause failed'))

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Start Session')).toBeTruthy()
      })

      // Start first
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

  describe('error paths during load', () => {
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

      renderScreen()

      await waitFor(() => {
        expect(screen.queryByText('Session Not Found')).toBeTruthy()
      })
    })
  })

  describe('session starting from currentStepId', () => {
    it('sets currentStepIndex from session currentStepId', async () => {
      jest.mocked(StepNavigationControls).mockClear()

      const step1 = new Step('step-1', 'guide-456', 0, 'First Step', 300)
      const step2 = new Step('step-2', 'guide-456', 1, 'Second Step', 300)

      const sessionWithStep = new Session('session-123', 'guide-456')
      sessionWithStep.start()
      // Set currentStepId to step2
      Object.defineProperty(sessionWithStep, 'currentStepId', { get: () => 'step-2' })

      mockSessionService.getSessionById.mockResolvedValue(sessionWithStep)
      mockGuideService.getGuideById.mockResolvedValue(createGuide())
      mockStepService.getStepsByGuideId.mockResolvedValue([step1, step2])

      renderScreen()

      await waitFor(() => {
        expect(jest.mocked(StepNavigationControls)).toHaveBeenCalled()
      })

      const props = jest.mocked(StepNavigationControls).mock.calls[0]![0]
      expect(props['currentStepIndex']).toBe(1)
    })
  })
})
