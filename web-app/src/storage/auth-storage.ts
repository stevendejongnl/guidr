const AUTH_TOKEN_KEY = 'Guidr_Web_AuthToken'
const USER_EMAIL_KEY = 'Guidr_Web_UserEmail'
const USER_IS_ADMIN_KEY = 'Guidr_Web_UserIsAdmin'
const USER_IS_BETA_KEY = 'Guidr_Web_UserIsBeta'
const USER_ID_KEY = 'Guidr_Web_UserId'

/**
 * Manages auth persistence in localStorage
 * Mirrors mobile AuthStorage implementation
 */
export class AuthStorage {
  getAuthToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }

  setAuthToken(token: string): void {
    if (!token || token.trim() === '') {
      throw new Error('Auth token cannot be empty')
    }
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }

  hasAuthToken(): boolean {
    return localStorage.getItem(AUTH_TOKEN_KEY) !== null
  }

  clearAuthToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }

  getUserEmail(): string | null {
    return localStorage.getItem(USER_EMAIL_KEY)
  }

  setUserEmail(email: string): void {
    if (!email || email.trim() === '') {
      throw new Error('User email cannot be empty')
    }
    localStorage.setItem(USER_EMAIL_KEY, email)
  }

  clearUserEmail(): void {
    localStorage.removeItem(USER_EMAIL_KEY)
  }

  getUserIsAdmin(): boolean {
    const value = localStorage.getItem(USER_IS_ADMIN_KEY)
    return value === 'true'
  }

  setUserIsAdmin(isAdmin: boolean): void {
    localStorage.setItem(USER_IS_ADMIN_KEY, isAdmin.toString())
  }

  clearUserIsAdmin(): void {
    localStorage.removeItem(USER_IS_ADMIN_KEY)
  }

  getUserIsBeta(): boolean {
    const value = localStorage.getItem(USER_IS_BETA_KEY)
    return value === 'true'
  }

  setUserIsBeta(isBeta: boolean): void {
    localStorage.setItem(USER_IS_BETA_KEY, isBeta.toString())
  }

  clearUserIsBeta(): void {
    localStorage.removeItem(USER_IS_BETA_KEY)
  }

  getUserId(): string | null {
    return localStorage.getItem(USER_ID_KEY)
  }

  setUserId(userId: string): void {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID cannot be empty')
    }
    localStorage.setItem(USER_ID_KEY, userId)
  }

  clearUserId(): void {
    localStorage.removeItem(USER_ID_KEY)
  }

  clearAll(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_EMAIL_KEY)
    localStorage.removeItem(USER_IS_ADMIN_KEY)
    localStorage.removeItem(USER_IS_BETA_KEY)
    localStorage.removeItem(USER_ID_KEY)
  }
}
