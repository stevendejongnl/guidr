import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ComingSoon } from './ComingSoon'

describe('ComingSoon', () => {
  it('renders children', () => {
    render(
      <ComingSoon>
        <Text testID="test-child">Test Child</Text>
      </ComingSoon>,
    )

    expect(screen.getByTestId('test-child')).toBeTruthy()
  })

  it('displays "Coming Soon" text', () => {
    render(
      <ComingSoon>
        <Text>Test Child</Text>
      </ComingSoon>,
    )

    expect(screen.getByText('Coming Soon')).toBeTruthy()
  })

  it('passes through testID prop', () => {
    const { root } = render(
      <ComingSoon testID="coming-soon-wrapper">
        <Text>Test Child</Text>
      </ComingSoon>,
    )

    expect(root.findByProps({ testID: 'coming-soon-wrapper' })).toBeTruthy()
  })

  it('disables interactions with child component', () => {
    const { root } = render(
      <ComingSoon>
        <Text testID="test-child">Test Child</Text>
      </ComingSoon>,
    )

    const contentWrapper = root.findByProps({ pointerEvents: 'none' })
    expect(contentWrapper).toBeTruthy()
  })
})
