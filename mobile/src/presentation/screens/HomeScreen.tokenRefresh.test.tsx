import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { AuthenticationError } from '../../common/ApiErrorUtils'
import { TokenRefreshService } from '../../infrastructure/api/TokenRefreshService'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockGuideService,
  createMockSessionService,
} from '../testUtils'

describe('HomeScreen - token refresh on AuthenticationError', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockGuideService: jest.Mocked<ReturnType<typeof createMockGuideService>>
  let mockSessionService: jest.Mocked<ReturnType<typeof createMockSessionService>>
  let mockAuthStorage: jest.Mocked<ReturnType<typeof createMockAuthStorage>>
  let mockServerConfigStorage: jest.Mocked<ReturnType<typeof createMockServerConfigStorage>>
  let mockAuthClient: jest.Mocked<ReturnType<typeof createMockAuthClient>>
  let mockTokenRefreshService: jest.Mocked<Pick<TokenRefreshService, 'refreshAndRetry'>>

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLogout = jest.fn()
    mockOnOpenSettings = jest.fn()
    mockOnOpenProfile = jest.fn()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockAuthClient = createMockAuthClient()
    mockGuideService = createMockGuideService([])
    mockSessionService = createMockSessionService([])
    mockTokenRefreshService = {
      refreshAndRetry: jest.fn().mockResolvedValue('new-access-token'),
    }
  })

  it('should call tokenRefreshService.refreshAndRetry and retry loadData when AuthenticationError occurs', async () => {
    let callCount = 0
    mockAuthClient.getProfile.mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        throw new AuthenticationError('Invalid or expired token')
      }
      return {
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: 'Test User',
        interests: [],
        isAdmin: false,
      }
    })

    const { getByText } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
        tokenRefreshService={mockTokenRefreshService as unknown as TokenRefreshService}
      />
    )

    await waitFor(() => {
      expect(mockTokenRefreshService.refreshAndRetry).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(getByText('Guidr')).toBeTruthy()
    })
  })

  it('should not call onLogout when tokenRefreshService succeeds', async () => {
    mockAuthClient.getProfile.mockRejectedValue(
      new AuthenticationError('Invalid or expired token')
    )

    render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
        tokenRefreshService={mockTokenRefreshService as unknown as TokenRefreshService}
      />
    )

    await waitFor(() => {
      expect(mockTokenRefreshService.refreshAndRetry).toHaveBeenCalledTimes(1)
    })

    expect(mockOnLogout).not.toHaveBeenCalled()
  })

  it('should not call onLogout from HomeScreen when tokenRefreshService.refreshAndRetry throws (service handles logout)', async () => {
    mockAuthClient.getProfile.mockRejectedValue(
      new AuthenticationError('Invalid or expired token')
    )
    mockTokenRefreshService.refreshAndRetry.mockRejectedValue(new Error('Refresh failed'))

    render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
        tokenRefreshService={mockTokenRefreshService as unknown as TokenRefreshService}
      />
    )

    await waitFor(() => {
      expect(mockTokenRefreshService.refreshAndRetry).toHaveBeenCalledTimes(1)
    })

    expect(mockOnLogout).not.toHaveBeenCalled()
  })

  it('should call onLogout directly when no tokenRefreshService is provided', async () => {
    mockAuthClient.getProfile.mockRejectedValue(
      new AuthenticationError('Invalid or expired token')
    )

    render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
      />
    )

    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalledTimes(1)
    })
  })
})
