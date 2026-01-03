import { GuideService } from './GuideService'
import { IGuideRepository } from '../repositories/IGuideRepository'
import { IStepRepository } from '../repositories/IStepRepository'
import { Guide } from '../entities/Guide'
import { Step } from '../entities/Step'

describe('GuideService', () => {
  let guideService: GuideService
  const authToken = 'mock-auth-token'
  let mockGuideRepository: jest.Mocked<IGuideRepository>
  let mockStepRepository: jest.Mocked<IStepRepository>

  beforeEach(() => {
    mockGuideRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCategoryId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }
    mockStepRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByGuideId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }
    guideService = new GuideService(mockGuideRepository, mockStepRepository)
  })

  describe('createGuide', () => {
    it('should create a new guide with generated ID', async () => {
      const categoryId = 'cat-1'
      const title = 'Chocolate Chip Cookies'
      const description = 'Classic recipe'

      const guide = await guideService.createGuide(categoryId, title, description, authToken)

      expect(guide.id).toBeDefined()
      expect(guide.categoryId).toBe(categoryId)
      expect(guide.title).toBe(title)
      expect(guide.description).toBe(description)
      expect(mockGuideRepository.save).toHaveBeenCalledWith(guide, authToken)
    })

    it('should create a guide without description', async () => {
      const guide = await guideService.createGuide('cat-1', 'Cookies', undefined, authToken)

      expect(guide.description).toBeUndefined()
      expect(mockGuideRepository.save).toHaveBeenCalledWith(guide, authToken)
    })

    it('should throw error if categoryId is empty', async () => {
      await expect(guideService.createGuide('', 'Cookies', undefined, authToken)).rejects.toThrow(
        'Category id cannot be empty'
      )
    })

    it('should throw error if title is empty', async () => {
      await expect(guideService.createGuide('cat-1', '', undefined, authToken)).rejects.toThrow(
        'Guide title cannot be empty'
      )
    })
  })

  describe('getGuideById', () => {
    it('should return guide if found', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      mockGuideRepository.findById.mockResolvedValue(guide)

      const result = await guideService.getGuideById('guide-1', authToken)

      expect(result).toBe(guide)
      expect(mockGuideRepository.findById).toHaveBeenCalledWith('guide-1', authToken)
    })

    it('should return null if guide not found', async () => {
      mockGuideRepository.findById.mockResolvedValue(null)

      const result = await guideService.getGuideById('guide-999', authToken)

      expect(result).toBeNull()
      expect(mockGuideRepository.findById).toHaveBeenCalledWith('guide-999', authToken)
    })
  })

  describe('getAllGuides', () => {
    it('should return all guides', async () => {
      const guides = [
        new Guide('guide-1', 'cat-1', 'Cookies'),
        new Guide('guide-2', 'cat-1', 'Brownies'),
      ]
      mockGuideRepository.findAll.mockResolvedValue(guides)

      const result = await guideService.getAllGuides(authToken)

      expect(result).toEqual(guides)
      expect(mockGuideRepository.findAll).toHaveBeenCalled()
    })
  })

  describe('getGuidesByCategoryId', () => {
    it('should return guides for category', async () => {
      const guides = [
        new Guide('guide-1', 'cat-1', 'Cookies'),
        new Guide('guide-2', 'cat-1', 'Brownies'),
      ]
      mockGuideRepository.findByCategoryId.mockResolvedValue(guides)

      const result = await guideService.getGuidesByCategoryId('cat-1', authToken)

      expect(result).toEqual(guides)
      expect(mockGuideRepository.findByCategoryId).toHaveBeenCalledWith('cat-1', authToken)
    })
  })

  describe('updateGuideTitle', () => {
    it('should update guide title and save', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      mockGuideRepository.findById.mockResolvedValue(guide)

      await guideService.updateGuideTitle('guide-1', 'Chocolate Cookies', authToken)

      expect(guide.title).toBe('Chocolate Cookies')
      expect(mockGuideRepository.save).toHaveBeenCalledWith(guide, authToken)
    })

    it('should throw error if guide not found', async () => {
      mockGuideRepository.findById.mockResolvedValue(null)

      await expect(guideService.updateGuideTitle('guide-999', 'New Title', authToken)).rejects.toThrow(
        'Guide with id guide-999 not found'
      )
    })
  })

  describe('updateGuideDescription', () => {
    it('should update guide description and save', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      mockGuideRepository.findById.mockResolvedValue(guide)

      await guideService.updateGuideDescription('guide-1', 'A delicious recipe', authToken)

      expect(guide.description).toBe('A delicious recipe')
      expect(mockGuideRepository.save).toHaveBeenCalledWith(guide, authToken)
    })

    it('should throw error if guide not found', async () => {
      mockGuideRepository.findById.mockResolvedValue(null)

      await expect(
        guideService.updateGuideDescription('guide-999', 'Description', authToken)
      ).rejects.toThrow('Guide with id guide-999 not found')
    })
  })

  describe('addStepToGuide', () => {
    it('should add step to guide and save', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      const step = new Step('step-1', 'guide-1', 1, 'Mix ingredients', 180)
      mockGuideRepository.findById.mockResolvedValue(guide)
      mockStepRepository.findById.mockResolvedValue(step)

      await guideService.addStepToGuide('guide-1', 'step-1', authToken)

      expect(guide.stepIds).toContain('step-1')
      expect(mockGuideRepository.save).toHaveBeenCalledWith(guide, authToken)
    })

    it('should throw error if guide not found', async () => {
      mockGuideRepository.findById.mockResolvedValue(null)

      await expect(guideService.addStepToGuide('guide-999', 'step-1', authToken)).rejects.toThrow(
        'Guide with id guide-999 not found'
      )
    })

    it('should throw error if step not found', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      mockGuideRepository.findById.mockResolvedValue(guide)
      mockStepRepository.findById.mockResolvedValue(null)

      await expect(guideService.addStepToGuide('guide-1', 'step-999', authToken)).rejects.toThrow(
        'Step with id step-999 not found'
      )
    })

    it('should throw error if step belongs to different guide', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      const step = new Step('step-1', 'guide-2', 1, 'Mix', 180)
      mockGuideRepository.findById.mockResolvedValue(guide)
      mockStepRepository.findById.mockResolvedValue(step)

      await expect(guideService.addStepToGuide('guide-1', 'step-1', authToken)).rejects.toThrow(
        'Step step-1 does not belong to guide guide-1'
      )
    })
  })

  describe('removeStepFromGuide', () => {
    it('should remove step from guide and save', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.addStep('step-1')
      mockGuideRepository.findById.mockResolvedValue(guide)

      await guideService.removeStepFromGuide('guide-1', 'step-1', authToken)

      expect(guide.stepIds).not.toContain('step-1')
      expect(mockGuideRepository.save).toHaveBeenCalledWith(guide, authToken)
    })

    it('should throw error if guide not found', async () => {
      mockGuideRepository.findById.mockResolvedValue(null)

      await expect(guideService.removeStepFromGuide('guide-999', 'step-1', authToken)).rejects.toThrow(
        'Guide with id guide-999 not found'
      )
    })
  })

  describe('deleteGuide', () => {
    it('should delete guide and all its steps', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      guide.addStep('step-1')
      guide.addStep('step-2')
      mockGuideRepository.findById.mockResolvedValue(guide)

      await guideService.deleteGuide('guide-1', authToken)

      expect(mockStepRepository.delete).toHaveBeenCalledWith('step-1', authToken)
      expect(mockStepRepository.delete).toHaveBeenCalledWith('step-2', authToken)
      expect(mockGuideRepository.delete).toHaveBeenCalledWith('guide-1', authToken)
    })

    it('should delete guide even if it has no steps', async () => {
      const guide = new Guide('guide-1', 'cat-1', 'Cookies')
      mockGuideRepository.findById.mockResolvedValue(guide)

      await guideService.deleteGuide('guide-1', authToken)

      expect(mockStepRepository.delete).not.toHaveBeenCalled()
      expect(mockGuideRepository.delete).toHaveBeenCalledWith('guide-1', authToken)
    })

    it('should throw error if guide not found', async () => {
      mockGuideRepository.findById.mockResolvedValue(null)

      await expect(guideService.deleteGuide('guide-999', authToken)).rejects.toThrow(
        'Guide with id guide-999 not found'
      )
    })
  })
})
