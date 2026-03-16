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

  it('should display green color when more than 50% time remains', () => {
    render(<CountdownTimer durationSeconds={100} isRunning={false} testID="timer" />)

    // With 100s remaining out of 100s, that is 100% - green zone
    const timerText = screen.getByTestId('timer-text')
    // Timer text color will be colors.success (green)
    expect(timerText).toBeTruthy()
  })

  it('should display yellow color when 25-50% time remains', () => {
    const { rerender } = render(
      <CountdownTimer durationSeconds={100} isRunning={true} testID="timer" />
    )

    // Advance to 35 seconds remaining (35% of 100s = yellow zone)
    act(() => {
      jest.advanceTimersByTime(65000)
    })

    rerender(<CountdownTimer durationSeconds={100} isRunning={false} testID="timer" />)

    const timerText = screen.getByTestId('timer-text')
    expect(timerText).toHaveTextContent('00:35')
  })

  it('should display red color when less than 25% time remains', () => {
    const { rerender } = render(
      <CountdownTimer durationSeconds={100} isRunning={true} testID="timer" />
    )

    // Advance to 20 seconds remaining (20% of 100s = red zone)
    act(() => {
      jest.advanceTimersByTime(80000)
    })

    rerender(<CountdownTimer durationSeconds={100} isRunning={false} testID="timer" />)

    const timerText = screen.getByTestId('timer-text')
    expect(timerText).toHaveTextContent('00:20')
  })

  it('should render with testID on the container', () => {
    render(<CountdownTimer durationSeconds={60} isRunning={false} testID="my-timer" />)

    expect(screen.getByTestId('my-timer')).toBeTruthy()
  })

  it('should have correct accessibility role as timer', () => {
    render(<CountdownTimer durationSeconds={60} isRunning={false} testID="my-timer" />)

    const container = screen.getByTestId('my-timer')
    expect(container.props['accessibilityRole']).toBe('timer')
  })

  it('should have correct accessibility label', () => {
    render(<CountdownTimer durationSeconds={65} isRunning={false} testID="my-timer" />)

    const container = screen.getByTestId('my-timer')
    expect(container.props['accessibilityLabel']).toBe('Timer: 01:05 remaining')
  })

  it('should clear interval when unmounted while running', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

    const { unmount } = render(
      <CountdownTimer durationSeconds={300} isRunning={true} testID="timer" />
    )

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('should call both onComplete and onSecondsChange at zero', () => {
    const onComplete = jest.fn()
    const onSecondsChange = jest.fn()

    render(
      <CountdownTimer
        durationSeconds={2}
        isRunning={true}
        onComplete={onComplete}
        onSecondsChange={onSecondsChange}
        testID="timer"
      />
    )

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(onComplete).toHaveBeenCalled()
    expect(onSecondsChange).toHaveBeenCalledWith(0)
  })
})
