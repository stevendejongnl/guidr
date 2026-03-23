import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockGuideService,
  createMockSessionService,
} from '../testUtils'

describe('HomeScreen - logout menu item', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockGuideService: jest.Mocked<ReturnType<typeof createMockGuideService>>
  let mockSessionService: jest.Mocked<ReturnType<typeof createMockSessionService>>
  let mockAuthStorage: jest.Mocked<ReturnType<typeof createMockAuthStorage>>
  let mockServerConfigStorage: jest.Mocked<ReturnType<typeof createMockServerConfigStorage>>
  let mockAuthClient: jest.Mocked<ReturnType<typeof createMockAuthClient>>

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
  })

  it('should show a confirmation alert when logout menu item is pressed', async () => {
    const { getByTestId } = render(
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

    fireEvent.press(getByTestId('home-menu'))
    fireEvent.press(getByTestId('menu-item-logout'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Out',
      'Are you sure you want to sign out?',
      expect.any(Array),
    )

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2]
    await act(async () => {
      await buttons[1].onPress()
    })

    expect(mockOnLogout).toHaveBeenCalledTimes(1)
  })

  it('should NOT call onLogout when sign out alert is cancelled', () => {
    const { getByTestId } = render(
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

    fireEvent.press(getByTestId('home-menu'))
    fireEvent.press(getByTestId('menu-item-logout'))

    expect(Alert.alert).toHaveBeenCalled()
    expect(mockOnLogout).not.toHaveBeenCalled()
  })

  it('should handle async logout errors', async () => {
    mockOnLogout.mockRejectedValue(new Error('Logout failed'))

    const { getByTestId } = render(
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

    fireEvent.press(getByTestId('home-menu'))
    fireEvent.press(getByTestId('menu-item-logout'))

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2]
    await act(async () => {
      await buttons[1].onPress()
    })

    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalledTimes(1)
    })
  })
})

describe('HomeScreen - error handling', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockGuideService: jest.Mocked<ReturnType<typeof createMockGuideService>>
  let mockSessionService: jest.Mocked<ReturnType<typeof createMockSessionService>>
  let mockAuthStorage: jest.Mocked<ReturnType<typeof createMockAuthStorage>>
  let mockServerConfigStorage: jest.Mocked<ReturnType<typeof createMockServerConfigStorage>>
  let mockAuthClient: jest.Mocked<ReturnType<typeof createMockAuthClient>>

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
  })

  it('should display error message when service fails to load data', async () => {
    mockGuideService.getAllGuides.mockRejectedValue(new Error('Failed to load guides'))

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
      />
    )

    await waitFor(() => {
      expect(getByText('Failed to load guides')).toBeTruthy()
    })
  })
})
