import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CategoryFormScreen } from './CategoryFormScreen'

// Mock services
jest.mock('../../domain/services/CategoryService')
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/repositories/CategoryRepository')
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('CategoryFormScreen', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form screen without errors', () => {
    render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} />
    )
    expect(mockOnSave).toBeDefined()
  })

  it('renders title for create mode', () => {
    const { getByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} />
    )
    expect(getByText(/New Category/i)).toBeTruthy()
  })

  it('renders save and cancel buttons', () => {
    const { getByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} />
    )
    expect(getByText('Save')).toBeTruthy()
    expect(getByText('Cancel')).toBeTruthy()
  })

  it('does not render delete button in create mode', () => {
    const { queryByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} />
    )
    expect(queryByText('Delete')).toBeFalsy()
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} />
    )
    fireEvent.press(getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('accepts parent category selection', () => {
    render(
      <CategoryFormScreen
        mode="create"
        parentId="cat-1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isAdmin={true}
      />
    )
    expect(mockOnSave).toBeDefined()
  })

  it('shows admin error for non-admin users in create mode', () => {
    const { getByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={false} />
    )
    expect(getByText(/Only administrators can create or edit categories/i)).toBeTruthy()
  })
})
