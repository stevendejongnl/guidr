import { Platform } from 'react-native'
import RNFS from 'react-native-fs'
import { parse } from 'smol-toml'
import { ErrorReporter } from '../monitoring/ErrorReporter'
import { AppConfig } from './DefaultConfig'

export class ConfigLoader {
  private static config: AppConfig | null = null
  private static readonly CONFIG_FILE = 'default-configuration.toml'

  static async loadConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const configContent = await RNFS.readFileAssets(this.CONFIG_FILE, 'utf8')

      const parsed = parse(configContent)
      this.config = parsed as unknown as AppConfig
      return this.config
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[ConfigLoader] Failed to load configuration:', errorMessage, error)

      ErrorReporter.capture(error, {
        component: 'ConfigLoader',
        action: 'loadConfig',
        platform: Platform.OS,
      })

      // Preserve original error message
      throw new Error(`Failed to load application configuration: ${errorMessage}`)
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
