import { Platform } from 'react-native'
import RNFS from 'react-native-fs'
import { parse } from 'smol-toml'

interface ServerConfig {
  url: string
}

interface AppConfig {
  server: ServerConfig
}

export class ConfigLoader {
  private static config: AppConfig | null = null
  private static readonly CONFIG_FILE = 'default-configuration.toml'

  static async loadConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config
    }

    try {
      let configContent: string

      if (Platform.OS === 'android') {
        // Android: read from assets folder
        configContent = await RNFS.readFileAssets(this.CONFIG_FILE, 'utf8')
      } else {
        // iOS: read from main bundle
        const configPath = `${RNFS.MainBundlePath}/${this.CONFIG_FILE}`
        configContent = await RNFS.readFile(configPath, 'utf8')
      }

      const parsed = parse(configContent)
      this.config = parsed as unknown as AppConfig
      return this.config
    } catch (error) {
      console.error('Failed to load configuration file:', error)
      throw new Error('Failed to load application configuration')
    }
  }

  static async getServerUrl(): Promise<string> {
    const config = await this.loadConfig()
    return config.server.url
  }

  static clearCache(): void {
    this.config = null
  }
}
