import { extractErrorMessage } from '../../common/ApiErrorUtils'

export interface ServerConfigResponse {
  minAppVersion: string | null
  maxAppVersion: string | null
}

export class ServerConfigClient {
  private readonly serverUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    // Normalize URL: remove trailing slash, ensure /api/v1 is not duplicated
    const normalized = serverUrl.replace(/\/$/, '')
    if (normalized.endsWith('/api/v1')) {
      // URL already includes /api/v1 (from older app versions)
      this.serverUrl = normalized
    } else {
      // Add /api/v1 prefix (consistent with AuthClient)
      this.serverUrl = `${normalized}/api/v1`
    }
  }

  async getConfig(): Promise<ServerConfigResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Failed to fetch server config'))
        } catch (jsonError) {
          // If error response isn't JSON (e.g., HTML error page), use status text
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      const data = await response.json()

      return {
        minAppVersion: data.minAppVersion ?? null,
        maxAppVersion: data.maxAppVersion ?? null,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching config')
    }
  }
}
