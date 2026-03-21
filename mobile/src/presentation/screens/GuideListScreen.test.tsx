import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { GuideListScreen } from './GuideListScreen'
import { Guide } from '../../domain/entities/Guide'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
  createMockGuideFavoriteClient,
} from '../testUtils'

// Mock only ErrorReporter (static utility)
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideListScreen', () => {
  const mockOnCreateGuide = jest.fn()
  const mockOnEditGuide = jest.fn()
  const mockOnViewGuide = jest.fn()
  const mockOnBack = jest.fn()
  let mockGuideService: ReturnType<typeof createMockGuideService>
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideFavoriteClient: ReturnType<typeof createMockGuideFavoriteClient>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock infrastructure and services
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
    mockGuideFavoriteClient = createMockGuideFavoriteClient([])
  })

  it('renders guide list screen without errors', () => {
    render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    expect(mockOnCreateGuide).toBeDefined()
  })

  it('renders header with back button', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    expect(getByText('← Back')).toBeTruthy()
  })

  it('renders guides title', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    expect(getByText('Guides')).toBeTruthy()
  })

  it('renders new guide button', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    expect(getByText('+ New')).toBeTruthy()
  })

  it('calls onBack when back button is pressed', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    fireEvent.press(getByText('← Back'))
    expect(mockOnBack).toHaveBeenCalled()
  })

  it('calls onCreateGuide when new button is pressed', () => {
    const { getByText } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    fireEvent.press(getByText('+ New'))
    expect(mockOnCreateGuide).toHaveBeenCalled()
  })

  it('defaults to "My Guides" tab', () => {
    const { getByTestId } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    const mineTab = getByTestId('filter-tab-mine')
    expect(mineTab.props['style']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: expect.any(String) }),
      ])
    )
  })

  it('calls getMyGuides on initial load (My Guides tab)', async () => {
    render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(mockGuideService.getMyGuides).toHaveBeenCalledWith('test-token')
    })
  })

  it('calls getMyGuides when Mine tab is selected', async () => {
    const myGuides: Guide[] = [
      {
        id: 'g1',
        title: 'My Guide',
        description: 'A personal guide',
        guideType: 'general',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Guide,
    ]

    mockGuideService = createMockGuideService(myGuides)

    const { getByTestId } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    fireEvent.press(getByTestId('filter-tab-mine'))

    await waitFor(() => {
      expect(mockGuideService.getMyGuides).toHaveBeenCalledWith('test-token')
    })
  })

  it('calls getAllGuides when switching to Public tab', async () => {
    const { getByTestId } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    fireEvent.press(getByTestId('filter-tab-public'))
    await waitFor(() => {
      expect(mockGuideService.getAllGuides).toHaveBeenCalledWith('test-token')
    })
  })

  it('renders Favorites tab', () => {
    const { getByTestId } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        guideFavoriteClient={mockGuideFavoriteClient}
      />
    )
    expect(getByTestId('filter-tab-favorites')).toBeTruthy()
  })

  it('calls getFavoriteGuideIds when Favorites tab is selected', async () => {
    const { getByTestId } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
        guideFavoriteClient={mockGuideFavoriteClient}
      />
    )

    fireEvent.press(getByTestId('filter-tab-favorites'))

    await waitFor(() => {
      expect(mockGuideFavoriteClient.getFavoriteGuideIds).toHaveBeenCalledWith('test-token')
    })
  })
})
