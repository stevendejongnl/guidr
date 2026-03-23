import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockGuideService,
  createMockSessionService,
  createMockStepTimerClient,
} from '../testUtils'

describe('HomeScreen - active timers section', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockGuideService: jest.Mocked<ReturnType<typeof createMockGuideService>>
  let mockSessionService: jest.Mocked<ReturnType<typeof createMockSessionService>>
  let mockAuthStorage: jest.Mocked<ReturnType<typeof createMockAuthStorage>>
  let mockServerConfigStorage: jest.Mocked<ReturnType<typeof createMockServerConfigStorage>>
  let mockAuthClient: jest.Mocked<ReturnType<typeof createMockAuthClient>>
  let mockStepTimerClient: jest.Mocked<ReturnType<typeof createMockStepTimerClient>>

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLogout = jest.fn()
    mockOnOpenSettings = jest.fn()
    mockOnOpenProfile = jest.fn()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockAuthClient = createMockAuthClient()
    mockGuideService = createMockGuideService([])
    mockSessionService = createMockSessionService([])
    mockStepTimerClient = createMockStepTimerClient()
  })

  it('should show Active Timers section when active timers exist', async () => {
    mockStepTimerClient.getActiveTimers.mockResolvedValue([
      {
        id: 'timer-1',
        stepId: 'step-1',
        guideId: 'guide-1',
        userId: 'user-1',
        status: 'running',
        startedAt: new Date().toISOString(),
        accumulatedSeconds: 10,
        durationSeconds: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        guideTitle: 'Sourdough Bread',
        stepTitle: 'Preheat Oven',
      },
    ])

    const { getByText } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
        stepTimerClient={mockStepTimerClient}
      />,
    )

    await waitFor(() => {
      expect(getByText('Active Timers')).toBeTruthy()
      expect(getByText('Sourdough Bread')).toBeTruthy()
      expect(getByText('Preheat Oven')).toBeTruthy()
    })
  })

  it('should not show Active Timers section when no active timers', async () => {
    mockStepTimerClient.getActiveTimers.mockResolvedValue([])

    const { queryByText } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
        stepTimerClient={mockStepTimerClient}
      />,
    )

    await waitFor(() => {
      expect(queryByText('Active Timers')).toBeNull()
    })
  })

  it('should call onViewGuideDetail when active timer is tapped', async () => {
    const mockOnViewGuideDetail = jest.fn()
    mockStepTimerClient.getActiveTimers.mockResolvedValue([
      {
        id: 'timer-1',
        stepId: 'step-1',
        guideId: 'guide-1',
        userId: 'user-1',
        status: 'paused',
        startedAt: null,
        accumulatedSeconds: 30,
        durationSeconds: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        guideTitle: 'Sourdough Bread',
        stepTitle: 'Preheat Oven',
      },
    ])

    const { getByTestId } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        onViewGuideDetail={mockOnViewGuideDetail}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
        stepTimerClient={mockStepTimerClient}
      />,
    )

    await waitFor(() => {
      expect(getByTestId('active-timer-timer-1')).toBeTruthy()
    })

    fireEvent.press(getByTestId('active-timer-timer-1'))
    expect(mockOnViewGuideDetail).toHaveBeenCalledWith('guide-1')
  })
})
