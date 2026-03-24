import { AuthClient } from './auth-client'
import { AuthStorage } from '../storage/auth-storage'

/**
 * Centralizes token refresh logic, deduplicating concurrent refresh calls
 * so only one network request is made regardless of how many callers trigger
 * a refresh simultaneously.
 */
export class TokenRefreshService {
  private _pendingRefresh: Promise<string> | null = null

  constructor(
    private readonly authClient: AuthClient,
    private readonly authStorage: AuthStorage,
    private readonly onLogout: () => void,
  ) {}

  /**
   * Refresh the access token and return the new access token.
   *
   * If a refresh is already in flight, this method joins that in-flight
   * promise instead of issuing a second network request.
   *
   * On failure the `onLogout` callback is invoked before the error is
   * re-thrown so the caller does not need to handle the logout itself.
   */
  async refreshAndRetry(): Promise<string> {
    if (this._pendingRefresh) {
      return this._pendingRefresh
    }

    this._pendingRefresh = this._doRefresh()

    try {
      return await this._pendingRefresh
    } finally {
      this._pendingRefresh = null
    }
  }

  private async _doRefresh(): Promise<string> {
    const refreshToken = this.authStorage.getRefreshToken()

    if (!refreshToken) {
      this.onLogout()
      throw new Error('No refresh token available')
    }

    try {
      const response = await this.authClient.refreshToken(refreshToken)
      this.authStorage.setAuthToken(response.accessToken)
      if (response.refreshToken) {
        this.authStorage.setRefreshToken(response.refreshToken)
      }
      return response.accessToken
    } catch (error) {
      this.onLogout()
      throw error
    }
  }
}
