import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GuideListScreen } from './GuideListScreen'

// Mock services
jest.mock('../../domain/services/GuideService')
jest.mock('../../domain/services/CategoryService')
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/repositories/GuideRepository')
jest.mock('../../infrastructure/repositories/StepRepository')
jest.mock('../../infrastructure/repositories/CategoryRepository')
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideListScreen', () => {
  const mockOnCreateGuide = jest.fn()
  const mockOnEditGuide = jest.fn()
  const mockOnViewGuide = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders guide list screen without errors', () => {
    render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
      />
    )
    expect(mockOnCreateGuide).toBeDefined()
  })

  it('renders header with back button', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
      />
    )
    expect(getByText('← Back')).toBeTruthy()
  })

  it('renders guides title', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
      />
    )
    expect(getByText('Guides')).toBeTruthy()
  })

  it('renders new guide button', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
      />
    )
    expect(getByText('+ New')).toBeTruthy()
  })

  it('calls onBack when back button is pressed', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
      />
    )
    fireEvent.press(getByText('← Back'))
    expect(mockOnBack).toHaveBeenCalled()
  })

  it('calls onCreateGuide when new button is pressed', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
      />
    )
    fireEvent.press(getByText('+ New'))
    expect(mockOnCreateGuide).toHaveBeenCalled()
  })

  it('accepts optional category filter', () => {
    render(
      <GuideListScreen
        categoryId="cat-1"
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
      />
    )
    expect(mockOnCreateGuide).toBeDefined()
  })
})
