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

    it('should not duplicate /api/v1 when URL already includes it (old app versions)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: 'token',
          tokenType: 'bearer',
          user: { id: '1', email: 'test@test.com', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isAdmin: false },
        }),
      } as Response)

      const client = new AuthClient('http://localhost:8000/api/v1')
      await client.login('test@test.com', 'password')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/login',
        expect.any(Object)
      )
    })

    it('should add /api/v1 when URL does not include it', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: 'token',
          tokenType: 'bearer',
          user: { id: '1', email: 'test@test.com', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isAdmin: false },
        }),
      } as Response)

      const client = new AuthClient('http://localhost:8000')
      await client.login('test@test.com', 'password')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/login',
        expect.any(Object)
      )
    })
  })

  describe('login', () => {
    it('should return token, email, and isAdmin on successful login', async () => {
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
            isAdmin: false,
          },
        }),
      } as Response)

      const result = await authClient.login('test@example.com', 'password123')

      expect(result.accessToken).toBe('mock-token-123')
      expect(result.tokenType).toBe('bearer')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.id).toBe('user-123')
      expect(result.user.isAdmin).toBe(false)
      const expectedFormData = new URLSearchParams()
      expectedFormData.append('username', 'test@example.com')
      expectedFormData.append('password', 'password123')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: expectedFormData.toString(),
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

    it('should handle FastAPI validation error array', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['body', 'email'],
              msg: 'value is not a valid email address',
              type: 'value_error.email',
            },
          ],
        }),
      } as Response)

      await expect(authClient.login('invalid-email', 'password123'))
        .rejects.toThrow('email: value is not a valid email address')
    })

    it('should handle isAdmin=true in login response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: 'mock-token-123',
          tokenType: 'bearer',
          user: {
            id: 'admin-user-123',
            email: 'admin@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isAdmin: true,
          },
        }),
      } as Response)

      const result = await authClient.login('admin@example.com', 'password123')

      expect(result.user.isAdmin).toBe(true)
    })

    it('should default isAdmin to false when missing in login response', async () => {
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
            // isAdmin is missing
          },
        }),
      } as Response)

      const result = await authClient.login('test@example.com', 'password123')

      expect(result.user.isAdmin).toBe(false)
    })
  })

  describe('register', () => {
    it('should return token, email, id, and isAdmin on successful registration', async () => {
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
            isAdmin: false,
          },
        }),
      } as Response)

      const result = await authClient.register('newuser@example.com', 'password123')

      expect(result.accessToken).toBe('mock-token-456')
      expect(result.tokenType).toBe('bearer')
      expect(result.user.email).toBe('newuser@example.com')
      expect(result.user.id).toBe('user-123')
      expect(result.user.isAdmin).toBe(false)
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

    it('should handle FastAPI validation error array for password', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['body', 'password'],
              msg: 'ensure this value has at least 6 characters',
              type: 'value_error.string.min_length',
            },
          ],
        }),
      } as Response)

      await expect(authClient.register('test@example.com', 'short'))
        .rejects.toThrow('password: ensure this value has at least 6 characters')
    })

    it('should handle isAdmin=true in register response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          accessToken: 'mock-token-456',
          tokenType: 'bearer',
          user: {
            id: 'admin-user-456',
            email: 'newadmin@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isAdmin: true,
          },
        }),
      } as Response)

      const result = await authClient.register('newadmin@example.com', 'password123')

      expect(result.user.isAdmin).toBe(true)
    })

    it('should default isAdmin to false when missing in register response', async () => {
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
            // isAdmin is missing
          },
        }),
      } as Response)

      const result = await authClient.register('newuser@example.com', 'password123')

      expect(result.user.isAdmin).toBe(false)
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

    it('should handle FastAPI validation error array for new password', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['body', 'newPassword'],
              msg: 'Password must contain at least one uppercase letter',
              type: 'value_error.password_requirements',
            },
          ],
        }),
      } as Response)

      await expect(
        authClient.changePassword('OldPassword123', 'newpassword456', authToken)
      ).rejects.toThrow('newPassword: Password must contain at least one uppercase letter')
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

    it('should handle FastAPI validation error array for email', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['body', 'newEmail'],
              msg: 'value is not a valid email address',
              type: 'value_error.email',
            },
          ],
        }),
      } as Response)

      await expect(
        authClient.changeEmail('invalid-email', 'Password123', authToken)
      ).rejects.toThrow('newEmail: value is not a valid email address')
    })
  })

  describe('getProfile', () => {
    const authToken = 'mock-auth-token-123'

    it('should throw error on 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      } as Response)

      await expect(authClient.getProfile(authToken))
        .rejects.toThrow('Unauthorized')
    })

    it('should handle FastAPI validation error array', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['header', 'authorization'],
              msg: 'Invalid token format',
              type: 'value_error.invalid_token',
            },
          ],
        }),
      } as Response)

      await expect(authClient.getProfile('invalid-token'))
        .rejects.toThrow('authorization: Invalid token format')
    })
  })

  describe('updateProfile', () => {
    const authToken = 'mock-auth-token-123'

    it('should return updated user on successful profile update', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'user-123',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          name: 'John Doe',
          interests: ['baking', 'sports'],
        }),
      } as Response)

      const result = await authClient.updateProfile('John Doe', ['baking', 'sports'], authToken)

      expect(result.id).toBe('user-123')
      expect(result.name).toBe('John Doe')
      expect(result.interests).toEqual(['baking', 'sports'])
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-auth-token-123',
          },
          body: JSON.stringify({
            name: 'John Doe',
            interests: ['baking', 'sports'],
          }),
        }
      )
    })

    it('should update only name when interests is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'user-123',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          name: 'Jane Doe',
          interests: null,
        }),
      } as Response)

      const result = await authClient.updateProfile('Jane Doe', null, authToken)

      expect(result.name).toBe('Jane Doe')
      expect(result.interests).toBeNull()
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/profile',
        expect.objectContaining({
          body: JSON.stringify({ name: 'Jane Doe', interests: null }),
        })
      )
    })

    it('should update only interests when name is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'user-123',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          name: null,
          interests: ['cooking'],
        }),
      } as Response)

      const result = await authClient.updateProfile(null, ['cooking'], authToken)

      expect(result.name).toBeNull()
      expect(result.interests).toEqual(['cooking'])
    })

    it('should throw error when auth token is expired', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      } as Response)

      await expect(
        authClient.updateProfile('John', ['sports'], 'expired-token')
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw generic error when response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)

      await expect(
        authClient.updateProfile('John', ['sports'], authToken)
      ).rejects.toThrow('Profile update failed')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      await expect(
        authClient.updateProfile('John', ['sports'], authToken)
      ).rejects.toThrow('Network request failed')
    })

    it('should throw error for empty auth token', async () => {
      await expect(
        authClient.updateProfile('John', ['sports'], '')
      ).rejects.toThrow('Auth token cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only auth token', async () => {
      await expect(
        authClient.updateProfile('John', ['sports'], '   ')
      ).rejects.toThrow('Auth token cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error when response is missing user data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await expect(
        authClient.updateProfile('John', ['sports'], authToken)
      ).rejects.toThrow('Invalid response from server')
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('unexpected error')

      await expect(
        authClient.updateProfile('John', ['sports'], authToken)
      ).rejects.toThrow('An unexpected error occurred during profile update')
    })

    it('should handle FastAPI validation error array for interests', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['body', 'interests'],
              msg: 'ensure this value has at most 10 items',
              type: 'value_error.list.max_items',
            },
          ],
        }),
      } as Response)

      await expect(
        authClient.updateProfile('John', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'], authToken)
      ).rejects.toThrow('interests: ensure this value has at most 10 items')
    })
  })

  describe('deleteAccount', () => {
    const authToken = 'mock-auth-token-123'

    it('should successfully delete account', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Account deleted successfully' }),
      } as Response)

      await authClient.deleteAccount('Password123', authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/account',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-auth-token-123',
          },
          body: JSON.stringify({ password: 'Password123' }),
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
        authClient.deleteAccount('WrongPassword', authToken)
      ).rejects.toThrow('Password is incorrect')
    })

    it('should throw error when auth token is expired', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      } as Response)

      await expect(
        authClient.deleteAccount('Password123', 'expired-token')
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw generic error when response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)

      await expect(
        authClient.deleteAccount('Password123', authToken)
      ).rejects.toThrow('Account deletion failed')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      await expect(
        authClient.deleteAccount('Password123', authToken)
      ).rejects.toThrow('Network request failed')
    })

    it('should throw error for empty password', async () => {
      await expect(
        authClient.deleteAccount('', authToken)
      ).rejects.toThrow('Password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only password', async () => {
      await expect(
        authClient.deleteAccount('   ', authToken)
      ).rejects.toThrow('Password cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for empty auth token', async () => {
      await expect(
        authClient.deleteAccount('Password123', '')
      ).rejects.toThrow('Auth token cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error for whitespace-only auth token', async () => {
      await expect(
        authClient.deleteAccount('Password123', '   ')
      ).rejects.toThrow('Auth token cannot be empty')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('unexpected error')

      await expect(
        authClient.deleteAccount('Password123', authToken)
      ).rejects.toThrow('An unexpected error occurred during account deletion')
    })

    it('should handle FastAPI validation error array for password', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['body', 'password'],
              msg: 'password does not meet complexity requirements',
              type: 'value_error.password_complexity',
            },
          ],
        }),
      } as Response)

      await expect(
        authClient.deleteAccount('password123', authToken)
      ).rejects.toThrow('password: password does not meet complexity requirements')
    })
  })
})
