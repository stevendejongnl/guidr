import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ServerSetupScreen } from './ServerSetupScreen'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { ValidatedServerStorage } from '../../infrastructure/storage/ValidatedServerStorage'
import { IHealthCheckService } from '../../domain/services/IHealthCheckService'

jest.mock('../../infrastructure/storage/ServerConfigStorage')
jest.mock('../../infrastructure/storage/ValidatedServerStorage')

describe('ServerSetupScreen', () => {
  let mockStorage: jest.Mocked<ServerConfigStorage>
  let mockHealthCheckService: jest.Mocked<IHealthCheckService>
  let mockValidatedStorage: any
  let mockOnComplete: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage = new ServerConfigStorage() as jest.Mocked<ServerConfigStorage>
    mockHealthCheckService = {
      validateServer: jest.fn(),
    } as unknown as jest.Mocked<IHealthCheckService>
    mockValidatedStorage = {
      setServerUrlWithValidation: jest.fn(),
    }
    ;(ValidatedServerStorage as jest.Mock).mockImplementation(() => mockValidatedStorage)
    mockOnComplete = jest.fn()
  })

  it('should render form with input and button', () => {
    const { getByPlaceholderText, getByText } = render(
      <ServerSetupScreen
        storage={mockStorage}
        healthCheckService={mockHealthCheckService}
        onComplete={mockOnComplete}
      />
    )

    expect(getByPlaceholderText('https://api.example.com')).toBeTruthy()
    expect(getByText('Save Server URL')).toBeTruthy()
  })

  it('should render title and description', () => {
    const { getByText } = render(
      <ServerSetupScreen
        storage={mockStorage}
        healthCheckService={mockHealthCheckService}
        onComplete={mockOnComplete}
      />
    )

    expect(getByText('Server Configuration')).toBeTruthy()
    expect(getByText('Enter your Guidr server URL to get started.')).toBeTruthy()
  })

  it('should update input when user types', () => {
    const { getByPlaceholderText } = render(
      <ServerSetupScreen
        storage={mockStorage}
        healthCheckService={mockHealthCheckService}
        onComplete={mockOnComplete}
      />
    )

    const input = getByPlaceholderText('https://api.example.com')
    fireEvent.changeText(input, 'https://api.test.com')

    expect(input.props['value']).toBe('https://api.test.com')
  })

  it('should show error for empty URL on submit', async () => {
    const { getByText } = render(
      <ServerSetupScreen
        storage={mockStorage}
        healthCheckService={mockHealthCheckService}
        onComplete={mockOnComplete}
      />
    )

    const button = getByText('Save Server URL')
    fireEvent.press(button)

    await waitFor(() => {
      expect(getByText('Please enter a server URL')).toBeTruthy()
    })

    expect(mockHealthCheckService.validateServer).not.toHaveBeenCalled()
    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('should save valid URL when health check succeeds', async () => {
    mockValidatedStorage.setServerUrlWithValidation.mockResolvedValue({
      healthy: true,
      responseTime: 100,
    })
    mockStorage.setServerUrl.mockResolvedValue()

    const { getByPlaceholderText, getByText, queryByText } = render(
      <ServerSetupScreen
        storage={mockStorage}
        healthCheckService={mockHealthCheckService}
        onComplete={mockOnComplete}
      />
    )

    const input = getByPlaceholderText('https://api.example.com')
    const button = getByText('Save Server URL')

    fireEvent.changeText(input, 'https://api.test.com')
    fireEvent.press(button)

    await waitFor(() => {
      expect(mockValidatedStorage.setServerUrlWithValidation).toHaveBeenCalledWith('https://api.test.com')
    })

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })

    expect(queryByText('Please enter a server URL')).toBeNull()
  })


  it('should clear error when user starts typing', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ServerSetupScreen
        storage={mockStorage}
        healthCheckService={mockHealthCheckService}
        onComplete={mockOnComplete}
      />
    )

    const button = getByText('Save Server URL')
    const input = getByPlaceholderText('https://api.example.com')

    // Trigger error
    fireEvent.press(button)

    await waitFor(() => {
      expect(getByText('Please enter a server URL')).toBeTruthy()
    })

    // Start typing
    fireEvent.changeText(input, 'h')

    expect(queryByText('Please enter a server URL')).toBeNull()
  })

  it('should render version display', () => {
    const { getByTestId } = render(
      <ServerSetupScreen storage={mockStorage} healthCheckService={mockHealthCheckService} onComplete={mockOnComplete} />
    )

    expect(getByTestId('version-display')).toBeTruthy()
  })

  it('should pre-populate input with current URL when provided', () => {
    const { getByDisplayValue } = render(
      <ServerSetupScreen
        storage={mockStorage}
        healthCheckService={mockHealthCheckService}
        onComplete={mockOnComplete}
        currentUrl="https://existing.server.com"
      />
    )

    expect(getByDisplayValue('https://existing.server.com')).toBeTruthy()
  })

  it('should start with empty input when currentUrl is not provided', () => {
    const { getByPlaceholderText } = render(
      <ServerSetupScreen storage={mockStorage} healthCheckService={mockHealthCheckService} onComplete={mockOnComplete} />
    )

    const input = getByPlaceholderText('https://api.example.com')
    expect(input.props['value']).toBe('')
  })
})
