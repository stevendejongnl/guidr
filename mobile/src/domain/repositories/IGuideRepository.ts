import { Guide } from '../entities/Guide'
import { Step } from '../entities/Step'

export interface GuideWithStepsResult {
  guide: Guide
  steps: Step[]
}

export interface IGuideRepository {
  findById(id: string, authToken: string): Promise<Guide | null>
  findAll(authToken: string): Promise<Guide[]>
  findByType(guideType: string, authToken: string): Promise<Guide[]>
  findMyGuides(authToken: string): Promise<Guide[]>
  findPublicGuides(authToken: string): Promise<Guide[]>
  findHighlightedGuides(authToken: string): Promise<Guide[]>
  save(guide: Guide, authToken: string): Promise<void>
  delete(id: string, authToken: string): Promise<void>
  copyToLanguage(guideId: string, targetLanguage: string, authToken: string): Promise<GuideWithStepsResult>
  translateToLanguage(guideId: string, targetLanguage: string, authToken: string): Promise<GuideWithStepsResult>
}
