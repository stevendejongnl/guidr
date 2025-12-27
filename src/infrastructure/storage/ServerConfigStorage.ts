import AsyncStorage from '@react-native-async-storage/async-storage'
import { ConfigLoader } from '../config/ConfigLoader'

const SERVER_URL_KEY = 'Guidr_ServerUrl'

export class ServerConfigStorage {
  async getServerUrl(): Promise<string | null> {
    return await AsyncStorage.getItem(SERVER_URL_KEY)
  }

  async setServerUrl(url: string): Promise<void> {
    if (!url || url.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }

    try {
      const parsedUrl = new URL(url)

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Server URL must use HTTP or HTTPS protocol')
      }

      await AsyncStorage.setItem(SERVER_URL_KEY, url)
    } catch (error) {
      if (error instanceof Error && error.message.includes('protocol')) {
        throw error
      }
      throw new Error('Invalid server URL format')
    }
  }

  async hasServerUrl(): Promise<boolean> {
    const url = await AsyncStorage.getItem(SERVER_URL_KEY)
    return url !== null
  }

  async clearServerUrl(): Promise<void> {
    await AsyncStorage.removeItem(SERVER_URL_KEY)
  }

  async initializeDefaultServerUrl(): Promise<void> {
    const hasUrl = await this.hasServerUrl()
    if (!hasUrl) {
      const defaultUrl = await ConfigLoader.getServerUrl()
      await AsyncStorage.setItem(SERVER_URL_KEY, defaultUrl)
    }
  }

  async getDefaultServerUrl(): Promise<string> {
    return await ConfigLoader.getServerUrl()
  }
}
