import React from 'react'
import { render, waitFor, fireEvent, act } from '@testing-library/react-native'
import { Platform, Alert } from 'react-native'
import AsyncStorageMock from '@react-native-async-storage/async-storage/jest/async-storage-mock'
import { AppNavigator } from './AppNavigator'
import { ServerConfigCache } from '../../infrastructure/storage/ServerConfigCache'
import { UpdateCheckCache } from '../../infrastructure/storage/UpdateCheckCache'
import { MaintenanceEventEmitter } from '../../common/MaintenanceEventEmitter'
import { GitHubRelease } from '../../infrastructure/api/GitHubReleaseClient'
import { ServerConfigResponse } from '../../infrastructure/api/ServerConfigClient'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockHealthCheckService,
  createMockNotificationService,
  createMockNotificationPreferencesStorage,
  createGitHubRelease,
  createMockGitHubReleaseClient,
  createMockUpdateCheckStorage,
  createMockServerConfigClient,
  createMockTokenRefreshService,
  createMockServicesBundle,
} from '../testUtils'

// ErrorReporter is a thin static wrapper around Sentry; not worth faking through props.
jest.mock('../../infrastructure/monitoring/ErrorReporter')
// AsyncStorage is a native module leaf dependency (used inline for the debug-mode
// flag, not wrapped in an injectable storage class) — automocked the same way every
// other test file in this codebase that touches it does.
jest.mock('@react-native-async-storage/async-storage', () => AsyncStorageMock)

interface RenderOptions {
  hasAuthToken?: boolean
  timerNotificationsEnabled?: boolean
  serverConfig?: ServerConfigResponse
  release?: GitHubRelease
  platform?: 'android' | 'ios' | 'web'
}

const renderAppNavigator = (options: RenderOptions = {}) => {
  const {
    hasAuthToken = false,
    timerNotificationsEnabled = true,
    serverConfig = { minAppVersion: null, maxAppVersion: null },
    release = createGitHubRelease({ version: '1.0.0' }),
    platform = 'android',
  } = options

  Platform.OS = platform

  const mocks = {
    authStorage: createMockAuthStorage({
      hasAuthToken: jest.fn().mockResolvedValue(hasAuthToken),
    }),
    serverConfigStorage: createMockServerConfigStorage(),
    healthCheckService: createMockHealthCheckService(),
    notificationPreferencesStorage: createMockNotificationPreferencesStorage({
      getTimerNotificationsEnabled: jest.fn().mockResolvedValue(timerNotificationsEnabled),
    }),
    notificationService: createMockNotificationService(),
    githubReleaseClient: createMockGitHubReleaseClient(release),
    updateCheckStorage: createMockUpdateCheckStorage(),
    createAuthClient: jest.fn(() => createMockAuthClient()),
    createServerConfigClient: jest.fn(() => createMockServerConfigClient(serverConfig)),
    createServices: jest.fn(() => createMockServicesBundle()),
    createTokenRefreshService: jest.fn(() => createMockTokenRefreshService()),
  }

  const view = render(
    <AppNavigator
      serverConfigStorage={mocks.serverConfigStorage}
      authStorage={mocks.authStorage}
      healthCheckService={mocks.healthCheckService}
      notificationPreferencesStorage={mocks.notificationPreferencesStorage}
      notificationService={mocks.notificationService}
      githubReleaseClient={mocks.githubReleaseClient}
      updateCheckStorage={mocks.updateCheckStorage}
      createAuthClient={mocks.createAuthClient}
      createServerConfigClient={mocks.createServerConfigClient}
      createServices={mocks.createServices}
      createTokenRefreshService={mocks.createTokenRefreshService}
    />
  )

  return { ...view, mocks }
}

