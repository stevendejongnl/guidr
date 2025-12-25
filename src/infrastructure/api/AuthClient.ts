export interface LoginResponse {
  token: string
  email: string
}

export class AuthClient {
  private readonly serverUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    this.serverUrl = serverUrl.replace(/\/$/, '') // Remove trailing slash
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    if (!email || email.trim() === '') {
      throw new Error('Email cannot be empty')
    }
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty')
    }

    try {
      const response = await fetch(`${this.serverUrl}/login`, {
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

      if (!data.token || !data.email) {
        throw new Error('Invalid response from server')
      }

      return { token: data.token, email: data.email }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during login')
    }
  }
}
