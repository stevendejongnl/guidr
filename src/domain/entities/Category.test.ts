import { Category } from './Category'

describe('Category', () => {
  describe('creation', () => {
    it('should create a category with required properties', () => {
      const category = new Category('cat-1', 'Recipes', null)

      expect(category.id).toBe('cat-1')
      expect(category.name).toBe('Recipes')
      expect(category.parentId).toBeNull()
      expect(category.createdAt).toBeInstanceOf(Date)
      expect(category.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a subcategory with parent reference', () => {
      const category = new Category('cat-2', 'Italian', 'cat-1')

      expect(category.id).toBe('cat-2')
      expect(category.name).toBe('Italian')
      expect(category.parentId).toBe('cat-1')
    })

    it('should throw error if name is empty', () => {
      expect(() => new Category('cat-1', '', null)).toThrow('Category name cannot be empty')
    })

    it('should throw error if name is whitespace only', () => {
      expect(() => new Category('cat-1', '   ', null)).toThrow('Category name cannot be empty')
    })

    it('should throw error if id is empty', () => {
      expect(() => new Category('', 'Recipes', null)).toThrow('Category id cannot be empty')
    })
  })

  describe('updateName', () => {
    it('should update category name', () => {
      const category = new Category('cat-1', 'Recipes', null)
      const oldUpdatedAt = category.updatedAt

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        category.updateName('Cooking')

        expect(category.name).toBe('Cooking')
        expect(category.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
      }, 10)
    })

    it('should throw error if new name is empty', () => {
      const category = new Category('cat-1', 'Recipes', null)
      expect(() => category.updateName('')).toThrow('Category name cannot be empty')
    })

    it('should throw error if new name is whitespace only', () => {
      const category = new Category('cat-1', 'Recipes', null)
      expect(() => category.updateName('  ')).toThrow('Category name cannot be empty')
    })
  })

  describe('isRoot', () => {
    it('should return true for root category', () => {
      const category = new Category('cat-1', 'Recipes', null)
      expect(category.isRoot()).toBe(true)
    })

    it('should return false for subcategory', () => {
      const category = new Category('cat-2', 'Italian', 'cat-1')
      expect(category.isRoot()).toBe(false)
    })
  })
})
