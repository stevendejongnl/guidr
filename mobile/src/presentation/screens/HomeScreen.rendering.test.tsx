import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockGuideService,
  createMockSessionService,
} from '../testUtils'

describe('HomeScreen - rendering', () => {
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

  it('should render title and description', () => {
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

    expect(getByText('Guidr')).toBeTruthy()
    expect(getByText('Discover')).toBeTruthy()
  })

  it('should render logout menu item', () => {
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
    expect(getByTestId('menu-item-logout')).toBeTruthy()
  })

  it('should render quick action buttons', () => {
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

    expect(getByText('Discover')).toBeTruthy()
  })

  it('should render My Guides button when not in admin mode', () => {
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

    expect(getByText('Discover')).toBeTruthy()
    expect(getByText('My Guides')).toBeTruthy()
  })

  it('should hide My Guides button when adminModeActive is true', () => {
    const { getByText, queryByText } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={true}
        adminModeActive={true}
        onToggleAdminMode={jest.fn()}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
      />
    )

    expect(getByText('Discover')).toBeTruthy()
    expect(queryByText('My Guides')).toBeNull()
  })

  it('should show My Guides button when adminModeActive is false', () => {
    const { getByText } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={true}
        adminModeActive={false}
        onToggleAdminMode={jest.fn()}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
      />
    )

    expect(getByText('Discover')).toBeTruthy()
    expect(getByText('My Guides')).toBeTruthy()
  })
})

describe('HomeScreen - menu', () => {
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

  it('should render menu button', () => {
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

    expect(getByTestId('home-menu')).toBeTruthy()
  })

  it('should call onOpenProfile when profile menu item is pressed', () => {
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
    fireEvent.press(getByTestId('menu-item-profile'))

    expect(mockOnOpenProfile).toHaveBeenCalledTimes(1)
  })

  it('should call onOpenSettings when settings menu item is pressed', () => {
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
    fireEvent.press(getByTestId('menu-item-settings'))

    expect(mockOnOpenSettings).toHaveBeenCalledTimes(1)
  })
})

describe('HomeScreen - quick action callbacks', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockGuideService: jest.Mocked<ReturnType<typeof createMockGuideService>>
  let mockSessionService: jest.Mocked<ReturnType<typeof createMockSessionService>>

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLogout = jest.fn()
    mockOnOpenSettings = jest.fn()
    mockOnOpenProfile = jest.fn()
    mockGuideService = createMockGuideService([])
    mockSessionService = createMockSessionService([])
  })

  it('should call onBrowseGuides when Discover button is pressed', () => {
    const mockOnBrowseGuides = jest.fn()
    const { getByText } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        onBrowseGuides={mockOnBrowseGuides}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
      />
    )

    fireEvent.press(getByText('Discover'))
    expect(mockOnBrowseGuides).toHaveBeenCalledTimes(1)
  })

  it('should call onManageGuides when My Guides button is pressed for non-admin user', () => {
    const mockOnManageGuides = jest.fn()
    const { getByText } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        onManageGuides={mockOnManageGuides}
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
      />
    )

    fireEvent.press(getByText('My Guides'))
    expect(mockOnManageGuides).toHaveBeenCalledTimes(1)
  })
})
