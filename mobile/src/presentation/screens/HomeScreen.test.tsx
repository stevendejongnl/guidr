import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { Guide } from '../../domain/entities/Guide'
import { Session, SessionStatus } from '../../domain/entities/Session'
import { Category } from '../../domain/entities/Category'
import { AuthenticationError } from '../../common/ApiErrorUtils'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockAuthClient,
  createMockGuideService,
  createMockSessionService,
  createMockCategoryService,
} from '../testUtils'

describe('HomeScreen', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockGuideService: jest.Mocked<ReturnType<typeof createMockGuideService>>
  let mockSessionService: jest.Mocked<ReturnType<typeof createMockSessionService>>
  let mockCategoryService: jest.Mocked<ReturnType<typeof createMockCategoryService>>
  let mockAuthStorage: jest.Mocked<ReturnType<typeof createMockAuthStorage>>
  let mockServerConfigStorage: jest.Mocked<ReturnType<typeof createMockServerConfigStorage>>
  let mockAuthClient: jest.Mocked<ReturnType<typeof createMockAuthClient>>

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
    mockCategoryService = createMockCategoryService([])
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
          categoryService={mockCategoryService}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
          authClient={mockAuthClient}
        />
      )

      // Should render app title
      expect(getByText('Guidr')).toBeTruthy()
      // Should render quick actions section
      expect(getByText('Browse Guides')).toBeTruthy()
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
          categoryService={mockCategoryService}
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
          categoryService={mockCategoryService}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
          authClient={mockAuthClient}
        />
      )

      expect(getByText('Browse Guides')).toBeTruthy()
    })

    it('should render My Guides button for all users', () => {
      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          isAdmin={false}
          guideService={mockGuideService}
          sessionService={mockSessionService}
          categoryService={mockCategoryService}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
          authClient={mockAuthClient}
        />
      )

      expect(getByText('Browse Guides')).toBeTruthy()
      expect(getByText('My Guides')).toBeTruthy()
    })

    it('should render Browse Categories button only for admins', () => {
      const { queryByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          isAdmin={false}
          guideService={mockGuideService}
          sessionService={mockSessionService}
          categoryService={mockCategoryService}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
          authClient={mockAuthClient}
        />
      )

      expect(queryByText('Browse Categories')).toBeFalsy()
    })

    it('should render all buttons for admin users', () => {
      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          isAdmin={true}
          guideService={mockGuideService}
          sessionService={mockSessionService}
          categoryService={mockCategoryService}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
          authClient={mockAuthClient}
        />
      )

      expect(getByText('Browse Guides')).toBeTruthy()
      expect(getByText('Browse Categories')).toBeTruthy()
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
          categoryService={mockCategoryService}
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
          categoryService={mockCategoryService}
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
          categoryService={mockCategoryService}
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
          categoryService={mockCategoryService}
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
          categoryService={mockCategoryService}
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
          categoryService={mockCategoryService}
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
    it('should display quick stats section with data from services', async () => {
      const mockGuides: Guide[] = [
        {
          id: 'g1',
          title: 'Perfect Sourdough Bread',
          description: 'Master the art of sourdough',
          categoryId: 'baking',
          stepCount: 8,
          duration: 180,
          thumbnail: '🍞',
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
        {
          id: 's2',
          guideId: 'g1',
          status: SessionStatus.Completed,
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
          categoryService={mockCategoryService}
          authStorage={mockAuthStorage}
          serverConfigStorage={mockServerConfigStorage}
          authClient={mockAuthClient}
        />
      )

      await waitFor(() => {
        expect(getByText('Active')).toBeTruthy()
        expect(getByText('Done')).toBeTruthy()
        expect(getByText('Guides')).toBeTruthy()
      })
    })

    it('should display recent activity section when sessions exist', async () => {
      const mockGuides: Guide[] = [
        {
          id: 'g1',
          title: 'Guide Title',
          description: 'Master the art of something',
          categoryId: 'category1',
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
          categoryService={mockCategoryService}
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
          categoryId: 'baking',
          stepCount: 8,
          duration: 180,
          thumbnail: '🍞',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Guide,
      ]

      const mockCategories: Category[] = [
        {
          id: 'baking',
          name: 'Baking',
          description: 'Baking guides',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Category,
      ]

      mockGuideService = createMockGuideService(mockGuides)
      mockCategoryService = createMockCategoryService(mockCategories)

      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          isAdmin={false}
          guideService={mockGuideService}
          sessionService={mockSessionService}
          categoryService={mockCategoryService}
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
    it('should call onBrowseGuides when Browse Guides button is pressed', () => {
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
          categoryService={mockCategoryService}
        />
      )

      fireEvent.press(getByText('Browse Guides'))
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
          categoryService={mockCategoryService}
        />
      )

      fireEvent.press(getByText('My Guides'))
      expect(mockOnManageGuides).toHaveBeenCalledTimes(1)
    })

    it('should call onBrowseCategories when Browse Categories button is pressed', () => {
      const mockOnBrowseCategories = jest.fn()
      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          onBrowseCategories={mockOnBrowseCategories}
          isAdmin={true}
          guideService={mockGuideService}
          sessionService={mockSessionService}
          categoryService={mockCategoryService}
        />
      )

      fireEvent.press(getByText('Browse Categories'))
      expect(mockOnBrowseCategories).toHaveBeenCalledTimes(1)
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
          categoryService={mockCategoryService}
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
          categoryService={mockCategoryService}
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
          categoryService={mockCategoryService}
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
})
