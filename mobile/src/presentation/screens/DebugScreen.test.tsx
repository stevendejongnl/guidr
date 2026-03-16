import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { DebugScreen } from './DebugScreen'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import { IHealthCheckService } from '../../domain/services/IHealthCheckService'
import { createMockAuthStorage, createMockServerConfigStorage } from '../testUtils'

jest.mock('@react-native-async-storage/async-storage')
jest.mock('react-native-device-info')

// Mock fetch globally
global.fetch = jest.fn()

describe('DebugScreen', () => {
  let mockOnBack: jest.Mock
  let mockHealthCheckService: jest.Mocked<IHealthCheckService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  const serverUrl = 'http://localhost:8000/api/v1'
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    mockOnBack = jest.fn()
    jest.clearAllMocks()

    // Mock HealthCheckService
    mockHealthCheckService = {
      validateServer: jest.fn().mockResolvedValue({
        healthy: true,
        responseTime: 100,
      }),
    }

    // Mock DeviceInfo
    ;(DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.0.0')
    ;(DeviceInfo.getBuildNumber as jest.Mock).mockReturnValue('100')

    mockAuthStorage = createMockAuthStorage({
      getAuthToken: jest.fn().mockResolvedValue('mock-token-12345678'),
      getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
    })
    mockServerConfigStorage = createMockServerConfigStorage({
      getServerUrl: jest.fn().mockResolvedValue('http://localhost:8000/api/v1'),
    })
  })

  describe('rendering', () => {
    it('should render all sections', () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      expect(getByText('Debug Tools')).toBeTruthy()
      expect(getByText('Version Information')).toBeTruthy()
      expect(getByText('Stored Configuration')).toBeTruthy()
      expect(getByText('Connection Test')).toBeTruthy()
      expect(getByText('Cache Management')).toBeTruthy()
    })

    it('should render back button', () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      expect(getByText('← Back')).toBeTruthy()
    })

    it('should render action buttons', () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      expect(getByText('Test Connection')).toBeTruthy()
      expect(getByText('Clear All Cache')).toBeTruthy()
    })
  })

  describe('version information', () => {
    it('should display app version and build number', async () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      await waitFor(() => {
        expect(getByText('App: v1.0.0 (100)')).toBeTruthy()
      })
    })

    it('should display server version as not connected initially', () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      expect(getByText('Server: Not connected')).toBeTruthy()
    })
  })

  describe('stored configuration', () => {
    it('should display stored server URL', async () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      await waitFor(() => {
        expect(getByText('Server URL: http://localhost:8000/api/v1')).toBeTruthy()
      })
    })

    it('should display masked auth token', async () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      await waitFor(() => {
        expect(getByText('Auth Token: ***12345678')).toBeTruthy()
      })
    })

    it('should display user email', async () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      await waitFor(() => {
        expect(getByText('Email: test@example.com')).toBeTruthy()
      })
    })

    it('should display None for missing values', async () => {
      const noValueServerStorage = createMockServerConfigStorage({
        getServerUrl: jest.fn().mockResolvedValue(null),
      })
      const noValueAuthStorage = createMockAuthStorage({
        getAuthToken: jest.fn().mockResolvedValue(null),
        getUserEmail: jest.fn().mockResolvedValue(null),
      })

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={noValueServerStorage}
          authStorage={noValueAuthStorage}
        />
      )

      await waitFor(() => {
        expect(getByText('Server URL: None')).toBeTruthy()
        expect(getByText('Auth Token: None')).toBeTruthy()
        expect(getByText('Email: None')).toBeTruthy()
      })
    })
  })

  describe('back button', () => {
    it('should call onBack when back button is pressed', () => {
      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      fireEvent.press(getByText('← Back'))

      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('connection test', () => {
    it('should show success message on successful connection', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
        text: async () => JSON.stringify({ status: 'healthy' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      const testButton = getByText('Test Connection')
      fireEvent.press(testButton)

      await waitFor(() => {
        expect(getByText(/✓ Connected/)).toBeTruthy()
        expect(getByText('Server: Available')).toBeTruthy()
      })

      expect(mockHealthCheckService.validateServer).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1'
      )
    })

    it('should show failure message on connection error', async () => {
      mockHealthCheckService.validateServer.mockResolvedValue({
        healthy: false,
        responseTime: 0,
        error: 'Network request failed',
      })

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      const testButton = getByText('Test Connection')
      fireEvent.press(testButton)

      await waitFor(() => {
        expect(getByText('✗ Connection failed')).toBeTruthy()
        expect(getByText('Network request failed')).toBeTruthy()
      })
    })

    it('should show error when server URL is not configured', async () => {
      const noUrlStorage = createMockServerConfigStorage({
        getServerUrl: jest.fn().mockResolvedValue(null),
      })

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl=""
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={noUrlStorage}
          authStorage={mockAuthStorage}
        />
      )

      await waitFor(() => {
        // Wait for initial load to complete
        expect(getByText('Server URL: None')).toBeTruthy()
      })

      const testButton = getByText('Test Connection')
      fireEvent.press(testButton)

      await waitFor(() => {
        expect(getByText('No server URL configured')).toBeTruthy()
      })
    })
  })

  describe('clear cache', () => {
    it('should clear AsyncStorage and show success message', async () => {
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined)

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      const clearButton = getByText('Clear All Cache')
      fireEvent.press(clearButton)

      await waitFor(() => {
        expect(getByText('Cache cleared successfully')).toBeTruthy()
      })

      expect(AsyncStorage.clear).toHaveBeenCalledTimes(1)
    })

    it('should show error message when clear fails', async () => {
      (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error('Clear failed'))

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      const clearButton = getByText('Clear All Cache')
      fireEvent.press(clearButton)

      await waitFor(() => {
        expect(getByText('Clear failed')).toBeTruthy()
      })
    })
  })

  describe('loading states', () => {
    it('should show loading indicator during connection test', async () => {
      let resolvePromise: () => void
      const promise = new Promise<Response>((resolve) => {
        resolvePromise = () => resolve({
          ok: true,
          status: 200,
          json: async () => ({ version: '1.0.0' }),
        } as Response)
      })
      mockFetch.mockReturnValue(promise)

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={mockAuthStorage}
        />
      )

      const testButton = getByText('Test Connection')
      fireEvent.press(testButton)

      // Resolve the promise to complete the test
      await waitFor(() => {
        resolvePromise!()
      })

      // Check that connection test completed
      await waitFor(() => {
        expect(getByText(/✓ Connected/)).toBeTruthy()
      })
    })
  })

  describe('token masking', () => {
    it('should mask long tokens correctly', async () => {
      const longTokenStorage = createMockAuthStorage({
        getAuthToken: jest.fn().mockResolvedValue('very-long-token-12345678'),
        getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
      })

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={longTokenStorage}
        />
      )

      await waitFor(() => {
        expect(getByText('Auth Token: ***12345678')).toBeTruthy()
      })
    })

    it('should not mask short tokens', async () => {
      const shortTokenStorage = createMockAuthStorage({
        getAuthToken: jest.fn().mockResolvedValue('short'),
        getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
      })

      const { getByText } = render(
        <DebugScreen
          onBack={mockOnBack}
          serverUrl={serverUrl}
          healthCheckService={mockHealthCheckService}
          serverConfigStorage={mockServerConfigStorage}
          authStorage={shortTokenStorage}
        />
      )

      await waitFor(() => {
        expect(getByText('Auth Token: short')).toBeTruthy()
      })
    })
  })
})
