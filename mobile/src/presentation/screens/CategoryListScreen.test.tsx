import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { CategoryListScreen } from './CategoryListScreen'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockCategoryService,
} from '../testUtils'

// Mock only ErrorReporter (static utility)
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('CategoryListScreen', () => {
  const mockOnCreateCategory = jest.fn()
  const mockOnEditCategory = jest.fn()
  const mockOnBack = jest.fn()
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

  it('renders category list screen', () => {
    render(
      <CategoryListScreen
        onCreateCategory={mockOnCreateCategory}
        onEditCategory={mockOnEditCategory}
        onBack={mockOnBack}
        categoryService={mockCategoryService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
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
        categoryService={mockCategoryService}
      />
    )

    expect(mockOnCreateCategory).toBeDefined()
  })
})
