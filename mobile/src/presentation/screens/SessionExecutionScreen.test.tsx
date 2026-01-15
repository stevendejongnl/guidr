import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { SessionExecutionScreen } from './SessionExecutionScreen'

// Mock repositories
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/storage/ServerConfigStorage')
jest.mock('../../infrastructure/repositories/SessionRepository')
jest.mock('../../infrastructure/repositories/GuideRepository')
jest.mock('../../infrastructure/repositories/StepRepository')
jest.mock('../../infrastructure/monitoring/ErrorReporter')

// Mock components
jest.mock('../components/SafeScreen', () => ({
  SafeScreen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../components/CountdownTimer')
jest.mock('../components/StepNavigationControls')
jest.mock('../components/AutoAdvanceToggle')

describe('SessionExecutionScreen', () => {
  const mockSessionId = 'session-123'
  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(
      <SessionExecutionScreen
        sessionId={mockSessionId}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
      />
    )

    // Component should render loading state initially
    expect(screen.queryByText('Loading session...')).toBeTruthy()
  })
})
