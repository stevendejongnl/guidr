import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { Guide } from '../../domain/entities/Guide'
import { Session, SessionStatus } from '../../domain/entities/Session'
import { AuthenticationError } from '../../common/ApiErrorUtils'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockGuideService,
  createMockSessionService,
  createMockStepTimerClient,
} from '../testUtils'

describe('HomeScreen', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockGuideService: jest.Mocked<ReturnType<typeof createMockGuideService>>
  let mockSessionService: jest.Mocked<ReturnType<typeof createMockSessionService>>
  let mockAuthStorage: jest.Mocked<ReturnType<typeof createMockAuthStorage>>
  let mockServerConfigStorage: jest.Mocked<ReturnType<typeof createMockServerConfigStorage>>
  let mockAuthClient: jest.Mocked<ReturnType<typeof createMockAuthClient>>
  let mockStepTimerClient: jest.Mocked<ReturnType<typeof createMockStepTimerClient>>

  beforeEach(() => {
    mockOnLogout = jest.fn()
    mockOnOpenSettings = jest.fn()
    mockOnOpenProfile = jest.fn()

    // Create mock infrastructure
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockAuthClient = createMockAuthClient()

    // Create mock services
    mockGuideService = createMockGuideService([])
    mockSessionService = createMockSessionService([])
    mockStepTimerClient = createMockStepTimerClient()
  })

  describe('rendering', () => {
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

      // Should render app title
      expect(getByText('Guidr')).toBeTruthy()
      // Should render quick actions section
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

  describe('logout menu item', () => {
    it('should call onLogout when logout menu item is pressed', () => {
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

      expect(mockOnLogout).toHaveBeenCalledTimes(1)
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

      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('error handling', () => {
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

  describe('menu', () => {
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

  describe('dashboard sections', () => {
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

      const mockSessions: Session[] = []

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

  describe('quick action callbacks', () => {
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

  describe('admin mode toggle', () => {
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

  describe('featured guides via getHighlightedGuides', () => {
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

      mockGuideService = createMockGuideService([], {
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

  describe('token refresh on AuthenticationError', () => {
    it('should refresh token and retry loadData when AuthenticationError occurs', async () => {
      // First call throws AuthenticationError, second call succeeds
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

      mockAuthStorage.getRefreshToken.mockResolvedValue('test-refresh-token')
      mockAuthClient.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isAdmin: false,
        },
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
        />
      )

      await waitFor(() => {
        expect(mockAuthClient.refreshToken).toHaveBeenCalledWith('test-refresh-token')
        expect(mockAuthStorage.setAuthToken).toHaveBeenCalledWith('new-access-token')
        expect(mockAuthStorage.setRefreshToken).toHaveBeenCalledWith('new-refresh-token')
      })

      // loadData should have been retried — verify by checking the welcome text rendered
      await waitFor(() => {
        expect(getByText('Guidr')).toBeTruthy()
      })
    })

    it('should call onLogout when refresh token fails', async () => {
      mockAuthClient.getProfile.mockRejectedValue(
        new AuthenticationError('Invalid or expired token')
      )
      mockAuthStorage.getRefreshToken.mockResolvedValue('expired-refresh-token')
      mockAuthClient.refreshToken.mockRejectedValue(new Error('Refresh token expired'))

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

    it('should call onLogout when no refresh token is available', async () => {
      mockAuthClient.getProfile.mockRejectedValue(
        new AuthenticationError('Invalid or expired token')
      )
      mockAuthStorage.getRefreshToken.mockResolvedValue(null)

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

  describe('active timers section', () => {
    it('should show Active Timers section when active timers exist', async () => {
      mockStepTimerClient.getActiveTimers.mockResolvedValue([
        {
          id: 'timer-1',
          stepId: 'step-1',
          guideId: 'guide-1',
          userId: 'user-1',
          status: 'running',
          startedAt: new Date().toISOString(),
          accumulatedSeconds: 10,
          durationSeconds: 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          guideTitle: 'Sourdough Bread',
          stepTitle: 'Preheat Oven',
        },
      ])

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
          stepTimerClient={mockStepTimerClient}
        />,
      )

      await waitFor(() => {
        expect(getByText('Active Timers')).toBeTruthy()
        expect(getByText('Sourdough Bread')).toBeTruthy()
        expect(getByText('Preheat Oven')).toBeTruthy()
      })
    })

    it('should not show Active Timers section when no active timers', async () => {
      mockStepTimerClient.getActiveTimers.mockResolvedValue([])

      const { queryByText } = render(
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
          stepTimerClient={mockStepTimerClient}
        />,
      )

      await waitFor(() => {
        expect(queryByText('Active Timers')).toBeNull()
      })
    })

    it('should call onViewGuideDetail when active timer is tapped', async () => {
      const mockOnViewGuideDetail = jest.fn()
      mockStepTimerClient.getActiveTimers.mockResolvedValue([
        {
          id: 'timer-1',
          stepId: 'step-1',
          guideId: 'guide-1',
          userId: 'user-1',
          status: 'paused',
          startedAt: null,
          accumulatedSeconds: 30,
          durationSeconds: 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          guideTitle: 'Sourdough Bread',
          stepTitle: 'Preheat Oven',
        },
      ])

      const { getByTestId } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          onViewGuideDetail={mockOnViewGuideDetail}
          isAdmin={false}
          guideService={mockGuideService}
          sessionService={mockSessionService}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
          authClient={mockAuthClient}
          stepTimerClient={mockStepTimerClient}
        />,
      )

      await waitFor(() => {
        expect(getByTestId('active-timer-timer-1')).toBeTruthy()
      })

      fireEvent.press(getByTestId('active-timer-timer-1'))
      expect(mockOnViewGuideDetail).toHaveBeenCalledWith('guide-1')
    })
  })
})
