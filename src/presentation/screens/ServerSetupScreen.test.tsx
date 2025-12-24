import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ServerSetupScreen } from './ServerSetupScreen'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'

jest.mock('../../infrastructure/storage/ServerConfigStorage')

describe('ServerSetupScreen', () => {
  let mockStorage: jest.Mocked<ServerConfigStorage>
  let mockOnComplete: jest.Mock

  beforeEach(() => {
    mockStorage = new ServerConfigStorage() as jest.Mocked<ServerConfigStorage>
    mockOnComplete = jest.fn()
    jest.clearAllMocks()
  })

  it('should render form with input and button', () => {
    const { getByPlaceholderText, getByText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
    )

    expect(getByPlaceholderText('https://api.example.com')).toBeTruthy()
    expect(getByText('Save Server URL')).toBeTruthy()
  })

  it('should render title and description', () => {
    const { getByText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
    )

    expect(getByText('Server Configuration')).toBeTruthy()
    expect(getByText('Enter your Guidr server URL to get started.')).toBeTruthy()
  })

  it('should update input when user types', () => {
    const { getByPlaceholderText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
    )

    const input = getByPlaceholderText('https://api.example.com')
    fireEvent.changeText(input, 'https://api.test.com')

    expect(input.props['value']).toBe('https://api.test.com')
  })

  it('should show error for empty URL on submit', async () => {
    const { getByText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
    )

    const button = getByText('Save Server URL')
    fireEvent.press(button)

    await waitFor(() => {
      expect(getByText('Please enter a server URL')).toBeTruthy()
    })

    expect(mockStorage.setServerUrl).not.toHaveBeenCalled()
    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('should save valid URL and call onComplete', async () => {
    mockStorage.setServerUrl.mockResolvedValue()

    const { getByPlaceholderText, getByText, queryByText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
    )

    const input = getByPlaceholderText('https://api.example.com')
    const button = getByText('Save Server URL')

    fireEvent.changeText(input, 'https://api.test.com')
    fireEvent.press(button)

    await waitFor(() => {
      expect(mockStorage.setServerUrl).toHaveBeenCalledWith('https://api.test.com')
    })

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })

    expect(queryByText('Please enter a server URL')).toBeNull()
  })

  it('should show error if storage throws error', async () => {
    mockStorage.setServerUrl.mockRejectedValue(new Error('Invalid server URL format'))

    const { getByPlaceholderText, getByText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
    )

    const input = getByPlaceholderText('https://api.example.com')
    const button = getByText('Save Server URL')

    fireEvent.changeText(input, 'invalid-url')
    fireEvent.press(button)

    await waitFor(() => {
      expect(getByText('Invalid server URL format')).toBeTruthy()
    })

    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('should show loading state while saving', async () => {
    let resolvePromise: () => void
    const savePromise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    mockStorage.setServerUrl.mockReturnValue(savePromise)

    const { getByPlaceholderText, getByText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
    )

    const input = getByPlaceholderText('https://api.example.com')
    const button = getByText('Save Server URL')

    fireEvent.changeText(input, 'https://api.test.com')
    fireEvent.press(button)

    await waitFor(() => {
      expect(getByText('Saving...')).toBeTruthy()
    })

    resolvePromise!()

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  it('should disable button while loading', async () => {
    let resolvePromise: () => void
    const savePromise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    mockStorage.setServerUrl.mockReturnValue(savePromise)

    const { getByPlaceholderText, getByText, queryByText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
    )

    const input = getByPlaceholderText('https://api.example.com')
    const button = getByText('Save Server URL')

    fireEvent.changeText(input, 'https://api.test.com')
    fireEvent.press(button)

    await waitFor(() => {
      const savingButton = queryByText('Saving...')
      expect(savingButton).toBeTruthy()
      if (savingButton && savingButton.parent) {
        expect(savingButton.parent.props['accessibilityState'].disabled).toBe(true)
      }
    })

    resolvePromise!()

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  it('should clear error when user starts typing', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ServerSetupScreen storage={mockStorage} onComplete={mockOnComplete} />
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
})
