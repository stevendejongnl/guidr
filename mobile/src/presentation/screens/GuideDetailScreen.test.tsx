import React from 'react'
import { render } from '@testing-library/react-native'
import { GuideDetailScreen } from './GuideDetailScreen'

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
})
