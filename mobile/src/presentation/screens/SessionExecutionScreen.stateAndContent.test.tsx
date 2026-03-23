import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
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

describe('SessionExecutionScreen - loading state', () => {
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

describe('SessionExecutionScreen - error state', () => {
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

describe('SessionExecutionScreen - session content', () => {
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
    mockSessionService.getSessionById.mockResolvedValue(createSession())
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

describe('SessionExecutionScreen - countdown timer', () => {
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

describe('SessionExecutionScreen - session controls', () => {
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

  describe('NotStarted state', () => {
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

  describe('Paused state', () => {
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
})
