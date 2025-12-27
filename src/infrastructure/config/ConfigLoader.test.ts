import RNFS from 'react-native-fs'
import * as TOML from '@iarna/toml'
import { ConfigLoader } from './ConfigLoader'

jest.mock('react-native-fs')
jest.mock('@iarna/toml')

describe('ConfigLoader', () => {
  const mockRNFS = RNFS as jest.Mocked<typeof RNFS>
  const mockTOML = TOML as jest.Mocked<typeof TOML>

  beforeEach(() => {
    jest.clearAllMocks()
    ConfigLoader.clearCache()
    Object.defineProperty(mockRNFS, 'MainBundlePath', {
      value: '/mock/bundle/path',
      writable: true,
    })
  })

  describe('loadConfig', () => {
    it('should load and parse TOML configuration file', async () => {
      const mockTomlContent = '[server]\nurl = "https://example.com"'
      const mockParsedConfig = {
        server: {
          url: 'https://example.com',
        },
      }

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockTOML.parse.mockReturnValue(mockParsedConfig)

      const config = await ConfigLoader.loadConfig()

      expect(mockRNFS.readFile).toHaveBeenCalledWith(
        '/mock/bundle/path/default-configuration.toml',
        'utf8'
      )
      expect(mockTOML.parse).toHaveBeenCalledWith(mockTomlContent)
      expect(config).toEqual(mockParsedConfig)
    })

    it('should cache configuration after first load', async () => {
      const mockTomlContent = '[server]\nurl = "https://example.com"'
      const mockParsedConfig = {
        server: {
          url: 'https://example.com',
        },
      }

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockTOML.parse.mockReturnValue(mockParsedConfig)

      await ConfigLoader.loadConfig()
      await ConfigLoader.loadConfig()

      expect(mockRNFS.readFile).toHaveBeenCalledTimes(1)
      expect(mockTOML.parse).toHaveBeenCalledTimes(1)
    })

    it('should throw error when file cannot be read', async () => {
      mockRNFS.readFile.mockRejectedValue(new Error('File not found'))

      await expect(ConfigLoader.loadConfig()).rejects.toThrow(
        'Failed to load application configuration'
      )
    })

    it('should throw error when TOML parsing fails', async () => {
      const mockTomlContent = 'invalid toml content'

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockTOML.parse.mockImplementation(() => {
        throw new Error('Parse error')
      })

      await expect(ConfigLoader.loadConfig()).rejects.toThrow(
        'Failed to load application configuration'
      )
    })
  })

  describe('getServerUrl', () => {
    it('should return server URL from configuration', async () => {
      const mockTomlContent = '[server]\nurl = "https://guidr.madebysteven.nl/testing-server"'
      const mockParsedConfig = {
        server: {
          url: 'https://guidr.madebysteven.nl/testing-server',
        },
      }

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockTOML.parse.mockReturnValue(mockParsedConfig)

      const url = await ConfigLoader.getServerUrl()

      expect(url).toBe('https://guidr.madebysteven.nl/testing-server')
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

      mockRNFS.readFile.mockResolvedValue(mockTomlContent)
      mockTOML.parse.mockReturnValue(mockParsedConfig)

      await ConfigLoader.loadConfig()
      ConfigLoader.clearCache()
      await ConfigLoader.loadConfig()

      expect(mockRNFS.readFile).toHaveBeenCalledTimes(2)
    })
  })
})
