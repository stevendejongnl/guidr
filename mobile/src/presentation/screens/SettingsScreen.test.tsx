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
    onOpenAdmin: jest.fn(),
    onOpenProfile: jest.fn(),
    adminMode: false,
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

  it('shows admin section when adminMode is true', () => {
    const { getByText, getByTestId } = render(
      <SettingsScreen {...defaultProps} adminMode={true} />
    )
    expect(getByText('Admin')).toBeTruthy()
    expect(getByTestId('open-admin-button')).toBeTruthy()
  })

  it('hides admin section when adminMode is false', () => {
    const { queryByText, queryByTestId } = render(
      <SettingsScreen {...defaultProps} adminMode={false} />
    )
    expect(queryByText('Admin')).toBeNull()
    expect(queryByTestId('open-admin-button')).toBeNull()
  })

  it('calls onOpenAdmin when admin tools button is pressed', () => {
    const { getByTestId } = render(
      <SettingsScreen {...defaultProps} adminMode={true} />
    )
    fireEvent.press(getByTestId('open-admin-button'))
    expect(defaultProps.onOpenAdmin).toHaveBeenCalledTimes(1)
  })

  it('hides admin section when onOpenAdmin is not provided', () => {
    const propsWithoutAdmin = {
      onBack: jest.fn(),
      onChangeServer: jest.fn(),
      onOpenProfile: jest.fn(),
      adminMode: true,
      serverUrl: 'https://api.example.com',
    }
    const { queryByText } = render(
      <SettingsScreen {...propsWithoutAdmin} />
    )
    expect(queryByText('Admin')).toBeNull()
  })
})

