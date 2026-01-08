import uuid from 'react-native-uuid'
import { Category } from '../entities/Category'
import { ICategoryRepository } from '../repositories/ICategoryRepository'

export class CategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async createCategory(name: string, parentId: string | null, authToken: string): Promise<Category> {
    const id = uuid.v4() as string
    const category = new Category(id, name, parentId)
    await this.categoryRepository.save(category, authToken)
    return category
  }

  async getCategoryById(id: string, authToken: string): Promise<Category | null> {
    return await this.categoryRepository.findById(id, authToken)
  }

  async getAllCategories(authToken: string): Promise<Category[]> {
    return await this.categoryRepository.findAll(authToken)
  }

  async getCategoriesByParentId(parentId: string | null, authToken: string): Promise<Category[]> {
    return await this.categoryRepository.findByParentId(parentId, authToken)
  }

  async updateCategoryName(id: string, newName: string, authToken: string): Promise<void> {
    const category = await this.categoryRepository.findById(id, authToken)
    if (!category) {
      throw new Error(`Category with id ${id} not found`)
    }
    category.updateName(newName)
    await this.categoryRepository.save(category, authToken)
  }

  async deleteCategory(id: string, authToken: string): Promise<void> {
    await this.categoryRepository.delete(id, authToken)
  }
}
