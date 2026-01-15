import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { StepNavigationControls } from './StepNavigationControls'

describe('StepNavigationControls', () => {
  it('should render with step indicator', () => {
    render(
      <StepNavigationControls
        currentStepIndex={0}
        totalSteps={5}
        onPrevious={jest.fn()}
        onNext={jest.fn()}
        testID="nav"
      />
    )

    const stepIndicator = screen.getByTestId('step-indicator')
    expect(stepIndicator).toHaveTextContent('1 of 5')
  })

  it('should disable previous button on first step', () => {
    const onPrevious = jest.fn()
    render(
      <StepNavigationControls
        currentStepIndex={0}
        totalSteps={5}
        onPrevious={onPrevious}
        onNext={jest.fn()}
        testID="nav"
      />
    )

    const previousButton = screen.getByTestId('previous-button')
    fireEvent.press(previousButton)

    expect(onPrevious).not.toHaveBeenCalled()
  })

  it('should disable next button on last step', () => {
    const onNext = jest.fn()
    render(
      <StepNavigationControls
        currentStepIndex={4}
        totalSteps={5}
        onPrevious={jest.fn()}
        onNext={onNext}
        testID="nav"
      />
    )

    const nextButton = screen.getByTestId('next-button')
    fireEvent.press(nextButton)

    expect(onNext).not.toHaveBeenCalled()
  })

  it('should enable both buttons in middle step', () => {
    const onPrevious = jest.fn()
    const onNext = jest.fn()
    render(
      <StepNavigationControls
        currentStepIndex={2}
        totalSteps={5}
        onPrevious={onPrevious}
        onNext={onNext}
        testID="nav"
      />
    )

    const previousButton = screen.getByTestId('previous-button')
    const nextButton = screen.getByTestId('next-button')

    fireEvent.press(previousButton)
    expect(onPrevious).toHaveBeenCalled()

    fireEvent.press(nextButton)
    expect(onNext).toHaveBeenCalled()
  })

  it('should display correct step numbers', () => {
    const { rerender } = render(
      <StepNavigationControls
        currentStepIndex={0}
        totalSteps={5}
        onPrevious={jest.fn()}
        onNext={jest.fn()}
        testID="nav"
      />
    )

    let stepIndicator = screen.getByTestId('step-indicator')
    expect(stepIndicator).toHaveTextContent('1 of 5')

    rerender(
      <StepNavigationControls
        currentStepIndex={2}
        totalSteps={5}
        onPrevious={jest.fn()}
        onNext={jest.fn()}
        testID="nav"
      />
    )

    stepIndicator = screen.getByTestId('step-indicator')
    expect(stepIndicator).toHaveTextContent('3 of 5')

    rerender(
      <StepNavigationControls
        currentStepIndex={4}
        totalSteps={5}
        onPrevious={jest.fn()}
        onNext={jest.fn()}
        testID="nav"
      />
    )

    stepIndicator = screen.getByTestId('step-indicator')
    expect(stepIndicator).toHaveTextContent('5 of 5')
  })

  it('should disable all buttons when disabled prop is true', () => {
    const onPrevious = jest.fn()
    const onNext = jest.fn()
    render(
      <StepNavigationControls
        currentStepIndex={2}
        totalSteps={5}
        onPrevious={onPrevious}
        onNext={onNext}
        disabled={true}
        testID="nav"
      />
    )

    const previousButton = screen.getByTestId('previous-button')
    const nextButton = screen.getByTestId('next-button')

    fireEvent.press(previousButton)
    fireEvent.press(nextButton)

    expect(onPrevious).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })
})
