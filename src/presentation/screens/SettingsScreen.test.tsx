import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { SettingsScreen } from './SettingsScreen'

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
  getBuildNumber: () => '100',
}))

describe('SettingsScreen', () => {
  const defaultProps = {
    onBack: jest.fn(),
    onChangeServer: jest.fn(),
    onOpenDebug: jest.fn(),
    debugMode: false,
    serverUrl: 'https://api.example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders settings screen with header', () => {
    const { getByText } = render(<SettingsScreen {...defaultProps} />)
    expect(getByText('Settings')).toBeTruthy()
  })

  it('displays app version information', () => {
    const { getByText } = render(<SettingsScreen {...defaultProps} />)
    expect(getByText('Version')).toBeTruthy()
    expect(getByText('1.0.0')).toBeTruthy()
    expect(getByText('Build')).toBeTruthy()
    expect(getByText('100')).toBeTruthy()
  })

  it('displays server URL', () => {
    const { getByText } = render(<SettingsScreen {...defaultProps} />)
    expect(getByText('Server URL')).toBeTruthy()
    expect(getByText('https://api.example.com')).toBeTruthy()
  })

  it('displays "Not configured" when server URL is null', () => {
    const { getByText } = render(
      <SettingsScreen {...defaultProps} serverUrl={null} />
    )
    expect(getByText('Not configured')).toBeTruthy()
  })

  it('calls onBack when back button is pressed', () => {
    const { getByTestId } = render(<SettingsScreen {...defaultProps} />)
    fireEvent.press(getByTestId('settings-back-button'))
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
  })

  it('calls onChangeServer when change server button is pressed', () => {
    const { getByTestId } = render(<SettingsScreen {...defaultProps} />)
    fireEvent.press(getByTestId('change-server-button'))
    expect(defaultProps.onChangeServer).toHaveBeenCalledTimes(1)
  })

  it('shows debug section when debugMode is true', () => {
    const { getByText, getByTestId } = render(
      <SettingsScreen {...defaultProps} debugMode={true} />
    )
    expect(getByText('Developer')).toBeTruthy()
    expect(getByTestId('open-debug-button')).toBeTruthy()
  })

  it('hides debug section when debugMode is false', () => {
    const { queryByText, queryByTestId } = render(
      <SettingsScreen {...defaultProps} debugMode={false} />
    )
    expect(queryByText('Developer')).toBeNull()
    expect(queryByTestId('open-debug-button')).toBeNull()
  })

  it('calls onOpenDebug when debug tools button is pressed', () => {
    const { getByTestId } = render(
      <SettingsScreen {...defaultProps} debugMode={true} />
    )
    fireEvent.press(getByTestId('open-debug-button'))
    expect(defaultProps.onOpenDebug).toHaveBeenCalledTimes(1)
  })

  it('hides debug section when onOpenDebug is not provided', () => {
    const propsWithoutDebug = {
      onBack: jest.fn(),
      onChangeServer: jest.fn(),
      debugMode: true,
      serverUrl: 'https://api.example.com',
    }
    const { queryByText } = render(
      <SettingsScreen {...propsWithoutDebug} />
    )
    expect(queryByText('Developer')).toBeNull()
  })
})

