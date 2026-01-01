import React from 'react'
import { ActivityIndicator } from 'react-native'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { LoginScreen } from './LoginScreen'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'

jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/api/AuthClient')

describe('LoginScreen', () => {
  let mockAuthStorage: jest.Mocked<AuthStorage>
  let mockAuthClient: jest.Mocked<AuthClient>
  let mockOnComplete: jest.Mock
  let mockOnChangeServer: jest.Mock
  let mockOnRegister: jest.Mock

  beforeEach(() => {
    mockAuthStorage = new AuthStorage() as jest.Mocked<AuthStorage>
    mockAuthClient = new AuthClient('http://localhost:8000') as jest.Mocked<AuthClient>
    mockOnComplete = jest.fn()
    mockOnChangeServer = jest.fn()
    mockOnRegister = jest.fn()
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render form with email and password inputs', () => {
      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      expect(getByPlaceholderText('email@example.com')).toBeTruthy()
      expect(getByPlaceholderText('Password')).toBeTruthy()
      expect(getByText('Login')).toBeTruthy()
    })

    it('should render title and description', () => {
      const { getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      expect(getByText('Welcome to Guidr')).toBeTruthy()
      expect(getByText('Sign in to continue')).toBeTruthy()
    })

    it('should have email keyboard type for email input', () => {
      const { getByPlaceholderText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      expect(emailInput.props['keyboardType']).toBe('email-address')
    })

    it('should have secure text entry for password input', () => {
      const { getByPlaceholderText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const passwordInput = getByPlaceholderText('Password')
      expect(passwordInput.props['secureTextEntry']).toBe(true)
    })

    it('should render version display', () => {
      const { getByTestId } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      expect(getByTestId('version-display')).toBeTruthy()
    })
  })

  describe('user interaction', () => {
    it('should update email input when user types', () => {
      const { getByPlaceholderText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      expect(emailInput.props['value']).toBe('test@example.com')
    })

    it('should update password input when user types', () => {
      const { getByPlaceholderText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'password123')

      expect(passwordInput.props['value']).toBe('password123')
    })

    it('should clear error when user starts typing email', () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const loginButton = getByText('Login')
      fireEvent.press(loginButton)

      expect(getByText('Please enter your email')).toBeTruthy()

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test')

      expect(queryByText('Please enter your email')).toBeNull()
    })

    it('should clear error when user starts typing password', () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const loginButton = getByText('Login')
      fireEvent.press(loginButton)

      expect(getByText('Please enter your password')).toBeTruthy()

      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'pass')

      expect(queryByText('Please enter your password')).toBeNull()
    })
  })

  describe('validation', () => {
    it('should show error for empty email', () => {
      const { getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const loginButton = getByText('Login')
      fireEvent.press(loginButton)

      expect(getByText('Please enter your email')).toBeTruthy()
      expect(mockAuthClient.login).not.toHaveBeenCalled()
    })

    it('should show error for invalid email format', () => {
      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'invalid-email')

      const loginButton = getByText('Login')
      fireEvent.press(loginButton)

      expect(getByText('Please enter a valid email address')).toBeTruthy()
      expect(mockAuthClient.login).not.toHaveBeenCalled()
    })

    it('should show error for empty password', () => {
      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      fireEvent.changeText(emailInput, 'test@example.com')

      const loginButton = getByText('Login')
      fireEvent.press(loginButton)

      expect(getByText('Please enter your password')).toBeTruthy()
      expect(mockAuthClient.login).not.toHaveBeenCalled()
    })
  })

  describe('async operations', () => {
    it('should login successfully and call onComplete', async () => {
      mockAuthClient.login.mockResolvedValue({
        token: 'mock-token-123',
        email: 'test@example.com',
      })
      mockAuthStorage.setAuthToken.mockResolvedValue()
      mockAuthStorage.setUserEmail.mockResolvedValue()

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password')
      const loginButton = getByText('Login')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(loginButton)

      await waitFor(() => {
        expect(mockAuthClient.login).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      await waitFor(() => {
        expect(mockAuthStorage.setAuthToken).toHaveBeenCalledWith('mock-token-123')
        expect(mockAuthStorage.setUserEmail).toHaveBeenCalledWith('test@example.com')
      })

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('should show error from AuthClient on failed login', async () => {
      mockAuthClient.login.mockRejectedValue(new Error('Invalid email or password'))

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password')
      const loginButton = getByText('Login')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'wrongpassword')
      fireEvent.press(loginButton)

      await waitFor(() => {
        expect(getByText('Invalid email or password')).toBeTruthy()
      })

      expect(mockOnComplete).not.toHaveBeenCalled()
    })

    it('should show error from AuthStorage on storage failure', async () => {
      mockAuthClient.login.mockResolvedValue({
        token: 'mock-token-123',
        email: 'test@example.com',
      })
      mockAuthStorage.setAuthToken.mockRejectedValue(new Error('Storage error'))

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password')
      const loginButton = getByText('Login')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(loginButton)

      await waitFor(() => {
        expect(getByText('Storage error')).toBeTruthy()
      })

      expect(mockOnComplete).not.toHaveBeenCalled()
    })

    it('should show generic error for non-Error exceptions', async () => {
      mockAuthClient.login.mockRejectedValue('unexpected error')

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password')
      const loginButton = getByText('Login')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(loginButton)

      await waitFor(() => {
        expect(getByText('Login failed')).toBeTruthy()
      })

      expect(mockOnComplete).not.toHaveBeenCalled()
    })
  })

  describe('loading states', () => {
    it('should show loading state while logging in', async () => {
      let resolveLogin: (value: any) => void
      mockAuthClient.login.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve
        })
      )

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password')
      const loginButton = getByText('Login')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(loginButton)

      await waitFor(() => {
        expect(getByText('Logging in...')).toBeTruthy()
      })

      resolveLogin!({ token: 'mock-token', email: 'test@example.com' })
    })

    it('should disable inputs while loading', async () => {
      let resolveLogin: (value: any) => void
      mockAuthClient.login.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve
        })
      )

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password')
      const loginButton = getByText('Login')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(loginButton)

      await waitFor(() => {
        expect(emailInput.props['editable']).toBe(false)
        expect(passwordInput.props['editable']).toBe(false)
      })

      resolveLogin!({ token: 'mock-token', email: 'test@example.com' })
    })

    it('should show activity indicator while loading', async () => {
      let resolveLogin: (value: any) => void
      mockAuthClient.login.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve
        })
      )
      mockAuthStorage.setAuthToken.mockResolvedValue()
      mockAuthStorage.setUserEmail.mockResolvedValue()

      const { getByPlaceholderText, getByText, UNSAFE_getByType } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const emailInput = getByPlaceholderText('email@example.com')
      const passwordInput = getByPlaceholderText('Password')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')

      const loginButton = getByText('Login')
      fireEvent.press(loginButton)

      await waitFor(() => {
        expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
      })

      resolveLogin!({ token: 'mock-token', email: 'test@example.com' })
    })
  })

  describe('change server', () => {
    it('should render change server link', () => {
      const { getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      expect(getByText('Change Server')).toBeTruthy()
    })

    it('should call onChangeServer when link pressed', () => {
      const { getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const link = getByText('Change Server')
      fireEvent.press(link)

      expect(mockOnChangeServer).toHaveBeenCalled()
    })

    it('should clear error when change server pressed', async () => {
      mockAuthClient.login.mockRejectedValue(new Error('Invalid credentials'))

      const { getByText, getByPlaceholderText, queryByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      // Trigger error
      fireEvent.changeText(getByPlaceholderText('email@example.com'), 'test@example.com')
      fireEvent.changeText(getByPlaceholderText('Password'), 'wrong')
      fireEvent.press(getByText('Login'))

      await waitFor(() => {
        expect(getByText('Invalid credentials')).toBeTruthy()
      })

      // Press change server
      fireEvent.press(getByText('Change Server'))

      expect(queryByText('Invalid credentials')).toBeNull()
    })

    it('should not be disabled during loading', async () => {
      let resolveLogin: (value: any) => void
      mockAuthClient.login.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve
        })
      )

      const { getByText, getByPlaceholderText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      fireEvent.changeText(getByPlaceholderText('email@example.com'), 'test@example.com')
      fireEvent.changeText(getByPlaceholderText('Password'), 'password')
      fireEvent.press(getByText('Login'))

      await waitFor(() => {
        expect(getByText('Logging in...')).toBeTruthy()
      })

      const changeServerLink = getByText('Change Server')
      expect(changeServerLink.props['accessibilityState']?.disabled).toBeFalsy()

      resolveLogin!({ token: 'token', email: 'test@example.com' })
    })
  })

  describe('registration', () => {
    it('should render registration link', () => {
      const { getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      expect(getByText('Don\'t have an account? Register')).toBeTruthy()
    })

    it('should call onRegister when link pressed', () => {
      const { getByText } = render(
        <LoginScreen
          authStorage={mockAuthStorage}
          authClient={mockAuthClient}
          onComplete={mockOnComplete}
          onChangeServer={mockOnChangeServer}
          onRegister={mockOnRegister}
        />
      )

      const link = getByText('Don\'t have an account? Register')
      fireEvent.press(link)

      expect(mockOnRegister).toHaveBeenCalledTimes(1)
    })
  })
})
