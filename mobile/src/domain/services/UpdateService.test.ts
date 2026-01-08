import { UpdateService, UpdateCheckResult } from './UpdateService'
import { GitHubReleaseClient, GitHubRelease } from '../../infrastructure/api/GitHubReleaseClient'
import { UpdateCheckStorage } from '../../infrastructure/storage/UpdateCheckStorage'
import { UpdateCheckCache } from '../../infrastructure/storage/UpdateCheckCache'

// Mock dependencies
jest.mock('../../infrastructure/api/GitHubReleaseClient')
jest.mock('../../infrastructure/storage/UpdateCheckStorage')

describe('UpdateService', () => {
  let service: UpdateService
  let mockGitHubClient: jest.Mocked<GitHubReleaseClient>
  let mockStorage: jest.Mocked<UpdateCheckStorage>

  const mockRelease: GitHubRelease = {
    version: '1.15.0',
    tagName: 'v1.15.0',
    name: 'Version 1.15.0',
    body: 'Release notes',
    publishedAt: '2025-01-15T10:00:00Z',
    apkUrl: 'https://github.com/example/app/releases/download/v1.15.0/app.apk',
    isPrerelease: false,
  }

  beforeEach(() => {
    // Clear cache before each test
    UpdateCheckCache.clearCache()

    // Create mocks
    mockGitHubClient = {
      getLatestRelease: jest.fn(),
      getReleaseByTag: jest.fn(),
    } as unknown as jest.Mocked<GitHubReleaseClient>

    mockStorage = {
      getLastCheckTimestamp: jest.fn(),
      setLastCheckTimestamp: jest.fn(),
      shouldCheckForUpdates: jest.fn(),
      clearLastCheck: jest.fn(),
    } as unknown as jest.Mocked<UpdateCheckStorage>

    service = new UpdateService(mockGitHubClient, mockStorage, {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    UpdateCheckCache.clearCache()
  })

  describe('checkForUpdates', () => {
    it('should detect update available when latest > current', async () => {
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockResolvedValue(mockRelease)

      const result = await service.checkForUpdates('1.14.0', false)

      expect(result).toEqual({
        updateAvailable: true,
        isMandatory: false,
        currentVersion: '1.14.0',
        latestVersion: '1.15.0',
        release: mockRelease,
      })
      expect(mockGitHubClient.getLatestRelease).toHaveBeenCalledWith(false)
    })

    it('should return no update when current === latest', async () => {
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockResolvedValue({
        ...mockRelease,
        version: '1.14.0',
      })

      const result = await service.checkForUpdates('1.14.0', false)

      expect(result).toEqual({
        updateAvailable: false,
        isMandatory: false,
        currentVersion: '1.14.0',
        latestVersion: '1.14.0',
        release: null,
      })
    })

    it('should return no update when current > latest', async () => {
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockResolvedValue({
        ...mockRelease,
        version: '1.13.0',
      })

      const result = await service.checkForUpdates('1.14.0', false)

      expect(result).toEqual({
        updateAvailable: false,
        isMandatory: false,
        currentVersion: '1.14.0',
        latestVersion: '1.13.0',
        release: null,
      })
    })

    it('should mark update as mandatory when current < minAppVersion', async () => {
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockResolvedValue(mockRelease)

      const serviceWithMinVersion = new UpdateService(
        mockGitHubClient,
        mockStorage,
        { minAppVersion: '1.14.0' }
      )

      const result = await serviceWithMinVersion.checkForUpdates('1.13.0', false)

      expect(result.updateAvailable).toBe(true)
      expect(result.isMandatory).toBe(true)
    })

    it('should mark update as optional when current >= minAppVersion', async () => {
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockResolvedValue(mockRelease)

      const serviceWithMinVersion = new UpdateService(
        mockGitHubClient,
        mockStorage,
        { minAppVersion: '1.11.0' }
      )

      const result = await serviceWithMinVersion.checkForUpdates('1.14.0', false)

      expect(result.updateAvailable).toBe(true)
      expect(result.isMandatory).toBe(false)
    })

    it('should force check and bypass cache when forceCheck is true', async () => {
      // Set up a cached result
      UpdateCheckCache.setCache({
        latestVersion: '1.14.0',
        currentVersion: '1.14.0',
        updateAvailable: false,
        isMandatory: false,
        release: null,
        checkedAt: new Date(),
      })

      mockGitHubClient.getLatestRelease.mockResolvedValue(mockRelease)

      const result = await service.checkForUpdates('1.14.0', true)

      expect(mockGitHubClient.getLatestRelease).toHaveBeenCalled()
      expect(result.latestVersion).toBe('1.15.0')
      expect(result.updateAvailable).toBe(true)
    })

    it('should return cached result when not forcing and cache is valid', async () => {
      const cachedResult = {
        latestVersion: '1.15.0',
        currentVersion: '1.14.0',
        updateAvailable: true,
        isMandatory: false,
        release: mockRelease,
        checkedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      }

      UpdateCheckCache.setCache(cachedResult)

      const result = await service.checkForUpdates('1.14.0', false)

      expect(result).toEqual({
        updateAvailable: cachedResult.updateAvailable,
        isMandatory: cachedResult.isMandatory,
        currentVersion: cachedResult.currentVersion,
        latestVersion: cachedResult.latestVersion,
        release: cachedResult.release,
      })

      // Should not call GitHub API
      expect(mockGitHubClient.getLatestRelease).not.toHaveBeenCalled()
    })

    it('should skip check when last check was < 24h ago', async () => {
      UpdateCheckCache.clearCache() // No in-memory cache
      mockStorage.shouldCheckForUpdates.mockResolvedValue(false)

      const result = await service.checkForUpdates('1.14.0', false)

      expect(result).toEqual({
        updateAvailable: false,
        isMandatory: false,
        currentVersion: '1.14.0',
        latestVersion: '1.14.0',
        release: null,
      })

      // Should not call GitHub API
      expect(mockGitHubClient.getLatestRelease).not.toHaveBeenCalled()
    })

    it('should update cache and timestamp after successful check', async () => {
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockResolvedValue(mockRelease)

      await service.checkForUpdates('1.14.0', false)

      expect(mockStorage.setLastCheckTimestamp).toHaveBeenCalled()
      expect(UpdateCheckCache.hasCache()).toBe(true)

      const cachedResult = UpdateCheckCache.getCache()
      expect(cachedResult?.latestVersion).toBe('1.15.0')
    })

    it('should handle GitHub API errors gracefully', async () => {
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockRejectedValue(
        new Error('Network error')
      )

      const result = await service.checkForUpdates('1.14.0', false)

      expect(result).toEqual({
        updateAvailable: false,
        isMandatory: false,
        currentVersion: '1.14.0',
        latestVersion: '1.14.0',
        release: null,
      })

      // Should not crash the app
    })

    it('should return cached result on error if cache exists', async () => {
      const cachedResult = {
        latestVersion: '1.15.0',
        currentVersion: '1.14.0',
        updateAvailable: true,
        isMandatory: false,
        release: mockRelease,
        checkedAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago (stale)
      }

      UpdateCheckCache.setCache(cachedResult)
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockRejectedValue(
        new Error('Network error')
      )

      const result = await service.checkForUpdates('1.14.0', false)

      // Should return stale cache instead of crashing
      expect(result.updateAvailable).toBe(true)
      expect(result.latestVersion).toBe('1.15.0')
    })

    it('should handle null minAppVersion gracefully', async () => {
      mockStorage.shouldCheckForUpdates.mockResolvedValue(true)
      mockGitHubClient.getLatestRelease.mockResolvedValue(mockRelease)

      const serviceWithNullMinVersion = new UpdateService(
        mockGitHubClient,
        mockStorage,
        { minAppVersion: null }
      )

      const result = await serviceWithNullMinVersion.checkForUpdates(
        '1.14.0',
        false
      )

      expect(result.updateAvailable).toBe(true)
      expect(result.isMandatory).toBe(false)
    })

    it('should handle storage errors gracefully', async () => {
      mockStorage.shouldCheckForUpdates.mockRejectedValue(
        new Error('Storage error')
      )
      mockGitHubClient.getLatestRelease.mockResolvedValue(mockRelease)

      const result = await service.checkForUpdates('1.14.0', false)

      // Should still return valid result despite storage error
      expect(result.updateAvailable).toBe(false)
    })
  })

  describe('shouldShowUpdatePrompt', () => {
    it('should return false when no update available', () => {
      const result: UpdateCheckResult = {
        updateAvailable: false,
        isMandatory: false,
        currentVersion: '1.14.0',
        latestVersion: '1.14.0',
        release: null,
      }

      expect(service.shouldShowUpdatePrompt(result)).toBe(false)
    })

    it('should return true for mandatory updates', () => {
      const result: UpdateCheckResult = {
        updateAvailable: true,
        isMandatory: true,
        currentVersion: '1.14.0',
        latestVersion: '1.15.0',
        release: mockRelease,
      }

      expect(service.shouldShowUpdatePrompt(result)).toBe(true)
    })

    it('should return true for optional updates', () => {
      const result: UpdateCheckResult = {
        updateAvailable: true,
        isMandatory: false,
        currentVersion: '1.14.0',
        latestVersion: '1.15.0',
        release: mockRelease,
      }

      expect(service.shouldShowUpdatePrompt(result)).toBe(true)
    })
  })
})
