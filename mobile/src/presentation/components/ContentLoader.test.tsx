import React from 'react'
import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { ContentLoader } from './ContentLoader'

describe('ContentLoader', () => {
  it('renders the skeleton while loading', () => {
    render(
      <ContentLoader
        isLoading
        testID="loader"
        skeleton={<Text testID="skeleton">skeleton</Text>}
      >
        <Text testID="content">real content</Text>
      </ContentLoader>
    )

    expect(screen.getByTestId('skeleton')).toBeTruthy()
    expect(screen.queryByTestId('content')).toBeNull()
  })

  it('renders children once loading finishes', () => {
    render(
      <ContentLoader
        isLoading={false}
        testID="loader"
        skeleton={<Text testID="skeleton">skeleton</Text>}
      >
        <Text testID="content">real content</Text>
      </ContentLoader>
    )

    expect(screen.getByTestId('content')).toBeTruthy()
    expect(screen.queryByTestId('skeleton')).toBeNull()
  })

  it('keeps the same testID on the wrapper across the loading -> loaded transition', () => {
    const { rerender } = render(
      <ContentLoader
        isLoading
        testID="session-history-loading"
        skeleton={<Text testID="skeleton">skeleton</Text>}
      >
        <Text testID="content">real content</Text>
      </ContentLoader>
    )

    expect(screen.getByTestId('session-history-loading')).toBeTruthy()

    rerender(
      <ContentLoader
        isLoading={false}
        testID="session-history-loading"
        skeleton={<Text testID="skeleton">skeleton</Text>}
      >
        <Text testID="content">real content</Text>
      </ContentLoader>
    )

    expect(screen.getByTestId('session-history-loading')).toBeTruthy()
    expect(screen.getByTestId('content')).toBeTruthy()
  })
})