const REGISTER_LINK_TEXT = 'Don\'t have an account? Register'
const SIGN_IN_LINK_TEXT = 'Already have an account? Sign in'

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ServerConfigCache.clearConfig()
    UpdateCheckCache.clearCache()
    MaintenanceEventEmitter.setListener(null)
    Platform.OS = 'android'
  })

  it('shows a loading spinner before configuration finishes loading', () => {
    const { queryByText } = renderAppNavigator()
    // Login screen text should not be present on the very first synchronous render
    expect(queryByText('Welcome to Guidr')).toBeNull()
  })

  it('shows the login screen once loaded and not authenticated', async () => {
    const { getByText } = renderAppNavigator({ hasAuthToken: false })

    await waitFor(() => {
      expect(getByText('Welcome to Guidr')).toBeTruthy()
    })
  })

  it('shows the home screen once loaded and authenticated', async () => {
    const { getByTestId } = renderAppNavigator({ hasAuthToken: true })

    await waitFor(() => {
      expect(getByTestId('home-menu')).toBeTruthy()
    })
  })

  describe('notification permission on login', () => {
    it('requests permission on cold start when already authenticated and timer notifications are enabled', async () => {
      const { getByTestId, mocks } = renderAppNavigator({
        hasAuthToken: true,
        timerNotificationsEnabled: true,
      })

      await waitFor(() => {
        expect(getByTestId('home-menu')).toBeTruthy()
      })

      expect(mocks.notificationService.requestPermission).toHaveBeenCalledTimes(1)
    })

    it('does not request permission on cold start when timer notifications are disabled', async () => {
      const { getByTestId, mocks } = renderAppNavigator({
        hasAuthToken: true,
        timerNotificationsEnabled: false,
      })

      await waitFor(() => {
        expect(getByTestId('home-menu')).toBeTruthy()
      })

      expect(mocks.notificationService.requestPermission).not.toHaveBeenCalled()
    })

    it('does not request permission on non-Android platforms', async () => {
      const { getByTestId, mocks } = renderAppNavigator({
        hasAuthToken: true,
        platform: 'ios',
      })

      await waitFor(() => {
        expect(getByTestId('home-menu')).toBeTruthy()
      })

      expect(mocks.notificationService.requestPermission).not.toHaveBeenCalled()
    })

    it('requests permission after completing a fresh login, not just on cold start', async () => {
      const { getByPlaceholderText, getByText, getByTestId, mocks } = renderAppNavigator({
        hasAuthToken: false,
      })

      await waitFor(() => {
        expect(getByText('Welcome to Guidr')).toBeTruthy()
      })

      expect(mocks.notificationService.requestPermission).not.toHaveBeenCalled()

      fireEvent.changeText(getByPlaceholderText('email@example.com'), 'test@example.com')
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123')
      fireEvent.press(getByText('Login'))

      await waitFor(() => {
        expect(getByTestId('home-menu')).toBeTruthy()
      })

      expect(mocks.notificationService.requestPermission).toHaveBeenCalledTimes(1)
    })

    it('requests permission after completing registration', async () => {
      const { getByText, getAllByText, getByPlaceholderText, getByTestId, mocks } = renderAppNavigator({
        hasAuthToken: false,
      })

      await waitFor(() => {
        expect(getByText('Welcome to Guidr')).toBeTruthy()
      })

      fireEvent.press(getByText(REGISTER_LINK_TEXT))

      await waitFor(() => {
        expect(getByText('Sign up to get started')).toBeTruthy()
      })

      fireEvent.changeText(getByPlaceholderText('email@example.com'), 'new@example.com')
      fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123')
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123')
      // "Create Account" appears both as the screen title and the submit button
      fireEvent.press(getAllByText('Create Account')[1]!)

      await waitFor(() => {
        expect(getByTestId('home-menu')).toBeTruthy()
      })

      expect(mocks.notificationService.requestPermission).toHaveBeenCalledTimes(1)
    })
  })

  it('goes back to the login screen from registration', async () => {
    const { getByText } = renderAppNavigator({ hasAuthToken: false })

    await waitFor(() => {
      expect(getByText('Welcome to Guidr')).toBeTruthy()
    })

    fireEvent.press(getByText(REGISTER_LINK_TEXT))

    await waitFor(() => {
      expect(getByText('Sign up to get started')).toBeTruthy()
    })

    fireEvent.press(getByText(SIGN_IN_LINK_TEXT))

    await waitFor(() => {
      expect(getByText('Welcome to Guidr')).toBeTruthy()
    })
  })

  it('shows the server maintenance screen when the maintenance event fires, and retry clears it', async () => {
    const { getByTestId, getByText, queryByText } = renderAppNavigator({ hasAuthToken: true })

    await waitFor(() => {
      expect(getByTestId('home-menu')).toBeTruthy()
    })

    MaintenanceEventEmitter.emit()

    await waitFor(() => {
      expect(getByText('Server Maintenance')).toBeTruthy()
    })

    fireEvent.press(getByText('Try Again Now'))

    await waitFor(() => {
      expect(queryByText('Server Maintenance')).toBeNull()
    })
  })

  it('shows the app outdated screen when the current version is below the server minimum', async () => {
    const { getByText } = renderAppNavigator({
      hasAuthToken: false,
      serverConfig: { minAppVersion: '2.0.0', maxAppVersion: null },
    })

    await waitFor(() => {
      expect(getByText('Update Required')).toBeTruthy()
    })

    fireEvent.press(getByText('Change Server'))

    await waitFor(() => {
      expect(getByText('Server Configuration')).toBeTruthy()
    })
  })

  it('completing server setup clears auth and returns to login', async () => {
    const { getByText, getByPlaceholderText, mocks } = renderAppNavigator({
      hasAuthToken: false,
      serverConfig: { minAppVersion: '2.0.0', maxAppVersion: null },
    })

    await waitFor(() => {
      expect(getByText('Update Required')).toBeTruthy()
    })

    fireEvent.press(getByText('Change Server'))

    await waitFor(() => {
      expect(getByText('Server Configuration')).toBeTruthy()
    })

    // The new server's config no longer excludes the current app version
    mocks.createServerConfigClient.mockReturnValue(
      createMockServerConfigClient({ minAppVersion: null, maxAppVersion: null })
    )

    fireEvent.changeText(getByPlaceholderText('https://api.example.com'), 'https://new-server.example.com')
    fireEvent.press(getByText('Save Server URL'))

    await waitFor(() => {
      expect(getByText('Welcome to Guidr')).toBeTruthy()
    })

    expect(mocks.authStorage.clearAll).toHaveBeenCalled()
  })

  describe('Android update flow', () => {
    it('shows an optional update screen that can be dismissed', async () => {
      const { getByText, queryByText } = renderAppNavigator({
        hasAuthToken: true,
        release: createGitHubRelease({ version: '9.9.9' }),
      })

      await waitFor(() => {
        expect(getByText('Update Available')).toBeTruthy()
      })

      fireEvent.press(getByText('Later'))

      await waitFor(() => {
        expect(queryByText('Update Available')).toBeNull()
      })
    })

    it('starting an update shows the download screen', async () => {
      const { getByText } = renderAppNavigator({
        hasAuthToken: true,
        release: createGitHubRelease({ version: '9.9.9', apkUrl: 'https://example.com/guidr.apk' }),
      })

      await waitFor(() => {
        expect(getByText('Update Available')).toBeTruthy()
      })

      fireEvent.press(getByText('Update'))

      await waitFor(() => {
        expect(getByText('Downloading Update...')).toBeTruthy()
      })
    })
  })

  describe('home screen navigation', () => {
    it('opens and returns from the settings screen', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator({ hasAuthToken: true })

      await waitFor(() => {
        expect(getByTestId('home-menu')).toBeTruthy()
      })

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-settings'))

      await waitFor(() => {
        expect(getByTestId('change-server-button')).toBeTruthy()
      })

      expect(queryByTestId('home-menu')).toBeNull()
    })

    it('opens the profile screen', async () => {
      const { getByTestId } = renderAppNavigator({ hasAuthToken: true })

      await waitFor(() => {
        expect(getByTestId('home-menu')).toBeTruthy()
      })

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-profile'))

      await waitFor(() => {
        expect(getByTestId('name-input')).toBeTruthy()
      })
    })

    it('logs out and returns to the login screen', async () => {
      const { getByTestId, getByText, mocks } = renderAppNavigator({ hasAuthToken: true })

      await waitFor(() => {
        expect(getByTestId('home-menu')).toBeTruthy()
      })

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-logout'))

      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2]
      await act(async () => {
        await buttons[1].onPress()
      })

      await waitFor(() => {
        expect(getByText('Welcome to Guidr')).toBeTruthy()
      })

      expect(mocks.authStorage.clearAll).toHaveBeenCalled()
    })
  })
})
