import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  isValidLanguage,
  getLanguageLabel,
} from './Languages'

describe('Languages', () => {
  describe('LANGUAGES constant', () => {
    it('should contain English', () => {
      expect(LANGUAGES['en']).toBe('English')
    })

    it('should contain Dutch', () => {
      expect(LANGUAGES['nl']).toBe('Nederlands')
    })

    it('should contain many languages', () => {
      expect(Object.keys(LANGUAGES).length).toBeGreaterThan(100)
    })

    it('should have two-letter codes as keys', () => {
      for (const code of Object.keys(LANGUAGES)) {
        expect(code).toHaveLength(2)
      }
    })
  })

  describe('DEFAULT_LANGUAGE', () => {
    it('should be English', () => {
      expect(DEFAULT_LANGUAGE).toBe('en')
    })
  })

  describe('isValidLanguage', () => {
    it('should return true for valid codes', () => {
      expect(isValidLanguage('en')).toBe(true)
      expect(isValidLanguage('nl')).toBe(true)
      expect(isValidLanguage('de')).toBe(true)
    })

    it('should return false for invalid codes', () => {
      expect(isValidLanguage('xx')).toBe(false)
      expect(isValidLanguage('')).toBe(false)
      expect(isValidLanguage('eng')).toBe(false)
    })
  })

  describe('getLanguageLabel', () => {
    it('should return label for known language', () => {
      expect(getLanguageLabel('en')).toBe('English')
      expect(getLanguageLabel('nl')).toBe('Nederlands')
    })

    it('should return code for unknown language', () => {
      expect(getLanguageLabel('xx')).toBe('xx')
    })
  })
})
