import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { SessionProgressIndicator } from './SessionProgressIndicator'

describe('SessionProgressIndicator', () => {
  it('should display guide title and step count', () => {
    render(
      <SessionProgressIndicator
        currentStepIndex={0}
        totalSteps={5}
        guideTitle="Meditation Guide"
        testID="progress"
      />
    )

    expect(screen.getByText('Meditation Guide')).toBeDefined()
    expect(screen.getByText('1/5')).toBeDefined()
  })

  it('should display correct progress percentage for first step', () => {
    render(
      <SessionProgressIndicator
        currentStepIndex={0}
        totalSteps={5}
        guideTitle="Test Guide"
        testID="progress"
      />
    )

    expect(screen.getByText('20% Complete')).toBeDefined()
  })

  it('should display correct progress percentage for middle step', () => {
    render(
      <SessionProgressIndicator
        currentStepIndex={2}
        totalSteps={5}
        guideTitle="Test Guide"
        testID="progress"
      />
    )

    expect(screen.getByText('60% Complete')).toBeDefined()
  })

  it('should display correct progress percentage for last step', () => {
    render(
      <SessionProgressIndicator
        currentStepIndex={4}
        totalSteps={5}
        guideTitle="Test Guide"
        testID="progress"
      />
    )

    expect(screen.getByText('100% Complete')).toBeDefined()
  })

  it('should update step count when props change', () => {
    const { rerender } = render(
      <SessionProgressIndicator
        currentStepIndex={0}
        totalSteps={5}
        guideTitle="Test Guide"
        testID="progress"
      />
    )

    expect(screen.getByText('1/5')).toBeDefined()

    rerender(
      <SessionProgressIndicator
        currentStepIndex={2}
        totalSteps={5}
        guideTitle="Test Guide"
        testID="progress"
      />
    )

    expect(screen.getByText('3/5')).toBeDefined()
  })

  it('should have correct accessibility attributes', () => {
    const { getByTestId } = render(
      <SessionProgressIndicator
        currentStepIndex={1}
        totalSteps={5}
        guideTitle="Accessibility Test"
        testID="progress"
      />
    )

    const indicator = getByTestId('progress')
    expect(indicator.props['accessible']).toBe(true)
    expect(indicator.props['accessibilityRole']).toBe('progressbar')
  })
})
