import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { GuideDetailScreen } from './GuideDetailScreen'

describe('GuideDetailScreen', () => {
  const mockOnBack = jest.fn()

  beforeEach(() => {
    mockOnBack.mockClear()
  })

  it('renders guide details when guide exists', () => {
    render(<GuideDetailScreen guideId="guide-1" onBack={mockOnBack} />)

    // Should display guide title, category, and description
    expect(screen.getByText(/guide|category|description/i)).toBeTruthy()
  })

  it('displays Coming Soon overlay', () => {
    render(<GuideDetailScreen guideId="guide-1" onBack={mockOnBack} />)

    // ComingSoon component should display "Coming Soon" text
    expect(screen.getByText('Coming Soon')).toBeTruthy()
  })

  it('renders error message when guide not found', () => {
    render(<GuideDetailScreen guideId="non-existent-guide" onBack={mockOnBack} />)

    expect(screen.getByText('Guide not found')).toBeTruthy()
  })

  it('displays back button', () => {
    render(<GuideDetailScreen guideId="guide-1" onBack={mockOnBack} testID="test" />)

    expect(screen.getByTestId('test:back')).toBeTruthy()
  })

  it('passes testID to ComingSoon wrapper', () => {
    const { root } = render(
      <GuideDetailScreen guideId="guide-1" onBack={mockOnBack} testID="test" />
    )

    expect(root.findByProps({ testID: 'test:coming-soon' })).toBeTruthy()
  })
})
