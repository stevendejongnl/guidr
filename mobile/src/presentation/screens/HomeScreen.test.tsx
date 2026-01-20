import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'
import * as HomeScreenMockDataModule from '../../infrastructure/mocks/HomeScreenMockData'
import { SessionStatus } from '../../infrastructure/mocks/HomeScreenMockData'

// Define interface for mock user profile
interface MockUserProfile {
  id: string
  email: string
  name: string
  interests: string[]
  isAdmin: boolean
}

jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/storage/ServerConfigStorage')
jest.mock('../../infrastructure/api/AuthClient')
jest.mock('../../infrastructure/mocks/HomeScreenMockData')

describe('HomeScreen', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockAuthStorage: jest.Mocked<AuthStorage>
  let mockServerConfigStorage: jest.Mocked<ServerConfigStorage>

  beforeEach(() => {
    mockOnLogout = jest.fn()
    mockOnOpenSettings = jest.fn()
    mockOnOpenProfile = jest.fn()

    mockAuthStorage = {
      getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
      getAuthToken: jest.fn().mockResolvedValue('test-token'),
    } as unknown as jest.Mocked<AuthStorage>

    mockServerConfigStorage = {
      getServerUrl: jest.fn().mockResolvedValue('http://localhost:8000'),
    } as unknown as jest.Mocked<ServerConfigStorage>

    ;(AuthStorage as jest.Mock).mockImplementation(() => mockAuthStorage)
    ;(ServerConfigStorage as jest.Mock).mockImplementation(() => mockServerConfigStorage)

    // Default mock implementations for HomeScreenMockData
    jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getStats').mockReturnValue({
      activeSessions: 0,
      completedSessions: 0,
      totalGuides: 33,
      favoriteCategories: [],
    })
    jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getRecentSessions').mockReturnValue([])
    jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getRecommendedGuides').mockReturnValue([])

    jest.clearAllMocks()
  })

  describe('rendering', () => {
    beforeEach(() => {
      const mockAuthClientInstance = {
        getProfile: jest.fn().mockResolvedValue({
          id: 'user1',
          email: 'test@example.com',
          name: null,
          interests: [],
          isAdmin: false,
        }),
      } as unknown as jest.Mocked<AuthClient>

      ;(AuthClient as jest.Mock).mockImplementation(() => mockAuthClientInstance)
    })

    it('should render title and description', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      // Should render app title
      expect(getByText('Guidr')).toBeTruthy()
      // Should render quick actions section
      expect(getByText('Browse Guides')).toBeTruthy()
    })

    it('should render logout menu item', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      fireEvent.press(getByTestId('home-menu'))
      expect(getByTestId('menu-item-logout')).toBeTruthy()
    })

    it('should display user email when loaded', async () => {
      const mockAuthClientInstance = {
        getProfile: jest.fn().mockResolvedValue({
          id: 'user1',
          email: 'test@example.com',
          name: null, // No name set, should use email
          interests: [],
          isAdmin: false,
        }),
      } as unknown as jest.Mocked<AuthClient>

      ;(AuthClient as jest.Mock).mockImplementation(() => mockAuthClientInstance)

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      await waitFor(() => {
        expect(getByText('Welcome, test@example.com!')).toBeTruthy()
      })
    })

    it('should display generic welcome when email is not available', async () => {
      mockAuthStorage.getUserEmail.mockResolvedValue(null)

      const mockAuthClientInstance = {
        getProfile: jest.fn().mockResolvedValue({
          id: 'user1',
          email: 'test@example.com',
          name: null,
          interests: [],
          isAdmin: false,
        }),
      } as unknown as jest.Mocked<AuthClient>

      ;(AuthClient as jest.Mock).mockImplementation(() => mockAuthClientInstance)

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      await waitFor(() => {
        // When email is null and profile has no name, should show "Welcome, User!"
        expect(getByText('Welcome, User!')).toBeTruthy()
      })
    })
  })

  describe('logout menu item', () => {
    it('should call onLogout when logout menu item is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-logout'))

      expect(mockOnLogout).toHaveBeenCalledTimes(1)
    })

    it('should handle async logout errors', async () => {
      mockOnLogout.mockRejectedValue(new Error('Logout failed'))

      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-logout'))

      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('error handling', () => {
    it('should handle email loading error gracefully', async () => {
      mockAuthStorage.getUserEmail.mockRejectedValue(new Error('Failed to load email'))

      const mockAuthClientInstance = {
        getProfile: jest.fn().mockResolvedValue({
          id: 'user1',
          email: 'test@example.com',
          name: null,
          interests: [],
          isAdmin: false,
        }),
      } as unknown as jest.Mocked<AuthClient>

      ;(AuthClient as jest.Mock).mockImplementation(() => mockAuthClientInstance)

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      await waitFor(() => {
        // When email loading fails, still show welcome with fallback name
        expect(getByText('Welcome, User!')).toBeTruthy()
      })

      // Verify that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('menu', () => {
    it('should render menu button', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      expect(getByTestId('home-menu')).toBeTruthy()
    })

    it('should call onOpenProfile when profile menu item is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-profile'))

      expect(mockOnOpenProfile).toHaveBeenCalledTimes(1)
    })

    it('should call onOpenSettings when settings menu item is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-settings'))

      expect(mockOnOpenSettings).toHaveBeenCalledTimes(1)
    })
  })

  describe('dashboard sections', () => {
    let mockAuthClient: jest.Mocked<AuthClient>
    let mockUserProfile: MockUserProfile

    beforeEach(() => {
      mockUserProfile = {
        id: 'user1',
        email: 'test@example.com',
        name: 'John Doe',
        interests: ['Baking', 'Cooking'],
        isAdmin: false,
      }

      mockAuthClient = {
        getProfile: jest.fn().mockResolvedValue(mockUserProfile),
      } as unknown as jest.Mocked<AuthClient>

      ;(AuthClient as jest.Mock).mockImplementation(() => mockAuthClient)

      // Mock HomeScreenMockData functions
      jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getStats').mockReturnValue({
        activeSessions: 2,
        completedSessions: 5,
        totalGuides: 33,
        favoriteCategories: ['Baking', 'Cooking'],
      })

      jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getRecentSessions').mockReturnValue([
        {
          id: 's1',
          guideId: 'g1',
          guideTitle: 'Perfect Sourdough',
          status: SessionStatus.InProgress,
          startedAt: new Date(),
          currentStepTitle: 'Shaping',
          progress: 65,
        },
      ])

      jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getRecommendedGuides').mockReturnValue([
        {
          id: 'g1',
          title: 'Perfect Sourdough Bread',
          description: 'Master the art of sourdough',
          categoryId: 'baking',
          categoryName: 'Baking',
          stepCount: 8,
          duration: 180,
          thumbnailEmoji: '🍞',
        },
      ])
    })

    it('should display quick stats section', async () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      await waitFor(() => {
        expect(getByText('Active')).toBeTruthy()
        expect(getByText('Done')).toBeTruthy()
        expect(getByText('Guides')).toBeTruthy()
      })
    })

    it('should display quick action buttons', async () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      await waitFor(() => {
        expect(getByText('Browse Guides')).toBeTruthy()
        expect(getByText('Browse Categories')).toBeTruthy()
      })
    })

    it('should display recent activity section', async () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      await waitFor(() => {
        expect(getByText('Recent Activity')).toBeTruthy()
        expect(getByText('Perfect Sourdough')).toBeTruthy()
      })
    })

    it('should display recommendations section', async () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} isAdmin={false} />
      )

      await waitFor(() => {
        expect(getByText('Recommended for You')).toBeTruthy()
        expect(getByText('Perfect Sourdough Bread')).toBeTruthy()
      })
    })

    it('should display user name in welcome when profile is loaded', async () => {
      const mockAuthClientInstance = {
        getProfile: jest.fn().mockResolvedValue({
          id: 'user1',
          email: 'test@example.com',
          name: 'John Doe',
          interests: ['Baking', 'Cooking'],
          isAdmin: false,
        }),
      } as unknown as jest.Mocked<AuthClient>

      ;(AuthClient as jest.Mock).mockImplementation(() => mockAuthClientInstance)

      jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getStats').mockReturnValue({
        activeSessions: 2,
        completedSessions: 5,
        totalGuides: 33,
        favoriteCategories: ['Baking', 'Cooking'],
      })

      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          isAdmin={false}
        />
      )

      await waitFor(() => {
        expect(getByText('Welcome, John Doe!')).toBeTruthy()
      })
    })

    it('should handle profile fetch error gracefully', async () => {
      mockAuthClient.getProfile.mockRejectedValue(new Error('Network error'))

      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          isAdmin={false}
        />
      )

      await waitFor(() => {
        // Should fall back to email and show error message
        // Also verify error is displayed
        expect(getByText('Network error')).toBeTruthy()
        // And still display the subtitle with email
        const subtitle = getByText('Welcome, test@example.com!')
        expect(subtitle).toBeTruthy()
      })
    })
  })

  describe('quick action callbacks', () => {
    let mockOnBrowseGuides: jest.Mock
    let mockAuthClient: jest.Mocked<AuthClient>

    beforeEach(() => {
      mockOnBrowseGuides = jest.fn()

      mockAuthClient = {
        getProfile: jest.fn().mockResolvedValue({
          id: 'user1',
          email: 'test@example.com',
          name: 'John',
          interests: [],
          isAdmin: false,
        }),
      } as unknown as jest.Mocked<AuthClient>

      ;(AuthClient as jest.Mock).mockImplementation(() => mockAuthClient)

      jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getStats').mockReturnValue({
        activeSessions: 0,
        completedSessions: 0,
        totalGuides: 33,
        favoriteCategories: [],
      })
      jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getRecentSessions').mockReturnValue([])
      jest.spyOn(HomeScreenMockDataModule.HomeScreenMockData, 'getRecommendedGuides').mockReturnValue([])
    })

    it('should call onBrowseGuides when Browse Guides button is pressed', async () => {
      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          onBrowseGuides={mockOnBrowseGuides}
          isAdmin={false}
        />
      )

      await waitFor(() => {
        fireEvent.press(getByText('Browse Guides'))
        expect(mockOnBrowseGuides).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onBrowseCategories when Browse Categories button is pressed', async () => {
      const mockOnBrowseCategories = jest.fn()
      const { getByText } = render(
        <HomeScreen
          onLogout={mockOnLogout}
          onOpenSettings={mockOnOpenSettings}
          onOpenProfile={mockOnOpenProfile}
          onBrowseGuides={mockOnBrowseGuides}
          onBrowseCategories={mockOnBrowseCategories}
          isAdmin={false}
        />
      )

      await waitFor(() => {
        fireEvent.press(getByText('Browse Categories'))
        expect(mockOnBrowseCategories).toHaveBeenCalledTimes(1)
      })
    })
  })
})
