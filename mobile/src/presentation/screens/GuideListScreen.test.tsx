import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GuideListScreen } from './GuideListScreen'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
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

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock infrastructure and services
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
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

  it('defaults to "My Guides" tab when isAdmin is true', () => {
    const { getByTestId } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        isAdmin={true}
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

  it('defaults to "All" tab when isAdmin is false', () => {
    const { getByTestId } = render(
      <GuideListScreen
        onCreateGuide={mockOnCreateGuide}
        onEditGuide={mockOnEditGuide}
        onViewGuide={mockOnViewGuide}
        onBack={mockOnBack}
        isAdmin={false}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )
    const allTab = getByTestId('filter-tab-all')
    expect(allTab.props['style']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: expect.any(String) }),
      ])
    )
  })
})
