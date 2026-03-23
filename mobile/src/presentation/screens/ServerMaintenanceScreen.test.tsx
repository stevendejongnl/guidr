import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import { ServerMaintenanceScreen } from './ServerMaintenanceScreen'

describe('ServerMaintenanceScreen', () => {
  const mockOnRetry = jest.fn()
  const mockOnChangeServer = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render title', () => {
    const { getByText } = render(
      <ServerMaintenanceScreen onRetry={mockOnRetry} onChangeServer={mockOnChangeServer} />
    )
    expect(getByText('Server Maintenance')).toBeTruthy()
  })

  it('should render description', () => {
    const { getByText } = render(
      <ServerMaintenanceScreen onRetry={mockOnRetry} onChangeServer={mockOnChangeServer} />
    )
    expect(getByText(/currently unavailable/i)).toBeTruthy()
  })

  it('should show initial countdown', () => {
    const { getByText } = render(
      <ServerMaintenanceScreen onRetry={mockOnRetry} onChangeServer={mockOnChangeServer} />
    )
    expect(getByText(/checking again in 10s/i)).toBeTruthy()
  })

  it('should call onRetry when Try Again Now is pressed', () => {
    const { getByText } = render(
      <ServerMaintenanceScreen onRetry={mockOnRetry} onChangeServer={mockOnChangeServer} />
    )
    fireEvent.press(getByText('Try Again Now'))
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('should call onChangeServer when Change Server is pressed', () => {
    const { getByText } = render(
      <ServerMaintenanceScreen onRetry={mockOnRetry} onChangeServer={mockOnChangeServer} />
    )
    fireEvent.press(getByText('Change Server'))
    expect(mockOnChangeServer).toHaveBeenCalledTimes(1)
  })

  it('should decrement countdown each second', () => {
    const { getByText } = render(
      <ServerMaintenanceScreen onRetry={mockOnRetry} onChangeServer={mockOnChangeServer} />
    )
    act(() => { jest.advanceTimersByTime(3000) })
    expect(getByText(/checking again in 7s/i)).toBeTruthy()
  })

  it('should call onRetry automatically after 10 seconds', () => {
    render(
      <ServerMaintenanceScreen onRetry={mockOnRetry} onChangeServer={mockOnChangeServer} />
    )
    act(() => { jest.advanceTimersByTime(10000) })
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('should reset countdown after manual retry', () => {
    const { getByText } = render(
      <ServerMaintenanceScreen onRetry={mockOnRetry} onChangeServer={mockOnChangeServer} />
    )
    act(() => { jest.advanceTimersByTime(5000) })
    fireEvent.press(getByText('Try Again Now'))
    expect(getByText(/checking again in 10s/i)).toBeTruthy()
  })
})
