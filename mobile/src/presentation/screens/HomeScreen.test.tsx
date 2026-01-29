import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { GuideService } from '../../domain/services/GuideService'
import { SessionService } from '../../domain/services/SessionService'
import { CategoryService } from '../../domain/services/CategoryService'
import { Guide } from '../../domain/entities/Guide'
import { Session, SessionStatus } from '../../domain/entities/Session'
import { Category } from '../../domain/entities/Category'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'

// Mock storage and API clients
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/storage/ServerConfigStorage')
jest.mock('../../infrastructure/api/AuthClient')

// Create mock service factories
const createMockGuideService = (guides: Guide[] = []): jest.Mocked<GuideService> => {
  const mock = {
    getAllGuides: jest.fn().mockResolvedValue(guides),
    getGuideById: jest.fn(),
    getGuidesByCategoryId: jest.fn(),
  } as unknown as jest.Mocked<GuideService>
  return mock
}

const createMockSessionService = (sessions: Session[] = []): jest.Mocked<SessionService> => {
  const mock = {
    getAllSessions: jest.fn().mockResolvedValue(sessions),
    getSessionById: jest.fn(),
    createSession: jest.fn(),
    getSessionsByStatus: jest.fn(),
  } as unknown as jest.Mocked<SessionService>
  return mock
}

const createMockCategoryService = (categories: Category[] = []): jest.Mocked<CategoryService> => {
  const mock = {
    getAllCategories: jest.fn().mockResolvedValue(categories),
    getCategoryById: jest.fn(),
  } as unknown as jest.Mocked<CategoryService>
  return mock
}

describe('HomeScreen', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockGuideService: jest.Mocked<GuideService>
  let mockSessionService: jest.Mocked<SessionService>
  let mockCategoryService: jest.Mocked<CategoryService>

  beforeEach(() => {
    mockOnLogout = jest.fn()
    mockOnOpenSettings = jest.fn()
    mockOnOpenProfile = jest.fn()

    // Create default mock services with empty data
    mockGuideService = createMockGuideService([])
    mockSessionService = createMockSessionService([])
    mockCategoryService = createMockCategoryService([])

    // Mock storage
    const mockAuthStorage = {
      getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
      getAuthToken: jest.fn().mockResolvedValue('test-token'),
    } as unknown as jest.Mocked<AuthStorage>

    const mockServerConfigStorage = {
      getServerUrl: jest.fn().mockResolvedValue('http://localhost:8000'),
    } as unknown as jest.Mocked<ServerConfigStorage>

    ;(AuthStorage as jest.Mock).mockImplementation(() => mockAuthStorage)
    ;(ServerConfigStorage as jest.Mock).mockImplementation(() => mockServerConfigStorage)

    // Mock AuthClient
    const mockAuthClientInstance = {
      getProfile: jest.fn().mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        interests: [],
        isAdmin: false,
      }),
    } as unknown as jest.Mocked<AuthClient>

    ;(AuthClient as jest.Mock).mockImplementation(() => mockAuthClientInstance)
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
        />
      )

      expect(getByText('Browse Guides')).toBeTruthy()
      expect(getByText('Browse Categories')).toBeTruthy()
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

    it('should call onBrowseCategories when Browse Categories button is pressed', () => {
      const mockOnBrowseCategories = jest.fn()
      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          onBrowseCategories={mockOnBrowseCategories}
          isAdmin={false}
          guideService={mockGuideService}
          sessionService={mockSessionService}
          categoryService={mockCategoryService}
        />
      )

      fireEvent.press(getByText('Browse Categories'))
      expect(mockOnBrowseCategories).toHaveBeenCalledTimes(1)
    })
  })
})
