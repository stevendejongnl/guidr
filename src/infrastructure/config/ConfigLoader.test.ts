import { Platform } from 'react-native'
import RNFS from 'react-native-fs'
import { parse } from 'smol-toml'
import { ConfigLoader } from './ConfigLoader'

jest.mock('react-native-fs')
jest.mock('smol-toml')
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

    it('should throw error when file cannot be read on iOS', async () => {
      mockPlatform.OS = 'ios'
      mockRNFS.readFile.mockRejectedValue(new Error('File not found'))

      await expect(ConfigLoader.loadConfig()).rejects.toThrow(
        'Failed to load application configuration'
      )
    })

    it('should throw error when file cannot be read on Android', async () => {
      mockPlatform.OS = 'android'
      mockRNFS.readFileAssets.mockRejectedValue(new Error('File not found'))

      await expect(ConfigLoader.loadConfig()).rejects.toThrow(
        'Failed to load application configuration'
      )
    })

    it('should throw error when TOML parsing fails', async () => {
      mockPlatform.OS = 'ios'
      const mockTomlContent = 'invalid toml content'

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockParse.mockImplementation(() => {
        throw new Error('Parse error')
      })

      await expect(ConfigLoader.loadConfig()).rejects.toThrow(
        'Failed to load application configuration'
      )
    })
  })

  describe('getServerUrl', () => {
    it('should return server URL from configuration', async () => {
      mockPlatform.OS = 'ios'
      const mockTomlContent = '[server]\nurl = "https://guidr.madebysteven.nl/testing-server"'
      const mockParsedConfig = {
        server: {
          url: 'https://guidr.madebysteven.nl/testing-server',
        },
      }

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockParse.mockReturnValue(mockParsedConfig)

      const url = await ConfigLoader.getServerUrl()

      expect(url).toBe('https://guidr.madebysteven.nl/testing-server')
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
