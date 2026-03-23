import { AuthClient, AuthResponse } from './auth-client'
import { AuthError } from '../models/auth-error'
import { AuthStorage } from '../storage/auth-storage'

/**
 * Authentication service handling login, register, logout
 * Uses OAuth2-compliant AuthClient for API interactions
 */
export class AuthService {
  constructor(
    private authClient: AuthClient,
    private storage: AuthStorage,
  ) {}

  /**
   * Login user and persist auth data
   * Uses OAuth2 form-encoded credentials
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.authClient.login(email, password)

      // Validate response
      if (!response.accessToken || !response.user || !response.user.email) {
        throw new AuthError(500, 'Invalid response from server')
      }

      // Persist to storage
      this.storage.setAuthToken(response.accessToken)
      if (response.refreshToken) {
        this.storage.setRefreshToken(response.refreshToken)
      }
      this.storage.setUserEmail(response.user.email)
      this.storage.setUserIsAdmin(typeof response.user.isAdmin === 'boolean' ? response.user.isAdmin : false)
      this.storage.setUserIsBeta(typeof response.user.isBeta === 'boolean' ? response.user.isBeta : false)

      return response
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      if (error instanceof Error) {
        throw new AuthError(500, error.message)
      }
      throw new AuthError(500, 'Login failed')
    }
  }

  /**
   * Register new user and persist auth data
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    if (password.length < 6) {
      throw new AuthError(400, 'Password must be at least 6 characters')
    }

    try {
      const response = await this.authClient.register(email, password)

      // Validate response
      if (!response.accessToken || !response.user || !response.user.email || !response.user.id) {
        throw new AuthError(500, 'Invalid response from server')
      }

      // Persist to storage
      this.storage.setAuthToken(response.accessToken)
      if (response.refreshToken) {
        this.storage.setRefreshToken(response.refreshToken)
      }
      this.storage.setUserEmail(response.user.email)
      this.storage.setUserIsAdmin(typeof response.user.isAdmin === 'boolean' ? response.user.isAdmin : false)
      this.storage.setUserIsBeta(typeof response.user.isBeta === 'boolean' ? response.user.isBeta : false)

      return response
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      if (error instanceof Error) {
        throw new AuthError(500, error.message)
      }
      throw new AuthError(500, 'Registration failed')
    }
  }

  /**
   * Logout user and clear all auth data
   */
  logout(): void {
    this.storage.clearAll()
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.storage.hasAuthToken()
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.storage.getUserIsAdmin()
  }

  /**
   * Check if current user has beta access
   */
  isBeta(): boolean {
    return this.storage.getUserIsBeta()
  }

  /**
   * Get current user email
   */
  getUserEmail(): string | null {
    return this.storage.getUserEmail()
  }

  /**
   * Get auth token for API requests
   */
  getAuthToken(): string | null {
    return this.storage.getAuthToken()
  }

  getRefreshToken(): string | null {
    return this.storage.getRefreshToken()
  }

  setRefreshToken(token: string): void {
    this.storage.setRefreshToken(token)
  }

  /**
   * Refresh profile flags from API and update storage.
   * Keeps localStorage in sync when new flags are added server-side.
   */
  async refreshProfile(): Promise<void> {
    const token = this.storage.getAuthToken()
    if (!token) return
    const profile = await this.authClient.getProfile(token)
    this.storage.setUserIsAdmin(profile.isAdmin)
    this.storage.setUserIsBeta(profile.isBeta)
  }
}

// Export singleton instances
const authClient = new AuthClient(window.location.origin)
const storage = new AuthStorage()
export const authService = new AuthService(authClient, storage)
