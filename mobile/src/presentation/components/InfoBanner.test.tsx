/**
 * Tests for InfoBanner component
 */

import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { InfoBanner } from './InfoBanner'

describe('InfoBanner', () => {
  it('renders message when visible is true', () => {
    render(
      <InfoBanner
        message="Test message"
        visible={true}
        testID="test-banner"
      />
    )
    expect(screen.getByText('Test message')).toBeTruthy()
  })

  it('does not render when visible is false', () => {
    const { queryByTestId } = render(
      <InfoBanner
        message="Test message"
        visible={false}
        testID="test-banner"
      />
    )
    expect(queryByTestId('test-banner')).toBeNull()
  })

  it('renders with default visible (true)', () => {
    render(<InfoBanner message="Test message" testID="test-banner" />)
    expect(screen.getByText('Test message')).toBeTruthy()
  })

  it('renders with info variant by default', () => {
    const { getByTestId } = render(
      <InfoBanner message="Test message" testID="test-banner" />
    )
    const banner = getByTestId('test-banner')
    expect(banner).toBeTruthy()
  })

  it('renders with warning variant', () => {
    const { getByTestId } = render(
      <InfoBanner
        message="Warning message"
        variant="warning"
        testID="test-banner"
      />
    )
    const banner = getByTestId('test-banner')
    expect(banner).toBeTruthy()
  })

  it('renders with success variant', () => {
    const { getByTestId } = render(
      <InfoBanner
        message="Success message"
        variant="success"
        testID="test-banner"
      />
    )
    const banner = getByTestId('test-banner')
    expect(banner).toBeTruthy()
  })

  it('renders with danger variant', () => {
    const { getByTestId } = render(
      <InfoBanner
        message="Danger message"
        variant="danger"
        testID="test-banner"
      />
    )
    const banner = getByTestId('test-banner')
    expect(banner).toBeTruthy()
  })

  it('displays correct message text', () => {
    const testMessage = 'You are editing content created by another user'
    render(<InfoBanner message={testMessage} />)
    expect(screen.getByText(testMessage)).toBeTruthy()
  })
})
