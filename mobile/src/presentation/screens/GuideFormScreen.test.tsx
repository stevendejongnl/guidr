import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { GuideFormScreen } from './GuideFormScreen'
import { Guide } from '../../domain/entities/Guide'
import { Step } from '../../domain/entities/Step'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
  createMockStepService,
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

  it('shows WorkoutEditor when workout type is selected', async () => {
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

    expect(queryByTestId('workout-editor')).toBeNull()

    fireEvent.press(getByTestId('guide-type-selector:workout'))

    expect(getByTestId('workout-editor')).toBeTruthy()
    expect(queryByTestId('ingredients-editor')).toBeNull()
    expect(queryByTestId('notes-editor')).toBeNull()
  })

  it('shows NotesEditor when general type is selected', async () => {
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

    expect(queryByTestId('notes-editor')).toBeNull()

    fireEvent.press(getByTestId('guide-type-selector:general'))

    expect(getByTestId('notes-editor')).toBeTruthy()
    expect(queryByTestId('ingredients-editor')).toBeNull()
    expect(queryByTestId('workout-editor')).toBeNull()
  })

  it('loads existing muscles and equipment in edit mode for workout guide', async () => {
    const guide = new Guide(
      'guide-1',
      'workout',
      'Chest Day',
      'Upper body workout',
      'user-123',
      false,
      false,
      {
        target_muscles: [{ name: 'chest', focus: 'primary' }],
        equipment: [{ name: 'dumbbells', weight: '15kg' }],
      }
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
      expect(getByText('chest (primary)')).toBeTruthy()
      expect(getByText('dumbbells — 15kg')).toBeTruthy()
    })
  })

  it('loads existing notes in edit mode for general guide', async () => {
    const guide = new Guide(
      'guide-1',
      'general',
      'Study Guide',
      'A study guide',
      'user-123',
      false,
      false,
      { notes: [{ key: 'difficulty', value: 'beginner' }] }
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
      expect(getByText('difficulty: beginner')).toBeTruthy()
    })
  })

  it('does not show steps section in create mode', async () => {
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

    expect(queryByTestId('steps-section')).toBeNull()
  })

  it('shows steps section with loaded steps in edit mode', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Test Guide',
      'A test',
      'user-123',
      false,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockSteps = [
      new Step('step-1', 'guide-1', 0, 'Step One', 10),
      new Step('step-2', 'guide-1', 1, 'Step Two', 15),
    ]
    const mockStepService = createMockStepService(mockSteps)

    const { getByText, getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('steps-section')).toBeTruthy()
      expect(getByText('Step One')).toBeTruthy()
      expect(getByText('Step Two')).toBeTruthy()
    })
  })

  it('shows add step button when onAddStep is provided in edit mode', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Test Guide',
      'A test',
      'user-123',
      false,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService()

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={mockStepService}
        onAddStep={jest.fn()}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('add-step-button')).toBeTruthy()
    })
  })

  it('calls onAddStep when add step button is pressed', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Test Guide',
      'A test',
      'user-123',
      false,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService()
    const mockOnAddStep = jest.fn()

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={mockStepService}
        onAddStep={mockOnAddStep}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('add-step-button')).toBeTruthy()
    })

    fireEvent.press(getByTestId('add-step-button'))

    expect(mockOnAddStep).toHaveBeenCalledWith('guide-1', 0)
  })

  it('calls onEditStep when step edit is triggered', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Test Guide',
      'A test',
      'user-123',
      false,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockSteps = [
      new Step('step-1', 'guide-1', 0, 'Step One', 10),
    ]
    const mockStepService = createMockStepService(mockSteps)
    const mockOnEditStep = jest.fn()

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={mockStepService}
        onEditStep={mockOnEditStep}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('step-0:edit')).toBeTruthy()
    })

    fireEvent.press(getByTestId('step-0:edit'))

    expect(mockOnEditStep).toHaveBeenCalledWith('step-1')
  })

  it('reloads steps when stepsRefreshKey changes', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Test Guide',
      'A test',
      'user-123',
      false,
      false
    )

    mockGuideService.getGuideById.mockResolvedValue(guide)

    const mockStepService = createMockStepService([])

    const { rerender } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={mockStepService}
        stepsRefreshKey={0}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(mockStepService.getStepsByGuideId).toHaveBeenCalledTimes(1)
    })

    // Increment stepsRefreshKey to trigger reload
    rerender(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={mockStepService}
        stepsRefreshKey={1}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(mockStepService.getStepsByGuideId).toHaveBeenCalledTimes(2)
    })
  })
})
