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
        json: async () => ({ token: 'mock-token-123', email: 'test@example.com' }),
      } as Response)

      const result = await authClient.login('test@example.com', 'password123')

      expect(result.token).toBe('mock-token-123')
      expect(result.email).toBe('test@example.com')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/login',
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

    it('should throw error when response is missing token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ email: 'test@example.com' }),
      } as Response)

      await expect(authClient.login('test@example.com', 'password123'))
        .rejects.toThrow('Invalid response from server')
    })

    it('should throw error when response is missing email', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ token: 'mock-token-123' }),
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
})
