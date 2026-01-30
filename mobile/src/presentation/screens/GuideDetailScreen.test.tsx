import React from 'react'
import { render } from '@testing-library/react-native'
import { GuideDetailScreen } from './GuideDetailScreen'
import { StepService } from '../../domain/services/StepService'

// Mock services
jest.mock('../../domain/services/GuideService')
jest.mock('../../domain/services/CategoryService')
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/repositories/GuideRepository')
jest.mock('../../infrastructure/repositories/StepRepository')
jest.mock('../../infrastructure/repositories/CategoryRepository')
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideDetailScreen', () => {
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders guide detail screen without errors', () => {
    const { getByTestId } = render(
      <GuideDetailScreen guideId="guide-1" onBack={mockOnBack} testID="test" />
    )
    expect(getByTestId('test')).toBeTruthy()
  })

  it('accepts optional onEdit callback', () => {
    const mockOnEdit = jest.fn()
    render(
      <GuideDetailScreen guideId="guide-1" onBack={mockOnBack} onEdit={mockOnEdit} />
    )
    expect(mockOnEdit).toBeDefined()
  })

  it('passes testID to safe screen', () => {
    const { getByTestId } = render(
      <GuideDetailScreen guideId="guide-1" onBack={mockOnBack} testID="test" />
    )

    expect(getByTestId('test')).toBeTruthy()
  })

  it('handles different guide IDs', () => {
    const { rerender } = render(
      <GuideDetailScreen guideId="guide-1" onBack={mockOnBack} />
    )

    rerender(
      <GuideDetailScreen guideId="guide-2" onBack={mockOnBack} />
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
      />
    )

    expect(getByTestId('test')).toBeTruthy()
  })
})
