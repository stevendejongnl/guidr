export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `HTTP ${status}: ${statusText}`)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private baseUrl: string
  private getAuthToken?: () => string | null
  private onUnauthorized?: () => Promise<string>

  constructor(baseUrl: string = '/api/v1', getAuthToken?: () => string | null) {
    this.baseUrl = baseUrl
    this.getAuthToken = getAuthToken
  }

  setOnUnauthorized(handler: () => Promise<string>): void {
    this.onUnauthorized = handler
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add auth header if token is available
    if (this.getAuthToken) {
      const token = this.getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const apiError = new ApiError(
          response.status,
          response.statusText,
          await this.getErrorMessage(response)
        )

        // On 401, attempt token refresh and retry once
        if (response.status === 401 && this.onUnauthorized) {
          const newToken = await this.onUnauthorized()
          const retryOptions: RequestInit = {
            ...options,
            headers: {
              ...(options.headers as Record<string, string>),
              Authorization: `Bearer ${newToken}`,
            },
          }
          const retryResponse = await fetch(url, retryOptions)
          if (!retryResponse.ok) {
            throw new ApiError(
              retryResponse.status,
              retryResponse.statusText,
              await this.getErrorMessage(retryResponse)
            )
          }
          if (retryResponse.status === 204) {
            return {} as T
          }
          return await retryResponse.json()
        }

        throw apiError
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getErrorMessage(response: Response): Promise<string> {
    try {
      const data = await response.json()
      return data.detail || data.message || response.statusText
    } catch {
      return response.statusText
    }
  }
}

// Export singleton instance with auth token getter
import { AuthStorage } from '../storage/auth-storage'
const authStorage = new AuthStorage()
export const apiClient = new ApiClient('/api/v1', () => authStorage.getAuthToken())
