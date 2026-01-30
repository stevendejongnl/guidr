import { Guide } from '../entities/Guide'

export interface IGuideRepository {
  findById(id: string, authToken: string): Promise<Guide | null>
  findAll(authToken: string): Promise<Guide[]>
  findByCategoryId(categoryId: string, authToken: string): Promise<Guide[]>
  findMyGuides(authToken: string): Promise<Guide[]>
  findPublicGuides(authToken: string): Promise<Guide[]>
  findHighlightedGuides(authToken: string): Promise<Guide[]>
  save(guide: Guide, authToken: string): Promise<void>
  delete(id: string, authToken: string): Promise<void>
}
