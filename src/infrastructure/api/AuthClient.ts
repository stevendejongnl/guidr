import { AuthResponse } from './dtos/UserDto'

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
}
