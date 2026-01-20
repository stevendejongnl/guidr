import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CategoryChip } from './CategoryChip'

describe('CategoryChip', () => {
  it('renders label text', () => {
    const { getByText } = render(
      <CategoryChip
        label="Baking"
        selected={false}
        onPress={() => {}}
        testID="chip"
      />
    )

    expect(getByText('Baking')).toBeDefined()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <CategoryChip
        label="Baking"
        selected={false}
        onPress={onPress}
        testID="chip"
      />
    )

    const chip = getByTestId('chip')
    fireEvent.press(chip)

    expect(onPress).toHaveBeenCalled()
  })

  it('renders in selected state', () => {
    const { getByTestId } = render(
      <CategoryChip
        label="Baking"
        selected={true}
        onPress={() => {}}
        testID="chip"
      />
    )

    const chip = getByTestId('chip')
    expect(chip.props['style']).toBeDefined()
  })

  it('renders in unselected state', () => {
    const { getByTestId } = render(
      <CategoryChip
        label="Baking"
        selected={false}
        onPress={() => {}}
        testID="chip"
      />
    )

    const chip = getByTestId('chip')
    expect(chip.props['style']).toBeDefined()
  })

  it('renders multiple chips with different states', () => {
    const { getByText: getByTextBaking, getByText: getByTextCooking } = render(
      <>
        <CategoryChip
          label="Baking"
          selected={true}
          onPress={() => {}}
          testID="chip-baking"
        />
        <CategoryChip
          label="Cooking"
          selected={false}
          onPress={() => {}}
          testID="chip-cooking"
        />
      </>
    )

    expect(getByTextBaking('Baking')).toBeDefined()
    expect(getByTextCooking('Cooking')).toBeDefined()
  })
})
