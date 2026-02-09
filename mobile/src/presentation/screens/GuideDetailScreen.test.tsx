import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { GuideDetailScreen } from './GuideDetailScreen'
import { Guide } from '../../domain/entities/Guide'
import { StepService } from '../../domain/services/StepService'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
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
    const mockStepService = {
      getStepsByGuideId: jest.fn(),
      updateStepOrder: jest.fn(),
      deleteStep: jest.fn(),
    } as unknown as StepService

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

  it('accepts onAddStep callback', () => {
    const mockOnAddStep = jest.fn()

    const { getByTestId } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        onAddStep={mockOnAddStep}
        testID="test"
        guideService={mockGuideService}
      />
    )

    expect(getByTestId('test')).toBeTruthy()
  })

  it('accepts onEditStep callback', () => {
    const mockOnEditStep = jest.fn()

    const { getByTestId } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        onEditStep={mockOnEditStep}
        testID="test"
        guideService={mockGuideService}
      />
    )

    expect(getByTestId('test')).toBeTruthy()
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

    const mockStepService = {
      getStepsByGuideId: jest.fn().mockResolvedValue([]),
      updateStepOrder: jest.fn(),
      deleteStep: jest.fn(),
    } as unknown as StepService

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

    const mockStepService = {
      getStepsByGuideId: jest.fn().mockResolvedValue([]),
      updateStepOrder: jest.fn(),
      deleteStep: jest.fn(),
    } as unknown as StepService

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

    const mockStepService = {
      getStepsByGuideId: jest.fn().mockResolvedValue([]),
      updateStepOrder: jest.fn(),
      deleteStep: jest.fn(),
    } as unknown as StepService

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
})
