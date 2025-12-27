import RNFS from 'react-native-fs'
import * as TOML from '@iarna/toml'

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
      const configPath = `${RNFS.MainBundlePath}/${this.CONFIG_FILE}`
      const configContent = await RNFS.readFile(configPath, 'utf8')
      const parsed = TOML.parse(configContent)
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
