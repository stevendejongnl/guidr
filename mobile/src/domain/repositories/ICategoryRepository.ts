import { Category } from '../entities/Category'

export interface ICategoryRepository {
  findById(id: string, _authToken?: string): Promise<Category | null>
  findAll(_authToken?: string): Promise<Category[]>
  findByParentId(parentId: string | null, _authToken?: string): Promise<Category[]>
  save(category: Category, _authToken?: string): Promise<void>
  delete(id: string, _authToken?: string): Promise<void>
}
