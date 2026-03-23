import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { Guide } from '../../domain/entities/Guide'
import { Session, SessionStatus } from '../../domain/entities/Session'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockGuideService,
  createMockSessionService,
} from '../testUtils'

describe('HomeScreen - dashboard sections', () => {
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

  it('should display quick actions section', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Perfect Sourdough Bread',
        description: 'Master the art of sourdough',
        guideType: 'cooking',
        stepCount: 8,
        duration: 180,
        thumbnail: '🍞',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(mockGuides)
    mockSessionService = createMockSessionService([])

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
      expect(getByText('Discover')).toBeTruthy()
      expect(getByText('My Guides')).toBeTruthy()
    })
  })

  it('should display recent activity section when sessions exist', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Guide Title',
        description: 'Master the art of something',
        guideType: 'general',
        stepCount: 8,
        duration: 180,
        thumbnail: '🎯',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    const mockSessions: Session[] = [
      {
        id: 's1',
        guideId: 'g1',
        status: SessionStatus.InProgress,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Session,
    ]

    mockGuideService = createMockGuideService(mockGuides)
    mockSessionService = createMockSessionService(mockSessions)

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
      expect(getByText('Recent Activity')).toBeTruthy()
    })
  })

  it('should display recommendations section when guides exist', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Perfect Sourdough Bread',
        description: 'Master the art of sourdough',
        guideType: 'cooking',
        stepCount: 8,
        duration: 180,
        thumbnail: '🍞',
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
        isAdmin={false}
        guideService={mockGuideService}
        sessionService={mockSessionService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        authClient={mockAuthClient}
      />
    )

    await waitFor(() => {
      expect(getByText('Recommended for You')).toBeTruthy()
      expect(getByText('Perfect Sourdough Bread')).toBeTruthy()
    })
  })
})

describe('HomeScreen - featured guides via getHighlightedGuides', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
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
    mockSessionService = createMockSessionService([])
  })

  it('should call getHighlightedGuides to populate Featured Guides section', async () => {
    const highlightedGuide = {
      id: 'h1',
      title: 'Highlighted Guide',
      guideType: 'cooking',
      isPublic: true,
      isHighlighted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Guide

    const mockGuideService = createMockGuideService([], {
      getHighlightedGuides: jest.fn().mockResolvedValue([highlightedGuide]),
    })

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
      expect(mockGuideService.getHighlightedGuides).toHaveBeenCalled()
    })
  })
})
