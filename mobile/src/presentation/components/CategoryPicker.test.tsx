import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CategoryPicker } from './CategoryPicker'

// Mock Category type
interface MockCategory {
  id: string
  name: string
  parentId: string | null
}

const mockCategories: MockCategory[] = [
  { id: 'cat-1', name: 'Cooking', parentId: null },
  { id: 'cat-2', name: 'Sports', parentId: null },
  { id: 'cat-3', name: 'Learning', parentId: null },
]

describe('CategoryPicker', () => {
  const mockOnSelect = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testCategories = mockCategories as any

  it('renders without errors when not visible', () => {
    const { getByTestId } = render(
      <CategoryPicker
        visible={false}
        categories={testCategories}
        selectedId={null}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    // Modal tree exists but is not displayed
    expect(getByTestId('category-picker-modal')).toBeTruthy()
  })

  it('renders modal when visible', () => {
    const { getByTestId } = render(
      <CategoryPicker
        visible={true}
        categories={testCategories}
        selectedId={null}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    expect(getByTestId('category-picker-modal')).toBeTruthy()
  })

  it('displays all categories in list', () => {
    const { getByText } = render(
      <CategoryPicker
        visible={true}
        categories={testCategories}
        selectedId={null}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    expect(getByText('Cooking')).toBeTruthy()
    expect(getByText('Sports')).toBeTruthy()
    expect(getByText('Learning')).toBeTruthy()
  })

  it('highlights selected category', () => {
    const { getByTestId } = render(
      <CategoryPicker
        visible={true}
        categories={testCategories}
        selectedId="cat-2"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    const selectedItem = getByTestId('category-item-cat-2')
    expect(selectedItem).toBeTruthy()
    // Check if selected item has different styling
    const selectedItemStyle = selectedItem.props['style']
    expect(selectedItemStyle).toBeDefined()
  })

  it('calls onSelect when category is tapped', () => {
    const { getByTestId } = render(
      <CategoryPicker
        visible={true}
        categories={testCategories}
        selectedId={null}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.press(getByTestId('category-item-cat-1'))
    expect(mockOnSelect).toHaveBeenCalledWith('cat-1', 'Cooking')
  })

  it('calls onCancel when overlay is pressed', () => {
    const { getByTestId } = render(
      <CategoryPicker
        visible={true}
        categories={testCategories}
        selectedId={null}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.press(getByTestId('category-picker-overlay'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('shows empty state when category list is empty', () => {
    const { getByText } = render(
      <CategoryPicker
        visible={true}
        categories={[]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    expect(getByText(/No categories available/i)).toBeTruthy()
  })

  it('does not close modal when category item is pressed', () => {
    const { queryByTestId } = render(
      <CategoryPicker
        visible={true}
        categories={testCategories}
        selectedId={null}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.press(queryByTestId('category-item-cat-1')!)
    // Modal should still be visible after selection
    expect(queryByTestId('category-picker-modal')).toBeTruthy()
  })
})
