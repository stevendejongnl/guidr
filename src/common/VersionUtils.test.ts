import {
  parseVersion,
  compareVersions,
  isVersionSupported,
} from './VersionUtils'

describe('VersionUtils', () => {
  describe('parseVersion', () => {
    it('should parse valid version string', () => {
      expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
    })

    it('should parse version with zeros', () => {
      expect(parseVersion('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 })
    })

    it('should parse version with large numbers', () => {
      expect(parseVersion('10.20.30')).toEqual({
        major: 10,
        minor: 20,
        patch: 30,
      })
    })

    it('should return null for invalid version with wrong parts count', () => {
      expect(parseVersion('1.2')).toBeNull()
      expect(parseVersion('1')).toBeNull()
      expect(parseVersion('1.2.3.4')).toBeNull()
    })

    it('should return null for non-numeric version parts', () => {
      expect(parseVersion('a.b.c')).toBeNull()
      expect(parseVersion('1.2.x')).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(parseVersion('')).toBeNull()
    })
  })

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0)
    })

    it('should return -1 when first version is lower (major)', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1)
    })

    it('should return 1 when first version is higher (major)', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1)
    })

    it('should return -1 when first version is lower (minor)', () => {
      expect(compareVersions('1.1.0', '1.2.0')).toBe(-1)
    })

    it('should return 1 when first version is higher (minor)', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBe(1)
    })

    it('should return -1 when first version is lower (patch)', () => {
      expect(compareVersions('1.2.3', '1.2.4')).toBe(-1)
    })

    it('should return 1 when first version is higher (patch)', () => {
      expect(compareVersions('1.2.4', '1.2.3')).toBe(1)
    })

    it('should return 0 for invalid versions', () => {
      expect(compareVersions('invalid', '1.0.0')).toBe(0)
      expect(compareVersions('1.0.0', 'invalid')).toBe(0)
    })
  })

  describe('isVersionSupported', () => {
    it('should return true when no constraints', () => {
      expect(isVersionSupported('1.0.0')).toBe(true)
      expect(isVersionSupported('1.0.0', null, null)).toBe(true)
      expect(isVersionSupported('1.0.0', undefined, undefined)).toBe(true)
    })

    it('should return true when version equals minVersion', () => {
      expect(isVersionSupported('1.0.0', '1.0.0', null)).toBe(true)
    })

    it('should return true when version is above minVersion', () => {
      expect(isVersionSupported('1.1.0', '1.0.0', null)).toBe(true)
      expect(isVersionSupported('2.0.0', '1.0.0', null)).toBe(true)
    })

    it('should return false when version is below minVersion', () => {
      expect(isVersionSupported('0.9.0', '1.0.0', null)).toBe(false)
      expect(isVersionSupported('1.0.0', '1.0.1', null)).toBe(false)
    })

    it('should return true when version equals maxVersion', () => {
      expect(isVersionSupported('2.0.0', null, '2.0.0')).toBe(true)
    })

    it('should return true when version is below maxVersion', () => {
      expect(isVersionSupported('1.9.0', null, '2.0.0')).toBe(true)
    })

    it('should return false when version is above maxVersion', () => {
      expect(isVersionSupported('2.1.0', null, '2.0.0')).toBe(false)
    })

    it('should return true when version is within range', () => {
      expect(isVersionSupported('1.5.0', '1.0.0', '2.0.0')).toBe(true)
    })

    it('should return true when version equals range boundaries', () => {
      expect(isVersionSupported('1.0.0', '1.0.0', '2.0.0')).toBe(true)
      expect(isVersionSupported('2.0.0', '1.0.0', '2.0.0')).toBe(true)
    })

    it('should return false when version is outside range', () => {
      expect(isVersionSupported('0.9.0', '1.0.0', '2.0.0')).toBe(false)
      expect(isVersionSupported('2.1.0', '1.0.0', '2.0.0')).toBe(false)
    })
  })
})

