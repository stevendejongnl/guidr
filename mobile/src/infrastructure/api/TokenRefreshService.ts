import { AuthClient } from './AuthClient'
import { AuthStorage } from '../storage/AuthStorage'

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
    serverStorage: { getServerUrl(): Promise<string | null> },
    private readonly onLogout: () => Promise<void>,
  ) {
    // serverStorage is accepted to keep the constructor signature stable for future use
    // (e.g. re-creating AuthClient when server URL changes) without a breaking change
    void serverStorage
  }

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
    const refreshToken = await this.authStorage.getRefreshToken()

    if (!refreshToken) {
      await this.onLogout()
      throw new Error('No refresh token available')
    }

    try {
      const response = await this.authClient.refreshToken(refreshToken)
      await this.authStorage.setAuthToken(response.accessToken)
      await this.authStorage.setRefreshToken(response.refreshToken)
      return response.accessToken
    } catch (error) {
      await this.onLogout()
      throw error
    }
  }
}
