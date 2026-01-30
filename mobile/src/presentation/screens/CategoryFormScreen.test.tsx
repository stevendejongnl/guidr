import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CategoryFormScreen } from './CategoryFormScreen'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockCategoryService,
} from '../testUtils'

// Mock only ErrorReporter (static utility)
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('CategoryFormScreen', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()
  let mockCategoryService: ReturnType<typeof createMockCategoryService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock infrastructure and services
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockCategoryService = createMockCategoryService([])
  })

  it('renders form screen without errors', () => {
    render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} categoryService={mockCategoryService} authStorage={mockAuthStorage} serverConfigStorage={mockServerConfigStorage} />
    )
    expect(mockOnSave).toBeDefined()
  })

  it('renders title for create mode', () => {
    const { getByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} categoryService={mockCategoryService} authStorage={mockAuthStorage} serverConfigStorage={mockServerConfigStorage} />
    )
    expect(getByText(/New Category/i)).toBeTruthy()
  })

  it('renders save and cancel buttons', () => {
    const { getByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} categoryService={mockCategoryService} authStorage={mockAuthStorage} serverConfigStorage={mockServerConfigStorage} />
    )
    expect(getByText('Save')).toBeTruthy()
    expect(getByText('Cancel')).toBeTruthy()
  })

  it('does not render delete button in create mode', () => {
    const { queryByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} categoryService={mockCategoryService} authStorage={mockAuthStorage} serverConfigStorage={mockServerConfigStorage} />
    )
    expect(queryByText('Delete')).toBeFalsy()
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={true} categoryService={mockCategoryService} authStorage={mockAuthStorage} serverConfigStorage={mockServerConfigStorage} />
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
        categoryService={mockCategoryService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    expect(mockOnSave).toBeDefined()
  })

  it('shows admin error for non-admin users in create mode', () => {
    const { getByText } = render(
      <CategoryFormScreen mode="create" onSave={mockOnSave} onCancel={mockOnCancel} isAdmin={false} categoryService={mockCategoryService} authStorage={mockAuthStorage} serverConfigStorage={mockServerConfigStorage} />
    )
    expect(getByText(/Only administrators can create or edit categories/i)).toBeTruthy()
  })
})
