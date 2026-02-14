import uuid from 'react-native-uuid'
import { Guide } from '../entities/Guide'
import { IGuideRepository } from '../repositories/IGuideRepository'
import { IStepRepository } from '../repositories/IStepRepository'

export class GuideService {
  constructor(
    private readonly guideRepository: IGuideRepository,
    private readonly stepRepository: IStepRepository
  ) {}

  async createGuide(
    guideType: string,
    title: string,
    description: string | undefined,
    authToken: string,
    createdByUserId?: string,
    isPublic: boolean = false,
    metadata?: Record<string, unknown>,
    language: string = 'en'
  ): Promise<Guide> {
    const id = uuid.v4() as string
    const guide = new Guide(
      id,
      guideType,
      title,
      description,
      createdByUserId,
      isPublic,
      false,
      metadata,
      language
    )
    await this.guideRepository.save(guide, authToken)
    return guide
  }

  async getGuideById(id: string, authToken: string): Promise<Guide | null> {
    return await this.guideRepository.findById(id, authToken)
  }

  async getAllGuides(authToken: string): Promise<Guide[]> {
    return await this.guideRepository.findAll(authToken)
  }

  async getMyGuides(authToken: string): Promise<Guide[]> {
    return await this.guideRepository.findMyGuides(authToken)
  }

  async getGuidesByType(guideType: string, authToken: string): Promise<Guide[]> {
    return await this.guideRepository.findByType(guideType, authToken)
  }

  async updateGuideTitle(id: string, newTitle: string, authToken: string): Promise<void> {
    const guide = await this.guideRepository.findById(id, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }
    guide.updateTitle(newTitle)
    await this.guideRepository.save(guide, authToken)
  }

  async updateGuideDescription(id: string, newDescription: string, authToken: string): Promise<void> {
    const guide = await this.guideRepository.findById(id, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }
    guide.updateDescription(newDescription)
    await this.guideRepository.save(guide, authToken)
  }

  async addStepToGuide(guideId: string, stepId: string, authToken: string): Promise<void> {
    const guide = await this.guideRepository.findById(guideId, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${guideId} not found`)
    }

    const step = await this.stepRepository.findById(stepId, authToken)
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`)
    }

    if (step.guideId !== guideId) {
      throw new Error(`Step ${stepId} does not belong to guide ${guideId}`)
    }

    guide.addStep(stepId)
    await this.guideRepository.save(guide, authToken)
  }

  async removeStepFromGuide(guideId: string, stepId: string, authToken: string): Promise<void> {
    const guide = await this.guideRepository.findById(guideId, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${guideId} not found`)
    }
    guide.removeStep(stepId)
    await this.guideRepository.save(guide, authToken)
  }

  async updateGuideLanguage(id: string, language: string, authToken: string): Promise<void> {
    const guide = await this.guideRepository.findById(id, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }
    guide.updateLanguage(language)
    await this.guideRepository.save(guide, authToken)
  }

  async updateGuideMetadata(
    id: string,
    metadata: Record<string, unknown>,
    authToken: string
  ): Promise<void> {
    const guide = await this.guideRepository.findById(id, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }
    guide.updateMetadata(metadata)
    await this.guideRepository.save(guide, authToken)
  }

  async deleteGuide(id: string, authToken: string): Promise<void> {
    const guide = await this.guideRepository.findById(id, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }

    // Delete all steps associated with this guide
    for (const stepId of guide.stepIds) {
      await this.stepRepository.delete(stepId, authToken)
    }

    await this.guideRepository.delete(id, authToken)
  }

  async toggleVisibility(id: string, isPublic: boolean, authToken: string): Promise<void> {
    const guide = await this.guideRepository.findById(id, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }

    if (isPublic) {
      guide.makePublic()
    } else {
      guide.makePrivate()
    }

    await this.guideRepository.save(guide, authToken)
  }

  async toggleHighlight(id: string, isHighlighted: boolean, authToken: string): Promise<void> {
    const guide = await this.guideRepository.findById(id, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }

    if (isHighlighted) {
      guide.highlight()
    } else {
      guide.unhighlight()
    }

    await this.guideRepository.save(guide, authToken)
  }
}
