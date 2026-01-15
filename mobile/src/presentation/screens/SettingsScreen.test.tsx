import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { SettingsScreen } from './SettingsScreen'
import { IHealthCheckService } from '../../domain/services/IHealthCheckService'

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
  getBuildNumber: () => '100',
}))

describe('SettingsScreen', () => {
  const mockHealthCheckService: jest.Mocked<IHealthCheckService> = {
    validateServer: jest.fn(),
  }

  const defaultProps = {
    onBack: jest.fn(),
    onChangeServer: jest.fn(),
    onOpenAdmin: jest.fn(),
    adminMode: false,
    serverUrl: 'https://api.example.com',
    healthCheckService: mockHealthCheckService,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders settings screen with header', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByText } = render(<SettingsScreen {...defaultProps} />)
    expect(getByText('Settings')).toBeTruthy()
  })

  it('displays server URL', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByText } = render(<SettingsScreen {...defaultProps} />)
    expect(getByText('Server URL')).toBeTruthy()
    expect(getByText('https://api.example.com')).toBeTruthy()
  })

  it('displays "Not configured" when server URL is null', async () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByText } = render(
      <SettingsScreen {...defaultProps} serverUrl={null} />
    )
    expect(getByText('Not configured')).toBeTruthy()
  })

  it('displays server version when available', async () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
      version: '1.23.2',
    })
    const { getByText } = render(<SettingsScreen {...defaultProps} />)
    await waitFor(() => {
      expect(getByText('Server Version')).toBeTruthy()
      expect(getByText('1.23.2')).toBeTruthy()
    })
  })

  it('displays "Not available" when server version not in response', async () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByText } = render(<SettingsScreen {...defaultProps} />)
    await waitFor(() => {
      expect(getByText('Not available')).toBeTruthy()
    })
  })

  it('displays "Not available" when health check fails', async () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: false,
      responseTime: 100,
      error: 'Connection failed',
    })
    const { getByText } = render(<SettingsScreen {...defaultProps} />)
    await waitFor(() => {
      expect(getByText('Not available')).toBeTruthy()
    })
  })

  it('calls onBack when back button is pressed', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByTestId } = render(<SettingsScreen {...defaultProps} />)
    fireEvent.press(getByTestId('settings-back-button'))
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
  })

  it('calls onChangeServer when change server button is pressed', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByTestId } = render(<SettingsScreen {...defaultProps} />)
    fireEvent.press(getByTestId('change-server-button'))
    expect(defaultProps.onChangeServer).toHaveBeenCalledTimes(1)
  })

  it('shows admin section when adminMode is true', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByText, getByTestId } = render(
      <SettingsScreen {...defaultProps} adminMode={true} />
    )
    expect(getByText('Admin')).toBeTruthy()
    expect(getByTestId('open-admin-button')).toBeTruthy()
  })

  it('hides admin section when adminMode is false', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { queryByText, queryByTestId } = render(
      <SettingsScreen {...defaultProps} adminMode={false} />
    )
    expect(queryByText('Admin')).toBeNull()
    expect(queryByTestId('open-admin-button')).toBeNull()
  })

  it('calls onOpenAdmin when admin tools button is pressed', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByTestId } = render(
      <SettingsScreen {...defaultProps} adminMode={true} />
    )
    fireEvent.press(getByTestId('open-admin-button'))
    expect(defaultProps.onOpenAdmin).toHaveBeenCalledTimes(1)
  })

  it('hides admin section when onOpenAdmin is not provided', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const propsWithoutAdmin = {
      onBack: jest.fn(),
      onChangeServer: jest.fn(),
      adminMode: true,
      serverUrl: 'https://api.example.com',
      healthCheckService: mockHealthCheckService,
    }
    const { queryByText } = render(
      <SettingsScreen {...propsWithoutAdmin} />
    )
    expect(queryByText('Admin')).toBeNull()
  })
})

