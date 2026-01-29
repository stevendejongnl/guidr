import uuid from 'react-native-uuid'
import { Step } from '../entities/Step'
import { IStepRepository } from '../repositories/IStepRepository'

export class StepService {
  constructor(private readonly stepRepository: IStepRepository) {}

  async createStep(
    guideId: string,
    order: number,
    title: string,
    duration: number,
    description: string | undefined,
    authToken: string
  ): Promise<Step> {
    const id = uuid.v4() as string
    const step = new Step(id, guideId, order, title, duration, description)
    await this.stepRepository.save(step, authToken)
    return step
  }

  async getStepById(id: string, authToken: string): Promise<Step | null> {
    return await this.stepRepository.findById(id, authToken)
  }

  async getStepsByGuideId(guideId: string, authToken: string): Promise<Step[]> {
    return await this.stepRepository.findByGuideId(guideId, authToken)
  }

  async updateStepTitle(stepId: string, newTitle: string, authToken: string): Promise<void> {
    const step = await this.stepRepository.findById(stepId, authToken)
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`)
    }
    step.updateTitle(newTitle)
    await this.stepRepository.save(step, authToken)
  }

  async updateStepDescription(stepId: string, newDescription: string, authToken: string): Promise<void> {
    const step = await this.stepRepository.findById(stepId, authToken)
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`)
    }
    step.updateDescription(newDescription)
    await this.stepRepository.save(step, authToken)
  }

  async updateStepDuration(stepId: string, newDuration: number, authToken: string): Promise<void> {
    const step = await this.stepRepository.findById(stepId, authToken)
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`)
    }
    step.updateDuration(newDuration)
    await this.stepRepository.save(step, authToken)
  }

  async updateStepOrder(stepId: string, newOrder: number, authToken: string): Promise<void> {
    const step = await this.stepRepository.findById(stepId, authToken)
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`)
    }
    step.updateOrder(newOrder)
    await this.stepRepository.save(step, authToken)
  }

  async deleteStep(stepId: string, authToken: string): Promise<void> {
    const step = await this.stepRepository.findById(stepId, authToken)
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`)
    }
    await this.stepRepository.delete(stepId, authToken)
  }
}
