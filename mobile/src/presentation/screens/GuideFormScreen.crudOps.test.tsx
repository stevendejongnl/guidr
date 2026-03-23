import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { GuideFormScreen } from './GuideFormScreen'
import { Guide } from '../../domain/entities/Guide'
import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
  createMockStepService,
} from '../testUtils'

jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideFormScreen - validation', () => {
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideService: ReturnType<typeof createMockGuideService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
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
})

describe('GuideFormScreen - create operations', () => {
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideService: ReturnType<typeof createMockGuideService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
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
})

describe('GuideFormScreen - edit and admin operations', () => {
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideService: ReturnType<typeof createMockGuideService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
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

    const { getByTestId } = render(
      <GuideFormScreen
        mode="edit"
        guideId="guide-1"
        onSave={jest.fn()}
        onCancel={jest.fn()}
        isAdmin={true}
        guideService={mockGuideService}
        stepService={createMockStepService()}
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
})

describe('GuideFormScreen - delete operations', () => {
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideService: ReturnType<typeof createMockGuideService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
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
})
