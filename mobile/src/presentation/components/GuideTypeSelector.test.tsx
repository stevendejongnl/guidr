import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GuideTypeSelector } from './GuideTypeSelector'
import { ALL_GUIDE_TYPES, GUIDE_TYPE_LABELS } from '../../domain/constants/GuideTypes'

describe('GuideTypeSelector', () => {
  const mockOnSelectType = jest.fn()

  beforeEach(() => {
    mockOnSelectType.mockClear()
  })

  it('should render all guide types', () => {
    const { getByText } = render(
      <GuideTypeSelector
        selectedType={null}
        onSelectType={mockOnSelectType}
      />
    )

    ALL_GUIDE_TYPES.forEach(type => {
      expect(getByText(GUIDE_TYPE_LABELS[type])).toBeDefined()
    })
  })

  it('should call onSelectType when a type is pressed', () => {
    const { getByTestId } = render(
      <GuideTypeSelector
        selectedType={null}
        onSelectType={mockOnSelectType}
        testID="selector"
      />
    )

    fireEvent.press(getByTestId('selector:cooking'))
    expect(mockOnSelectType).toHaveBeenCalledWith('cooking')
  })

  it('should highlight the selected type', () => {
    const { getByTestId } = render(
      <GuideTypeSelector
        selectedType="cooking"
        onSelectType={mockOnSelectType}
        testID="selector"
      />
    )

    expect(getByTestId('selector:cooking')).toBeDefined()
  })

  it('should render with custom testID', () => {
    const { getByTestId } = render(
      <GuideTypeSelector
        selectedType={null}
        onSelectType={mockOnSelectType}
        testID="custom-selector"
      />
    )

    expect(getByTestId('custom-selector')).toBeDefined()
  })

  it('should not respond to press when disabled', () => {
    const { getByTestId } = render(
      <GuideTypeSelector
        selectedType={null}
        onSelectType={mockOnSelectType}
        disabled={true}
        testID="selector"
      />
    )

    fireEvent.press(getByTestId('selector:cooking'))
    expect(mockOnSelectType).not.toHaveBeenCalled()
  })
})
