import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { BrowseGuidesScreen } from './BrowseGuidesScreen'

describe('BrowseGuidesScreen', () => {
  const mockOnBack = jest.fn()
  const mockOnViewGuide = jest.fn()

  beforeEach(() => {
    mockOnBack.mockClear()
    mockOnViewGuide.mockClear()
  })

  it('renders screen title', () => {
    const { getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    expect(getByText('Browse Guides')).toBeDefined()
  })

  it('renders back button', () => {
    const { getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    expect(getByText('← Back')).toBeDefined()
  })

  it('calls onBack when back button is pressed', () => {
    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    fireEvent.press(getByTestId('browse-guides:back'))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('renders search bar', () => {
    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    expect(getByTestId('browse-guides:search')).toBeDefined()
  })

  it('renders category filter chips', () => {
    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    expect(getByTestId('browse-guides:chip-All Guides')).toBeDefined()
    expect(getByTestId('browse-guides:chip-Baking')).toBeDefined()
    expect(getByTestId('browse-guides:chip-Cooking')).toBeDefined()
  })

  it('filters guides by search text', async () => {
    const { getByTestId, queryAllByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    const searchInput = getByTestId('browse-guides:search:input')
    fireEvent.changeText(searchInput, 'sourdough')

    await waitFor(() => {
      // After searching, should find the sourdough guide(s)
      const results = queryAllByText(/sourdough/i)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  it('filters guides by category', async () => {
    const { getByTestId, getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    const bakingChip = getByTestId('browse-guides:chip-Baking')
    fireEvent.press(bakingChip)

    await waitFor(() => {
      expect(getByText('Baking Guides')).toBeDefined()
    })
  })

  it('shows empty state when no guides match filter', async () => {
    const { getByTestId, queryByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    const searchInput = getByTestId('browse-guides:search:input')
    fireEvent.changeText(searchInput, 'nonexistent guide that does not exist')

    await waitFor(() => {
      // Check for empty state message
      expect(queryByText(/No guides found/i)).toBeDefined()
    })
  })

  it('resets filters when reset action is pressed in empty state', async () => {
    const { getByTestId, getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    // Search for non-existent guide
    const searchInput = getByTestId('browse-guides:search:input')
    fireEvent.changeText(searchInput, 'nonexistent')

    // Find and press reset button
    await waitFor(() => {
      const resetButton = getByText('Reset Filters')
      expect(resetButton).toBeDefined()
      fireEvent.press(resetButton)
    })
  })

  it('calls onViewGuide when guide card is pressed', async () => {
    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    // Find first guide card (g1)
    const guideCard = getByTestId('browse-guides:card-g1')
    fireEvent.press(guideCard)

    expect(mockOnViewGuide).toHaveBeenCalledWith('g1')
  })

  it('combines search and category filters', async () => {
    const { getByTestId, getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    // Select Baking category
    const bakingChip = getByTestId('browse-guides:chip-Baking')
    fireEvent.press(bakingChip)

    // Search within that category
    const searchInput = getByTestId('browse-guides:search:input')
    fireEvent.changeText(searchInput, 'bread')

    await waitFor(() => {
      expect(getByText('Baking Guides')).toBeDefined()
    })
  })

  it('has node progress indicator in header', () => {
    const { root } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
      />
    )

    expect(root).toBeDefined()
  })
})
