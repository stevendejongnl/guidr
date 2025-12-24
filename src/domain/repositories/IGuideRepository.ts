import { Guide } from '../entities/Guide'

export interface IGuideRepository {
  findById(id: string): Promise<Guide | null>
  findAll(): Promise<Guide[]>
  findByCategoryId(categoryId: string): Promise<Guide[]>
  save(guide: Guide): Promise<void>
  delete(id: string): Promise<void>
}
