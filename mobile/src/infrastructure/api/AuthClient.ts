import { AuthResponse, UserDto } from './dtos/UserDto'

export class AuthClient {
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    this.apiBaseUrl = `${serverUrl.replace(/\/$/, '')}/api/v1`
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email || email.trim() === '') {
      throw new Error('Email cannot be empty')
    }
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty')
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }

      const data = await response.json()

      if (!data.accessToken || !data.tokenType || !data.user || !data.user.email) {
        throw new Error('Invalid response from server')
      }

      return {
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
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
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Registration failed')
      }

      const data = await response.json()

      if (!data.accessToken || !data.tokenType || !data.user || !data.user.email || !data.user.id) {
        throw new Error('Invalid response from server')
      }

      return {
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during registration')
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
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Password change failed')
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
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Email change failed')
      }

      const data = await response.json()

      if (!data.accessToken || !data.tokenType || !data.user || !data.user.email) {
        throw new Error('Invalid response from server')
      }

      return {
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during email change')
    }
  }

  async updateProfile(
    name: string | null,
    interests: string[] | null,
    authToken: string,
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Profile update failed')
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
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Account deletion failed')
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
