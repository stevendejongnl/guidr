import { GitHubReleaseClient, GitHubRelease } from './GitHubReleaseClient'

// Mock fetch globally
global.fetch = jest.fn()

describe('GitHubReleaseClient', () => {
  let client: GitHubReleaseClient

  beforeEach(() => {
    client = new GitHubReleaseClient()
    ;(fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getLatestRelease', () => {
    it('should fetch and parse latest release successfully', async () => {
      const mockResponse = {
        tag_name: 'v1.15.0',
        name: 'Version 1.15.0',
        body: '## Changes\n- Fixed bug\n- Added feature',
        published_at: '2025-01-15T10:00:00Z',
        prerelease: false,
        assets: [
          {
            name: 'guidr-v1.15.0.apk',
            browser_download_url:
              'https://github.com/stevendejongnl/guidr/releases/download/v1.15.0/guidr-v1.15.0.apk',
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      const result: GitHubRelease = await client.getLatestRelease()

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/stevendejongnl/guidr/releases/latest',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Accept: 'application/vnd.github+json',
          }),
        })
      )

      expect(result).toEqual({
        version: '1.15.0',
        tagName: 'v1.15.0',
        name: 'Version 1.15.0',
        body: '## Changes\n- Fixed bug\n- Added feature',
        publishedAt: '2025-01-15T10:00:00Z',
        apkUrl:
          'https://github.com/stevendejongnl/guidr/releases/download/v1.15.0/guidr-v1.15.0.apk',
        isPrerelease: false,
      })
    })

    it('should strip v prefix from tag name', async () => {
      const mockResponse = {
        tag_name: 'v2.0.0',
        name: 'Major Release',
        body: 'Breaking changes',
        published_at: '2025-02-01T12:00:00Z',
        prerelease: false,
        assets: [
          {
            name: 'guidr-v2.0.0.apk',
            browser_download_url:
              'https://github.com/stevendejongnl/guidr/releases/download/v2.0.0/guidr-v2.0.0.apk',
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      const result = await client.getLatestRelease()
      expect(result.version).toBe('2.0.0')
      expect(result.tagName).toBe('v2.0.0')
    })

    it('should handle tag without v prefix', async () => {
      const mockResponse = {
        tag_name: '1.14.0',
        name: 'Release',
        body: 'Changes',
        published_at: '2025-01-10T10:00:00Z',
        prerelease: false,
        assets: [
          {
            name: 'guidr-v1.14.0.apk',
            browser_download_url:
              'https://github.com/example/app/releases/download/1.14.0/guidr-v1.14.0.apk',
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      const result = await client.getLatestRelease()
      expect(result.version).toBe('1.14.0')
      expect(result.tagName).toBe('1.14.0')
    })

    it('should throw error when APK asset is missing', async () => {
      const mockResponse = {
        tag_name: 'v1.15.0',
        name: 'Version 1.15.0',
        body: 'Release notes',
        published_at: '2025-01-15T10:00:00Z',
        prerelease: false,
        assets: [
          {
            name: 'source.zip',
            browser_download_url:
              'https://github.com/example/app/archive/v1.15.0.zip',
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      await expect(client.getLatestRelease()).rejects.toThrow(
        /APK file not found in release assets/
      )
    })

    it('should throw error when no assets exist', async () => {
      const mockResponse = {
        tag_name: 'v1.15.0',
        name: 'Version 1.15.0',
        body: 'Release notes',
        published_at: '2025-01-15T10:00:00Z',
        prerelease: false,
        assets: [],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      await expect(client.getLatestRelease()).rejects.toThrow(
        /APK file not found in release assets/
      )
    })

    it('should handle GitHub API rate limiting', async () => {
      const mockHeaders = new Map()
      mockHeaders.set('X-RateLimit-Remaining', '0')
      mockHeaders.set('X-RateLimit-Reset', '1736947200') // 2025-01-15 12:00:00

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        headers: mockHeaders,
        json: async () => ({}),
      })

      await expect(client.getLatestRelease()).rejects.toThrow(
        /GitHub API rate limit exceeded/
      )
    })

    it('should handle network failures', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(client.getLatestRelease()).rejects.toThrow('Network error')
    })

    it('should handle 404 errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
        headers: new Map(),
      })

      await expect(client.getLatestRelease()).rejects.toThrow('Not Found')
    })

    it('should handle invalid response structure (missing tag_name)', async () => {
      const mockResponse = {
        name: 'Version 1.15.0',
        body: 'Release notes',
        published_at: '2025-01-15T10:00:00Z',
        prerelease: false,
        assets: [],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      await expect(client.getLatestRelease()).rejects.toThrow(
        'Invalid response from GitHub API'
      )
    })

    it('should handle invalid response structure (missing name)', async () => {
      const mockResponse = {
        tag_name: 'v1.15.0',
        body: 'Release notes',
        published_at: '2025-01-15T10:00:00Z',
        prerelease: false,
        assets: [],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      await expect(client.getLatestRelease()).rejects.toThrow(
        'Invalid response from GitHub API'
      )
    })

    it('should handle empty body field', async () => {
      const mockResponse = {
        tag_name: 'v1.15.0',
        name: 'Version 1.15.0',
        body: null,
        published_at: '2025-01-15T10:00:00Z',
        prerelease: false,
        assets: [
          {
            name: 'guidr-v1.15.0.apk',
            browser_download_url:
              'https://github.com/example/app/releases/download/v1.15.0/guidr-v1.15.0.apk',
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      const result = await client.getLatestRelease()
      expect(result.body).toBe('')
    })

    it('should fetch prereleases when includePrerelease is true', async () => {
      const mockResponse = [
        {
          tag_name: 'v1.16.0-beta.1',
          name: 'Beta Release',
          body: 'Beta features',
          published_at: '2025-01-20T10:00:00Z',
          prerelease: true,
          assets: [
            {
              name: 'guidr-v1.16.0-beta.1.apk',
              browser_download_url:
                'https://github.com/example/app/releases/download/v1.16.0-beta.1/guidr-v1.16.0-beta.1.apk',
            },
          ],
        },
      ]

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      const result = await client.getLatestRelease(true)

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/stevendejongnl/guidr/releases',
        expect.any(Object)
      )

      expect(result.version).toBe('1.16.0-beta.1')
      expect(result.isPrerelease).toBe(true)
    })

    it('should throw error when no releases found for prerelease request', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: new Map(),
      })

      await expect(client.getLatestRelease(true)).rejects.toThrow(
        'No releases found'
      )
    })
  })

  describe('getReleaseByTag', () => {
    it('should fetch release by specific tag', async () => {
      const mockResponse = {
        tag_name: 'v1.14.0',
        name: 'Version 1.14.0',
        body: 'Previous release',
        published_at: '2025-01-01T10:00:00Z',
        prerelease: false,
        assets: [
          {
            name: 'guidr-v1.14.0.apk',
            browser_download_url:
              'https://github.com/example/app/releases/download/v1.14.0/guidr-v1.14.0.apk',
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      const result = await client.getReleaseByTag('v1.14.0')

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/stevendejongnl/guidr/releases/tags/v1.14.0',
        expect.objectContaining({
          method: 'GET',
        })
      )

      expect(result.version).toBe('1.14.0')
      expect(result.tagName).toBe('v1.14.0')
    })

    it('should handle release without APK asset', async () => {
      const mockResponse = {
        tag_name: 'v1.13.0',
        name: 'Old Release',
        body: 'Before APK uploads',
        published_at: '2024-12-01T10:00:00Z',
        prerelease: false,
        assets: [],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map(),
      })

      const result = await client.getReleaseByTag('v1.13.0')
      expect(result.apkUrl).toBeNull()
    })

    it('should throw error for non-existent tag', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
        headers: new Map(),
      })

      await expect(client.getReleaseByTag('v99.99.99')).rejects.toThrow(
        'Not Found'
      )
    })
  })
})
