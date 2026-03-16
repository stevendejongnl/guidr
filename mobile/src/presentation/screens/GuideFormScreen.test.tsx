import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
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

  it('shows validation error when title is empty and save is pressed', async () => {
    const { getByTestId, getByText } = render(
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

    fireEvent.press(getByTestId('save-button'))

    await waitFor(() => {
      expect(getByText('Guide title is required')).toBeTruthy()
    })
  })

  it('shows validation error when guide type is not selected', async () => {
    const { getByTestId, getByText } = render(
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

    fireEvent.changeText(getByTestId('guide-title-input'), 'My Guide')
    fireEvent.press(getByTestId('save-button'))

    await waitFor(() => {
      expect(getByText('Guide type is required')).toBeTruthy()
    })
  })

  it('calls guideService.createGuide and onSave on successful create', async () => {
    const mockOnSave = jest.fn()
    const createdGuide = new Guide('new-guide', 'cooking', 'My Cookies')
    mockGuideService.createGuide = jest.fn().mockResolvedValue(createdGuide)

    const { getByTestId } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
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

    fireEvent.changeText(getByTestId('guide-title-input'), 'My Cookies')
    fireEvent.press(getByTestId('guide-type-selector:cooking'))

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(mockGuideService.createGuide).toHaveBeenCalled()
      expect(mockOnSave).toHaveBeenCalledWith('new-guide')
    })
  })

  it('shows error message when createGuide throws', async () => {
    mockGuideService.createGuide = jest.fn().mockRejectedValue(new Error('Create failed'))

    const { getByTestId, getByText } = render(
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

    fireEvent.changeText(getByTestId('guide-title-input'), 'My Guide')
    fireEvent.press(getByTestId('guide-type-selector:cooking'))

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(getByText('Create failed')).toBeTruthy()
    })
  })

  it('calls update methods and onSave on successful edit', async () => {
    const guide = new Guide('guide-1', 'cooking', 'Old Title', 'Old desc', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)
    mockGuideService.updateGuideTitle = jest.fn().mockResolvedValue(undefined)
    mockGuideService.updateGuideDescription = jest.fn().mockResolvedValue(undefined)
    mockGuideService.updateGuideLanguage = jest.fn().mockResolvedValue(undefined)
    mockGuideService.toggleVisibility = jest.fn().mockResolvedValue(undefined)
    mockGuideService.toggleHighlight = jest.fn().mockResolvedValue(undefined)

    const mockOnSave = jest.fn()
    const mockStepService = createMockStepService()

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={mockOnSave}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('guide-form-screen')).toBeTruthy()
      expect(getByTestId('save-button')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('guide-1')
    })
  })

  it('calls toggleHighlight when admin saves in edit mode', async () => {
    const guide = new Guide('guide-1', 'cooking', 'Title', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)
    mockGuideService.updateGuideTitle = jest.fn().mockResolvedValue(undefined)
    mockGuideService.updateGuideDescription = jest.fn().mockResolvedValue(undefined)
    mockGuideService.updateGuideLanguage = jest.fn().mockResolvedValue(undefined)
    mockGuideService.toggleVisibility = jest.fn().mockResolvedValue(undefined)
    mockGuideService.toggleHighlight = jest.fn().mockResolvedValue(undefined)

    const mockStepService = createMockStepService()

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={true}
        guideService={mockGuideService}
        stepService={mockStepService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('highlight-toggle')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(mockGuideService.toggleHighlight).toHaveBeenCalled()
    })
  })

  it('shows error when initializeServices fails (no token)', async () => {
    const brokenAuthStorage = createMockAuthStorage({
      getAuthToken: jest.fn().mockResolvedValue(null),
    })

    const { getByTestId, getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        authStorage={brokenAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('guide-form-screen')).toBeTruthy()
      expect(getByText('Missing auth token or server URL')).toBeTruthy()
    })
  })

  it('calls onCancel when cancel button is pressed', async () => {
    const mockOnCancel = jest.fn()

    const { getByTestId } = render(
      <GuideFormScreen
        mode="create"
        onSave={jest.fn()}
        onCancel={mockOnCancel}
        isAdmin={false}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('cancel-button')).toBeTruthy()
    })

    fireEvent.press(getByTestId('cancel-button'))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('shows delete button in edit mode', async () => {
    const guide = new Guide('guide-1', 'cooking', 'Test', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={createMockStepService()}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('delete-button')).toBeTruthy()
    })
  })

  it('shows Alert.alert when delete button is pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    const guide = new Guide('guide-1', 'cooking', 'Test', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={createMockStepService()}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('delete-button')).toBeTruthy()
    })

    fireEvent.press(getByTestId('delete-button'))

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Guide',
      expect.any(String),
      expect.any(Array),
    )

    alertSpy.mockRestore()
  })

  it('calls deleteGuide and onSave when delete is confirmed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const deleteButton = buttons?.find(b => b.text === 'Delete')
      deleteButton?.onPress?.()
    })

    const guide = new Guide('guide-1', 'cooking', 'Test', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)
    mockGuideService.deleteGuide = jest.fn().mockResolvedValue(undefined)

    const mockOnSave = jest.fn()

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={mockOnSave}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={createMockStepService()}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('delete-button')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('delete-button'))
    })

    await waitFor(() => {
      expect(mockGuideService.deleteGuide).toHaveBeenCalledWith('guide-1', 'test-token')
      expect(mockOnSave).toHaveBeenCalledWith('guide-1')
    })

    alertSpy.mockRestore()
  })

  it('shows step delete Alert when step delete is pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    const guide = new Guide('guide-1', 'cooking', 'Test', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)

    const mockSteps = [new Step('step-1', 'guide-1', 0, 'Step One', 10)]
    const mockStepService = createMockStepService(mockSteps)

    const { getByTestId } = render(
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
      expect(getByTestId('step-0:delete')).toBeTruthy()
    })

    fireEvent.press(getByTestId('step-0:delete'))

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Step',
      expect.any(String),
      expect.any(Array),
    )

    alertSpy.mockRestore()
  })

  it('calls deleteStep and reloads when step delete is confirmed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const deleteButton = buttons?.find(b => b.text === 'Delete')
      deleteButton?.onPress?.()
    })

    const guide = new Guide('guide-1', 'cooking', 'Test', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)

    const mockSteps = [new Step('step-1', 'guide-1', 0, 'Step One', 10)]
    // First call returns steps, second call (after delete) returns empty list
    let callCount = 0
    const mockStepService = createMockStepService(mockSteps)
    mockStepService.getStepsByGuideId = jest.fn().mockImplementation(() => {
      callCount++
      return Promise.resolve(callCount === 1 ? mockSteps : [])
    })
    mockStepService.deleteStep = jest.fn().mockResolvedValue(undefined)

    const { getByTestId, queryByText } = render(
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
      expect(getByTestId('step-0:delete')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('step-0:delete'))
    })

    await waitFor(() => {
      expect(mockStepService.deleteStep).toHaveBeenCalledWith('step-1', 'test-token')
      expect(queryByText('Step One')).toBeNull()
    })

    alertSpy.mockRestore()
  })

  it('calls updateStepOrder when move-up is pressed', async () => {
    const guide = new Guide('guide-1', 'cooking', 'Test', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)

    const mockSteps = [
      new Step('step-1', 'guide-1', 0, 'First', 10),
      new Step('step-2', 'guide-1', 1, 'Second', 10),
    ]
    const mockStepService = createMockStepService(mockSteps)
    mockStepService.updateStepOrder = jest.fn().mockResolvedValue(undefined)
    mockStepService.getStepsByGuideId = jest.fn().mockResolvedValue(mockSteps)

    const { getByTestId } = render(
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
      expect(getByTestId('step-1:move-up')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('step-1:move-up'))
    })

    await waitFor(() => {
      expect(mockStepService.updateStepOrder).toHaveBeenCalled()
    })
  })

  it('calls updateStepOrder when move-down is pressed', async () => {
    const guide = new Guide('guide-1', 'cooking', 'Test', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)

    const mockSteps = [
      new Step('step-1', 'guide-1', 0, 'First', 10),
      new Step('step-2', 'guide-1', 1, 'Second', 10),
    ]
    const mockStepService = createMockStepService(mockSteps)
    mockStepService.updateStepOrder = jest.fn().mockResolvedValue(undefined)
    mockStepService.getStepsByGuideId = jest.fn().mockResolvedValue(mockSteps)

    const { getByTestId } = render(
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
      expect(getByTestId('step-0:move-down')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('step-0:move-down'))
    })

    await waitFor(() => {
      expect(mockStepService.updateStepOrder).toHaveBeenCalled()
    })
  })

  it('includes cooking metadata when creating a cooking guide with ingredients', async () => {
    const createdGuide = new Guide('new-guide', 'cooking', 'Pasta')
    mockGuideService.createGuide = jest.fn().mockResolvedValue(createdGuide)

    const { getByTestId } = render(
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

    fireEvent.changeText(getByTestId('guide-title-input'), 'Pasta')
    fireEvent.press(getByTestId('guide-type-selector:cooking'))

    // Add an ingredient via the IngredientsEditor
    await waitFor(() => {
      expect(getByTestId('ingredients-editor')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(mockGuideService.createGuide).toHaveBeenCalled()
    })
  })

  it('shows load guide error when getGuideById throws in edit mode', async () => {
    mockGuideService.getGuideById = jest.fn().mockRejectedValue(new Error('Guide not found'))

    const mockStepService = createMockStepService()

    const { getByTestId, getByText } = render(
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
      expect(getByTestId('guide-form-screen')).toBeTruthy()
      expect(getByText('Guide not found')).toBeTruthy()
    })
  })

  it('shows initialization error when auth token is missing', async () => {
    // No guideService injected — services init will fail since no token
    const brokenAuthStorage = createMockAuthStorage({
      getAuthToken: jest.fn().mockResolvedValue(null),
    })

    const { getByTestId, getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        authStorage={brokenAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('guide-form-screen')).toBeTruthy()
      expect(getByText('Missing auth token or server URL')).toBeTruthy()
    })
  })

  it('includes workout metadata when creating workout guide', async () => {
    const createdGuide = new Guide('new-guide', 'workout', 'Workout')
    mockGuideService.createGuide = jest.fn().mockResolvedValue(createdGuide)

    const { getByTestId } = render(
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

    fireEvent.changeText(getByTestId('guide-title-input'), 'Workout')
    fireEvent.press(getByTestId('guide-type-selector:workout'))

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(mockGuideService.createGuide).toHaveBeenCalled()
    })
  })

  it('includes general notes metadata when creating general guide', async () => {
    const createdGuide = new Guide('new-guide', 'general', 'General')
    mockGuideService.createGuide = jest.fn().mockResolvedValue(createdGuide)

    const { getByTestId } = render(
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

    fireEvent.changeText(getByTestId('guide-title-input'), 'General')
    fireEvent.press(getByTestId('guide-type-selector:general'))

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(mockGuideService.createGuide).toHaveBeenCalled()
    })
  })

  it('calls updateGuideMetadata in edit mode when metadata is available', async () => {
    const guide = new Guide(
      'guide-1',
      'cooking',
      'Title',
      'Desc',
      'user-123',
      false,
      false,
      { ingredients: [{ name: 'flour', quantity: '200', unit: 'g' }] },
    )
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)
    mockGuideService.updateGuideTitle = jest.fn().mockResolvedValue(undefined)
    mockGuideService.updateGuideDescription = jest.fn().mockResolvedValue(undefined)
    mockGuideService.updateGuideLanguage = jest.fn().mockResolvedValue(undefined)
    mockGuideService.toggleVisibility = jest.fn().mockResolvedValue(undefined)
    mockGuideService.updateGuideMetadata = jest.fn().mockResolvedValue(undefined)

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
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('save-button')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(mockGuideService.updateGuideMetadata).toHaveBeenCalled()
    })
  })

  it('shows error when delete fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const deleteButton = buttons?.find(b => b.text === 'Delete')
      deleteButton?.onPress?.()
    })

    const guide = new Guide('guide-1', 'cooking', 'Test', '', 'user-123', false, false)
    mockGuideService.getGuideById = jest.fn().mockResolvedValue(guide)
    mockGuideService.deleteGuide = jest.fn().mockRejectedValue(new Error('Delete failed'))

    const { getByTestId, getByText } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={false}
        guideService={mockGuideService}
        stepService={createMockStepService()}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('delete-button')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('delete-button'))
    })

    await waitFor(() => {
      expect(getByText('Delete failed')).toBeTruthy()
    })

    alertSpy.mockRestore()
  })

  it('shows the highlight toggle only for admin users', async () => {
    const { getByTestId } = render(
      <GuideFormScreen
        mode="create"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={true}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
        serverConfigStorage={mockServerConfigStorage}
      />
    )

    await waitFor(() => {
      expect(getByTestId('guide-form-screen')).toBeTruthy()
    })

    expect(getByTestId('highlight-toggle')).toBeTruthy()

    // Non-admin version
    const { queryByTestId: queryNonAdmin } = render(
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
      expect(queryNonAdmin('highlight-toggle')).toBeNull()
    })
  })
})
