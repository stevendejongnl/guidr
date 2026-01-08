import { Step } from '../entities/Step'

export interface IStepRepository {
  findById(id: string, authToken: string): Promise<Step | null>
  findAll(authToken: string): Promise<Step[]>
  findByGuideId(guideId: string, authToken: string): Promise<Step[]>
  save(step: Step, authToken: string): Promise<void>
  delete(id: string, authToken: string): Promise<void>
}
