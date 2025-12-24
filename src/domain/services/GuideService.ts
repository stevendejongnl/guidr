import uuid from 'react-native-uuid'
import { Guide } from '../entities/Guide'
import { IGuideRepository } from '../repositories/IGuideRepository'
import { IStepRepository } from '../repositories/IStepRepository'

export class GuideService {
  constructor(
    private readonly guideRepository: IGuideRepository,
    private readonly stepRepository: IStepRepository
  ) {}

  async createGuide(categoryId: string, title: string, description?: string): Promise<Guide> {
    const id = uuid.v4() as string
    const guide = new Guide(id, categoryId, title, description)
    await this.guideRepository.save(guide)
    return guide
  }

  async getGuideById(id: string): Promise<Guide | null> {
    return await this.guideRepository.findById(id)
  }

  async getAllGuides(): Promise<Guide[]> {
    return await this.guideRepository.findAll()
  }

  async getGuidesByCategoryId(categoryId: string): Promise<Guide[]> {
    return await this.guideRepository.findByCategoryId(categoryId)
  }

  async updateGuideTitle(id: string, newTitle: string): Promise<void> {
    const guide = await this.guideRepository.findById(id)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }
    guide.updateTitle(newTitle)
    await this.guideRepository.save(guide)
  }

  async updateGuideDescription(id: string, newDescription: string): Promise<void> {
    const guide = await this.guideRepository.findById(id)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }
    guide.updateDescription(newDescription)
    await this.guideRepository.save(guide)
  }

  async addStepToGuide(guideId: string, stepId: string): Promise<void> {
    const guide = await this.guideRepository.findById(guideId)
    if (!guide) {
      throw new Error(`Guide with id ${guideId} not found`)
    }

    const step = await this.stepRepository.findById(stepId)
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`)
    }

    if (step.guideId !== guideId) {
      throw new Error(`Step ${stepId} does not belong to guide ${guideId}`)
    }

    guide.addStep(stepId)
    await this.guideRepository.save(guide)
  }

  async removeStepFromGuide(guideId: string, stepId: string): Promise<void> {
    const guide = await this.guideRepository.findById(guideId)
    if (!guide) {
      throw new Error(`Guide with id ${guideId} not found`)
    }
    guide.removeStep(stepId)
    await this.guideRepository.save(guide)
  }

  async deleteGuide(id: string): Promise<void> {
    const guide = await this.guideRepository.findById(id)
    if (!guide) {
      throw new Error(`Guide with id ${id} not found`)
    }

    // Delete all steps associated with this guide
    for (const stepId of guide.stepIds) {
      await this.stepRepository.delete(stepId)
    }

    await this.guideRepository.delete(id)
  }
}
