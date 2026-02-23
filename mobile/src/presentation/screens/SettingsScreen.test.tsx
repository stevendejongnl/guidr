import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { SettingsScreen } from './SettingsScreen'
import { IHealthCheckService } from '../../domain/services/IHealthCheckService'
import { NotificationPreferencesStorage } from '../../infrastructure/storage/NotificationPreferencesStorage'
import { NotificationService } from '../../infrastructure/native/NotificationService'

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
  getBuildNumber: () => '100',
}))

describe('SettingsScreen', () => {
  const mockHealthCheckService: jest.Mocked<IHealthCheckService> = {
    validateServer: jest.fn(),
  }

  const mockPrefsStorage: jest.Mocked<NotificationPreferencesStorage> = {
    getTimerNotificationsEnabled: jest.fn(),
    setTimerNotificationsEnabled: jest.fn(),
    getCriticalNotificationsEnabled: jest.fn(),
    setCriticalNotificationsEnabled: jest.fn(),
  } as unknown as jest.Mocked<NotificationPreferencesStorage>

  const mockNotifService: jest.Mocked<NotificationService> = {
    requestPermission: jest.fn(),
    scheduleTimerNotification: jest.fn(),
    cancelTimerNotification: jest.fn(),
    cancelAllTimerNotifications: jest.fn(),
    showImmediateNotification: jest.fn(),
  } as unknown as jest.Mocked<NotificationService>

  const defaultProps = {
    onBack: jest.fn(),
    onChangeServer: jest.fn(),
    onOpenAdmin: jest.fn(),
    isAdmin: false,
    adminModeActive: false,
    onToggleAdminMode: jest.fn(),
    serverUrl: 'https://api.example.com',
    healthCheckService: mockHealthCheckService,
    notificationPreferencesStorage: mockPrefsStorage,
    notificationService: mockNotifService,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrefsStorage.getTimerNotificationsEnabled.mockResolvedValue(true)
    mockPrefsStorage.getCriticalNotificationsEnabled.mockResolvedValue(false)
    mockPrefsStorage.setTimerNotificationsEnabled.mockResolvedValue(undefined)
    mockPrefsStorage.setCriticalNotificationsEnabled.mockResolvedValue(undefined)
    mockNotifService.requestPermission.mockResolvedValue(true)
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

  it('shows admin section when isAdmin is true', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByText, getByTestId } = render(
      <SettingsScreen {...defaultProps} isAdmin={true} />
    )
    expect(getByText('Admin')).toBeTruthy()
    expect(getByTestId('admin-mode-toggle')).toBeTruthy()
  })

  it('hides admin section when isAdmin is false', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { queryByText, queryByTestId } = render(
      <SettingsScreen {...defaultProps} isAdmin={false} />
    )
    expect(queryByText('Admin')).toBeNull()
    expect(queryByTestId('admin-mode-toggle')).toBeNull()
  })

  it('shows admin tools button only when adminModeActive is true', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByTestId } = render(
      <SettingsScreen {...defaultProps} isAdmin={true} adminModeActive={true} />
    )
    expect(getByTestId('open-admin-button')).toBeTruthy()
  })

  it('hides admin tools button when adminModeActive is false', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { queryByTestId } = render(
      <SettingsScreen {...defaultProps} isAdmin={true} adminModeActive={false} />
    )
    expect(queryByTestId('open-admin-button')).toBeNull()
  })

  it('calls onOpenAdmin when admin tools button is pressed', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const { getByTestId } = render(
      <SettingsScreen {...defaultProps} isAdmin={true} adminModeActive={true} />
    )
    fireEvent.press(getByTestId('open-admin-button'))
    expect(defaultProps.onOpenAdmin).toHaveBeenCalledTimes(1)
  })

  it('fires onToggleAdminMode when toggle is changed', () => {
    mockHealthCheckService.validateServer.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    const mockToggle = jest.fn()
    const { getByTestId } = render(
      <SettingsScreen {...defaultProps} isAdmin={true} onToggleAdminMode={mockToggle} />
    )
    fireEvent(getByTestId('admin-mode-toggle'), 'onValueChange', true)
    expect(mockToggle).toHaveBeenCalledWith(true)
  })

  // Notification tests
  describe('Notifications section', () => {
    beforeEach(() => {
      mockHealthCheckService.validateServer.mockResolvedValue({
        healthy: true,
        responseTime: 100,
      })
    })

    it('renders notifications section with timer toggle', () => {
      const { getByText, getByTestId } = render(
        <SettingsScreen {...defaultProps} />
      )
      expect(getByText('Notifications')).toBeTruthy()
      expect(getByText('Timer Notifications')).toBeTruthy()
      expect(getByTestId('timer-notifications-toggle')).toBeTruthy()
    })

    it('renders hint text for timer notifications', () => {
      const { getByText } = render(<SettingsScreen {...defaultProps} />)
      expect(getByText('Get notified when step timers complete')).toBeTruthy()
    })

    it('loads notification preferences on mount', async () => {
      render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(mockPrefsStorage.getTimerNotificationsEnabled).toHaveBeenCalled()
        expect(mockPrefsStorage.getCriticalNotificationsEnabled).toHaveBeenCalled()
      })
    })

    it('shows time-sensitive toggle when timer notifications enabled', async () => {
      mockPrefsStorage.getTimerNotificationsEnabled.mockResolvedValue(true)

      const { getByTestId } = render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(getByTestId('critical-notifications-toggle')).toBeTruthy()
      })
    })

    it('hides time-sensitive toggle when timer notifications disabled', async () => {
      mockPrefsStorage.getTimerNotificationsEnabled.mockResolvedValue(false)

      const { queryByTestId } = render(<SettingsScreen {...defaultProps} />)

      // Wait for async prefs load to complete, then verify toggle is hidden
      await waitFor(
        () => {
          expect(queryByTestId('critical-notifications-toggle')).toBeNull()
        },
        { timeout: 3000 },
      )
    })

    it('saves preference when timer toggle is changed', async () => {
      const { getByTestId } = render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(getByTestId('timer-notifications-toggle')).toBeTruthy()
      })

      fireEvent(getByTestId('timer-notifications-toggle'), 'onValueChange', false)

      await waitFor(() => {
        expect(mockPrefsStorage.setTimerNotificationsEnabled).toHaveBeenCalledWith(false)
      })
    })

    it('requests permission when enabling timer notifications', async () => {
      mockPrefsStorage.getTimerNotificationsEnabled.mockResolvedValue(false)

      const { getByTestId } = render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(getByTestId('timer-notifications-toggle')).toBeTruthy()
      })

      fireEvent(getByTestId('timer-notifications-toggle'), 'onValueChange', true)

      await waitFor(() => {
        expect(mockNotifService.requestPermission).toHaveBeenCalled()
      })
    })

    it('disables time-sensitive when timer notifications are turned off', async () => {
      mockPrefsStorage.getTimerNotificationsEnabled.mockResolvedValue(true)
      mockPrefsStorage.getCriticalNotificationsEnabled.mockResolvedValue(true)

      const { getByTestId } = render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(getByTestId('timer-notifications-toggle')).toBeTruthy()
      })

      fireEvent(getByTestId('timer-notifications-toggle'), 'onValueChange', false)

      await waitFor(() => {
        expect(mockPrefsStorage.setCriticalNotificationsEnabled).toHaveBeenCalledWith(false)
      })
    })

    it('saves preference when time-sensitive toggle is changed', async () => {
      mockPrefsStorage.getTimerNotificationsEnabled.mockResolvedValue(true)

      const { getByTestId } = render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(getByTestId('critical-notifications-toggle')).toBeTruthy()
      })

      fireEvent(getByTestId('critical-notifications-toggle'), 'onValueChange', true)

      await waitFor(() => {
        expect(mockPrefsStorage.setCriticalNotificationsEnabled).toHaveBeenCalledWith(true)
      })
    })

    it('disables timer notifications toggle during async save', async () => {
      mockPrefsStorage.setTimerNotificationsEnabled.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      )

      const { getByTestId } = render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(getByTestId('timer-notifications-toggle')).toBeTruthy()
      })

      fireEvent(getByTestId('timer-notifications-toggle'), 'onValueChange', false)

      expect(getByTestId('timer-notifications-toggle').props['disabled']).toBe(true)
    })

    it('disables critical notifications toggle during async save', async () => {
      mockPrefsStorage.setCriticalNotificationsEnabled.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      )

      const { getByTestId } = render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(getByTestId('critical-notifications-toggle')).toBeTruthy()
      })

      fireEvent(getByTestId('critical-notifications-toggle'), 'onValueChange', true)

      expect(getByTestId('critical-notifications-toggle').props['disabled']).toBe(true)
    })

    it('shows time-sensitive notification hint text', async () => {
      mockPrefsStorage.getTimerNotificationsEnabled.mockResolvedValue(true)

      const { getByText } = render(<SettingsScreen {...defaultProps} />)

      await waitFor(() => {
        expect(getByText('Break through Focus and Do Not Disturb modes')).toBeTruthy()
      })
    })
  })
})
