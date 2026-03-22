import { Guide } from '../../domain/entities/Guide'
import { createGuideViewModel } from './GuideViewModel'

describe('GuideViewModel', () => {
  describe('createGuideViewModel', () => {
    it('creates a ViewModel from a Guide entity with guide type label', () => {
      const guide = new Guide('guide-1', 'cooking', 'Learn to Cook', 'A beginner cooking guide')

      const viewModel = createGuideViewModel(guide)

      expect(viewModel.id).toBe('guide-1')
      expect(viewModel.guideType).toBe('cooking')
      expect(viewModel.title).toBe('Learn to Cook')
      expect(viewModel.description).toBe('A beginner cooking guide')
      expect(viewModel.guideTypeLabel).toBe('Cooking')
      expect(viewModel.stepCount).toBe(0)
    })

    it('includes timestamps from domain entity', () => {
      const guide = new Guide('guide-1', 'cooking', 'Test Guide')

      const viewModel = createGuideViewModel(guide)

      expect(viewModel.createdAt).toEqual(guide.createdAt)
      expect(viewModel.updatedAt).toEqual(guide.updatedAt)
    })

    it('includes stepCount from domain entity', () => {
      const guide = new Guide('guide-1', 'cooking', 'Test Guide')
      guide.addStep('step-1')
      guide.addStep('step-2')

      const viewModel = createGuideViewModel(guide)

      expect(viewModel.stepCount).toBe(2)
    })

    it('handles undefined description', () => {
      const guide = new Guide('guide-1', 'cooking', 'Test Guide', undefined)

      const viewModel = createGuideViewModel(guide)

      expect(viewModel.description).toBeUndefined()
    })

    it('sets duration as undefined (future feature)', () => {
      const guide = new Guide('guide-1', 'cooking', 'Test Guide')

      const viewModel = createGuideViewModel(guide)

      expect(viewModel.duration).toBeUndefined()
    })

    it('sets imageUrl as undefined (future feature)', () => {
      const guide = new Guide('guide-1', 'cooking', 'Test Guide')

      const viewModel = createGuideViewModel(guide)

      expect(viewModel.imageUrl).toBeUndefined()
    })

    it('sets rating as undefined (future feature)', () => {
      const guide = new Guide('guide-1', 'cooking', 'Test Guide')

      const viewModel = createGuideViewModel(guide)

      expect(viewModel.rating).toBeUndefined()
    })

    it('sets status as undefined (future feature)', () => {
      const guide = new Guide('guide-1', 'cooking', 'Test Guide')

      const viewModel = createGuideViewModel(guide)

      expect(viewModel.status).toBeUndefined()
    })
  })
})
