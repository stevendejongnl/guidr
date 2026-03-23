import { expect } from '@open-wc/testing'
import { ApiClient, ApiError } from './api-client.js'

describe('ApiClient', () => {
  let client: ApiClient
  const originalFetch = window.fetch

  beforeEach(() => {
    client = new ApiClient('http://localhost:8000/api/v1')
  })

  afterEach(() => {
    window.fetch = originalFetch
  })

  function mockFetch(status: number, body: unknown) {
    window.fetch = async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
  }

  function mockFetchEmpty(status = 204) {
    window.fetch = async () => new Response(null, { status })
  }

  function mockFetchNetworkError() {
    window.fetch = async () => {
      throw new Error('Failed to fetch')
    }
  }

  describe('constructor', () => {
    it('uses provided base URL', () => {
      const c = new ApiClient('/api/v1')
      expect(c).to.exist
    })

    it('uses default base URL when none provided', () => {
      const c = new ApiClient()
      expect(c).to.exist
    })

    it('injects auth token from getter', async () => {
      let capturedHeaders: HeadersInit | undefined
      window.fetch = async (_url: RequestInfo | URL, opts?: RequestInit) => {
        capturedHeaders = opts?.headers
        return new Response(JSON.stringify({ result: true }), { status: 200 })
      }
      const c = new ApiClient('/api/v1', () => 'my-token')
      await c.get('/test')
      expect((capturedHeaders as Record<string, string>)['Authorization']).to.equal('Bearer my-token')
    })

    it('omits auth header when getter returns null', async () => {
      let capturedHeaders: HeadersInit | undefined
      window.fetch = async (_url: RequestInfo | URL, opts?: RequestInit) => {
        capturedHeaders = opts?.headers
        return new Response(JSON.stringify({}), { status: 200 })
      }
      const c = new ApiClient('/api/v1', () => null)
      await c.get('/test')
      expect((capturedHeaders as Record<string, string>)['Authorization']).to.be.undefined
    })
  })

  describe('HTTP methods', () => {
    it('GET request succeeds', async () => {
      mockFetch(200, { id: 1 })
      const result = await client.get<{ id: number }>('/items')
      expect(result.id).to.equal(1)
    })

    it('POST request succeeds', async () => {
      mockFetch(201, { id: 2, name: 'created' })
      const result = await client.post<{ id: number }>('/items', { name: 'test' })
      expect(result.id).to.equal(2)
    })

    it('PUT request succeeds', async () => {
      mockFetch(200, { id: 3, name: 'updated' })
      const result = await client.put<{ id: number }>('/items/3', { name: 'updated' })
      expect(result.id).to.equal(3)
    })

    it('PATCH request succeeds', async () => {
      mockFetch(200, { id: 4, name: 'patched' })
      const result = await client.patch<{ id: number }>('/items/4', { name: 'patched' })
      expect(result.id).to.equal(4)
    })

    it('DELETE request succeeds', async () => {
      mockFetch(200, { deleted: true })
      const result = await client.delete<{ deleted: boolean }>('/items/5')
      expect(result.deleted).to.be.true
    })

    it('handles 204 No Content as empty object', async () => {
      mockFetchEmpty(204)
      const result = await client.delete('/items/6')
      expect(result).to.deep.equal({})
    })
  })

  describe('error handling', () => {
    it('throws ApiError on non-ok response with detail field', async () => {
      window.fetch = async () =>
        new Response(JSON.stringify({ detail: 'Validation error' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      try {
        await client.get('/fail')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError)
        expect((err as ApiError).message).to.equal('Validation error')
        expect((err as ApiError).status).to.equal(400)
      }
    })

    it('throws ApiError with statusText when response body has no detail', async () => {
      window.fetch = async () =>
        new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        })
      try {
        await client.get('/missing')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError)
        expect((err as ApiError).status).to.equal(404)
      }
    })

    it('wraps network error in Error', async () => {
      mockFetchNetworkError()
      try {
        await client.get('/network-fail')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(Error)
        expect((err as Error).message).to.include('Network error')
      }
    })
  })

  describe('401 retry with token refresh', () => {
    it('retries with new token on 401 and succeeds', async () => {
      let callCount = 0
      window.fetch = async () => {
        callCount++
        if (callCount === 1) {
          return new Response(JSON.stringify({ detail: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ id: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const c = new ApiClient('/api/v1', () => 'old-token')
      c.setOnUnauthorized(async () => 'new-token')
      const result = await c.get<{ id: number }>('/items')
      expect(result.id).to.equal(1)
      expect(callCount).to.equal(2)
    })

    it('throws after retry still returns 401', async () => {
      window.fetch = async () =>
        new Response(JSON.stringify({ detail: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      const c = new ApiClient('/api/v1', () => 'old-token')
      c.setOnUnauthorized(async () => 'new-token')
      try {
        await c.get('/items')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError)
        expect((err as ApiError).status).to.equal(401)
      }
    })

    it('throws ApiError directly on 401 when no onUnauthorized handler', async () => {
      mockFetch(401, { detail: 'Unauthorized' })
      try {
        await client.get('/items')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError)
        expect((err as ApiError).status).to.equal(401)
      }
    })

    it('uses new token in retry Authorization header', async () => {
      let retryHeaders: Record<string, string> | undefined
      let callCount = 0
      window.fetch = async (_url: RequestInfo | URL, opts?: RequestInit) => {
        callCount++
        if (callCount === 1) {
          return new Response(JSON.stringify({ detail: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        retryHeaders = opts?.headers as Record<string, string>
        return new Response(JSON.stringify({}), { status: 200 })
      }
      const c = new ApiClient('/api/v1', () => 'old-token')
      c.setOnUnauthorized(async () => 'refreshed-token')
      await c.get('/items')
      expect(retryHeaders?.['Authorization']).to.equal('Bearer refreshed-token')
    })
  })

  describe('ApiError', () => {
    it('has correct name, status, and message', () => {
      const err = new ApiError(422, 'Unprocessable', 'custom message')
      expect(err.name).to.equal('ApiError')
      expect(err.status).to.equal(422)
      expect(err.statusText).to.equal('Unprocessable')
      expect(err.message).to.equal('custom message')
    })

    it('uses default HTTP message when no custom message', () => {
      const err = new ApiError(500, 'Internal Server Error')
      expect(err.message).to.equal('HTTP 500: Internal Server Error')
    })
  })
})
