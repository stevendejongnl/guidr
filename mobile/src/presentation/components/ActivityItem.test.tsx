import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ActivityItem } from './ActivityItem'
import { SessionStatus } from '../../infrastructure/mocks/HomeScreenMockData'

describe('ActivityItem', () => {
  const mockSessionInProgress = {
    id: 's1',
    guideId: 'g1',
    guideTitle: 'Perfect Sourdough',
    status: SessionStatus.InProgress,
    startedAt: new Date(Date.now() - 3600000), // 1 hour ago
    currentStepTitle: 'Shaping',
    progress: 65,
    currentStep: 4,
    totalSteps: 8,
  }

  const mockSessionCompleted = {
    id: 's2',
    guideId: 'g2',
    guideTitle: 'Completed Guide',
    status: SessionStatus.Completed,
    startedAt: new Date(Date.now() - 86400000),
    currentStepTitle: undefined,
    progress: 100,
  }

  const mockSessionPaused = {
    id: 's3',
    guideId: 'g3',
    guideTitle: 'Paused Guide',
    status: SessionStatus.Paused,
    startedAt: new Date(Date.now() - 7200000),
    currentStepTitle: 'Step 3',
    progress: 45,
    currentStep: 3,
    totalSteps: 8,
  }

  it('renders session data', () => {
    const { getByText } = render(
      <ActivityItem session={mockSessionInProgress} testID="activity-item" />,
    )

    expect(getByText('Perfect Sourdough')).toBeDefined()
    expect(getByText('In Progress')).toBeDefined()
    expect(getByText('Shaping')).toBeDefined()
  })

  it('shows node progress indicator for in-progress sessions with step info', () => {
    const { getByTestId } = render(
      <ActivityItem session={mockSessionInProgress} testID="activity-item" />,
    )

    const progressIndicator = getByTestId('activity-item:progress')
    expect(progressIndicator).toBeDefined()
  })

  it('shows progress percentage', () => {
    const { getByText } = render(
      <ActivityItem session={mockSessionInProgress} testID="activity-item" />,
    )

    expect(getByText('65%')).toBeDefined()
  })

  it('shows resume button for in-progress sessions', () => {
    const onResume = jest.fn()
    const { getByText } = render(
      <ActivityItem session={mockSessionInProgress} onResume={onResume} testID="activity-item" />,
    )

    const resumeButton = getByText('Resume →')
    expect(resumeButton).toBeDefined()
  })

  it('calls onResume callback when resume button is pressed', () => {
    const onResume = jest.fn()
    const { getByText } = render(
      <ActivityItem session={mockSessionInProgress} onResume={onResume} testID="activity-item" />,
    )

    const resumeButton = getByText('Resume →')
    fireEvent.press(resumeButton)

    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('shows resume button for paused sessions', () => {
    const onResume = jest.fn()
    const { getByText } = render(
      <ActivityItem session={mockSessionPaused} onResume={onResume} testID="activity-item" />,
    )

    expect(getByText('Resume →')).toBeDefined()
  })

  it('does not show resume button for completed sessions', () => {
    const { queryByText } = render(
      <ActivityItem session={mockSessionCompleted} testID="activity-item" />,
    )

    const resumeButton = queryByText('Resume')
    expect(resumeButton).toBeNull()
  })

  it('displays completed status with appropriate styling', () => {
    const { getByText } = render(
      <ActivityItem session={mockSessionCompleted} testID="activity-item" />,
    )

    expect(getByText('Completed')).toBeDefined()
  })

  it('applies testID for accessibility', () => {
    const { getByTestId } = render(
      <ActivityItem session={mockSessionInProgress} testID="my-activity" />,
    )

    const item = getByTestId('my-activity')
    expect(item).toBeDefined()
  })

  it('displays relative time', () => {
    const { getByText } = render(
      <ActivityItem session={mockSessionInProgress} testID="activity-item" />,
    )

    // Should show "1h ago" or similar
    const timeText = getByText(/ago/)
    expect(timeText).toBeDefined()
  })
})
