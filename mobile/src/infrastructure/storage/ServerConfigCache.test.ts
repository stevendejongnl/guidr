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
      ServerConfigCache.setConfig({ minAppVersion: '1.0.0', maxAppVersion: null })
      expect(ServerConfigCache.hasConfig()).toBe(true)
    })

    it('should return false after config is cleared', () => {
      ServerConfigCache.setConfig({ minAppVersion: '1.0.0' })
      ServerConfigCache.clearConfig()
      expect(ServerConfigCache.hasConfig()).toBe(false)
    })
  })

  describe('getConfig', () => {
    it('should return null initially', () => {
      expect(ServerConfigCache.getConfig()).toBeNull()
    })

    it('should return stored config', () => {
      const config = { minAppVersion: '1.0.0', maxAppVersion: '2.0.0' }
      ServerConfigCache.setConfig(config)
      expect(ServerConfigCache.getConfig()).toEqual(config)
    })

    it('should return config with version constraints', () => {
      const config = { minAppVersion: '1.0.0', maxAppVersion: null }
      ServerConfigCache.setConfig(config)
      expect(ServerConfigCache.getConfig()).toEqual(config)
    })

    it('should return null after clear', () => {
      ServerConfigCache.setConfig({ minAppVersion: '1.0.0' })
      ServerConfigCache.clearConfig()
      expect(ServerConfigCache.getConfig()).toBeNull()
    })
  })

  describe('setConfig', () => {
    it('should store config with version constraints', () => {
      const config = { minAppVersion: '1.0.0', maxAppVersion: null }
      ServerConfigCache.setConfig(config)
      expect(ServerConfigCache.getConfig()).toEqual(config)
    })

    it('should store config with min and max versions', () => {
      const config = { minAppVersion: '1.0.0', maxAppVersion: '2.0.0' }
      ServerConfigCache.setConfig(config)
      expect(ServerConfigCache.getConfig()).toEqual(config)
    })

    it('should overwrite existing config', () => {
      ServerConfigCache.setConfig({ minAppVersion: '1.0.0' })
      const newConfig = { minAppVersion: '1.1.0', maxAppVersion: '2.0.0' }
      ServerConfigCache.setConfig(newConfig)
      expect(ServerConfigCache.getConfig()).toEqual(newConfig)
    })
  })

  describe('clearConfig', () => {
    it('should clear stored config', () => {
      ServerConfigCache.setConfig({ minAppVersion: '1.0.0' })
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
