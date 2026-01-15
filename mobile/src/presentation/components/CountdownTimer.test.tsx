import React from 'react'
import { render, screen, act } from '@testing-library/react-native'
import { CountdownTimer } from './CountdownTimer'

describe('CountdownTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should render timer with initial duration', () => {
    render(<CountdownTimer durationSeconds={300} isRunning={false} testID="timer" />)

    const timerText = screen.getByTestId('timer-text')
    expect(timerText).toHaveTextContent('05:00')
  })

  it('should count down when isRunning is true', async () => {
    const { rerender } = render(<CountdownTimer durationSeconds={300} isRunning={false} testID="timer" />)

    rerender(<CountdownTimer durationSeconds={300} isRunning={true} testID="timer" />)

    const timerText = screen.getByTestId('timer-text')

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(timerText).toHaveTextContent('04:59')

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(timerText).toHaveTextContent('04:58')
  })

  it('should stop counting when isRunning is false', () => {
    const { rerender } = render(<CountdownTimer durationSeconds={300} isRunning={true} testID="timer" />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    rerender(<CountdownTimer durationSeconds={300} isRunning={false} testID="timer" />)

    const timerText = screen.getByTestId('timer-text')
    expect(timerText).toHaveTextContent('04:58')

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // Should still be 04:58 since timer stopped
    expect(timerText).toHaveTextContent('04:58')
  })

  it('should call onComplete when timer reaches 0', () => {
    const onComplete = jest.fn()
    render(
      <CountdownTimer
        durationSeconds={5}
        isRunning={true}
        onComplete={onComplete}
        testID="timer"
      />
    )

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(onComplete).toHaveBeenCalled()
  })

  it('should call onSecondsChange callback each second', () => {
    const onSecondsChange = jest.fn()
    render(
      <CountdownTimer
        durationSeconds={10}
        isRunning={true}
        onSecondsChange={onSecondsChange}
        testID="timer"
      />
    )

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(onSecondsChange).toHaveBeenCalledWith(9)

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(onSecondsChange).toHaveBeenCalledWith(8)
  })

  it('should reset timer when durationSeconds prop changes', () => {
    const { rerender } = render(
      <CountdownTimer durationSeconds={300} isRunning={true} testID="timer" />
    )

    act(() => {
      jest.advanceTimersByTime(30000) // Advance 30 seconds
    })

    const timerText = screen.getByTestId('timer-text')
    expect(timerText).toHaveTextContent('04:30')

    // Change duration
    rerender(<CountdownTimer durationSeconds={200} isRunning={true} testID="timer" />)

    // Should reset to new duration
    expect(timerText).toHaveTextContent('03:20')
  })

  it('should format time correctly with leading zeros', () => {
    render(
      <CountdownTimer durationSeconds={65} isRunning={true} testID="timer" />
    )

    const timerText = screen.getByTestId('timer-text')
    expect(timerText).toHaveTextContent('01:05')

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(timerText).toHaveTextContent('01:00')

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(timerText).toHaveTextContent('00:59')
  })

  it('should not go below 0', () => {
    render(
      <CountdownTimer durationSeconds={5} isRunning={true} testID="timer" />
    )

    act(() => {
      jest.advanceTimersByTime(10000) // Advance more than duration
    })

    const timerText = screen.getByTestId('timer-text')
    expect(timerText).toHaveTextContent('00:00')
  })
})
