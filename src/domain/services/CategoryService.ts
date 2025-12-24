import uuid from 'react-native-uuid'
import { Category } from '../entities/Category'
import { ICategoryRepository } from '../repositories/ICategoryRepository'

export class CategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async createCategory(name: string, parentId: string | null): Promise<Category> {
    const id = uuid.v4() as string
    const category = new Category(id, name, parentId)
    await this.categoryRepository.save(category)
    return category
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return await this.categoryRepository.findById(id)
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.findAll()
  }

  async getCategoriesByParentId(parentId: string | null): Promise<Category[]> {
    return await this.categoryRepository.findByParentId(parentId)
  }

  async updateCategoryName(id: string, newName: string): Promise<void> {
    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw new Error(`Category with id ${id} not found`)
    }
    category.updateName(newName)
    await this.categoryRepository.save(category)
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepository.delete(id)
  }
}
