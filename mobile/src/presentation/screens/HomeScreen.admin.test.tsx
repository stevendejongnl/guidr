import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { Guide } from '../../domain/entities/Guide'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockGuideService,
  createMockSessionService,
} from '../testUtils'

describe('HomeScreen - admin mode toggle', () => {
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

  it('should show admin toggle in menu when isAdmin is true', () => {
    const mockOnToggle = jest.fn()
    const { getByTestId, getByText } = render(
      <HomeScreen
        onLogout={mockOnLogout}
        onOpenSettings={mockOnOpenSettings}
        onOpenProfile={mockOnOpenProfile}
        isAdmin={true}
        adminModeActive={false}
        onToggleAdminMode={mockOnToggle}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
      />
    )

    fireEvent.press(getByTestId('home-menu'))
    expect(getByText('Admin Mode')).toBeTruthy()
  })

  it('should not show admin toggle in menu when isAdmin is false', () => {
    const { getByTestId, queryByText } = render(
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
    expect(queryByText('Admin Mode')).toBeNull()
  })

  it('should hide Featured Guides when adminModeActive is true', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Featured Guide',
        description: 'A featured guide',
        guideType: 'cooking',
        stepCount: 3,
        duration: 60,
        isPublic: true,
        isHighlighted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(mockGuides)

    const { queryByText } = render(
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

    await waitFor(() => {
      expect(queryByText('✨ Featured Guides')).toBeNull()
    })
  })

  it('should hide Recommended for You when adminModeActive is true', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Test Guide',
        description: 'A test guide',
        guideType: 'general',
        stepCount: 3,
        duration: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(mockGuides)

    const { queryByText } = render(
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

    await waitFor(() => {
      expect(queryByText('Recommended for You')).toBeNull()
    })
  })

  it('should show Featured and Recommended when adminModeActive is false', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Featured Guide',
        description: 'A featured guide',
        guideType: 'cooking',
        stepCount: 3,
        duration: 60,
        isPublic: true,
        isHighlighted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(mockGuides)

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

    await waitFor(() => {
      expect(getByText('Recommended for You')).toBeTruthy()
    })
  })
})
