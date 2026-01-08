import { Guide } from './Guide'

describe('Guide', () => {
  describe('creation', () => {
    it('should create a guide with required properties', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Chocolate Chip Cookies')

      expect(guide.id).toBe('guide-1')
      expect(guide.categoryId).toBe('cat-1')
      expect(guide.title).toBe('Chocolate Chip Cookies')
      expect(guide.description).toBeUndefined()
      expect(guide.stepIds).toEqual([])
      expect(guide.stepCount).toBe(0)
      expect(guide.createdAt).toBeInstanceOf(Date)
      expect(guide.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a guide with optional description', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Chocolate Chip Cookies', 'Classic recipe')
      expect(guide.description).toBe('Classic recipe')
    })

    it('should throw error if title is empty', () => {
      expect(() => new Guide('guide-1', 'cat-1', '')).toThrow('Guide title cannot be empty')
    })

    it('should throw error if id is empty', () => {
      expect(() => new Guide('', 'cat-1', 'Cookies')).toThrow('Guide id cannot be empty')
    })

    it('should throw error if categoryId is empty', () => {
      expect(() => new Guide('guide-1', '', 'Cookies')).toThrow('Category id cannot be empty')
    })
  })

  describe('updateTitle', () => {
    it('should update guide title', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      const oldUpdatedAt = guide.updatedAt

      setTimeout(() => {
        guide.updateTitle('Chocolate Cookies')

        expect(guide.title).toBe('Chocolate Cookies')
        expect(guide.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })

    it('should throw error if new title is empty', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      expect(() => guide.updateTitle('')).toThrow('Guide title cannot be empty')
    })
  })

  describe('updateDescription', () => {
    it('should update guide description', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.updateDescription('A delicious recipe')

      expect(guide.description).toBe('A delicious recipe')
    })

    it('should allow empty description', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies', 'Original description')
      guide.updateDescription('')

      expect(guide.description).toBe('')
    })
  })

  describe('step management', () => {
    it('should add step id to guide', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.addStep('step-1')

      expect(guide.stepIds).toEqual(['step-1'])
      expect(guide.stepCount).toBe(1)
    })

    it('should maintain step order', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.addStep('step-1')
      guide.addStep('step-2')
      guide.addStep('step-3')

      expect(guide.stepIds).toEqual(['step-1', 'step-2', 'step-3'])
      expect(guide.stepCount).toBe(3)
    })

    it('should not add duplicate step ids', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.addStep('step-1')
      guide.addStep('step-1')

      expect(guide.stepIds).toEqual(['step-1'])
      expect(guide.stepCount).toBe(1)
    })

    it('should remove step id from guide', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.addStep('step-1')
      guide.addStep('step-2')
      guide.removeStep('step-1')

      expect(guide.stepIds).toEqual(['step-2'])
      expect(guide.stepCount).toBe(1)
    })

    it('should handle removing non-existent step gracefully', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.addStep('step-1')
      guide.removeStep('step-999')

      expect(guide.stepIds).toEqual(['step-1'])
      expect(guide.stepCount).toBe(1)
    })

    it('should return immutable step ids array', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.addStep('step-1')

      const stepIds = guide.stepIds
      stepIds.push('step-2')

      expect(guide.stepIds).toEqual(['step-1'])
    })
  })
})
