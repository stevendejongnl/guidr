import { ApiClient, ApiError } from './api-client'
import { AuthResponse } from '../models/user'
import { AuthError } from '../models/auth-error'
import { AuthStorage } from '../storage/auth-storage'

/**
 * Authentication service handling login, register, logout
 * Mirrors mobile AuthClient implementation
 */
export class AuthService {
  constructor(
    private apiClient: ApiClient,
    private storage: AuthStorage,
  ) {}

  /**
   * Login user and persist auth data
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email || email.trim() === '') {
      throw new AuthError(400, 'Email cannot be empty')
    }
    if (!password || password.trim() === '') {
      throw new AuthError(400, 'Password cannot be empty')
    }

    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      })

      // Validate response
      if (!response.accessToken || !response.user || !response.user.email) {
        throw new AuthError(500, 'Invalid response from server')
      }

      // Persist to storage
      this.storage.setAuthToken(response.accessToken)
      this.storage.setUserEmail(response.user.email)
      this.storage.setUserIsAdmin(typeof response.user.isAdmin === 'boolean' ? response.user.isAdmin : false)

      return response
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      if (error instanceof ApiError) {
        throw new AuthError(error.status, error.message)
      }
      throw new AuthError(500, 'Login failed')
    }
  }

  /**
   * Register new user and persist auth data
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    if (!email || email.trim() === '') {
      throw new AuthError(400, 'Email cannot be empty')
    }
    if (!password || password.trim() === '') {
      throw new AuthError(400, 'Password cannot be empty')
    }
    if (password.length < 6) {
      throw new AuthError(400, 'Password must be at least 6 characters')
    }

    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
      })

      // Validate response
      if (!response.accessToken || !response.user || !response.user.email || !response.user.id) {
        throw new AuthError(500, 'Invalid response from server')
      }

      // Persist to storage
      this.storage.setAuthToken(response.accessToken)
      this.storage.setUserEmail(response.user.email)
      this.storage.setUserIsAdmin(typeof response.user.isAdmin === 'boolean' ? response.user.isAdmin : false)

      return response
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      if (error instanceof ApiError) {
        throw new AuthError(error.status, error.message)
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
}

// Export singleton instances
const apiClient = new ApiClient('/api/v1')
const storage = new AuthStorage()
export const authService = new AuthService(apiClient, storage)
