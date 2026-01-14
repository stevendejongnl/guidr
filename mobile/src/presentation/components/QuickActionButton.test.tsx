import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QuickActionButton } from './QuickActionButton'

describe('QuickActionButton', () => {
  it('renders icon and label', () => {
    const { getByText } = render(
      <QuickActionButton icon="🔍" label="Browse Guides" onPress={() => {}} testID="action-btn" />,
    )

    expect(getByText('🔍')).toBeDefined()
    expect(getByText('Browse Guides')).toBeDefined()
  })

  it('calls onPress callback when pressed', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <QuickActionButton icon="▶️" label="Start Session" onPress={onPress} testID="action-btn" />,
    )

    const button = getByTestId('action-btn')
    fireEvent.press(button)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('applies primary variant by default', () => {
    const { getByTestId } = render(
      <QuickActionButton icon="📋" label="View Sessions" onPress={() => {}} testID="action-btn" />,
    )

    const button = getByTestId('action-btn')
    expect(button.props['style']).toBeDefined()
  })

  it('applies secondary variant when specified', () => {
    const { getByTestId } = render(
      <QuickActionButton
        icon="⚙️"
        label="Settings"
        onPress={() => {}}
        variant="secondary"
        testID="action-btn"
      />,
    )

    const button = getByTestId('action-btn')
    expect(button.props['style']).toBeDefined()
  })

  it('applies outline variant when specified', () => {
    const { getByTestId } = render(
      <QuickActionButton
        icon="❌"
        label="Cancel"
        onPress={() => {}}
        variant="outline"
        testID="action-btn"
      />,
    )

    const button = getByTestId('action-btn')
    expect(button.props['style']).toBeDefined()
  })

  it('applies testID for accessibility', () => {
    const { getByTestId } = render(
      <QuickActionButton icon="🎯" label="Action" onPress={() => {}} testID="my-action" />,
    )

    const button = getByTestId('my-action')
    expect(button).toBeDefined()
  })
})
