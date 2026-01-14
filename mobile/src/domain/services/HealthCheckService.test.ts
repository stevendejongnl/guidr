import { HealthCheckService } from './HealthCheckService'

// Mock fetch globally
global.fetch = jest.fn()

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    healthCheckService = new HealthCheckService()
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('validateServer', () => {
    it('should call /api/v1/health endpoint with correct URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      await healthCheckService.validateServer('https://example.com')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/v1/health',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should return healthy=true when server returns status healthy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(true)
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBeUndefined()
    })

    it('should normalize URLs by stripping /api/v1 suffix', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      await healthCheckService.validateServer('https://example.com/api/v1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/v1/health',
        expect.anything()
      )
    })

    it('should normalize URLs by stripping /api/v1/ with trailing slash', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      await healthCheckService.validateServer('https://example.com/api/v1/')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/v1/health',
        expect.anything()
      )
    })

    it('should remove trailing slashes from URLs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      await healthCheckService.validateServer('https://example.com/')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/v1/health',
        expect.anything()
      )
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('Network request failed')
    })

    it('should handle non-200 HTTP responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('404')
    })

    it('should handle 503 Server Unavailable', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('503')
    })

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should measure response time accurately', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(typeof result.responseTime).toBe('number')
    })

    it('should validate HTTP protocol URLs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      const result = await healthCheckService.validateServer('http://example.com')

      expect(result.healthy).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com/api/v1/health',
        expect.anything()
      )
    })

    it('should validate HTTPS protocol URLs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(true)
    })

    it('should return false for invalid health status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'degraded' }),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('Invalid health status')
    })

    it('should return false when health status is missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('Invalid health status')
    })

    it('should handle timeout with AbortController', async () => {
      // Test that abort errors are handled as timeouts
      // Mock fetch to throw an AbortError (what happens when request times out)
      mockFetch.mockImplementation(() => {
        const error = new Error('The operation was aborted.')
        error.name = 'AbortError'
        throw error
      })

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toBe('Request timeout')
    })

    it('should handle connection refused errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'))

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('Connection refused')
    })

    it('should not strip /api/v1 from path segments (e.g., /api/v1/foo)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      // Note: /api/v1/foo should normalize to /api/v1/foo (not strip /api/v1)
      // But our normalization strips /api/v1 from the END only with regex /\/api\/v1\/?$/
      // So /api/v1/foo won't match the regex and will remain /api/v1/foo
      await healthCheckService.validateServer('https://example.com/api/v1/foo')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/v1/foo/api/v1/health',
        expect.anything()
      )
    })

    it('should handle URLs with port numbers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      await healthCheckService.validateServer('http://localhost:8000')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/health',
        expect.anything()
      )
    })

    it('should handle URLs with subdomains', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as Response)

      await healthCheckService.validateServer('https://api.example.com')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/health',
        expect.anything()
      )
    })

    it('should handle fetch being rejected with non-Error object', async () => {
      mockFetch.mockRejectedValue('Unknown error')

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle 502 Bad Gateway', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({}),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('502')
    })

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      } as Response)

      const result = await healthCheckService.validateServer('https://example.com')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('500')
    })
  })
})
