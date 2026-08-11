import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'
import { GuideDetailScreen } from './GuideDetailScreen'
import { Guide } from '../../domain/entities/Guide'
import { Step } from '../../domain/entities/Step'
import { StepTimerClient } from '../../infrastructure/api/StepTimerClient'
import { StepTimerDto } from '../../infrastructure/api/dtos/StepTimerDto'
import { WidgetService } from '../../infrastructure/native/WidgetService'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
  createMockStepService,
  createMockNotificationPreferencesStorage,
} from '../testUtils'

// Mock only ErrorReporter (static utility)
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideDetailScreen', () => {
  const mockOnBack = jest.fn()
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock infrastructure and services
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
  })

  it('renders guide detail screen without errors', () => {
    const { getByTestId } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="test"
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    expect(getByTestId('test')).toBeTruthy()
  })

  it('accepts optional onEdit callback', () => {
    const mockOnEdit = jest.fn()
    render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        guideService={mockGuideService}
      />
    )
    expect(mockOnEdit).toBeDefined()
  })

  it('passes testID to safe screen', () => {
    const { getByTestId } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="test"
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    expect(getByTestId('test')).toBeTruthy()
  })

  it('handles different guide IDs', () => {
    const { rerender } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        guideService={mockGuideService}
      />
    )

    rerender(
      <GuideDetailScreen
        guideId="guide-2"
        onBack={mockOnBack}
        guideService={mockGuideService}
      />
    )

    expect(mockOnBack).toBeDefined()
  })

  it('accepts stepService via props', () => {
    const mockStepService = createMockStepService()

    const { getByTestId } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        stepService={mockStepService}
        testID="test"
        guideService={mockGuideService}
      />
    )

    expect(getByTestId('test')).toBeTruthy()
  })

  it('renders steps as read-only without edit controls', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Test Guide',
      'A test guide',
      'user-123',
      true,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockSteps = [
      new Step('step-1', 'guide-1', 0, 'Step One', 10, 'First step'),
      new Step('step-2', 'guide-1', 1, 'Step Two', 15, 'Second step'),
    ]
    const mockStepService = createMockStepService(mockSteps)

    const { getByText, queryByTestId } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="detail"
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByText('Step One')).toBeTruthy()
      expect(getByText('Step Two')).toBeTruthy()
    })

    // No add, edit, or delete controls should be present
    expect(queryByTestId('detail:add-step')).toBeNull()
    expect(queryByTestId('detail:step-0:edit')).toBeNull()
    expect(queryByTestId('detail:step-0:delete')).toBeNull()
    expect(queryByTestId('detail:step-0:move-up')).toBeNull()
    expect(queryByTestId('detail:step-0:move-down')).toBeNull()
  })

  it('displays ingredients for cooking guides', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Cookies',
      'Delicious cookies',
      'user-123',
      true,
      false,
      { ingredients: [
        { name: 'flour', quantity: '200', unit: 'g' },
        { name: 'sugar', quantity: '100', unit: 'g' },
      ] }
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService()

    const { getByText } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="detail"
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByText('Ingredients')).toBeTruthy()
      expect(getByText('200 g — flour')).toBeTruthy()
      expect(getByText('100 g — sugar')).toBeTruthy()
    })
  })

  it('displays target muscles and equipment for workout guides', async () => {
    const guide = new Guide(
      'guide-1',
      'workout',
      'Chest Day',
      'Upper body workout',
      'user-123',
      true,
      false,
      {
        target_muscles: [
          { name: 'chest', focus: 'primary' },
          { name: 'triceps', focus: 'secondary' },
        ],
        equipment: [
          { name: 'dumbbells', weight: '15kg' },
        ],
      }
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService()

    const { getByText } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="detail"
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByText('Target Muscles')).toBeTruthy()
      expect(getByText('chest (primary)')).toBeTruthy()
      expect(getByText('triceps (secondary)')).toBeTruthy()
      expect(getByText('Equipment')).toBeTruthy()
      expect(getByText('dumbbells — 15kg')).toBeTruthy()
    })
  })

  it('shows info banner when admin views another user\'s guide', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Other User Guide',
      'A guide by someone else',
      'other-user-456',
      true,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService()

    const { getByText } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="detail"
        isAdmin={true}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByText('You are viewing a guide from another user')).toBeTruthy()
    })
  })

  it('does not show info banner when admin views own guide', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'My Guide',
      'A guide by me',
      'user-123',
      true,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService()

    const { queryByText } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="detail"
        isAdmin={true}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(queryByText('You are viewing a guide from another user')).toBeNull()
    })
  })

  it('does not show info banner for non-admin users', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Some Guide',
      'A guide',
      'other-user-456',
      true,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService()

    const { queryByText } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="detail"
        isAdmin={false}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(queryByText('You are viewing a guide from another user')).toBeNull()
    })
  })

  it('displays notes for general guides', async () => {
    const guide = new Guide(
      'guide-1',
      'general',
      'Study Guide',
      'A study guide',
      'user-123',
      true,
      false,
      {
        notes: [
          { key: 'difficulty', value: 'beginner' },
          { key: 'duration', value: '30min' },
        ],
      }
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService()

    const { getByText } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="detail"
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByText('Notes')).toBeTruthy()
      expect(getByText('difficulty: beginner')).toBeTruthy()
      expect(getByText('duration: 30min')).toBeTruthy()
    })
  })

  describe('Step Timer Integration', () => {
    const createMockStepTimerClient = (): jest.Mocked<StepTimerClient> =>
      ({
        getTimersByGuide: jest.fn().mockResolvedValue([]),
        startTimer: jest.fn(),
        pauseTimer: jest.fn(),
        resetTimer: jest.fn(),
      }) as unknown as jest.Mocked<StepTimerClient>

    const createMockWidgetService = (): jest.Mocked<WidgetService> =>
      ({
        updateWidget: jest.fn().mockResolvedValue(undefined),
        clearWidget: jest.fn().mockResolvedValue(undefined),
      }) as unknown as jest.Mocked<WidgetService>

    const singleStepGuide = new Guide(
      'guide-1',
      'cooking',
      'Test Guide',
      'A test guide',
      'user-123',
      true,
      false
    )

    const makeTimerDto = (overrides: Partial<StepTimerDto> = {}): StepTimerDto => ({
      id: 'timer-1',
      stepId: 'step-1',
      guideId: 'guide-1',
      userId: 'user-123',
      status: 'running',
      startedAt: new Date().toISOString(),
      accumulatedSeconds: 0,
      durationSeconds: 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    })

    const renderSingleStepTimer = (options: {
      stepTimerClient: jest.Mocked<StepTimerClient>
      widgetService?: jest.Mocked<WidgetService>
    }) => {
      mockGuideService.getGuideById.mockResolvedValue(singleStepGuide)
      const mockStepService = createMockStepService([
        new Step('step-1', 'guide-1', 0, 'Step One', 600, 'First step'),
      ])

      return render(
        <GuideDetailScreen
          guideId="guide-1"
          onBack={mockOnBack}
          testID="detail"
          guideService={mockGuideService}
          stepService={mockStepService}
          stepTimerClient={options.stepTimerClient}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
          notificationPreferencesStorage={createMockNotificationPreferencesStorage()}
          {...(options.widgetService && { widgetService: options.widgetService })}
        />
      )
    }

    it('timer controls render for each step when steps are loaded', async () => {
      const guide = new Guide(
        'guide-1',
        'cooking',
        'Test Guide',
        'A test guide',
        'user-123',
        true,
        false
      )

      mockGuideService.getGuideById.mockResolvedValue(guide)

      const mockSteps = [
        new Step('step-1', 'guide-1', 0, 'Step One', 10, 'First step'),
        new Step('step-2', 'guide-1', 1, 'Step Two', 15, 'Second step'),
      ]
      const mockStepService = createMockStepService(mockSteps)
      const mockStepTimerClient = createMockStepTimerClient()

      const { getByTestId } = render(
        <GuideDetailScreen
          guideId="guide-1"
          onBack={mockOnBack}
          testID="detail"
          guideService={mockGuideService}
          stepService={mockStepService}
          stepTimerClient={mockStepTimerClient}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
        />
      )

      await waitFor(() => {
        expect(mockStepTimerClient.getTimersByGuide).toHaveBeenCalledWith('guide-1', 'test-token')
      })

      // Timer sections should be present for steps
      expect(getByTestId('detail:step-0:timer')).toBeTruthy()
      expect(getByTestId('detail:step-1:timer')).toBeTruthy()
    })

    it('start button triggers stepTimerClient API call', async () => {
      const mockStepTimerClient = createMockStepTimerClient()
      mockStepTimerClient.startTimer.mockResolvedValue(makeTimerDto())

      const { getByTestId } = renderSingleStepTimer({ stepTimerClient: mockStepTimerClient })

      await waitFor(() => {
        expect(mockStepTimerClient.getTimersByGuide).toHaveBeenCalled()
      })

      fireEvent.press(getByTestId('detail:step-0:timer-start'))

      await waitFor(() => {
        // 600 seconds passed directly (no conversion)
        expect(mockStepTimerClient.startTimer).toHaveBeenCalledWith(
          'step-1',
          'guide-1',
          600,
          'test-token'
        )
      })
    })

    it('updates the widget when a countdown timer starts', async () => {
      const mockStepTimerClient = createMockStepTimerClient()
      const mockWidgetService = createMockWidgetService()
      mockStepTimerClient.startTimer.mockResolvedValue(makeTimerDto())

      const { getByTestId } = renderSingleStepTimer({
        stepTimerClient: mockStepTimerClient,
        widgetService: mockWidgetService,
      })

      await waitFor(() => {
        expect(mockStepTimerClient.getTimersByGuide).toHaveBeenCalled()
      })

      fireEvent.press(getByTestId('detail:step-0:timer-start'))

      await waitFor(() => {
        expect(mockWidgetService.updateWidget).toHaveBeenCalledWith({
          stepId: 'step-1',
          guideTitle: 'Test Guide',
          stepTitle: 'Step One',
          totalDurationSeconds: 600,
          remainingSeconds: 600,
          isPaused: false,
          isComplete: false,
        })
      })
    })

    it('updates the widget when a running timer is paused', async () => {
      const mockStepTimerClient = createMockStepTimerClient()
      const mockWidgetService = createMockWidgetService()
      mockStepTimerClient.startTimer.mockResolvedValue(makeTimerDto())
      mockStepTimerClient.pauseTimer.mockResolvedValue(
        makeTimerDto({ status: 'paused', startedAt: null, accumulatedSeconds: 120 })
      )

      const { getByTestId } = renderSingleStepTimer({
        stepTimerClient: mockStepTimerClient,
        widgetService: mockWidgetService,
      })

      await waitFor(() => {
        expect(mockStepTimerClient.getTimersByGuide).toHaveBeenCalled()
      })

      fireEvent.press(getByTestId('detail:step-0:timer-start'))

      await waitFor(() => {
        expect(getByTestId('detail:step-0:timer-pause')).toBeTruthy()
      })

      mockWidgetService.updateWidget.mockClear()
      fireEvent.press(getByTestId('detail:step-0:timer-pause'))

      await waitFor(() => {
        expect(mockStepTimerClient.pauseTimer).toHaveBeenCalledWith('timer-1', 'test-token')
      })

      await waitFor(() => {
        expect(mockWidgetService.updateWidget).toHaveBeenCalledWith(
          expect.objectContaining({
            stepId: 'step-1',
            guideTitle: 'Test Guide',
            stepTitle: 'Step One',
            totalDurationSeconds: 600,
            isPaused: true,
            isComplete: false,
          })
        )
      })
    })

    it('clears the widget when a timer is reset', async () => {
      const mockStepTimerClient = createMockStepTimerClient()
      const mockWidgetService = createMockWidgetService()

      const { getByTestId } = renderSingleStepTimer({
        stepTimerClient: mockStepTimerClient,
        widgetService: mockWidgetService,
      })

      await waitFor(() => {
        expect(mockStepTimerClient.getTimersByGuide).toHaveBeenCalled()
      })

      fireEvent.press(getByTestId('detail:step-0:timer-reset'))

      await waitFor(() => {
        expect(mockWidgetService.clearWidget).toHaveBeenCalled()
      })
    })

    it('updates the widget with isComplete when a countdown timer finishes', async () => {
      const mockStepTimerClient = createMockStepTimerClient()
      const mockWidgetService = createMockWidgetService()

      // Timer that's already complete (idle status, fully accumulated seconds)
      mockStepTimerClient.startTimer.mockResolvedValue(
        makeTimerDto({ status: 'idle', startedAt: null, accumulatedSeconds: 600 })
      )

      const { getByTestId } = renderSingleStepTimer({
        stepTimerClient: mockStepTimerClient,
        widgetService: mockWidgetService,
      })

      await waitFor(() => {
        expect(mockStepTimerClient.getTimersByGuide).toHaveBeenCalled()
      })

      fireEvent.press(getByTestId('detail:step-0:timer-start'))

      await waitFor(() => {
        expect(mockWidgetService.updateWidget).toHaveBeenCalledWith({
          stepId: 'step-1',
          guideTitle: 'Test Guide',
          stepTitle: 'Step One',
          totalDurationSeconds: 600,
          remainingSeconds: 0,
          isPaused: false,
          isComplete: true,
        })
      })
    })
  })
})
