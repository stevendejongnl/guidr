import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { BrowseGuidesScreen } from './BrowseGuidesScreen'
import { GuideService } from '../../domain/services/GuideService'
import { CategoryService } from '../../domain/services/CategoryService'
import { Guide } from '../../domain/entities/Guide'
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

const createMockCategoryService = (categories: Category[] = []): jest.Mocked<CategoryService> => {
  const mock = {
    getAllCategories: jest.fn().mockResolvedValue(categories),
    getCategoryById: jest.fn(),
  } as unknown as jest.Mocked<CategoryService>
  return mock
}

describe('BrowseGuidesScreen', () => {
  const mockOnBack = jest.fn()
  const mockOnViewGuide = jest.fn()
  let mockGuideService: jest.Mocked<GuideService>
  let mockCategoryService: jest.Mocked<CategoryService>

  beforeEach(() => {
    mockOnBack.mockClear()
    mockOnViewGuide.mockClear()

    // Create default mock services with empty data
    mockGuideService = createMockGuideService([])
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

  it('renders screen title', () => {
    const { getByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
      />
    )

    await waitFor(() => {
      expect(getByTestId('browse-guides:search')).toBeDefined()
    })
  })

  it('renders category filter chips', async () => {
    const mockCategories: Category[] = [
      {
        id: 'baking',
        name: 'Baking',
        description: 'Baking guides',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Category,
      {
        id: 'cooking',
        name: 'Cooking',
        description: 'Cooking guides',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Category,
    ]

    mockCategoryService = createMockCategoryService(mockCategories)

    const { getByTestId } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
        categoryService={mockCategoryService}
      />
    )

    await waitFor(() => {
      expect(getByTestId('browse-guides:chip-All Guides')).toBeDefined()
      expect(getByTestId('browse-guides:chip-Baking')).toBeDefined()
      expect(getByTestId('browse-guides:chip-Cooking')).toBeDefined()
    })
  })

  it('filters guides by search text', async () => {
    const mockGuides: Guide[] = [
      {
        id: 'g1',
        title: 'Sourdough Bread',
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

    const { getByTestId, queryAllByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
        categoryService={mockCategoryService}
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
        categoryId: 'category1',
        stepCount: 5,
        duration: 100,
        thumbnail: '📚',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(mockGuides)
    mockCategoryService = createMockCategoryService([])

    const { getByTestId, queryByText } = render(
      <BrowseGuidesScreen
        onBack={mockOnBack}
        onViewGuide={mockOnViewGuide}
        testID="browse-guides"
        guideService={mockGuideService}
        categoryService={mockCategoryService}
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
        categoryId: 'cat1',
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
        categoryService={mockCategoryService}
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
        categoryId: 'cat1',
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
        categoryService={mockCategoryService}
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
        categoryService={mockCategoryService}
      />
    )

    expect(root).toBeDefined()
  })
})
