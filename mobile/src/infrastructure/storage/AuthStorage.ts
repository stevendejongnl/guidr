import AsyncStorage from '@react-native-async-storage/async-storage'

const AUTH_TOKEN_KEY = 'Guidr_AuthToken'
const USER_EMAIL_KEY = 'Guidr_UserEmail'
const USER_IS_ADMIN_KEY = 'Guidr_UserIsAdmin'
const USER_ID_KEY = 'Guidr_UserId'

export class AuthStorage {
  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY)
  }

  async setAuthToken(token: string): Promise<void> {
    if (!token || token.trim() === '') {
      throw new Error('Auth token cannot be empty')
    }
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token)
  }

  async hasAuthToken(): Promise<boolean> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY)
    return token !== null
  }

  async clearAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
  }

  async getUserEmail(): Promise<string | null> {
    return await AsyncStorage.getItem(USER_EMAIL_KEY)
  }

  async setUserEmail(email: string): Promise<void> {
    if (!email || email.trim() === '') {
      throw new Error('User email cannot be empty')
    }
    await AsyncStorage.setItem(USER_EMAIL_KEY, email)
  }

  async clearUserEmail(): Promise<void> {
    await AsyncStorage.removeItem(USER_EMAIL_KEY)
  }

  async getUserIsAdmin(): Promise<boolean> {
    const value = await AsyncStorage.getItem(USER_IS_ADMIN_KEY)
    return value === 'true'
  }

  async setUserIsAdmin(isAdmin: boolean): Promise<void> {
    await AsyncStorage.setItem(USER_IS_ADMIN_KEY, isAdmin.toString())
  }

  async clearUserIsAdmin(): Promise<void> {
    await AsyncStorage.removeItem(USER_IS_ADMIN_KEY)
  }

  async getUserId(): Promise<string | null> {
    return await AsyncStorage.getItem(USER_ID_KEY)
  }

  async setUserId(userId: string): Promise<void> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID cannot be empty')
    }
    await AsyncStorage.setItem(USER_ID_KEY, userId)
  }

  async clearUserId(): Promise<void> {
    await AsyncStorage.removeItem(USER_ID_KEY)
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_EMAIL_KEY),
      AsyncStorage.removeItem(USER_IS_ADMIN_KEY),
      AsyncStorage.removeItem(USER_ID_KEY),
    ])
  }
}
