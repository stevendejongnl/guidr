import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GuideCard } from './GuideCard'

describe('GuideCard', () => {
  const mockGuide = {
    id: 'g1',
    title: 'Perfect Sourdough Bread',
    description: 'Master the art of sourdough with this step-by-step guide to creating artisan bread.',
    categoryId: 'baking',
    categoryName: 'Baking',
    stepCount: 8,
    duration: 180,
    thumbnailEmoji: '🍞',
  }

  it('renders guide data', () => {
    const { getByText } = render(
      <GuideCard guide={mockGuide} testID="guide-card" />,
    )

    expect(getByText('Perfect Sourdough Bread')).toBeDefined()
    expect(getByText(mockGuide.description)).toBeDefined()
  })

  it('displays emoji thumbnail', () => {
    const { getByText } = render(
      <GuideCard guide={mockGuide} testID="guide-card" />,
    )

    expect(getByText('🍞')).toBeDefined()
  })

  it('shows step count, duration, and category metadata', () => {
    const { getByText } = render(
      <GuideCard guide={mockGuide} testID="guide-card" />,
    )

    expect(getByText(/8 steps/)).toBeDefined()
    expect(getByText(/3h 0m/)).toBeDefined()
    expect(getByText(/Baking/)).toBeDefined()
  })

  it('calls onPress callback when pressed', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <GuideCard guide={mockGuide} onPress={onPress} testID="guide-card" />,
    )

    const card = getByTestId('guide-card')
    fireEvent.press(card)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('truncates long descriptions', () => {
    const longDescriptionGuide = {
      ...mockGuide,
      description: 'This is a very long description that should be truncated to show only the first few lines so the user interface looks clean and organized without too much text on the screen at once.',
    }

    const { getByTestId } = render(
      <GuideCard guide={longDescriptionGuide} testID="guide-card" />,
    )

    const descriptionElement = getByTestId('guide-description')
    // Should have numberOfLines set to limit display
    expect(descriptionElement.props['numberOfLines']).toBe(2)
  })

  it('applies testID for accessibility', () => {
    const { getByTestId } = render(
      <GuideCard guide={mockGuide} testID="my-guide" />,
    )

    const card = getByTestId('my-guide')
    expect(card).toBeDefined()
  })

  it('displays different emoji for different guides', () => {
    const cookingGuide = {
      ...mockGuide,
      thumbnailEmoji: '🍳',
      categoryName: 'Cooking',
    }

    const { getByText } = render(
      <GuideCard guide={cookingGuide} testID="guide-card" />,
    )

    expect(getByText('🍳')).toBeDefined()
  })
})
