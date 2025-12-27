import { ServerConfigCache } from './ServerConfigCache'

describe('ServerConfigCache', () => {
  beforeEach(() => {
    ServerConfigCache.clearConfig()
  })

  describe('hasConfig', () => {
    it('should return false initially', () => {
      expect(ServerConfigCache.hasConfig()).toBe(false)
    })

    it('should return true after config is set', () => {
      ServerConfigCache.setConfig({ debugMode: true })
      expect(ServerConfigCache.hasConfig()).toBe(true)
    })

    it('should return false after config is cleared', () => {
      ServerConfigCache.setConfig({ debugMode: true })
      ServerConfigCache.clearConfig()
      expect(ServerConfigCache.hasConfig()).toBe(false)
    })
  })

  describe('getConfig', () => {
    it('should return null initially', () => {
      expect(ServerConfigCache.getConfig()).toBeNull()
    })

    it('should return stored config', () => {
      const config = { debugMode: true }
      ServerConfigCache.setConfig(config)
      expect(ServerConfigCache.getConfig()).toEqual(config)
    })

    it('should return config with debugMode false', () => {
      const config = { debugMode: false }
      ServerConfigCache.setConfig(config)
      expect(ServerConfigCache.getConfig()).toEqual(config)
    })

    it('should return null after clear', () => {
      ServerConfigCache.setConfig({ debugMode: true })
      ServerConfigCache.clearConfig()
      expect(ServerConfigCache.getConfig()).toBeNull()
    })
  })

  describe('setConfig', () => {
    it('should store config with debugMode true', () => {
      ServerConfigCache.setConfig({ debugMode: true })
      expect(ServerConfigCache.getConfig()).toEqual({ debugMode: true })
    })

    it('should store config with debugMode false', () => {
      ServerConfigCache.setConfig({ debugMode: false })
      expect(ServerConfigCache.getConfig()).toEqual({ debugMode: false })
    })

    it('should overwrite existing config', () => {
      ServerConfigCache.setConfig({ debugMode: true })
      ServerConfigCache.setConfig({ debugMode: false })
      expect(ServerConfigCache.getConfig()).toEqual({ debugMode: false })
    })
  })

  describe('clearConfig', () => {
    it('should clear stored config', () => {
      ServerConfigCache.setConfig({ debugMode: true })
      ServerConfigCache.clearConfig()
      expect(ServerConfigCache.hasConfig()).toBe(false)
      expect(ServerConfigCache.getConfig()).toBeNull()
    })

    it('should be safe to call when no config exists', () => {
      expect(() => ServerConfigCache.clearConfig()).not.toThrow()
      expect(ServerConfigCache.hasConfig()).toBe(false)
    })
  })
})
