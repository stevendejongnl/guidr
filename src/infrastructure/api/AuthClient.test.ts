import { AuthClient } from './AuthClient'

// Mock fetch globally
global.fetch = jest.fn()

describe('AuthClient', () => {
  let authClient: AuthClient
  const serverUrl = 'http://localhost:8000'
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    authClient = new AuthClient(serverUrl)
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should throw error for empty server URL', () => {
      expect(() => new AuthClient('')).toThrow('Server URL cannot be empty')
    })

    it('should throw error for whitespace-only server URL', () => {
      expect(() => new AuthClient('   ')).toThrow('Server URL cannot be empty')
    })

    it('should remove trailing slash from server URL', () => {
      const client = new AuthClient('http://localhost:8000/')
      expect(client).toBeDefined()
    })
  })

  describe('login', () => {
    it('should return token and email on successful login', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: 'mock-token-123',
          tokenType: 'bearer',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        }),
      } as Response)

      const result = await authClient.login('test@example.com', 'password123')

      expect(result.accessToken).toBe('mock-token-123')
      expect(result.tokenType).toBe('bearer')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.id).toBe('user-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        }
      )
    })

    it('should throw error on 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid email or password' }),
      } as Response)

      await expect(authClient.login('test@example.com', 'wrong'))
        .rejects.toThrow('Invalid email or password')
    })

    it('should throw generic error when response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)

      await expect(authClient.login('test@example.com', 'password123'))
        .rejects.toThrow('Login failed')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      await expect(authClient.login('test@example.com', 'password123'))
        .rejects.toThrow('Network request failed')
    })

    it('should throw error for empty email', async () => {
      await expect(authClient.login('', 'password123'))
        .rejects.toThrow('Email cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only email', async () => {
      await expect(authClient.login('   ', 'password123'))
        .rejects.toThrow('Email cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for empty password', async () => {
      await expect(authClient.login('test@example.com', ''))
        .rejects.toThrow('Password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only password', async () => {
      await expect(authClient.login('test@example.com', '   '))
        .rejects.toThrow('Password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error when response is missing accessToken', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          tokenType: 'bearer',
          user: { id: 'user-123', email: 'test@example.com', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        }),
      } as Response)

      await expect(authClient.login('test@example.com', 'password123'))
        .rejects.toThrow('Invalid response from server')
    })

    it('should throw error when response is missing user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'mock-token-123', tokenType: 'bearer' }),
      } as Response)

      await expect(authClient.login('test@example.com', 'password123'))
        .rejects.toThrow('Invalid response from server')
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('unexpected error')

      await expect(authClient.login('test@example.com', 'password123'))
        .rejects.toThrow('An unexpected error occurred during login')
    })
  })

  describe('register', () => {
    it('should return token, email, and id on successful registration', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          accessToken: 'mock-token-456',
          tokenType: 'bearer',
          user: {
            id: 'user-123',
            email: 'newuser@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        }),
      } as Response)

      const result = await authClient.register('newuser@example.com', 'password123')

      expect(result.accessToken).toBe('mock-token-456')
      expect(result.tokenType).toBe('bearer')
      expect(result.user.email).toBe('newuser@example.com')
      expect(result.user.id).toBe('user-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'newuser@example.com', password: 'password123' }),
        }
      )
    })

    it('should throw error on 409 conflict (duplicate email)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Email already registered' }),
      } as Response)

      await expect(authClient.register('existing@example.com', 'password123'))
        .rejects.toThrow('Email already registered')
    })

    it('should throw generic error when response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)

      await expect(authClient.register('test@example.com', 'password123'))
        .rejects.toThrow('Registration failed')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      await expect(authClient.register('test@example.com', 'password123'))
        .rejects.toThrow('Network request failed')
    })

    it('should throw error for empty email', async () => {
      await expect(authClient.register('', 'password123'))
        .rejects.toThrow('Email cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only email', async () => {
      await expect(authClient.register('   ', 'password123'))
        .rejects.toThrow('Email cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for empty password', async () => {
      await expect(authClient.register('test@example.com', ''))
        .rejects.toThrow('Password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only password', async () => {
      await expect(authClient.register('test@example.com', '   '))
        .rejects.toThrow('Password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error when response is missing accessToken', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          tokenType: 'bearer',
          user: { email: 'test@example.com', id: 'user-123', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        }),
      } as Response)

      await expect(authClient.register('test@example.com', 'password123'))
        .rejects.toThrow('Invalid response from server')
    })

    it('should throw error when response is missing user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ accessToken: 'mock-token-123', tokenType: 'bearer' }),
      } as Response)

      await expect(authClient.register('test@example.com', 'password123'))
        .rejects.toThrow('Invalid response from server')
    })

    it('should throw error when response is missing user.id', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          accessToken: 'mock-token-123',
          tokenType: 'bearer',
          user: { email: 'test@example.com', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        }),
      } as Response)

      await expect(authClient.register('test@example.com', 'password123'))
        .rejects.toThrow('Invalid response from server')
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('unexpected error')

      await expect(authClient.register('test@example.com', 'password123'))
        .rejects.toThrow('An unexpected error occurred during registration')
    })
  })

  describe('changePassword', () => {
    const authToken = 'mock-auth-token-123'

    it('should successfully change password', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Password changed successfully' }),
      } as Response)

      await authClient.changePassword('OldPassword123', 'NewPassword456', authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/change-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-auth-token-123',
          },
          body: JSON.stringify({
            oldPassword: 'OldPassword123',
            newPassword: 'NewPassword456',
          }),
        }
      )
    })

    it('should throw error when old password is incorrect', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Current password is incorrect' }),
      } as Response)

      await expect(
        authClient.changePassword('WrongPassword', 'NewPassword456', authToken)
      ).rejects.toThrow('Current password is incorrect')
    })

    it('should throw error when new password is invalid', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Password must be at least 6 characters' }),
      } as Response)

      await expect(
        authClient.changePassword('OldPassword123', 'short', authToken)
      ).rejects.toThrow('Password must be at least 6 characters')
    })

    it('should throw error when auth token is expired', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      } as Response)

      await expect(
        authClient.changePassword('OldPassword123', 'NewPassword456', 'expired-token')
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw generic error when response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)

      await expect(
        authClient.changePassword('OldPassword123', 'NewPassword456', authToken)
      ).rejects.toThrow('Password change failed')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      await expect(
        authClient.changePassword('OldPassword123', 'NewPassword456', authToken)
      ).rejects.toThrow('Network request failed')
    })

    it('should throw error for empty old password', async () => {
      await expect(
        authClient.changePassword('', 'NewPassword456', authToken)
      ).rejects.toThrow('Old password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only old password', async () => {
      await expect(
        authClient.changePassword('   ', 'NewPassword456', authToken)
      ).rejects.toThrow('Old password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for empty new password', async () => {
      await expect(
        authClient.changePassword('OldPassword123', '', authToken)
      ).rejects.toThrow('New password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only new password', async () => {
      await expect(
        authClient.changePassword('OldPassword123', '   ', authToken)
      ).rejects.toThrow('New password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for empty auth token', async () => {
      await expect(
        authClient.changePassword('OldPassword123', 'NewPassword456', '')
      ).rejects.toThrow('Auth token cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only auth token', async () => {
      await expect(
        authClient.changePassword('OldPassword123', 'NewPassword456', '   ')
      ).rejects.toThrow('Auth token cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('unexpected error')

      await expect(
        authClient.changePassword('OldPassword123', 'NewPassword456', authToken)
      ).rejects.toThrow('An unexpected error occurred during password change')
    })
  })

  describe('changeEmail', () => {
    const authToken = 'mock-auth-token-123'

    it('should return new token and user on successful email change', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: 'new-mock-token-456',
          tokenType: 'bearer',
          user: {
            id: 'user-123',
            email: 'newemail@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        }),
      } as Response)

      const result = await authClient.changeEmail(
        'newemail@example.com',
        'Password123',
        authToken
      )

      expect(result.accessToken).toBe('new-mock-token-456')
      expect(result.tokenType).toBe('bearer')
      expect(result.user.email).toBe('newemail@example.com')
      expect(result.user.id).toBe('user-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/change-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-auth-token-123',
          },
          body: JSON.stringify({
            newEmail: 'newemail@example.com',
            password: 'Password123',
          }),
        }
      )
    })

    it('should throw error when password is incorrect', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Password is incorrect' }),
      } as Response)

      await expect(
        authClient.changeEmail('newemail@example.com', 'WrongPassword', authToken)
      ).rejects.toThrow('Password is incorrect')
    })

    it('should throw error when email is invalid', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid email format' }),
      } as Response)

      await expect(
        authClient.changeEmail('invalid-email', 'Password123', authToken)
      ).rejects.toThrow('Invalid email format')
    })

    it('should throw error when email already in use', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Email already in use' }),
      } as Response)

      await expect(
        authClient.changeEmail('existing@example.com', 'Password123', authToken)
      ).rejects.toThrow('Email already in use')
    })

    it('should throw error when auth token is expired', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      } as Response)

      await expect(
        authClient.changeEmail('newemail@example.com', 'Password123', 'expired-token')
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw generic error when response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)

      await expect(
        authClient.changeEmail('newemail@example.com', 'Password123', authToken)
      ).rejects.toThrow('Email change failed')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      await expect(
        authClient.changeEmail('newemail@example.com', 'Password123', authToken)
      ).rejects.toThrow('Network request failed')
    })

    it('should throw error for empty new email', async () => {
      await expect(
        authClient.changeEmail('', 'Password123', authToken)
      ).rejects.toThrow('New email cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only new email', async () => {
      await expect(
        authClient.changeEmail('   ', 'Password123', authToken)
      ).rejects.toThrow('New email cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for empty password', async () => {
      await expect(
        authClient.changeEmail('newemail@example.com', '', authToken)
      ).rejects.toThrow('Password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only password', async () => {
      await expect(
        authClient.changeEmail('newemail@example.com', '   ', authToken)
      ).rejects.toThrow('Password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for empty auth token', async () => {
      await expect(
        authClient.changeEmail('newemail@example.com', 'Password123', '')
      ).rejects.toThrow('Auth token cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only auth token', async () => {
      await expect(
        authClient.changeEmail('newemail@example.com', 'Password123', '   ')
      ).rejects.toThrow('Auth token cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error when response is missing accessToken', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          tokenType: 'bearer',
          user: { id: 'user-123', email: 'new@example.com', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        }),
      } as Response)

      await expect(
        authClient.changeEmail('new@example.com', 'Password123', authToken)
      ).rejects.toThrow('Invalid response from server')
    })

    it('should throw error when response is missing user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'new-token-123', tokenType: 'bearer' }),
      } as Response)

      await expect(
        authClient.changeEmail('new@example.com', 'Password123', authToken)
      ).rejects.toThrow('Invalid response from server')
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('unexpected error')

      await expect(
        authClient.changeEmail('new@example.com', 'Password123', authToken)
      ).rejects.toThrow('An unexpected error occurred during email change')
    })
  })
})
