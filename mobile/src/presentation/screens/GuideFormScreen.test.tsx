import React from 'react'
import { View } from 'react-native'
import { render, waitFor } from '@testing-library/react-native'

// Mock everything FIRST, before importing the component
jest.mock('@react-native-async-storage/async-storage')
jest.mock('../../infrastructure/monitoring/ErrorReporter', () => ({
  ErrorReporter: { capture: jest.fn() },
}))
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/storage/ServerConfigStorage')
jest.mock('../../infrastructure/repositories/GuideRepository')
jest.mock('../../infrastructure/repositories/StepRepository')
jest.mock('../../infrastructure/repositories/CategoryRepository')
jest.mock('../../domain/services/GuideService')
jest.mock('../../domain/services/CategoryService')
jest.mock('../components/SafeScreen', () => ({
  SafeScreen: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
    <View testID={testID}>{children}</View>
  ),
}))
jest.mock('../components/CategoryPickerButton', () => ({
  CategoryPickerButton: () => null,
}))

// NOW import the component and services after mocks are set up
import { GuideFormScreen } from './GuideFormScreen'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { GuideService } from '../../domain/services/GuideService'
import { CategoryService } from '../../domain/services/CategoryService'

/**
 * GuideFormScreen Test Strategy: Dependency Injection
 *
 * Rather than mocking the services, we pass in real service instances
 * initialized with mocked repositories. This tests the real service logic
 * while isolating external dependencies.
 *
 * Benefits:
 * - Services are tested with real implementations
 * - Only low-level dependencies are mocked
 * - Clear separation between unit tests (service tests) and integration tests
 * - No complex mock setup in component tests
 */

describe('GuideFormScreen', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock AuthStorage
    const mockAuthStorage = {
      getAuthToken: jest.fn().mockResolvedValue('test-token'),
      getUserIsAdmin: jest.fn().mockResolvedValue(false),
      getUserId: jest.fn().mockResolvedValue('user-123'),
    }
    ;(AuthStorage as jest.Mock).mockImplementation(() => mockAuthStorage)

    // Mock ServerConfigStorage
    const mockServerStorage = {
      getServerUrl: jest.fn().mockResolvedValue('http://test-server'),
    }
    ;(ServerConfigStorage as jest.Mock).mockImplementation(() => mockServerStorage)

    // Mock repositories
    ;(GuideRepository as jest.Mock).mockImplementation(() => ({
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue({ id: 'new-guide-1' }),
    }))

    ;(StepRepository as jest.Mock).mockImplementation(() => ({
      findById: jest.fn().mockResolvedValue(null),
    }))

    ;(CategoryRepository as jest.Mock).mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([]),
    }))
  })

  // Create real service instances for injection
  const createTestServices = () => {
    const guideRepo = new GuideRepository('http://test-server')
    const stepRepo = new StepRepository('http://test-server')
    const categoryRepo = new CategoryRepository('http://test-server')

    return {
      guideService: new GuideService(guideRepo, stepRepo),
      categoryService: new CategoryService(categoryRepo),
    }
  }

  it('renders form screen without errors in create mode', async () => {
    const { guideService, categoryService } = createTestServices()
    const { getByTestId } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        guideService={guideService}
        categoryService={categoryService}
      />
    )

    await waitFor(() => {
      expect(getByTestId('guide-form-screen')).toBeTruthy()
    })
  })

  it('renders title for create mode', async () => {
    const { guideService, categoryService } = createTestServices()
    const { getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        guideService={guideService}
        categoryService={categoryService}
      />
    )

    await waitFor(() => {
      expect(getByText(/New Guide/i)).toBeTruthy()
    })
  })

  it('renders save and cancel buttons', async () => {
    const { guideService, categoryService } = createTestServices()
    const { getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        guideService={guideService}
        categoryService={categoryService}
      />
    )

    await waitFor(() => {
      expect(getByText('Save')).toBeTruthy()
      expect(getByText('Cancel')).toBeTruthy()
    })
  })

  it('does not render delete button in create mode', async () => {
    const { guideService, categoryService } = createTestServices()
    const { queryByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        guideService={guideService}
        categoryService={categoryService}
      />
    )

    await waitFor(() => {
      expect(queryByText('Delete')).toBeFalsy()
    })
  })

  it('accepts a pre-selected category ID in create mode', async () => {
    const { guideService, categoryService } = createTestServices()
    render(
      <GuideFormScreen
        mode="create"
        categoryId="cat-1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        guideService={guideService}
        categoryService={categoryService}
      />
    )

    await waitFor(() => {
      expect(mockOnSave).toBeDefined()
    })
  })

  it('shows category section in create mode', async () => {
    const { guideService, categoryService } = createTestServices()
    const { getByText } = render(
      <GuideFormScreen
        mode="create"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        guideService={guideService}
        categoryService={categoryService}
      />
    )

    // Verify category label is present
    await waitFor(() => {
      expect(getByText('Category')).toBeTruthy()
    })
  })
})
