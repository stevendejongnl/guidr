import { StepService } from './StepService'
import { Step } from '../entities/Step'
import { IStepRepository } from '../repositories/IStepRepository'

describe('StepService', () => {
  let stepService: StepService
  let mockRepository: jest.Mocked<IStepRepository>
  const authToken = 'test-auth-token'

  function makeStep(overrides: {
    id?: string
    guideId?: string
    order?: number
    title?: string
    duration?: number
    description?: string
  } = {}): Step {
    return new Step(
      overrides.id ?? 'step-1',
      overrides.guideId ?? 'guide-1',
      overrides.order ?? 1,
      overrides.title ?? 'Boil water',
      overrides.duration ?? 120,
      overrides.description,
    )
  }

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByGuideId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }
    stepService = new StepService(mockRepository)
  })

  describe('createStep', () => {
    it('creates a step with a generated id and saves it', async () => {
      mockRepository.save.mockResolvedValue(undefined)

      const step = await stepService.createStep('guide-1', 1, 'Boil water', 120, undefined, authToken)

      expect(step.id).toBeDefined()
      expect(step.guideId).toBe('guide-1')
      expect(step.order).toBe(1)
      expect(step.title).toBe('Boil water')
      expect(step.duration).toBe(120)
      expect(step.description).toBeUndefined()
      expect(mockRepository.save).toHaveBeenCalledWith(step, authToken)
    })

    it('creates a step with description when provided', async () => {
      mockRepository.save.mockResolvedValue(undefined)

      const step = await stepService.createStep(
        'guide-1',
        2,
        'Add salt',
        30,
        'Add a pinch of salt',
        authToken,
      )

      expect(step.description).toBe('Add a pinch of salt')
      expect(mockRepository.save).toHaveBeenCalledWith(step, authToken)
    })

    it('returns the created step', async () => {
      mockRepository.save.mockResolvedValue(undefined)

      const step = await stepService.createStep('guide-1', 1, 'Mix', 60, undefined, authToken)

      expect(step).toBeInstanceOf(Step)
    })

    it('propagates repository errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Save failed'))

      await expect(
        stepService.createStep('guide-1', 1, 'Step', 60, undefined, authToken),
      ).rejects.toThrow('Save failed')
    })
  })

  describe('getStepById', () => {
    it('returns the step when found', async () => {
      const step = makeStep()
      mockRepository.findById.mockResolvedValue(step)

      const result = await stepService.getStepById('step-1', authToken)

      expect(result).toBe(step)
      expect(mockRepository.findById).toHaveBeenCalledWith('step-1', authToken)
    })

    it('returns null when step not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await stepService.getStepById('unknown-id', authToken)

      expect(result).toBeNull()
    })
  })

  describe('getStepsByGuideId', () => {
    it('returns steps for the given guide', async () => {
      const steps = [makeStep({ id: 'step-1' }), makeStep({ id: 'step-2', order: 2, title: 'Stir' })]
      mockRepository.findByGuideId.mockResolvedValue(steps)

      const result = await stepService.getStepsByGuideId('guide-1', authToken)

      expect(result).toHaveLength(2)
      expect(result[0]!['id']).toBe('step-1')
      expect(result[1]!['id']).toBe('step-2')
      expect(mockRepository.findByGuideId).toHaveBeenCalledWith('guide-1', authToken)
    })

    it('returns empty array when guide has no steps', async () => {
      mockRepository.findByGuideId.mockResolvedValue([])

      const result = await stepService.getStepsByGuideId('guide-empty', authToken)

      expect(result).toHaveLength(0)
    })
  })

  describe('updateStepTitle', () => {
    it('updates the title and saves the step', async () => {
      const step = makeStep()
      mockRepository.findById.mockResolvedValue(step)
      mockRepository.save.mockResolvedValue(undefined)

      await stepService.updateStepTitle('step-1', 'New Title', authToken)

      expect(step.title).toBe('New Title')
      expect(mockRepository.save).toHaveBeenCalledWith(step, authToken)
    })

    it('throws when step is not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        stepService.updateStepTitle('missing-step', 'New Title', authToken),
      ).rejects.toThrow('Step with id missing-step not found')

      expect(mockRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('updateStepDescription', () => {
    it('updates the description and saves the step', async () => {
      const step = makeStep()
      mockRepository.findById.mockResolvedValue(step)
      mockRepository.save.mockResolvedValue(undefined)

      await stepService.updateStepDescription('step-1', 'New description', authToken)

      expect(step.description).toBe('New description')
      expect(mockRepository.save).toHaveBeenCalledWith(step, authToken)
    })

    it('throws when step is not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        stepService.updateStepDescription('missing-step', 'desc', authToken),
      ).rejects.toThrow('Step with id missing-step not found')

      expect(mockRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('updateStepDuration', () => {
    it('updates the duration and saves the step', async () => {
      const step = makeStep()
      mockRepository.findById.mockResolvedValue(step)
      mockRepository.save.mockResolvedValue(undefined)

      await stepService.updateStepDuration('step-1', 300, authToken)

      expect(step.duration).toBe(300)
      expect(mockRepository.save).toHaveBeenCalledWith(step, authToken)
    })

    it('throws when step is not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        stepService.updateStepDuration('missing-step', 300, authToken),
      ).rejects.toThrow('Step with id missing-step not found')

      expect(mockRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('updateStepOrder', () => {
    it('updates the order and saves the step', async () => {
      const step = makeStep()
      mockRepository.findById.mockResolvedValue(step)
      mockRepository.save.mockResolvedValue(undefined)

      await stepService.updateStepOrder('step-1', 5, authToken)

      expect(step.order).toBe(5)
      expect(mockRepository.save).toHaveBeenCalledWith(step, authToken)
    })

    it('throws when step is not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        stepService.updateStepOrder('missing-step', 5, authToken),
      ).rejects.toThrow('Step with id missing-step not found')

      expect(mockRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('deleteStep', () => {
    it('deletes the step when found', async () => {
      const step = makeStep()
      mockRepository.findById.mockResolvedValue(step)
      mockRepository.delete.mockResolvedValue(undefined)

      await stepService.deleteStep('step-1', authToken)

      expect(mockRepository.delete).toHaveBeenCalledWith('step-1', authToken)
    })

    it('throws when step is not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        stepService.deleteStep('missing-step', authToken),
      ).rejects.toThrow('Step with id missing-step not found')

      expect(mockRepository.delete).not.toHaveBeenCalled()
    })
  })
})
