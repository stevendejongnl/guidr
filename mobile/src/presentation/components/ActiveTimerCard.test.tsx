import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ActiveTimerCard } from './ActiveTimerCard'
import { ActiveTimerItem } from '../hooks/useActiveTimers'

describe('ActiveTimerCard', () => {
  const makeTimer = (overrides: Partial<ActiveTimerItem> = {}): ActiveTimerItem => ({
    timerId: 'timer-1',
    guideId: 'guide-1',
    stepId: 'step-1',
    guideTitle: 'My Cooking Guide',
    stepTitle: 'Preheat Oven',
    display: {
      timerId: 'timer-1',
      mode: 'countdown',
      displaySeconds: 75,
      isRunning: true,
      isPaused: false,
      isComplete: false,
    },
    ...overrides,
  })

  it('should render guide title', () => {
    const { getByText } = render(
      <ActiveTimerCard timer={makeTimer()} onPress={jest.fn()} />,
    )
    expect(getByText('My Cooking Guide')).toBeTruthy()
  })

  it('should render step title', () => {
    const { getByText } = render(
      <ActiveTimerCard timer={makeTimer()} onPress={jest.fn()} />,
    )
    expect(getByText('Preheat Oven')).toBeTruthy()
  })

  it('should render timer value as MM:SS', () => {
    const { getByText } = render(
      <ActiveTimerCard timer={makeTimer()} onPress={jest.fn()} />,
    )
    expect(getByText('01:15')).toBeTruthy()
  })

  it('should render timer value as HH:MM:SS when >= 1 hour', () => {
    const timer = makeTimer({
      display: {
        timerId: 'timer-1',
        mode: 'stopwatch',
        displaySeconds: 3661,
        isRunning: true,
        isPaused: false,
        isComplete: false,
      },
    })
    const { getByText } = render(
      <ActiveTimerCard timer={timer} onPress={jest.fn()} />,
    )
    expect(getByText('01:01:01')).toBeTruthy()
  })

  it('should call onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <ActiveTimerCard timer={makeTimer()} onPress={onPress} />,
    )
    fireEvent.press(getByTestId('active-timer-timer-1'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('should render in-progress status badge for running timer', () => {
    const { getByText } = render(
      <ActiveTimerCard timer={makeTimer()} onPress={jest.fn()} />,
    )
    expect(getByText('In Progress')).toBeTruthy()
  })

  it('should render completed status badge for complete timer', () => {
    const timer = makeTimer({
      display: {
        timerId: 'timer-1',
        mode: 'countdown',
        displaySeconds: 0,
        isRunning: false,
        isPaused: false,
        isComplete: true,
      },
    })
    const { getByText } = render(
      <ActiveTimerCard timer={timer} onPress={jest.fn()} />,
    )
    expect(getByText('Completed')).toBeTruthy()
  })

  it('should render paused status badge for paused timer', () => {
    const timer = makeTimer({
      display: {
        timerId: 'timer-1',
        mode: 'countdown',
        displaySeconds: 30,
        isRunning: false,
        isPaused: true,
        isComplete: false,
      },
    })
    const { getByText } = render(
      <ActiveTimerCard timer={timer} onPress={jest.fn()} />,
    )
    expect(getByText('Paused')).toBeTruthy()
  })
})
