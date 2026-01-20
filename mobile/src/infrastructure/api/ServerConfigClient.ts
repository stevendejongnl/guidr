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
    // Add /api/v1 prefix (consistent with AuthClient)
    this.serverUrl = `${serverUrl.replace(/\/$/, '')}/api/v1`
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
        const errorData = await response.json()
        throw new Error(extractErrorMessage(errorData, 'Failed to fetch server config'))
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
