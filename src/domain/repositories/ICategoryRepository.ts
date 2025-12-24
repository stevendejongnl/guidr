import { Category } from '../entities/Category'

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>
  findAll(): Promise<Category[]>
  findByParentId(parentId: string | null): Promise<Category[]>
  save(category: Category): Promise<void>
  delete(id: string): Promise<void>
}
