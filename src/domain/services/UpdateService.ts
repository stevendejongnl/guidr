import { GitHubReleaseClient, GitHubRelease } from '../../infrastructure/api/GitHubReleaseClient'
import { UpdateCheckStorage } from '../../infrastructure/storage/UpdateCheckStorage'
import { UpdateCheckCache, CachedUpdateInfo } from '../../infrastructure/storage/UpdateCheckCache'
import { compareVersions } from '../../common/VersionUtils'

export interface UpdateCheckResult {
  updateAvailable: boolean
  isMandatory: boolean
  currentVersion: string
  latestVersion: string
  release: GitHubRelease | null
}

export interface ServerConfig {
  minAppVersion?: string | null
  maxAppVersion?: string | null
}

export class UpdateService {
  constructor(
    private githubClient: GitHubReleaseClient,
    private updateStorage: UpdateCheckStorage,
    private serverConfig: ServerConfig
  ) {}

  async checkForUpdates(
    currentVersion: string,
    forceCheck: boolean = false
  ): Promise<UpdateCheckResult> {
    try {
      // If not forced and in-memory cache is valid (< 24h), return cached result
      if (!forceCheck && UpdateCheckCache.isCacheValid()) {
        const cachedResult = UpdateCheckCache.getCache()
        if (cachedResult) {
          return {
            updateAvailable: cachedResult.updateAvailable,
            isMandatory: cachedResult.isMandatory,
            currentVersion: cachedResult.currentVersion,
            latestVersion: cachedResult.latestVersion,
            release: cachedResult.release,
          }
        }
      }

      // If not forced and last check was < 24h ago, return no update
      if (!forceCheck) {
        const shouldCheck = await this.updateStorage.shouldCheckForUpdates()
        if (!shouldCheck) {
          // Return cached result or no update
          const cachedResult = UpdateCheckCache.getCache()
          if (cachedResult) {
            return {
              updateAvailable: cachedResult.updateAvailable,
              isMandatory: cachedResult.isMandatory,
              currentVersion: cachedResult.currentVersion,
              latestVersion: cachedResult.latestVersion,
              release: cachedResult.release,
            }
          }

          return {
            updateAvailable: false,
            isMandatory: false,
            currentVersion,
            latestVersion: currentVersion,
            release: null,
          }
        }
      }

      // Perform fresh check
      const release = await this.githubClient.getLatestRelease(false)
      const latestVersion = release.version

      // Compare versions
      const updateAvailable = compareVersions(currentVersion, latestVersion) < 0

      // Determine if mandatory
      const isMandatory = this.determineIfMandatory(
        currentVersion,
        latestVersion,
        this.serverConfig.minAppVersion
      )

      const result: UpdateCheckResult = {
        updateAvailable,
        isMandatory,
        currentVersion,
        latestVersion,
        release: updateAvailable ? release : null,
      }

      // Update cache and timestamp
      const cacheInfo: CachedUpdateInfo = {
        ...result,
        checkedAt: new Date(),
      }
      UpdateCheckCache.setCache(cacheInfo)
      await this.updateStorage.setLastCheckTimestamp(new Date())

      return result
    } catch (error) {
      // On error, don't block the app - return no update available
      console.error('Update check failed:', error)

      // If we have a cached result, return it even if stale
      const cachedResult = UpdateCheckCache.getCache()
      if (cachedResult) {
        return {
          updateAvailable: cachedResult.updateAvailable,
          isMandatory: cachedResult.isMandatory,
          currentVersion: cachedResult.currentVersion,
          latestVersion: cachedResult.latestVersion,
          release: cachedResult.release,
        }
      }

      // No cache, return no update
      return {
        updateAvailable: false,
        isMandatory: false,
        currentVersion,
        latestVersion: currentVersion,
        release: null,
      }
    }
  }

  shouldShowUpdatePrompt(result: UpdateCheckResult): boolean {
    if (!result.updateAvailable) {
      return false
    }

    // Always show mandatory updates
    if (result.isMandatory) {
      return true
    }

    // Show optional updates (user can dismiss)
    return true
  }

  private determineIfMandatory(
    currentVersion: string,
    latestVersion: string,
    minVersionFromServer?: string | null
  ): boolean {
    // If server specifies minAppVersion and current < min, MANDATORY
    if (minVersionFromServer) {
      try {
        if (compareVersions(currentVersion, minVersionFromServer) < 0) {
          return true
        }
      } catch (error) {
        console.error('Failed to compare versions for mandatory check:', error)
      }
    }

    // Otherwise, update is OPTIONAL
    return false
  }
}
