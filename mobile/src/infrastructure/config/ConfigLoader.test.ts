import RNFS from 'react-native-fs'
import { parse } from 'smol-toml'
import { ConfigLoader } from './ConfigLoader'
import { ErrorReporter } from '../monitoring/ErrorReporter'

jest.mock('react-native-fs')
jest.mock('smol-toml')
jest.mock('../monitoring/ErrorReporter')
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}))

describe('ConfigLoader', () => {
  const mockRNFS = RNFS as jest.Mocked<typeof RNFS>
  const mockParse = parse as jest.MockedFunction<typeof parse>

  beforeEach(() => {
    jest.clearAllMocks()
    ConfigLoader.clearCache()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('loadConfig', () => {
    it('should load and parse TOML configuration file', async () => {
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
      const mockTomlContent = '[server]\nurl = "https://example.com"'
      const mockParsedConfig = {
        server: {
          url: 'https://example.com',
        },
      }

      mockRNFS.readFileAssets.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      await ConfigLoader.loadConfig()
      await ConfigLoader.loadConfig()

      expect(mockRNFS.readFileAssets).toHaveBeenCalledTimes(1)
      expect(mockParse).toHaveBeenCalledTimes(1)
    })

    it('should throw error when file cannot be read', async () => {
      mockRNFS.readFileAssets.mockRejectedValue(new Error('File not found'))

      await expect(ConfigLoader.loadConfig()).rejects.toThrow(
        'Failed to load application configuration: File not found'
      )
    })

    it('should throw error when TOML parsing fails', async () => {
      const mockTomlContent = 'invalid toml content'
      const parseError = new Error('Parse error')

      mockRNFS.readFileAssets.mockResolvedValue(mockTomlContent)
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
          platform: 'android',
        })
      )
    })
  })

  describe('getServerUrl', () => {
    it('should return server URL from configuration', async () => {
      const mockTomlContent = '[server]\nurl = "https://guidr.madebysteven.nl"'
      const mockParsedConfig = {
        server: {
          url: 'https://guidr.madebysteven.nl',
        },
      }

      mockRNFS.readFileAssets.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      const url = await ConfigLoader.getServerUrl()

      expect(url).toBe('https://guidr.madebysteven.nl')
    })
  })

  describe('clearCache', () => {
    it('should clear cached configuration', async () => {
      const mockTomlContent = '[server]\nurl = "https://example.com"'
      const mockParsedConfig = {
        server: {
          url: 'https://example.com',
        },
      }

      mockRNFS.readFileAssets.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      await ConfigLoader.loadConfig()
      ConfigLoader.clearCache()
      await ConfigLoader.loadConfig()

      expect(mockRNFS.readFileAssets).toHaveBeenCalledTimes(2)
    })
  })
})
