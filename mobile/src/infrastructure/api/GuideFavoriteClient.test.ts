import { GuideFavoriteClient } from './GuideFavoriteClient'

// Mock fetch globally
global.fetch = jest.fn()

describe('GuideFavoriteClient', () => {
  let client: GuideFavoriteClient
  const serverUrl = 'http://localhost:8000'
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
  const authToken = 'test-token'

  beforeEach(() => {
    client = new GuideFavoriteClient(serverUrl)
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should throw error for empty server URL', () => {
      expect(() => new GuideFavoriteClient('')).toThrow('Server URL cannot be empty')
    })

    it('should not duplicate /api/v1 when URL already includes it', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ guideIds: [] }),
      } as Response)

      const c = new GuideFavoriteClient('http://localhost:8000/api/v1')
      await c.getFavoriteGuideIds(authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guide-favorites',
        expect.any(Object),
      )
    })
  })

  describe('favoriteGuide', () => {
    it('should POST to favorite endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
      } as Response)

      await client.favoriteGuide('guide-123', authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guide-favorites/guides/guide-123',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      )
    })

    it('should throw on error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' }),
      } as Response)

      await expect(client.favoriteGuide('guide-123', authToken))
        .rejects.toThrow('Server error')
    })
  })

  describe('unfavoriteGuide', () => {
    it('should DELETE to unfavorite endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      await client.unfavoriteGuide('guide-123', authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guide-favorites/guides/guide-123',
        expect.objectContaining({
          method: 'DELETE',
        }),
      )
    })
  })

  describe('getFavoriteGuideIds', () => {
    it('should GET and return guide IDs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ guideIds: ['g1', 'g2', 'g3'] }),
      } as Response)

      const ids = await client.getFavoriteGuideIds(authToken)

      expect(ids).toEqual(['g1', 'g2', 'g3'])
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guide-favorites',
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })

    it('should return empty array when no favorites', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ guideIds: [] }),
      } as Response)

      const ids = await client.getFavoriteGuideIds(authToken)

      expect(ids).toEqual([])
    })

    it('should throw on error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      } as Response)

      await expect(client.getFavoriteGuideIds(authToken))
        .rejects.toThrow('Unauthorized')
    })
  })
})
