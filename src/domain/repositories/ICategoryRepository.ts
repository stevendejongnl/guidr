import { Category } from '../entities/Category'

export interface ICategoryRepository {
  findById(id: string, authToken: string): Promise<Category | null>
  findAll(authToken: string): Promise<Category[]>
  findByParentId(parentId: string | null, authToken: string): Promise<Category[]>
  save(category: Category, authToken: string): Promise<void>
  delete(id: string, authToken: string): Promise<void>
}
