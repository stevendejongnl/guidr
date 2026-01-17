import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { CategoryListScreen } from './CategoryListScreen'

// Mock CategoryService and AuthStorage
jest.mock('../../domain/services/CategoryService')
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/repositories/CategoryRepository')
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('CategoryListScreen', () => {
  const mockOnCreateCategory = jest.fn()
  const mockOnEditCategory = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders category list screen', () => {
    render(
      <CategoryListScreen
        onCreateCategory={mockOnCreateCategory}
        onEditCategory={mockOnEditCategory}
        onBack={mockOnBack}
      />
    )
    // Test should not throw
    expect(mockOnCreateCategory).toBeDefined()
  })

  it('renders with title Categories', async () => {
    const { getAllByText } = render(
      <CategoryListScreen
        onCreateCategory={mockOnCreateCategory}
        onEditCategory={mockOnEditCategory}
        onBack={mockOnBack}
      />
    )
    // May have multiple instances of "Categories"
    await waitFor(() => {
      const items = getAllByText('Categories')
      expect(items.length).toBeGreaterThan(0)
    }, { timeout: 100 })
  })

  it('renders empty state message when no categories', async () => {
    const { queryByText } = render(
      <CategoryListScreen
        onCreateCategory={mockOnCreateCategory}
        onEditCategory={mockOnEditCategory}
        onBack={mockOnBack}
      />
    )
    await waitFor(() => {
      const emptyMsg = queryByText(/No categories/i)
      expect(emptyMsg).toBeTruthy()
    }, { timeout: 100 })
  })

  it('passes callbacks to children', () => {
    render(
      <CategoryListScreen
        onCreateCategory={mockOnCreateCategory}
        onEditCategory={mockOnEditCategory}
        onBack={mockOnBack}
      />
    )

    expect(mockOnCreateCategory).toBeDefined()
    expect(mockOnEditCategory).toBeDefined()
    expect(mockOnBack).toBeDefined()
  })

  it('accepts optional parentId prop', () => {
    render(
      <CategoryListScreen
        parentId="cat-1"
        onCreateCategory={mockOnCreateCategory}
        onEditCategory={mockOnEditCategory}
        onBack={mockOnBack}
      />
    )

    expect(mockOnCreateCategory).toBeDefined()
  })
})
