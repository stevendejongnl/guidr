import { Platform } from 'react-native'
import RNFS from 'react-native-fs'
import { parse } from 'smol-toml'
import { ConfigLoader } from './ConfigLoader'
import { DEFAULT_CONFIG } from './DefaultConfig'
import { ErrorReporter } from '../monitoring/ErrorReporter'

jest.mock('react-native-fs')
jest.mock('smol-toml')
jest.mock('../monitoring/ErrorReporter')
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}))

describe('ConfigLoader', () => {
  const mockRNFS = RNFS as jest.Mocked<typeof RNFS>
  const mockParse = parse as jest.MockedFunction<typeof parse>
  const mockPlatform = Platform as { OS: string }

  beforeEach(() => {
    jest.clearAllMocks()
    ConfigLoader.clearCache()
    mockPlatform.OS = 'ios'
    Object.defineProperty(mockRNFS, 'MainBundlePath', {
      value: '/mock/bundle/path',
      writable: true,
    })
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('loadConfig', () => {
    it('should load and parse TOML configuration file on iOS', async () => {
      mockPlatform.OS = 'ios'
      const mockTomlContent = '[server]\nurl = "https://example.com"'
      const mockParsedConfig = {
        server: {
          url: 'https://example.com',
        },
      }

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      const config = await ConfigLoader.loadConfig()

      expect(mockRNFS.readFile).toHaveBeenCalledWith(
        '/mock/bundle/path/default-configuration.toml',
        'utf8'
      )
      expect(mockParse).toHaveBeenCalledWith(mockTomlContent)
      expect(config).toEqual(mockParsedConfig)
    })

    it('should load and parse TOML configuration file on Android', async () => {
      mockPlatform.OS = 'android'
      const mockTomlContent = '[server]\nurl = "https://example.com"'
      const mockParsedConfig = {
        server: {
          url: 'https://example.com',
        },
      }

      mockRNFS.readFileAssets.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      const config = await ConfigLoader.loadConfig()

      expect(mockRNFS.readFileAssets).toHaveBeenCalledWith(
        'default-configuration.toml',
        'utf8'
      )
      expect(mockParse).toHaveBeenCalledWith(mockTomlContent)
      expect(config).toEqual(mockParsedConfig)
    })

    it('should cache configuration after first load', async () => {
      mockPlatform.OS = 'ios'
      const mockTomlContent = '[server]\nurl = "https://example.com"'
      const mockParsedConfig = {
        server: {
          url: 'https://example.com',
        },
      }

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      await ConfigLoader.loadConfig()
      await ConfigLoader.loadConfig()

      expect(mockRNFS.readFile).toHaveBeenCalledTimes(1)
      expect(mockParse).toHaveBeenCalledTimes(1)
    })

    it('should fall back to DEFAULT_CONFIG when file cannot be read on iOS', async () => {
      mockPlatform.OS = 'ios'
      const fileError = new Error('File not found')
      mockRNFS.readFile.mockRejectedValue(fileError)

      const config = await ConfigLoader.loadConfig()

      expect(config).toEqual(DEFAULT_CONFIG)
      expect(ErrorReporter.capture).toHaveBeenCalledWith(
        fileError,
        expect.objectContaining({
          component: 'ConfigLoader',
          action: 'loadConfigFile',
          platform: 'ios',
        })
      )
    })

    it('should throw error when file cannot be read on Android', async () => {
      mockPlatform.OS = 'android'
      mockRNFS.readFileAssets.mockRejectedValue(new Error('File not found'))

      await expect(ConfigLoader.loadConfig()).rejects.toThrow(
        'Failed to load application configuration: File not found'
      )
    })

    it('should throw error when TOML parsing fails', async () => {
      mockPlatform.OS = 'ios'
      const mockTomlContent = 'invalid toml content'
      const parseError = new Error('Parse error')

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockParse.mockImplementation(() => {
        throw parseError
      })

      await expect(ConfigLoader.loadConfig()).rejects.toThrow(
        'Failed to load application configuration: Parse error'
      )
      expect(ErrorReporter.capture).toHaveBeenCalledWith(
        parseError,
        expect.objectContaining({
          component: 'ConfigLoader',
          action: 'loadConfig',
          platform: 'ios',
        })
      )
    })

    it('should cache DEFAULT_CONFIG after iOS fallback', async () => {
      mockPlatform.OS = 'ios'
      mockRNFS.readFile.mockRejectedValue(new Error('File not found'))

      await ConfigLoader.loadConfig()
      await ConfigLoader.loadConfig()

      // Should only try to read file once, then use cached DEFAULT_CONFIG
      expect(mockRNFS.readFile).toHaveBeenCalledTimes(1)
      expect(ErrorReporter.capture).toHaveBeenCalledTimes(1)
    })
  })

  describe('getServerUrl', () => {
    it('should return server URL from configuration', async () => {
      mockPlatform.OS = 'ios'
      const mockTomlContent = '[server]\nurl = "https://guidr.madebysteven.nl/api/v1"'
      const mockParsedConfig = {
        server: {
          url: 'https://guidr.madebysteven.nl/api/v1',
        },
      }

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      const url = await ConfigLoader.getServerUrl()

      expect(url).toBe('https://guidr.madebysteven.nl/api/v1')
    })
  })

  describe('clearCache', () => {
    it('should clear cached configuration', async () => {
      mockPlatform.OS = 'ios'
      const mockTomlContent = '[server]\nurl = "https://example.com"'
      const mockParsedConfig = {
        server: {
          url: 'https://example.com',
        },
      }

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      await ConfigLoader.loadConfig()
      ConfigLoader.clearCache()
      await ConfigLoader.loadConfig()

      expect(mockRNFS.readFile).toHaveBeenCalledTimes(2)
    })
  })
})
