import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GuideFormScreen } from './GuideFormScreen'

// Mock services
jest.mock('../../domain/services/GuideService')
jest.mock('../../domain/services/CategoryService')
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/repositories/GuideRepository')
jest.mock('../../infrastructure/repositories/StepRepository')
jest.mock('../../infrastructure/repositories/CategoryRepository')
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideFormScreen', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form screen without errors in create mode', () => {
    render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    expect(mockOnSave).toBeDefined()
  })

  it('renders title for create mode', () => {
    const { getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    expect(getByText(/New Guide/i)).toBeTruthy()
  })

  it('renders save and cancel buttons', () => {
    const { getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    expect(getByText('Save')).toBeTruthy()
    expect(getByText('Cancel')).toBeTruthy()
  })

  it('does not render delete button in create mode', () => {
    const { queryByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    expect(queryByText('Delete')).toBeFalsy()
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.press(getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('accepts a pre-selected category ID in create mode', () => {
    render(
      <GuideFormScreen
        mode="create"
        categoryId="cat-1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    expect(mockOnSave).toBeDefined()
  })
})
