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
})
