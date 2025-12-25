import AsyncStorage from '@react-native-async-storage/async-storage'

const AUTH_TOKEN_KEY = 'Guidr_AuthToken'
const USER_EMAIL_KEY = 'Guidr_UserEmail'

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

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
    await AsyncStorage.removeItem(USER_EMAIL_KEY)
  }
}
