import { Guide } from './Guide'

describe('Guide', () => {
  describe('creation', () => {
    it('should create a guide with required properties', () => {
      const guide = new Guide('guide-1', 'cooking', 'Chocolate Chip Cookies')

      expect(guide.id).toBe('guide-1')
      expect(guide.guideType).toBe('cooking')
      expect(guide.title).toBe('Chocolate Chip Cookies')
      expect(guide.description).toBeUndefined()
      expect(guide.metadata).toBeUndefined()
      expect(guide.stepIds).toEqual([])
      expect(guide.stepCount).toBe(0)
      expect(guide.createdAt).toBeInstanceOf(Date)
      expect(guide.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a guide with optional description', () => {
      const guide = new Guide('guide-1', 'cooking', 'Chocolate Chip Cookies', 'Classic recipe')
      expect(guide.description).toBe('Classic recipe')
    })

    it('should create a guide with metadata', () => {
      const guide = new Guide(
        'guide-1',
        'cooking',
        'Cookies',
        undefined,
        undefined,
        false,
        false,
        { ingredients: ['flour', 'sugar'] }
      )
      expect(guide.metadata).toEqual({ ingredients: ['flour', 'sugar'] })
    })

    it('should throw error if title is empty', () => {
      expect(() => new Guide('guide-1', 'cooking', '')).toThrow('Guide title cannot be empty')
    })

    it('should throw error if id is empty', () => {
      expect(() => new Guide('', 'cooking', 'Cookies')).toThrow('Guide id cannot be empty')
    })

    it('should throw error if guideType is invalid', () => {
      expect(() => new Guide('guide-1', 'invalid', 'Cookies')).toThrow('Invalid guide type')
    })

    it('should accept all valid guide types', () => {
      expect(() => new Guide('g1', 'cooking', 'T')).not.toThrow()
      expect(() => new Guide('g2', 'workout', 'T')).not.toThrow()
      expect(() => new Guide('g3', 'general', 'T')).not.toThrow()
    })
  })

  describe('updateTitle', () => {
    it('should update guide title', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      const oldUpdatedAt = guide.updatedAt

      setTimeout(() => {
        guide.updateTitle('Chocolate Cookies')

        expect(guide.title).toBe('Chocolate Cookies')
        expect(guide.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })

    it('should throw error if new title is empty', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      expect(() => guide.updateTitle('')).toThrow('Guide title cannot be empty')
    })
  })

  describe('updateDescription', () => {
    it('should update guide description', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.updateDescription('A delicious recipe')

      expect(guide.description).toBe('A delicious recipe')
    })

    it('should allow empty description', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies', 'Original description')
      guide.updateDescription('')

      expect(guide.description).toBe('')
    })
  })

  describe('updateMetadata', () => {
    it('should update metadata', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.updateMetadata({ ingredients: ['butter'] })

      expect(guide.metadata).toEqual({ ingredients: ['butter'] })
    })

    it('should allow clearing metadata', () => {
      const guide = new Guide(
        'guide-1',
        'cooking',
        'Cookies',
        undefined,
        undefined,
        false,
        false,
        { ingredients: ['flour'] }
      )
      guide.updateMetadata(undefined)

      expect(guide.metadata).toBeUndefined()
    })
  })

  describe('step management', () => {
    it('should add step id to guide', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.addStep('step-1')

      expect(guide.stepIds).toEqual(['step-1'])
      expect(guide.stepCount).toBe(1)
    })

    it('should maintain step order', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.addStep('step-1')
      guide.addStep('step-2')
      guide.addStep('step-3')

      expect(guide.stepIds).toEqual(['step-1', 'step-2', 'step-3'])
      expect(guide.stepCount).toBe(3)
    })

    it('should not add duplicate step ids', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.addStep('step-1')
      guide.addStep('step-1')

      expect(guide.stepIds).toEqual(['step-1'])
      expect(guide.stepCount).toBe(1)
    })

    it('should remove step id from guide', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.addStep('step-1')
      guide.addStep('step-2')
      guide.removeStep('step-1')

      expect(guide.stepIds).toEqual(['step-2'])
      expect(guide.stepCount).toBe(1)
    })

    it('should handle removing non-existent step gracefully', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.addStep('step-1')
      guide.removeStep('step-999')

      expect(guide.stepIds).toEqual(['step-1'])
      expect(guide.stepCount).toBe(1)
    })

    it('should return immutable step ids array', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.addStep('step-1')

      const stepIds = guide.stepIds
      stepIds.push('step-2')

      expect(guide.stepIds).toEqual(['step-1'])
    })
  })

  describe('visibility management', () => {
    it('should be private by default', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      expect(guide.isPublic).toBe(false)
    })

    it('should make guide public', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.makePublic()

      expect(guide.isPublic).toBe(true)
    })

    it('should make guide private', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.makePublic()
      guide.makePrivate()

      expect(guide.isPublic).toBe(false)
    })

    it('should update timestamp when changing visibility', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      const oldUpdatedAt = guide.updatedAt

      setTimeout(() => {
        guide.makePublic()
        expect(guide.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })
  })

  describe('highlighting management', () => {
    it('should not be highlighted by default', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      expect(guide.isHighlighted).toBe(false)
    })

    it('should highlight guide', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.highlight()

      expect(guide.isHighlighted).toBe(true)
    })

    it('should unhighlight guide', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.highlight()
      guide.unhighlight()

      expect(guide.isHighlighted).toBe(false)
    })

    it('should update timestamp when highlighting', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      const oldUpdatedAt = guide.updatedAt

      setTimeout(() => {
        guide.highlight()
        expect(guide.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })
  })

  describe('language', () => {
    it('should default to English', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      expect(guide.language).toBe('en')
    })

    it('should accept a custom language', () => {
      const guide = new Guide(
        'guide-1',
        'cooking',
        'Koekjes',
        undefined,
        undefined,
        false,
        false,
        undefined,
        'nl'
      )
      expect(guide.language).toBe('nl')
    })

    it('should update language', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.updateLanguage('fr')

      expect(guide.language).toBe('fr')
    })

    it('should update timestamp when changing language', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      const oldUpdatedAt = guide.updatedAt

      setTimeout(() => {
        guide.updateLanguage('de')
        expect(guide.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })
  })

  describe('ownership', () => {
    it('should be created without owner by default', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      expect(guide.createdByUserId).toBeUndefined()
    })

    it('should track owner when provided', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies', undefined, 'user-123')
      expect(guide.createdByUserId).toBe('user-123')
    })

    it('should identify if user is owner', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies', undefined, 'user-123')
      expect(guide.isOwnedBy('user-123')).toBe(true)
      expect(guide.isOwnedBy('user-456')).toBe(false)
    })

    it('should return false for isOwnedBy when no owner', () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      expect(guide.isOwnedBy('user-123')).toBe(false)
    })
  })
})
