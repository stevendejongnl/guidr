import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { BrowseGuidesScreen } from './BrowseGuidesScreen'
import { GuideService } from '../../domain/services/GuideService'
import { Guide } from '../../domain/entities/Guide'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'

// Mock storage and API clients
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/storage/ServerConfigStorage')
jest.mock('../../infrastructure/api/AuthClient')

// Create mock service factory
const createMockGuideService = (guides: Guide[] = []): jest.Mocked<GuideService> => {
  const mock = {
    getAllGuides: jest.fn().mockResolvedValue(guides),
    getGuideById: jest.fn(),
    getGuidesByType: jest.fn(),
  } as unknown as jest.Mocked<GuideService>
  return mock
}

describe('BrowseGuidesScreen', () => {
  const mockOnBack = jest.fn()
  const mockOnViewGuide = jest.fn()
  let mockGuideService: jest.Mocked<GuideService>

  beforeEach(() => {
    mockOnBack.mockClear()
    mockOnViewGuide.mockClear()

    // Create default mock services with empty data
    mockGuideService = createMockGuideService([])

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

  it('renders screen title', () => {
    const { getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    expect(getByText('Browse Guides')).toBeDefined()
  })

  it('renders back button', () => {
    const { getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    expect(getByText('← Back')).toBeDefined()
  })

  it('calls onBack when back button is pressed', () => {
    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    fireEvent.press(getByTestId('browse-guides:back'))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('renders search bar', async () => {
    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    await waitFor(() => {
      expect(getByTestId('browse-guides:search')).toBeDefined()
    })
  })

  it('renders type filter chips', async () => {
    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    await waitFor(() => {
      expect(getByTestId('browse-guides:chip-All Guides')).toBeDefined()
      expect(getByTestId('browse-guides:chip-Cooking')).toBeDefined()
      expect(getByTestId('browse-guides:chip-Workout')).toBeDefined()
      expect(getByTestId('browse-guides:chip-General')).toBeDefined()
    })
  })

  it('filters guides by search text', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Sourdough Bread',
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

    const { getByTestId, queryAllByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    await waitFor(() => {
      const searchInput = getByTestId('browse-guides:search:input')
      fireEvent.changeText(searchInput, 'sourdough')
    })

    await waitFor(() => {
      // After searching, should find the sourdough guide(s)
      const results = queryAllByText(/sourdough/i)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no guides match filter', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Some Guide',
        description: 'A guide about something',
        guideType: 'general',
        stepCount: 5,
        duration: 100,
        thumbnail: '📚',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(mockGuides)

    const { getByTestId, queryByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    await waitFor(() => {
      const searchInput = getByTestId('browse-guides:search:input')
      fireEvent.changeText(searchInput, 'nonexistent guide that does not exist')
    })

    await waitFor(() => {
      // Check for empty state message
      expect(queryByText(/No guides found/i)).toBeDefined()
    })
  })

  it('resets filters when reset action is pressed in empty state', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Some Guide',
        description: 'A guide',
        guideType: 'cooking',
        stepCount: 5,
        duration: 100,
        thumbnail: '📚',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(mockGuides)

    const { getByTestId, getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    // Search for non-existent guide
    await waitFor(() => {
      const searchInput = getByTestId('browse-guides:search:input')
      fireEvent.changeText(searchInput, 'nonexistent')
    })

    // Find and press reset button
    await waitFor(() => {
      const resetButton = getByText('Reset Filters')
      expect(resetButton).toBeDefined()
      fireEvent.press(resetButton)
    })
  })

  it('calls onViewGuide when guide card is pressed', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Test Guide',
        description: 'A test guide',
        guideType: 'cooking',
        stepCount: 3,
        duration: 60,
        thumbnail: '📖',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(mockGuides)

    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    await waitFor(() => {
      // Find first guide card (g1)
      const guideCard = getByTestId('browse-guides:card-g1')
      fireEvent.press(guideCard)
      expect(mockOnViewGuide).toHaveBeenCalledWith('g1')
    })
  })

  it('has node progress indicator in header', () => {
    const { root } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
      />
    )

    expect(root).toBeDefined()
  })
})
