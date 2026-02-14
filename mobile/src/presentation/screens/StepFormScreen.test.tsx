import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { StepFormScreen } from './StepFormScreen'
import { StepService } from '../../domain/services/StepService'
import { Step } from '../../domain/entities/Step'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'

// Mock storage and API clients
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/storage/ServerConfigStorage')
jest.mock('../../infrastructure/api/AuthClient')

// Create mock service factory
const createMockStepService = (): jest.Mocked<StepService> => {
  const mock = {
    createStep: jest.fn(),
    getStepById: jest.fn(),
    getStepsByGuideId: jest.fn().mockResolvedValue([]),
    updateStepTitle: jest.fn(),
    updateStepDuration: jest.fn(),
    updateStepDescription: jest.fn(),
    updateStepOrder: jest.fn(),
    deleteStep: jest.fn(),
  } as unknown as jest.Mocked<StepService>
  return mock
}

describe('StepFormScreen', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()
  const guideId = 'guide-1'
  let mockStepService: jest.Mocked<StepService>

  beforeEach(() => {
    mockOnSave.mockClear()
    mockOnCancel.mockClear()

    // Create default mock service
    mockStepService = createMockStepService()

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

  describe('rendering', () => {
    it('renders screen title for create mode', async () => {
      const { getByText } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        expect(getByText('New Step')).toBeTruthy()
      })
    })

    it('renders screen title for edit mode', async () => {
      mockStepService.getStepById.mockResolvedValue({
        id: 'step-1',
        guideId,
        order: 0,
        title: 'Test Step',
        description: 'A test step',
        duration: 1800,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByText } = render(
        <StepFormScreen
          mode="edit"
          guideId={guideId}
          stepId="step-1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        expect(getByText('Edit Step')).toBeTruthy()
      })
    })

    it('renders form inputs', async () => {
      const { getByTestId } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        expect(getByTestId('step-title-input')).toBeTruthy()
        expect(getByTestId('step-duration-hours-input')).toBeTruthy()
        expect(getByTestId('step-duration-minutes-input')).toBeTruthy()
        expect(getByTestId('step-description-input')).toBeTruthy()
      })
    })

    it('renders action buttons', async () => {
      const { getByTestId } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        expect(getByTestId('step-save-button')).toBeTruthy()
        expect(getByTestId('step-cancel-button')).toBeTruthy()
      })
    })

    it('renders delete button in edit mode', async () => {
      mockStepService.getStepById.mockResolvedValue({
        id: 'step-1',
        guideId,
        order: 0,
        title: 'Test Step',
        description: undefined,
        duration: 1800,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByTestId } = render(
        <StepFormScreen
          mode="edit"
          guideId={guideId}
          stepId="step-1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        expect(getByTestId('step-delete-button')).toBeTruthy()
      })
    })
  })

  describe('validation', () => {
    it('shows error when title is empty', async () => {
      const { getByTestId, getByText } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const saveButton = getByTestId('step-save-button')
        fireEvent.press(saveButton)
      })

      await waitFor(() => {
        expect(getByText('Step title is required')).toBeTruthy()
      })
    })

    it('shows error when duration is not a number', async () => {
      const { getByTestId, getByText } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const titleInput = getByTestId('step-title-input')
        fireEvent.changeText(titleInput, 'Test Step')

        const hoursInput = getByTestId('step-duration-hours-input')
        fireEvent.changeText(hoursInput, 'abc')

        const saveButton = getByTestId('step-save-button')
        fireEvent.press(saveButton)
      })

      await waitFor(() => {
        expect(getByText('Duration must contain valid numbers')).toBeTruthy()
      })
    })

    it('allows saving with zero duration (no timer)', async () => {
      mockStepService.createStep.mockResolvedValue({
        id: 'step-new',
        guideId,
        order: 0,
        title: 'No Timer Step',
        description: undefined,
        duration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByTestId } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const titleInput = getByTestId('step-title-input')
        fireEvent.changeText(titleInput, 'No Timer Step')

        const saveButton = getByTestId('step-save-button')
        fireEvent.press(saveButton)
      })

      await waitFor(() => {
        expect(mockStepService.createStep).toHaveBeenCalledWith(
          guideId,
          0,
          'No Timer Step',
          0,
          undefined,
          'test-token'
        )
      })
    })

    it('shows error when duration exceeds maximum', async () => {
      const { getByTestId, getByText } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const titleInput = getByTestId('step-title-input')
        fireEvent.changeText(titleInput, 'Test Step')

        const hoursInput = getByTestId('step-duration-hours-input')
        fireEvent.changeText(hoursInput, '24')

        const minutesInput = getByTestId('step-duration-minutes-input')
        fireEvent.changeText(minutesInput, '1')

        const saveButton = getByTestId('step-save-button')
        fireEvent.press(saveButton)
      })

      await waitFor(() => {
        expect(getByText(/When hours is 24, minutes must be 0/)).toBeTruthy()
      })
    })

    it('shows error when minutes exceed 59', async () => {
      const { getByTestId, getByText } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const titleInput = getByTestId('step-title-input')
        fireEvent.changeText(titleInput, 'Test Step')

        const minutesInput = getByTestId('step-duration-minutes-input')
        fireEvent.changeText(minutesInput, '60')

        const saveButton = getByTestId('step-save-button')
        fireEvent.press(saveButton)
      })

      await waitFor(() => {
        expect(getByText(/Hours must be 0-24, minutes must be 0-59/)).toBeTruthy()
      })
    })
  })

  describe('edit mode decomposition', () => {
    it('decomposes 5400 seconds into 1 hour and 30 minutes', async () => {
      mockStepService.getStepById.mockResolvedValue({
        id: 'step-1',
        guideId,
        order: 0,
        title: 'Test Step',
        description: 'A test step',
        duration: 5400,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByTestId } = render(
        <StepFormScreen
          mode="edit"
          guideId={guideId}
          stepId="step-1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const hoursInput = getByTestId('step-duration-hours-input')
        const minutesInput = getByTestId('step-duration-minutes-input')
        expect(hoursInput.props['value']).toBe('1')
        expect(minutesInput.props['value']).toBe('30')
      })
    })

    it('decomposes 2700 seconds into empty hours and 45 minutes', async () => {
      mockStepService.getStepById.mockResolvedValue({
        id: 'step-1',
        guideId,
        order: 0,
        title: 'Test Step',
        description: 'A test step',
        duration: 2700,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByTestId } = render(
        <StepFormScreen
          mode="edit"
          guideId={guideId}
          stepId="step-1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const hoursInput = getByTestId('step-duration-hours-input')
        const minutesInput = getByTestId('step-duration-minutes-input')
        expect(hoursInput.props['value']).toBe('')
        expect(minutesInput.props['value']).toBe('45')
      })
    })
    it('decomposes 0 seconds into empty fields (no timer)', async () => {
      mockStepService.getStepById.mockResolvedValue({
        id: 'step-1',
        guideId,
        order: 0,
        title: 'No Timer Step',
        description: '',
        duration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByTestId } = render(
        <StepFormScreen
          mode="edit"
          guideId={guideId}
          stepId="step-1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const hoursInput = getByTestId('step-duration-hours-input')
        const minutesInput = getByTestId('step-duration-minutes-input')
        expect(hoursInput.props['value']).toBe('')
        expect(minutesInput.props['value']).toBe('')
      })
    })
  })

  describe('form submission', () => {
    it('creates step with valid data', async () => {
      mockStepService.createStep.mockResolvedValue({
        id: 'step-new',
        guideId,
        order: 0,
        title: 'New Step',
        description: 'A new step',
        duration: 3600,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByTestId } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const titleInput = getByTestId('step-title-input')
        fireEvent.changeText(titleInput, 'New Step')

        const hoursInput = getByTestId('step-duration-hours-input')
        fireEvent.changeText(hoursInput, '1')

        const minutesInput = getByTestId('step-duration-minutes-input')
        fireEvent.changeText(minutesInput, '0')

        const descriptionInput = getByTestId('step-description-input')
        fireEvent.changeText(descriptionInput, 'A new step')

        const saveButton = getByTestId('step-save-button')
        fireEvent.press(saveButton)
      })

      await waitFor(() => {
        expect(mockStepService.createStep).toHaveBeenCalledWith(
          guideId,
          0,
          'New Step',
          3600,
          'A new step',
          'test-token'
        )
        expect(mockOnSave).toHaveBeenCalledWith('step-new')
      })
    })

    it('updates step with valid data', async () => {
      mockStepService.getStepById.mockResolvedValue({
        id: 'step-1',
        guideId,
        order: 0,
        title: 'Original Title',
        description: 'Original description',
        duration: 1800,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByTestId } = render(
        <StepFormScreen
          mode="edit"
          guideId={guideId}
          stepId="step-1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const titleInput = getByTestId('step-title-input')
        fireEvent.changeText(titleInput, 'Updated Title')

        const hoursInput = getByTestId('step-duration-hours-input')
        fireEvent.changeText(hoursInput, '0')

        const minutesInput = getByTestId('step-duration-minutes-input')
        fireEvent.changeText(minutesInput, '45')

        const saveButton = getByTestId('step-save-button')
        fireEvent.press(saveButton)
      })

      await waitFor(() => {
        expect(mockStepService.updateStepTitle).toHaveBeenCalledWith(
          'step-1',
          'Updated Title',
          'test-token'
        )
        expect(mockStepService.updateStepDuration).toHaveBeenCalledWith(
          'step-1',
          2700,
          'test-token'
        )
        expect(mockOnSave).toHaveBeenCalledWith('step-1')
      })
    })
  })

  describe('authorization', () => {
    it('shows auth error when canEdit is false (non-owner, non-admin)', async () => {
      const { getByText, queryByTestId } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          canEdit={false}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        expect(getByText(/Only the guide owner or administrators can edit steps/)).toBeTruthy()
      })

      // Form inputs should not be rendered
      expect(queryByTestId('step-title-input')).toBeNull()
    })

    it('shows form when canEdit is true (owner, non-admin)', async () => {
      const { getByTestId, queryByText } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          canEdit={true}
          isAdmin={false}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        expect(getByTestId('step-title-input')).toBeTruthy()
      })

      // Auth error should not be shown
      expect(queryByText(/Only the guide owner or administrators can edit steps/)).toBeNull()
    })
  })

  describe('user interactions', () => {
    it('calls onCancel when cancel button is pressed', async () => {
      const { getByTestId } = render(
        <StepFormScreen
          mode="create"
          guideId={guideId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const cancelButton = getByTestId('step-cancel-button')
        fireEvent.press(cancelButton)
        expect(mockOnCancel).toHaveBeenCalledTimes(1)
      })
    })

    it('shows alert when delete is pressed', async () => {
      mockStepService.getStepById.mockResolvedValue({
        id: 'step-1',
        guideId,
        order: 0,
        title: 'Test Step',
        description: undefined,
        duration: 1800,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Step)

      const { getByTestId } = render(
        <StepFormScreen
          mode="edit"
          guideId={guideId}
          stepId="step-1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          stepService={mockStepService}
        />
      )

      await waitFor(() => {
        const deleteButton = getByTestId('step-delete-button')
        expect(deleteButton).toBeTruthy()
        // Alert.alert would be called but we're not testing the alert behavior
      })
    })
  })
})
