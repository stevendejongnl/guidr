import {
  ALL_GUIDE_TYPES,
  GUIDE_TYPE_LABELS,
  GUIDE_TYPES,
  isValidGuideType,
} from './GuideTypes'

describe('GuideTypes', () => {
  it('should define cooking, workout, general types', () => {
    expect(GUIDE_TYPES.COOKING).toBe('cooking')
    expect(GUIDE_TYPES.WORKOUT).toBe('workout')
    expect(GUIDE_TYPES.GENERAL).toBe('general')
  })

  it('should list all types', () => {
    expect(ALL_GUIDE_TYPES).toEqual(['cooking', 'workout', 'general'])
  })

  it('should have labels for all types', () => {
    for (const type of ALL_GUIDE_TYPES) {
      expect(GUIDE_TYPE_LABELS[type]).toBeDefined()
    }
  })

  describe('isValidGuideType', () => {
    it('should return true for valid types', () => {
      expect(isValidGuideType('cooking')).toBe(true)
      expect(isValidGuideType('workout')).toBe(true)
      expect(isValidGuideType('general')).toBe(true)
    })

    it('should return false for invalid types', () => {
      expect(isValidGuideType('invalid')).toBe(false)
      expect(isValidGuideType('')).toBe(false)
    })
  })
})
