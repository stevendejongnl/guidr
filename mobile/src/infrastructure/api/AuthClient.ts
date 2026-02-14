import { AuthResponse, UserDto } from './dtos/UserDto'
import { extractErrorMessage, AuthenticationError } from '../../common/ApiErrorUtils'

export class AuthClient {
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    // Normalize URL: remove trailing slash, ensure /api/v1 is not duplicated
    const normalized = serverUrl.replace(/\/$/, '')
    if (normalized.endsWith('/api/v1')) {
      // URL already includes /api/v1 (from older app versions)
      this.apiBaseUrl = normalized
    } else {
      // Add /api/v1 prefix
      this.apiBaseUrl = `${normalized}/api/v1`
    }
  }

  /**
   * Login with email and password using OAuth2-compliant form-encoded credentials.
   *
   * The API follows OAuth2 Password Grant standard (RFC 6749) which requires:
   * - Content-Type: application/x-www-form-urlencoded
   * - Parameter name: "username" (mapped to email internally by the API)
   *
   * @param email User's email address
   * @param password User's password
   * @returns Authentication response with access token, refresh token, and user info
   * @throws Error if email or password is empty, or if API returns an error
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email || email.trim() === '') {
      throw new Error('Email cannot be empty')
    }
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty')
    }

    try {
      // OAuth2 Password Grant requires form-encoded data with "username" field
      // The API treats "username" as email internally for authentication
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Login failed'))
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      const data = await response.json()

      if (!data.accessToken || !data.tokenType || !data.user || !data.user.email) {
        throw new Error('Invalid response from server')
      }

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || '',
        tokenType: data.tokenType,
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
          isAdmin: typeof data.user.isAdmin === 'boolean' ? data.user.isAdmin : false,
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during login')
    }
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    if (!email || email.trim() === '') {
      throw new Error('Email cannot be empty')
    }
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty')
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Registration failed'))
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      const data = await response.json()

      if (!data.accessToken || !data.tokenType || !data.user || !data.user.email || !data.user.id) {
        throw new Error('Invalid response from server')
      }

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || '',
        tokenType: data.tokenType,
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
          isAdmin: typeof data.user.isAdmin === 'boolean' ? data.user.isAdmin : false,
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during registration')
    }
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    if (!token || token.trim() === '') {
      throw new Error('Refresh token cannot be empty')
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: token }),
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Token refresh failed'))
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      const data = await response.json()

      if (!data.accessToken || !data.refreshToken || !data.user) {
        throw new Error('Invalid response from server')
      }

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenType: data.tokenType || 'bearer',
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
          isAdmin: typeof data.user.isAdmin === 'boolean' ? data.user.isAdmin : false,
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during token refresh')
    }
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
    authToken: string,
  ): Promise<void> {
    if (!oldPassword || oldPassword.trim() === '') {
      throw new Error('Old password cannot be empty')
    }
    if (!newPassword || newPassword.trim() === '') {
      throw new Error('New password cannot be empty')
    }
    if (!authToken || authToken.trim() === '') {
      throw new Error('Auth token cannot be empty')
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Invalid or expired token')
        }
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Password change failed'))
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      // Success - no return value needed
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during password change')
    }
  }

  async changeEmail(
    newEmail: string,
    password: string,
    authToken: string,
  ): Promise<AuthResponse> {
    if (!newEmail || newEmail.trim() === '') {
      throw new Error('New email cannot be empty')
    }
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty')
    }
    if (!authToken || authToken.trim() === '') {
      throw new Error('Auth token cannot be empty')
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/change-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          newEmail,
          password,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Invalid or expired token')
        }
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Email change failed'))
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      const data = await response.json()

      if (!data.accessToken || !data.tokenType || !data.user || !data.user.email) {
        throw new Error('Invalid response from server')
      }

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || '',
        tokenType: data.tokenType,
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
          isAdmin: typeof data.user.isAdmin === 'boolean' ? data.user.isAdmin : false,
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during email change')
    }
  }

  async getProfile(authToken: string): Promise<UserDto> {
    if (!authToken || authToken.trim() === '') {
      throw new Error('Auth token cannot be empty')
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Invalid or expired token')
        }
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Failed to fetch profile'))
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      const data = await response.json()

      if (!data.id || !data.email) {
        throw new Error('Invalid response from server')
      }

      return {
        id: data.id,
        email: data.email,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        name: data.name,
        interests: data.interests,
        preferredLanguages: data.preferredLanguages,
        isAdmin: typeof data.isAdmin === 'boolean' ? data.isAdmin : false,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching profile')
    }
  }

  async updateProfile(
    name: string | null,
    interests: string[] | null,
    authToken: string,
    preferredLanguages?: string[] | null,
  ): Promise<UserDto> {
    if (!authToken || authToken.trim() === '') {
      throw new Error('Auth token cannot be empty')
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name,
          interests,
          preferredLanguages: preferredLanguages ?? undefined,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Invalid or expired token')
        }
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Profile update failed'))
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      const data = await response.json()

      if (!data.id || !data.email) {
        throw new Error('Invalid response from server')
      }

      return {
        id: data.id,
        email: data.email,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        name: data.name,
        interests: data.interests,
        preferredLanguages: data.preferredLanguages,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during profile update')
    }
  }

  async deleteAccount(password: string, authToken: string): Promise<void> {
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty')
    }
    if (!authToken || authToken.trim() === '') {
      throw new Error('Auth token cannot be empty')
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          password,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Invalid or expired token')
        }
        try {
          const errorData = await response.json()
          throw new Error(extractErrorMessage(errorData, 'Account deletion failed'))
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
          throw jsonError
        }
      }

      // Success - no return value needed
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during account deletion')
    }
  }
}
