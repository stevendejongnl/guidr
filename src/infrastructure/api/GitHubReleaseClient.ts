export interface GitHubRelease {
  version: string // e.g., "1.15.0" (stripped from "v1.15.0")
  tagName: string // e.g., "v1.15.0"
  name: string // Release name
  body: string // Changelog markdown
  publishedAt: string // ISO timestamp
  apkUrl: string | null // Direct download URL for APK
  isPrerelease: boolean
}

interface GitHubReleaseAsset {
  name: string
  browser_download_url: string
}

interface GitHubReleaseResponse {
  tag_name: string
  name: string
  body: string
  published_at: string
  prerelease: boolean
  assets: GitHubReleaseAsset[]
}

export class GitHubReleaseClient {
  private readonly owner = 'stevendejongnl'
  private readonly repo = 'guidr'
  private readonly apiBase = 'https://api.github.com'

  async getLatestRelease(
    includePrerelease: boolean = false
  ): Promise<GitHubRelease> {
    try {
      const endpoint = includePrerelease
        ? `${this.apiBase}/repos/${this.owner}/${this.repo}/releases`
        : `${this.apiBase}/repos/${this.owner}/${this.repo}/releases/latest`

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      if (!response.ok) {
        // Check for rate limiting
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get(
            'X-RateLimit-Remaining'
          )
          const rateLimitReset = response.headers.get('X-RateLimit-Reset')
          if (rateLimitRemaining === '0' && rateLimitReset) {
            const resetTime = new Date(
              parseInt(rateLimitReset, 10) * 1000
            ).toLocaleTimeString()
            throw new Error(
              `GitHub API rate limit exceeded. Try again after ${resetTime}`
            )
          }
        }

        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.message || `GitHub API request failed: ${response.status}`
        )
      }

      const data: GitHubReleaseResponse | GitHubReleaseResponse[] =
        await response.json()

      // If we requested all releases (for prerelease), get the first one
      const releaseData = Array.isArray(data) ? data[0] : data

      if (!releaseData) {
        throw new Error('No releases found')
      }

      // Validate response structure
      if (
        !releaseData.tag_name ||
        typeof releaseData.tag_name !== 'string' ||
        !releaseData.name ||
        typeof releaseData.name !== 'string'
      ) {
        throw new Error('Invalid response from GitHub API')
      }

      // Parse version from tag (remove 'v' prefix if present)
      const version = releaseData.tag_name.startsWith('v')
        ? releaseData.tag_name.substring(1)
        : releaseData.tag_name

      // Find APK asset in the release
      const apkAsset = releaseData.assets.find((asset) =>
        asset.name.match(/^guidr-v.*\.apk$/)
      )

      if (!apkAsset) {
        throw new Error(
          `Update available (${version}) but APK file not found in release assets. Please download manually from GitHub.`
        )
      }

      return {
        version,
        tagName: releaseData.tag_name,
        name: releaseData.name,
        body: releaseData.body || '',
        publishedAt: releaseData.published_at,
        apkUrl: apkAsset.browser_download_url,
        isPrerelease: releaseData.prerelease,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(
        'An unexpected error occurred while fetching release information'
      )
    }
  }

  async getReleaseByTag(tag: string): Promise<GitHubRelease> {
    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/releases/tags/${tag}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.message ||
            `Failed to fetch release for tag ${tag}: ${response.status}`
        )
      }

      const releaseData: GitHubReleaseResponse = await response.json()

      // Validate response structure
      if (
        !releaseData.tag_name ||
        typeof releaseData.tag_name !== 'string' ||
        !releaseData.name ||
        typeof releaseData.name !== 'string'
      ) {
        throw new Error('Invalid response from GitHub API')
      }

      // Parse version from tag
      const version = releaseData.tag_name.startsWith('v')
        ? releaseData.tag_name.substring(1)
        : releaseData.tag_name

      // Find APK asset
      const apkAsset = releaseData.assets.find((asset) =>
        asset.name.match(/^guidr-v.*\.apk$/)
      )

      return {
        version,
        tagName: releaseData.tag_name,
        name: releaseData.name,
        body: releaseData.body || '',
        publishedAt: releaseData.published_at,
        apkUrl: apkAsset?.browser_download_url || null,
        isPrerelease: releaseData.prerelease,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(
        'An unexpected error occurred while fetching release information'
      )
    }
  }
}
