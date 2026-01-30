import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { SessionExecutionScreen } from './SessionExecutionScreen'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockSessionService,
  createMockGuideService,
} from '../testUtils'
import { StepService } from '../../domain/services/StepService'

// Mock only infrastructure (not services)
jest.mock('../../infrastructure/monitoring/ErrorReporter')

// Mock components
jest.mock('../components/SafeScreen', () => ({
  SafeScreen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../components/CountdownTimer')
jest.mock('../components/StepNavigationControls')
jest.mock('../components/AutoAdvanceToggle')

// Create mock step service
const createMockStepService = (): jest.Mocked<StepService> => {
  const mock = {
    getStepsByGuideId: jest.fn().mockResolvedValue([]),
    updateStepOrder: jest.fn(),
    deleteStep: jest.fn(),
  } as unknown as jest.Mocked<StepService>
  return mock
}

describe('SessionExecutionScreen', () => {
  const mockSessionId = 'session-123'
  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()
  let mockSessionService: ReturnType<typeof createMockSessionService>
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockStepService: jest.Mocked<StepService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock infrastructure and services
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockSessionService = createMockSessionService()
    mockGuideService = createMockGuideService()
    mockStepService = createMockStepService()
  })

  it('should render without crashing', () => {
    render(
      <SessionExecutionScreen
        sessionId={mockSessionId}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    // Component should render loading state initially
    expect(screen.queryByText('Loading session...')).toBeTruthy()
  })
})
