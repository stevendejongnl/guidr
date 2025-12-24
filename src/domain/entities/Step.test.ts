import { Step } from './Step'

describe('Step', () => {
  describe('creation', () => {
    it('should create a step with required properties', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix ingredients', 180)

      expect(step.id).toBe('step-1')
      expect(step.guideId).toBe('guide-1')
      expect(step.order).toBe(1)
      expect(step.title).toBe('Mix ingredients')
      expect(step.duration).toBe(180)
      expect(step.description).toBeUndefined()
      expect(step.createdAt).toBeInstanceOf(Date)
      expect(step.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a step with optional description', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix ingredients', 180, 'Combine all dry ingredients')
      expect(step.description).toBe('Combine all dry ingredients')
    })

    it('should throw error if id is empty', () => {
      expect(() => new Step('', 'guide-1', 1, 'Mix', 180)).toThrow('Step id cannot be empty')
    })

    it('should throw error if guideId is empty', () => {
      expect(() => new Step('step-1', '', 1, 'Mix', 180)).toThrow('Guide id cannot be empty')
    })

    it('should throw error if title is empty', () => {
      expect(() => new Step('step-1', 'guide-1', 1, '', 180)).toThrow('Step title cannot be empty')
    })

    it('should throw error if order is negative', () => {
      expect(() => new Step('step-1', 'guide-1', -1, 'Mix', 180)).toThrow('Step order must be non-negative')
    })

    it('should throw error if duration is negative', () => {
      expect(() => new Step('step-1', 'guide-1', 1, 'Mix', -5)).toThrow('Step duration must be non-negative')
    })

    it('should allow zero duration', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 0)
      expect(step.duration).toBe(0)
    })

    it('should allow zero order', () => {
      const step = new Step('step-1', 'guide-1', 0, 'Mix', 180)
      expect(step.order).toBe(0)
    })
  })

  describe('updateTitle', () => {
    it('should update step title', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      const oldUpdatedAt = step.updatedAt

      setTimeout(() => {
        step.updateTitle('Stir ingredients')

        expect(step.title).toBe('Stir ingredients')
        expect(step.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })

    it('should throw error if new title is empty', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      expect(() => step.updateTitle('')).toThrow('Step title cannot be empty')
    })
  })

  describe('updateDescription', () => {
    it('should update step description', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      step.updateDescription('Use a wooden spoon')

      expect(step.description).toBe('Use a wooden spoon')
    })

    it('should allow empty description', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180, 'Original description')
      step.updateDescription('')

      expect(step.description).toBe('')
    })
  })

  describe('updateDuration', () => {
    it('should update step duration', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      const oldUpdatedAt = step.updatedAt

      setTimeout(() => {
        step.updateDuration(240)

        expect(step.duration).toBe(240)
        expect(step.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })

    it('should allow zero duration', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      step.updateDuration(0)

      expect(step.duration).toBe(0)
    })

    it('should throw error if new duration is negative', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      expect(() => step.updateDuration(-10)).toThrow('Step duration must be non-negative')
    })
  })

  describe('updateOrder', () => {
    it('should update step order', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      const oldUpdatedAt = step.updatedAt

      setTimeout(() => {
        step.updateOrder(3)

        expect(step.order).toBe(3)
        expect(step.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })

    it('should allow zero order', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      step.updateOrder(0)

      expect(step.order).toBe(0)
    })

    it('should throw error if new order is negative', () => {
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)
      expect(() => step.updateOrder(-1)).toThrow('Step order must be non-negative')
    })
  })
})
