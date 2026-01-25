import { Guide } from '../../domain/entities/Guide'
import { createGuideViewModel } from './GuideViewModel'

describe('GuideViewModel', () => {
  describe('createGuideViewModel', () => {
    it('creates a ViewModel from a Guide entity with category name', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Learn to Cook', 'A beginner cooking guide')
      const categoryName = 'Cooking'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.id).toBe('guide-1')
      expect(viewModel.categoryId).toBe('cat-1')
      expect(viewModel.title).toBe('Learn to Cook')
      expect(viewModel.description).toBe('A beginner cooking guide')
      expect(viewModel.categoryName).toBe('Cooking')
      expect(viewModel.stepCount).toBe(0)
    })

    it('includes timestamps from domain entity', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Test Guide')
      const categoryName = 'Test Category'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.createdAt).toEqual(guide.createdAt)
      expect(viewModel.updatedAt).toEqual(guide.updatedAt)
    })

    it('includes stepCount from domain entity', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Test Guide')
      guide.addStep('step-1')
      guide.addStep('step-2')
      const categoryName = 'Test'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.stepCount).toBe(2)
    })

    it('generates thumbnail emoji for UI display', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Learn to Cook')
      const categoryName = 'Cooking'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.thumbnailEmoji).toBeTruthy()
      expect(typeof viewModel.thumbnailEmoji).toBe('string')
      expect(viewModel.thumbnailEmoji.length).toBeGreaterThan(0)
    })

    it('generates consistent emoji for same guide title', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Learn to Cook')
      const categoryName = 'Cooking'

      const viewModel1 = createGuideViewModel(guide, categoryName)
      const viewModel2 = createGuideViewModel(guide, categoryName)

      expect(viewModel1.thumbnailEmoji).toBe(viewModel2.thumbnailEmoji)
    })

    it('handles undefined description', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Test Guide', undefined)
      const categoryName = 'Test'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.description).toBeUndefined()
    })

    it('sets duration as undefined (future feature)', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Test Guide')
      const categoryName = 'Test'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.duration).toBeUndefined()
    })

    it('sets imageUrl as undefined (future feature)', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Test Guide')
      const categoryName = 'Test'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.imageUrl).toBeUndefined()
    })

    it('sets rating as undefined (future feature)', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Test Guide')
      const categoryName = 'Test'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.rating).toBeUndefined()
    })

    it('sets status as undefined (future feature)', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Test Guide')
      const categoryName = 'Test'

      const viewModel = createGuideViewModel(guide, categoryName)

      expect(viewModel.status).toBeUndefined()
    })
  })
})
