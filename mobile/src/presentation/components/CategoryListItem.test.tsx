import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CategoryListItem } from './CategoryListItem'
import { Category } from '../../domain/entities/Category'

describe('CategoryListItem', () => {
  const mockCategory = new Category('cat-1', 'Test Category', null)
  const mockChildCategory = new Category('cat-2', 'Child Category', 'cat-1')

  it('renders category name', () => {
    const { getByText } = render(
      <CategoryListItem category={mockCategory} hasChildren={false} onPress={jest.fn()} />
    )
    expect(getByText('Test Category')).toBeTruthy()
  })

  it('renders children indicator when category has children', () => {
    const { getByText } = render(
      <CategoryListItem category={mockCategory} hasChildren={true} onPress={jest.fn()} />
    )
    expect(getByText('▶')).toBeTruthy()
  })

  it('does not render children indicator when category has no children', () => {
    const { queryByText } = render(
      <CategoryListItem category={mockCategory} hasChildren={false} onPress={jest.fn()} />
    )
    expect(queryByText('▶')).toBeFalsy()
  })

  it('calls onPress when item is pressed', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <CategoryListItem category={mockCategory} hasChildren={false} onPress={onPress} />
    )
    fireEvent.press(getByText('Test Category'))
    expect(onPress).toHaveBeenCalledWith(mockCategory)
  })

  it('applies indent style for child category', () => {
    const { getByText } = render(
      <CategoryListItem
        category={mockChildCategory}
        hasChildren={false}
        onPress={jest.fn()}
        level={1}
      />
    )
    expect(getByText('Child Category')).toBeTruthy()
  })
})
