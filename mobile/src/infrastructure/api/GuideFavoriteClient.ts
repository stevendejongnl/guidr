import { extractErrorMessage } from '../../common/ApiErrorUtils'

export interface GuideFavoriteListResponse {
  guideIds: string[]
}

export class GuideFavoriteClient {
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    const normalized = serverUrl.replace(/\/$/, '')
    if (normalized.endsWith('/api/v1')) {
      this.apiBaseUrl = normalized
    } else {
      this.apiBaseUrl = `${normalized}/api/v1`
    }
  }

  async favoriteGuide(guideId: string, authToken: string): Promise<void> {
    const response = await fetch(
      `${this.apiBaseUrl}/guide-favorites/guides/${encodeURIComponent(guideId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData, 'Failed to favorite guide'))
    }
  }

  async unfavoriteGuide(guideId: string, authToken: string): Promise<void> {
    const response = await fetch(
      `${this.apiBaseUrl}/guide-favorites/guides/${encodeURIComponent(guideId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData, 'Failed to unfavorite guide'))
    }
  }

  async getFavoriteGuideIds(authToken: string): Promise<string[]> {
    const response = await fetch(`${this.apiBaseUrl}/guide-favorites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData, 'Failed to load favorites'))
    }

    const data: GuideFavoriteListResponse = await response.json()
    return data.guideIds
  }
}
