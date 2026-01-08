import { CategoryService } from './CategoryService'
import { ICategoryRepository } from '../repositories/ICategoryRepository'
import { Category } from '../entities/Category'

describe('CategoryService', () => {
  let categoryService: CategoryService
  let mockRepository: jest.Mocked<ICategoryRepository>
  const authToken = 'mock-auth-token'

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByParentId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }
    categoryService = new CategoryService(mockRepository)
  })

  describe('createCategory', () => {
    it('should create a new category with generated ID', async () => {
      const name = 'Recipes'
      const parentId = null

      const category = await categoryService.createCategory(name, parentId, authToken)

      expect(category.id).toBeDefined()
      expect(category.name).toBe(name)
      expect(category.parentId).toBe(parentId)
      expect(mockRepository.save).toHaveBeenCalledWith(category, authToken)
    })

    it('should create a subcategory with parent ID', async () => {
      const name = 'Italian'
      const parentId = 'cat-1'

      const category = await categoryService.createCategory(name, parentId, authToken)

      expect(category.name).toBe(name)
      expect(category.parentId).toBe(parentId)
      expect(mockRepository.save).toHaveBeenCalledWith(category, authToken)
    })

    it('should throw error if name is empty', async () => {
      await expect(categoryService.createCategory('', null, authToken)).rejects.toThrow(
        'Category name cannot be empty'
      )
    })
  })

  describe('getCategoryById', () => {
    it('should return category if found', async () => {
      const category = new Category('cat-1', 'Recipes', null)
      mockRepository.findById.mockResolvedValue(category)

      const result = await categoryService.getCategoryById('cat-1', authToken)

      expect(result).toBe(category)
      expect(mockRepository.findById).toHaveBeenCalledWith('cat-1', authToken)
    })

    it('should return null if category not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await categoryService.getCategoryById('cat-999', authToken)

      expect(result).toBeNull()
      expect(mockRepository.findById).toHaveBeenCalledWith('cat-999', authToken)
    })
  })

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const categories = [
        new Category('cat-1', 'Recipes', null),
        new Category('cat-2', 'Italian', 'cat-1'),
      ]
      mockRepository.findAll.mockResolvedValue(categories)

      const result = await categoryService.getAllCategories(authToken)

      expect(result).toEqual(categories)
      expect(mockRepository.findAll).toHaveBeenCalledWith(authToken)
    })

    it('should return empty array if no categories', async () => {
      mockRepository.findAll.mockResolvedValue([])

      const result = await categoryService.getAllCategories(authToken)

      expect(result).toEqual([])
      expect(mockRepository.findAll).toHaveBeenCalledWith(authToken)
    })
  })

  describe('getCategoriesByParentId', () => {
    it('should return root categories when parentId is null', async () => {
      const categories = [
        new Category('cat-1', 'Recipes', null),
        new Category('cat-2', 'Travel', null),
      ]
      mockRepository.findByParentId.mockResolvedValue(categories)

      const result = await categoryService.getCategoriesByParentId(null, authToken)

      expect(result).toEqual(categories)
      expect(mockRepository.findByParentId).toHaveBeenCalledWith(null, authToken)
    })

    it('should return subcategories for given parent', async () => {
      const categories = [
        new Category('cat-2', 'Italian', 'cat-1'),
        new Category('cat-3', 'French', 'cat-1'),
      ]
      mockRepository.findByParentId.mockResolvedValue(categories)

      const result = await categoryService.getCategoriesByParentId('cat-1', authToken)

      expect(result).toEqual(categories)
      expect(mockRepository.findByParentId).toHaveBeenCalledWith('cat-1', authToken)
    })
  })

  describe('updateCategoryName', () => {
    it('should update category name and save', async () => {
      const category = new Category('cat-1', 'Recipes', null)
      mockRepository.findById.mockResolvedValue(category)

      await categoryService.updateCategoryName('cat-1', 'Cooking', authToken)

      expect(category.name).toBe('Cooking')
      expect(mockRepository.save).toHaveBeenCalledWith(category, authToken)
    })

    it('should throw error if category not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(categoryService.updateCategoryName('cat-999', 'Cooking', authToken)).rejects.toThrow(
        'Category with id cat-999 not found'
      )
    })

    it('should throw error if new name is empty', async () => {
      const category = new Category('cat-1', 'Recipes', null)
      mockRepository.findById.mockResolvedValue(category)

      await expect(categoryService.updateCategoryName('cat-1', '', authToken)).rejects.toThrow(
        'Category name cannot be empty'
      )
    })
  })

  describe('deleteCategory', () => {
    it('should delete category by ID', async () => {
      await categoryService.deleteCategory('cat-1', authToken)

      expect(mockRepository.delete).toHaveBeenCalledWith('cat-1', authToken)
    })
  })
})
