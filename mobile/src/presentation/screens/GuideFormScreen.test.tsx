import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GuideFormScreen } from './GuideFormScreen'

// Mock storage and services
jest.mock('@react-native-async-storage/async-storage')
jest.mock('../../domain/services/GuideService')
jest.mock('../../domain/services/CategoryService')
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/storage/ServerConfigStorage')
jest.mock('../../infrastructure/repositories/GuideRepository')
jest.mock('../../infrastructure/repositories/StepRepository')
jest.mock('../../infrastructure/repositories/CategoryRepository')
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideFormScreen', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock AuthStorage
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AuthStorage = require('../../infrastructure/storage/AuthStorage').AuthStorage
    AuthStorage.prototype.getAuthToken = jest.fn().mockResolvedValue('test-token')
    // Mock ServerConfigStorage
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ServerConfigStorage = require('../../infrastructure/storage/ServerConfigStorage').ServerConfigStorage
    ServerConfigStorage.prototype.getServerUrl = jest.fn().mockResolvedValue('http://test-server')
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

  it('shows category section in create mode', () => {
    const { getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    // Verify category label is present
    expect(getByText('Category')).toBeTruthy()
  })

  it('shows category as read-only text in edit mode', async () => {
    const { queryByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    // In edit mode, category should NOT have a picker button
    // Wait a moment for async loading
    await new Promise((r) => setTimeout(r, 50))
    expect(queryByTestId('category-picker-button')).toBeFalsy()
  })
})
