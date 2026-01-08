import { Category } from '@domain/entities/Category'
import { CategoryMapper } from './CategoryMapper'
import type { CategoryDto } from '../api/dtos/CategoryDto'

describe('CategoryMapper', () => {
  describe('toDomain', () => {
    it('should convert DTO to Category entity', () => {
      const dto: CategoryDto = {
        id: 'cat-1',
        name: 'Cooking',
        parentId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const category = CategoryMapper.toDomain(dto)

      expect(category).toBeInstanceOf(Category)
      expect(category.id).toBe('cat-1')
      expect(category.name).toBe('Cooking')
      expect(category.parentId).toBeNull()
      expect(category.createdAt).toBeInstanceOf(Date)
      expect(category.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle category with parent', () => {
      const dto: CategoryDto = {
        id: 'cat-2',
        name: 'Pasta',
        parentId: 'cat-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const category = CategoryMapper.toDomain(dto)

      expect(category.parentId).toBe('cat-1')
    })
  })

  describe('toDto', () => {
    it('should convert Category to DTO', () => {
      const category = new Category('cat-1', 'Cooking', null)

      const dto = CategoryMapper.toDto(category)

      expect(dto.id).toBe('cat-1')
      expect(dto.name).toBe('Cooking')
      expect(dto.parentId).toBeNull()
      expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should handle category with parent', () => {
      const category = new Category('cat-2', 'Pasta', 'cat-1')

      const dto = CategoryMapper.toDto(category)

      expect(dto.parentId).toBe('cat-1')
    })
  })

  describe('toCreateRequest', () => {
    it('should create request with all fields', () => {
      const request = CategoryMapper.toCreateRequest('Cooking', null)

      expect(request).toEqual({
        name: 'Cooking',
        parentId: null,
      })
    })

    it('should create request with parent', () => {
      const request = CategoryMapper.toCreateRequest('Pasta', 'cat-1')

      expect(request).toEqual({
        name: 'Pasta',
        parentId: 'cat-1',
      })
    })
  })

  describe('toUpdateRequest', () => {
    it('should create update request with name', () => {
      const category = new Category('cat-1', 'Updated Name', null)

      const request = CategoryMapper.toUpdateRequest(category)

      expect(request).toEqual({
        name: 'Updated Name',
      })
    })
  })
})
