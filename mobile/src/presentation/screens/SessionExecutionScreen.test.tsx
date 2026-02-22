import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
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
})
