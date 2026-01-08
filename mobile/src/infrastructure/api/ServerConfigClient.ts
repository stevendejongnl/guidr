export interface ServerConfigResponse {
  debugMode: boolean
  minAppVersion: string | null
  maxAppVersion: string | null
}

export class ServerConfigClient {
  private readonly serverUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    this.serverUrl = serverUrl.replace(/\/$/, '') // Remove trailing slash
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
        throw new Error(errorData.detail || 'Failed to fetch server config')
      }

      const data = await response.json()

      // Validate response structure
      if (typeof data.debugMode !== 'boolean') {
        throw new Error('Invalid response from server')
      }

      return {
        debugMode: data.debugMode,
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
