import { ServerConfigClient } from './ServerConfigClient'

// Mock fetch globally
global.fetch = jest.fn()

describe('ServerConfigClient', () => {
  let configClient: ServerConfigClient
  const serverUrl = 'http://localhost:8000'
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    configClient = new ServerConfigClient(serverUrl)
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should throw error for empty server URL', () => {
      expect(() => new ServerConfigClient('')).toThrow('Server URL cannot be empty')
    })

    it('should throw error for whitespace-only server URL', () => {
      expect(() => new ServerConfigClient('   ')).toThrow('Server URL cannot be empty')
    })

    it('should remove trailing slash from server URL', () => {
      const client = new ServerConfigClient('http://localhost:8000/')
      expect(client).toBeDefined()
    })
  })

  describe('getConfig', () => {
    it('should return config on successful request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ debugMode: true }),
      } as Response)

      const result = await configClient.getConfig()

      expect(result.debugMode).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/config',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )
    })

    it('should return debugMode false when server returns false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ debugMode: false }),
      } as Response)

      const result = await configClient.getConfig()

      expect(result.debugMode).toBe(false)
    })

    it('should throw error on 404 not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' }),
      } as Response)

      await expect(configClient.getConfig())
        .rejects.toThrow('Not found')
    })

    it('should throw generic error when response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)

      await expect(configClient.getConfig())
        .rejects.toThrow('Failed to fetch server config')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      await expect(configClient.getConfig())
        .rejects.toThrow('Network request failed')
    })

    it('should throw error when debugMode is not a boolean', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ debugMode: 'true' }),
      } as Response)

      await expect(configClient.getConfig())
        .rejects.toThrow('Invalid response from server')
    })

    it('should throw error when debugMode is missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await expect(configClient.getConfig())
        .rejects.toThrow('Invalid response from server')
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('unexpected error')

      await expect(configClient.getConfig())
        .rejects.toThrow('An unexpected error occurred while fetching config')
    })
  })
})
