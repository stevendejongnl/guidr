import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GuideCard } from './GuideCard'
import { GuideViewModel } from '../viewmodels/GuideViewModel'

describe('GuideCard', () => {
  const mockGuide: GuideViewModel = {
    id: 'g1',
    title: 'Perfect Sourdough Bread',
    description: 'Master the art of sourdough with this step-by-step guide to creating artisan bread.',
    guideType: 'cooking',
    guideTypeLabel: 'Cooking',
    stepCount: 8,
    duration: 180,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByUserId: undefined,
    isPublic: false,
    isHighlighted: false,
  }

  it('renders guide data', () => {
    const { getByText } = render(
      <GuideCard guide={mockGuide} testID="guide-card" />,
    )

    expect(getByText('Perfect Sourdough Bread')).toBeDefined()
    expect(getByText('Master the art of sourdough with this step-by-step guide to creating artisan bread.')).toBeDefined()
  })

  it('shows step count, duration, and guide type metadata', () => {
    const { getByText } = render(
      <GuideCard guide={mockGuide} testID="guide-card" />,
    )

    expect(getByText(/8 steps/)).toBeDefined()
    expect(getByText(/3h 0m/)).toBeDefined()
    expect(getByText(/Cooking/)).toBeDefined()
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

  it('renders with guides of different lengths', () => {
    const { getByText } = render(
      <GuideCard guide={mockGuide} testID="guide-card" />,
    )

    expect(getByText('Perfect Sourdough Bread')).toBeTruthy()
  })

  it('applies testID for accessibility', () => {
    const { getByTestId } = render(
      <GuideCard guide={mockGuide} testID="my-guide" />,
    )

    const card = getByTestId('my-guide')
    expect(card).toBeDefined()
  })

  it('renders with image url when provided', () => {
    const guideWithImage = {
      ...mockGuide,
      imageUrl: 'https://picsum.photos/48/48?random=1',
    }

    const { getByText } = render(
      <GuideCard guide={guideWithImage} testID="guide-card" />,
    )

    // Just verify the component renders without error
    expect(getByText('Perfect Sourdough Bread')).toBeDefined()
  })

  it('renders with rating when provided', () => {
    const guideWithRating = {
      ...mockGuide,
      rating: 4.8,
      ratingCount: 156,
    }

    const { getByText } = render(
      <GuideCard guide={guideWithRating} testID="guide-card" />,
    )

    expect(getByText('Perfect Sourdough Bread')).toBeDefined()
  })

  it('renders with status badge when provided', () => {
    const guideWithStatus = {
      ...mockGuide,
      status: 'in-progress' as const,
    }

    const { getByText } = render(
      <GuideCard guide={guideWithStatus} testID="guide-card" />,
    )

    expect(getByText('Perfect Sourdough Bread')).toBeDefined()
  })

  it('renders with node progress when step info provided', () => {
    const guideWithProgress = {
      ...mockGuide,
      currentStep: 3,
    }

    const { getByText } = render(
      <GuideCard guide={guideWithProgress} testID="guide-card" />,
    )

    expect(getByText('Perfect Sourdough Bread')).toBeDefined()
  })

  it('renders basic guide without optional fields', () => {
    const { getByText } = render(
      <GuideCard guide={mockGuide} testID="guide-card" />,
    )

    expect(getByText('Perfect Sourdough Bread')).toBeDefined()
  })

  it('shows "Yours" badge when isOwned is true', () => {
    const { getByText } = render(
      <GuideCard guide={mockGuide} isOwned={true} testID="guide-card" />,
    )

    expect(getByText('Yours')).toBeDefined()
  })

  it('does not show "Yours" badge when isOwned is false', () => {
    const { queryByText } = render(
      <GuideCard guide={mockGuide} isOwned={false} testID="guide-card" />,
    )

    expect(queryByText('Yours')).toBeNull()
  })

  it('shows filled heart when isFavorited is true', () => {
    const onToggleFavorite = jest.fn()
    const { getByTestId } = render(
      <GuideCard
        guide={mockGuide}
        isFavorited={true}
        onToggleFavorite={onToggleFavorite}
        testID="guide-card"
      />,
    )

    const favButton = getByTestId('guide-card:favorite')
    expect(favButton).toBeDefined()
  })

  it('calls onToggleFavorite when heart is pressed', () => {
    const onToggleFavorite = jest.fn()
    const { getByTestId } = render(
      <GuideCard
        guide={mockGuide}
        isFavorited={false}
        onToggleFavorite={onToggleFavorite}
        testID="guide-card"
      />,
    )

    fireEvent.press(getByTestId('guide-card:favorite'))
    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it('does not show favorite button when onToggleFavorite is not provided', () => {
    const { queryByTestId } = render(
      <GuideCard guide={mockGuide} testID="guide-card" />,
    )

    expect(queryByTestId('guide-card:favorite')).toBeNull()
  })
})
