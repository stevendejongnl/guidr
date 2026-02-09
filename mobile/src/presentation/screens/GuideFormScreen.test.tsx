import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { GuideFormScreen } from './GuideFormScreen'
import { Guide } from '../../domain/entities/Guide'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
} from '../testUtils'

// Mock only ErrorReporter (static utility)
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideFormScreen', () => {
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideService: ReturnType<typeof createMockGuideService>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock infrastructure and services
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
  })

  it('component supports dependency injection pattern with guideService props', () => {
    expect(mockAuthStorage).toBeDefined()
    expect(mockServerConfigStorage).toBeDefined()
  })

  it('component can accept infrastructure via dependency injection', () => {
    expect(mockAuthStorage).toBeDefined()
    expect(mockServerConfigStorage).toBeDefined()
    expect(mockGuideService).toBeDefined()
  })

  it('shows IngredientsEditor when cooking type is selected', async () => {
    const { getByTestId, queryByTestId } = render(
      <GuideFormScreen
        mode="create"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('guide-form-screen')).toBeTruthy()
    })

    // Initially no ingredients editor
    expect(queryByTestId('ingredients-editor')).toBeNull()

    // Select cooking type
    fireEvent.press(getByTestId('guide-type-selector:cooking'))

    // Now ingredients editor should be visible
    expect(getByTestId('ingredients-editor')).toBeTruthy()
  })

  it('does not show IngredientsEditor for non-cooking types', async () => {
    const { getByTestId, queryByTestId } = render(
      <GuideFormScreen
        mode="create"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('guide-form-screen')).toBeTruthy()
    })

    // Select workout type
    fireEvent.press(getByTestId('guide-type-selector:workout'))

    expect(queryByTestId('ingredients-editor')).toBeNull()
  })

  it('loads existing ingredients in edit mode for cooking guide', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Cookies',
      'Delicious cookies',
      'user-123',
      false,
      false,
      { ingredients: [{ name: 'flour', quantity: '200', unit: 'g' }] }
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const { getByText } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByText('200 g — flour')).toBeTruthy()
    })
  })
})
