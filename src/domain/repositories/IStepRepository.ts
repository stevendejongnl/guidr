import { Step } from '../entities/Step'

export interface IStepRepository {
  findById(id: string): Promise<Step | null>
  findAll(): Promise<Step[]>
  findByGuideId(guideId: string): Promise<Step[]>
  save(step: Step): Promise<void>
  delete(id: string): Promise<void>
}
