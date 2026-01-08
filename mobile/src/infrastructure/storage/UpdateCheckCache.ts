import { GitHubRelease } from '../api/GitHubReleaseClient'

export interface CachedUpdateInfo {
  latestVersion: string
  currentVersion: string
  updateAvailable: boolean
  isMandatory: boolean
  release: GitHubRelease | null
  checkedAt: Date
}

export class UpdateCheckCache {
  private static cache: CachedUpdateInfo | null = null
  private static readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

  static setCache(info: CachedUpdateInfo): void {
    this.cache = {
      ...info,
      checkedAt: new Date(info.checkedAt), // Ensure it's a Date object
    }
  }

  static getCache(): CachedUpdateInfo | null {
    return this.cache
  }

  static hasCache(): boolean {
    return this.cache !== null
  }

  static isCacheValid(): boolean {
    if (!this.cache) {
      return false
    }

    const now = new Date()
    const timeSinceCheck = now.getTime() - this.cache.checkedAt.getTime()
    return timeSinceCheck < this.CACHE_DURATION_MS
  }

  static clearCache(): void {
    this.cache = null
  }
}
