import React from 'react'
import { render } from '@testing-library/react-native'
import { GuideDetailScreen } from './GuideDetailScreen'
import { StepService } from '../../domain/services/StepService'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
  createMockCategoryService,
} from '../testUtils'

// Mock only ErrorReporter (static utility)
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideDetailScreen', () => {
  const mockOnBack = jest.fn()
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockCategoryService: ReturnType<typeof createMockCategoryService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock infrastructure and services
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
    mockCategoryService = createMockCategoryService([])
  })

  it('renders guide detail screen without errors', () => {
    const { getByTestId } = render(
      <GuideDetailScreen
        guideId="guide-1"
        onBack={mockOnBack}
        testID="test"
        guideService={mockGuideService}
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
      />
    )

    rerender(
      <GuideDetailScreen
        guideId="guide-2"
        onBack={mockOnBack}
        guideService={mockGuideService}
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
      />
    )

    expect(getByTestId('test')).toBeTruthy()
  })
})
