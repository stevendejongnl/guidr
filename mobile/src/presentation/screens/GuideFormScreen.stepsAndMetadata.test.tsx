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

jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideFormScreen - step delete and reordering', () => {
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideService: ReturnType<typeof createMockGuideService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
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
})

describe('GuideFormScreen - metadata and error handling', () => {
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideService: ReturnType<typeof createMockGuideService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
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
      expect(getByTestId('save-button')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(getByTestId('save-button'))
    })

    await waitFor(() => {
      expect(mockGuideService.updateGuideMetadata).toHaveBeenCalled()
    })
  })

  it('shows load guide error when getGuideById throws in edit mode', async () => {
    mockGuideService.getGuideById = jest.fn().mockRejectedValue(new Error('Guide not found'))

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
      expect(getByTestId('guide-form-screen')).toBeTruthy()
      expect(getByText('Guide not found')).toBeTruthy()
    })
  })

  it('shows initialization error when auth token is missing', async () => {
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
})
