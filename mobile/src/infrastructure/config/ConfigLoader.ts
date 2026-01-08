import { Platform } from 'react-native'
import RNFS from 'react-native-fs'
import { parse } from 'smol-toml'
import { ErrorReporter } from '../monitoring/ErrorReporter'
import { DEFAULT_CONFIG, AppConfig } from './DefaultConfig'

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
        // iOS: Try to read from bundle, fall back to default config
        const configPath = `${RNFS.MainBundlePath}/${this.CONFIG_FILE}`
        console.log('[ConfigLoader] Attempting to load config from:', configPath)

        try {
          configContent = await RNFS.readFile(configPath, 'utf8')
        } catch (fileError) {
          console.warn(
            '[ConfigLoader] Failed to load config file, using embedded default:',
            fileError
          )
          ErrorReporter.capture(fileError, {
            component: 'ConfigLoader',
            action: 'loadConfigFile',
            platform: Platform.OS,
          })
          // Use embedded default config on iOS
          this.config = DEFAULT_CONFIG
          return this.config
        }
      }

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
