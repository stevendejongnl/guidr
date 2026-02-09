import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { IngredientsEditor } from './IngredientsEditor'
import type { Ingredient } from './IngredientsEditor'

describe('IngredientsEditor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty state', () => {
    const { getByTestId } = render(
      <IngredientsEditor
        ingredients={[]}
        onChange={mockOnChange}
        testID="ingredients"
      />
    )

    expect(getByTestId('ingredients')).toBeTruthy()
    expect(getByTestId('ingredients:name-input')).toBeTruthy()
    expect(getByTestId('ingredients:quantity-input')).toBeTruthy()
    expect(getByTestId('ingredients:unit-input')).toBeTruthy()
    expect(getByTestId('ingredients:add-button')).toBeTruthy()
  })

  it('renders existing ingredients', () => {
    const ingredients: Ingredient[] = [
      { name: 'flour', quantity: '200', unit: 'g' },
      { name: 'eggs', quantity: '3', unit: 'piece' },
    ]

    const { getByText } = render(
      <IngredientsEditor
        ingredients={ingredients}
        onChange={mockOnChange}
        testID="ingredients"
      />
    )

    expect(getByText('200 g — flour')).toBeTruthy()
    expect(getByText('3 piece — eggs')).toBeTruthy()
  })

  it('adds ingredient when all fields filled', () => {
    const { getByTestId } = render(
      <IngredientsEditor
        ingredients={[]}
        onChange={mockOnChange}
        testID="ingredients"
      />
    )

    fireEvent.changeText(getByTestId('ingredients:name-input'), 'flour')
    fireEvent.changeText(getByTestId('ingredients:quantity-input'), '200')
    fireEvent.changeText(getByTestId('ingredients:unit-input'), 'g')
    fireEvent.press(getByTestId('ingredients:add-button'))

    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'flour', quantity: '200', unit: 'g' },
    ])
  })

  it('does not add ingredient when name is empty', () => {
    const { getByTestId } = render(
      <IngredientsEditor
        ingredients={[]}
        onChange={mockOnChange}
        testID="ingredients"
      />
    )

    fireEvent.changeText(getByTestId('ingredients:quantity-input'), '200')
    fireEvent.changeText(getByTestId('ingredients:unit-input'), 'g')
    fireEvent.press(getByTestId('ingredients:add-button'))

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('removes ingredient by index', () => {
    const ingredients: Ingredient[] = [
      { name: 'flour', quantity: '200', unit: 'g' },
      { name: 'eggs', quantity: '3', unit: 'piece' },
    ]

    const { getByTestId } = render(
      <IngredientsEditor
        ingredients={ingredients}
        onChange={mockOnChange}
        testID="ingredients"
      />
    )

    fireEvent.press(getByTestId('ingredients:remove-0'))

    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'eggs', quantity: '3', unit: 'piece' },
    ])
  })

  it('disables inputs and buttons when disabled prop is true', () => {
    const { getByTestId } = render(
      <IngredientsEditor
        ingredients={[]}
        onChange={mockOnChange}
        disabled={true}
        testID="ingredients"
      />
    )

    expect(getByTestId('ingredients:name-input').props['editable']).toBe(false)
    expect(getByTestId('ingredients:quantity-input').props['editable']).toBe(false)
    expect(getByTestId('ingredients:unit-input').props['editable']).toBe(false)
  })

  it('applies unit from quick-pick suggestion', () => {
    const { getByTestId } = render(
      <IngredientsEditor
        ingredients={[]}
        onChange={mockOnChange}
        testID="ingredients"
      />
    )

    fireEvent.press(getByTestId('ingredients:unit-g'))

    expect(getByTestId('ingredients:unit-input').props['value']).toBe('g')
  })
})
