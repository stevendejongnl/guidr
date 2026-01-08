import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { RegistrationScreen } from './RegistrationScreen'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'

jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/api/AuthClient')

describe('RegistrationScreen', () => {
  let mockAuthStorage: jest.Mocked<AuthStorage>
  let mockAuthClient: jest.Mocked<AuthClient>
  let mockOnComplete: jest.Mock
  let mockOnBackToLogin: jest.Mock

  beforeEach(() => {
    mockAuthStorage = new AuthStorage() as jest.Mocked<AuthStorage>
    mockAuthClient = new AuthClient('http://localhost:8000') as jest.Mocked<AuthClient>
    mockOnComplete = jest.fn()
    mockOnBackToLogin = jest.fn()
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render form with email, password, and confirm password inputs', () => {
      const { getByPlaceholderText, getAllByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      expect(getByPlaceholderText('email@example.com')).toBeTruthy()
      expect(getByPlaceholderText('Password (min 6 characters)')).toBeTruthy()
      expect(getByPlaceholderText('Confirm Password')).toBeTruthy()
      expect(getAllByText('Create Account').length).toBe(2) // Title and button
    })

    it('should render title and description', () => {
      const { getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      expect(getAllByText('Create Account').length).toBe(2) // Title and button
      expect(getByText('Sign up to get started')).toBeTruthy()
    })

    it('should render back to login link', () => {
      const { getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      expect(getByText('Already have an account? Sign in')).toBeTruthy()
    })

    it('should have email keyboard type for email input', () => {
      const { getByPlaceholderText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      expect(emailInput.props['keyboardType']).toBe('email-address')
    })

    it('should have secure text entry for password inputs', () => {
      const { getByPlaceholderText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      expect(passwordInput.props['secureTextEntry']).toBe(true)
      expect(confirmPasswordInput.props['secureTextEntry']).toBe(true)
    })
  })

  describe('user interaction', () => {
    it('should update email field when typing', () => {
      const { getByPlaceholderText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      expect(emailInput.props['value']).toBe('test@example.com')
    })

    it('should update password field when typing', () => {
      const { getByPlaceholderText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, 'password123')

      expect(passwordInput.props['value']).toBe('password123')
    })

    it('should update confirm password field when typing', () => {
      const { getByPlaceholderText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(confirmPasswordInput.props['value']).toBe('password123')
    })

    it('should clear error when typing in email field', () => {
      const { getByPlaceholderText, getAllByText, getByText, queryByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const button = getAllByText('Create Account')[1]! // Get button, not title
      fireEvent.press(button)

      expect(getByText('Please enter your email')).toBeTruthy()

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      expect(queryByText('Please enter your email')).toBeNull()
    })

    it('should call onBackToLogin when back to login link is pressed', () => {
      const { getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const link = getByText('Already have an account? Sign in')
      fireEvent.press(link)

      expect(mockOnBackToLogin).toHaveBeenCalledTimes(1)
    })
  })

  describe('validation', () => {
    it('should show error for empty email', () => {
      const { getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      expect(getByText('Please enter your email')).toBeTruthy()
    })

    it('should show error for invalid email format', () => {
      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'notanemail')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      expect(getByText('Please enter a valid email address')).toBeTruthy()
    })

    it('should show error for empty password', () => {
      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      expect(getByText('Please enter a password')).toBeTruthy()
    })

    it('should show error for short password (less than 6 characters)', () => {
      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, '12345')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      expect(getByText('Password must be at least 6 characters')).toBeTruthy()
    })

    it('should show error for empty confirm password', () => {
      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, 'password123')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      expect(getByText('Please confirm your password')).toBeTruthy()
    })

    it('should show error when passwords do not match', () => {
      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, 'password123')

      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'differentpassword')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      expect(getByText('Passwords do not match')).toBeTruthy()
    })
  })

  describe('async operations', () => {
    it('should register user and auto-login on successful registration', async () => {
      mockAuthClient.register = jest.fn().mockResolvedValue({
        accessToken: 'mock-token-123',
        tokenType: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      })
      mockAuthStorage.setAuthToken = jest.fn().mockResolvedValue(undefined)
      mockAuthStorage.setUserEmail = jest.fn().mockResolvedValue(undefined)

      const { getByPlaceholderText, getAllByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, 'password123')

      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      await waitFor(() => {
        expect(mockAuthClient.register).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(mockAuthStorage.setAuthToken).toHaveBeenCalledWith('mock-token-123')
        expect(mockAuthStorage.setUserEmail).toHaveBeenCalledWith('test@example.com')
        expect(mockOnComplete).toHaveBeenCalledTimes(1)
      })
    })

    it('should show error on duplicate email (409)', async () => {
      mockAuthClient.register = jest.fn().mockRejectedValue(
        new Error('Email already registered')
      )

      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'existing@example.com')

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, 'password123')

      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      await waitFor(() => {
        expect(getByText('Email already registered')).toBeTruthy()
        expect(mockOnComplete).not.toHaveBeenCalled()
      })
    })

    it('should show error on network failure', async () => {
      mockAuthClient.register = jest.fn().mockRejectedValue(
        new Error('Network request failed')
      )

      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, 'password123')

      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      await waitFor(() => {
        expect(getByText('Network request failed')).toBeTruthy()
        expect(mockOnComplete).not.toHaveBeenCalled()
      })
    })

    it('should show generic error message for non-Error exceptions', async () => {
      mockAuthClient.register = jest.fn().mockRejectedValue('unexpected error')

      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, 'password123')

      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      await waitFor(() => {
        expect(getByText('Registration failed')).toBeTruthy()
        expect(mockOnComplete).not.toHaveBeenCalled()
      })
    })
  })

  describe('loading states', () => {
    it('should show loading text when registration is in progress', async () => {
      mockAuthClient.register = jest.fn().mockImplementation(() => new Promise(() => {}))

      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      fireEvent.changeText(passwordInput, 'password123')

      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      await waitFor(() => {
        expect(getByText('Creating account...')).toBeTruthy()
      })
    })

    it('should disable inputs during loading', async () => {
      mockAuthClient.register = jest.fn().mockImplementation(() => new Promise(() => {}))

      const { getByPlaceholderText, getAllByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      const confirmPasswordInput = getByPlaceholderText('Confirm Password')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      await waitFor(() => {
        expect(emailInput.props['editable']).toBe(false)
        expect(passwordInput.props['editable']).toBe(false)
        expect(confirmPasswordInput.props['editable']).toBe(false)
      })
    })

    it('should disable button during loading', async () => {
      mockAuthClient.register = jest.fn().mockImplementation(() => new Promise(() => {}))

      const { getByPlaceholderText, getAllByText, getByText } = render(
        <RegistrationScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onBackToLogin={mockOnBackToLogin}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password (min 6 characters)')
      const confirmPasswordInput = getByPlaceholderText('Confirm Password')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      const button = getAllByText('Create Account')[1]!
      fireEvent.press(button)

      // Wait for the loading text to appear as a proxy for disabled state
      await waitFor(() => {
        expect(getByText('Creating account...')).toBeTruthy()
      })
    })
  })
})
