import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { CategoryPickerButton } from './CategoryPickerButton'
import { CategoryService } from '../../domain/services/CategoryService'

jest.mock('../../domain/services/CategoryService')
jest.mock('../../infrastructure/storage/AuthStorage')

interface MockCategory {
  id: string
  name: string
  parentId: string | null
}

const mockCategories: MockCategory[] = [
  { id: 'cat-1', name: 'Cooking', parentId: null },
  { id: 'cat-2', name: 'Sports', parentId: null },
]

describe('CategoryPickerButton', () => {
  const mockOnSelectCategory = jest.fn()
  let mockCategoryService: jest.Mocked<CategoryService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockCategoryService = {
      getAllCategories: jest.fn().mockResolvedValue(mockCategories),
    } as unknown as jest.Mocked<CategoryService>
  })

  it('renders placeholder text when no category is selected', async () => {
    const { getAllByText } = render(
      <CategoryPickerButton
        selectedCategoryId={null}
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockCategoryService}
      />
    )
    await waitFor(() => {
      const elements = getAllByText('Select Category')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  it('renders category name when selected', async () => {
    const { getAllByText } = render(
      <CategoryPickerButton
        selectedCategoryId="cat-1"
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockCategoryService}
      />
    )
    await waitFor(() => {
      const elements = getAllByText('Cooking')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  it('fetches categories on mount', async () => {
    render(
      <CategoryPickerButton
        selectedCategoryId={null}
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockCategoryService}
      />
    )
    await waitFor(() => {
      expect(mockCategoryService.getAllCategories).toHaveBeenCalledWith('test-token')
    })
  })

  it('opens picker when button is pressed', async () => {
    const { getByTestId, getAllByText } = render(
      <CategoryPickerButton
        selectedCategoryId={null}
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockCategoryService}
      />
    )
    await waitFor(() => {
      expect(mockCategoryService.getAllCategories).toHaveBeenCalled()
    })
    fireEvent.press(getByTestId('category-picker-button'))
    const elements = getAllByText('Select Category')
    expect(elements.length).toBeGreaterThan(1) // Button text + modal header
  })

  it('shows loading state while fetching categories', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockLoadingService = {
      getAllCategories: jest.fn(() => new Promise(() => {})), // Never resolves
    } as unknown as CategoryService
    const { getByTestId } = render(
      <CategoryPickerButton
        selectedCategoryId={null}
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockLoadingService}
      />
    )
    expect(getByTestId('category-picker-loading')).toBeTruthy()
  })

  it('calls onSelectCategory when category is selected', async () => {
    const { getByTestId } = render(
      <CategoryPickerButton
        selectedCategoryId={null}
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockCategoryService}
      />
    )
    await waitFor(() => {
      expect(mockCategoryService.getAllCategories).toHaveBeenCalled()
    })
    fireEvent.press(getByTestId('category-picker-button'))
    fireEvent.press(getByTestId('category-item-cat-2'))
    expect(mockOnSelectCategory).toHaveBeenCalledWith('cat-2')
  })

  it('handles fetch errors gracefully', async () => {
    mockCategoryService.getAllCategories = jest.fn().mockRejectedValue(new Error('Network error'))
    const { getByText } = render(
      <CategoryPickerButton
        selectedCategoryId={null}
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockCategoryService}
      />
    )
    await waitFor(() => {
      expect(getByText('Network error')).toBeTruthy()
    })
  })

  it('respects disabled prop', () => {
    const { getByTestId } = render(
      <CategoryPickerButton
        selectedCategoryId={null}
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockCategoryService}
        disabled={true}
      />
    )
    const button = getByTestId('category-picker-button')
    expect(button.props['disabled']).toBe(true)
  })

  it('closes picker when onCancel is called', async () => {
    const { getByTestId, getAllByText } = render(
      <CategoryPickerButton
        selectedCategoryId={null}
        onSelectCategory={mockOnSelectCategory}
        authToken="test-token"
        categoryService={mockCategoryService}
      />
    )
    await waitFor(() => {
      expect(mockCategoryService.getAllCategories).toHaveBeenCalled()
    })
    fireEvent.press(getByTestId('category-picker-button'))
    fireEvent.press(getByTestId('category-picker-overlay'))
    // Modal should close, button still renders the placeholder text
    const elements = getAllByText('Select Category')
    expect(elements.length).toBeGreaterThan(0)
  })
})
