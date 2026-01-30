import { GuideMapper } from './GuideMapper'
import { Guide } from '@domain/entities/Guide'
import type { GuideDto } from '../api/dtos/GuideDto'

describe('GuideMapper', () => {
  const mockGuideDto: GuideDto = {
    id: 'guide-1',
    categoryId: 'cat-1',
    title: 'Chocolate Chip Cookies',
    description: 'Classic recipe',
    stepIds: ['step-1', 'step-2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdByUserId: 'user-123',
    isPublic: true,
    isHighlighted: false,
  }

  const mockGuideDtoWithoutOwner: GuideDto = {
    id: 'guide-2',
    categoryId: 'cat-1',
    title: 'Brownies',
    description: null,
    stepIds: [],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdByUserId: undefined,
    isPublic: false,
    isHighlighted: true,
  }

  describe('toDomain', () => {
    it('should convert DTO with all fields to domain entity', () => {
      const guide = GuideMapper.toDomain(mockGuideDto)

      expect(guide).toBeInstanceOf(Guide)
      expect(guide.id).toBe('guide-1')
      expect(guide.categoryId).toBe('cat-1')
      expect(guide.title).toBe('Chocolate Chip Cookies')
      expect(guide.description).toBe('Classic recipe')
      expect(guide.stepIds).toEqual(['step-1', 'step-2'])
      expect(guide.createdByUserId).toBe('user-123')
      expect(guide.isPublic).toBe(true)
      expect(guide.isHighlighted).toBe(false)
    })

    it('should handle DTO without createdByUserId (backward compatibility)', () => {
      const guide = GuideMapper.toDomain(mockGuideDtoWithoutOwner)

      expect(guide).toBeInstanceOf(Guide)
      expect(guide.id).toBe('guide-2')
      expect(guide.createdByUserId).toBeUndefined()
      expect(guide.isPublic).toBe(false)
      expect(guide.isHighlighted).toBe(true)
    })

    it('should handle null description', () => {
      const dtoWithNullDescription = { ...mockGuideDto, description: null }

      const guide = GuideMapper.toDomain(dtoWithNullDescription)

      expect(guide.description).toBeUndefined()
    })

    it('should reconstruct stepIds array', () => {
      const dtoWithSteps = { ...mockGuideDto, stepIds: ['step-a', 'step-b', 'step-c'] }

      const guide = GuideMapper.toDomain(dtoWithSteps)

      expect(guide.stepIds).toEqual(['step-a', 'step-b', 'step-c'])
      expect(guide.stepCount).toBe(3)
    })

    it('should handle empty stepIds', () => {
      const dtoWithoutSteps = { ...mockGuideDto, stepIds: [] }

      const guide = GuideMapper.toDomain(dtoWithoutSteps)

      expect(guide.stepIds).toEqual([])
      expect(guide.stepCount).toBe(0)
    })

    it('should reset timestamps to current time', () => {
      const beforeConversion = Date.now()

      const guide = GuideMapper.toDomain(mockGuideDto)

      const afterConversion = Date.now()

      expect(guide.createdAt.getTime()).toBeGreaterThanOrEqual(beforeConversion)
      expect(guide.createdAt.getTime()).toBeLessThanOrEqual(afterConversion)
      expect(guide.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeConversion)
      expect(guide.updatedAt.getTime()).toBeLessThanOrEqual(afterConversion)
    })
  })

  describe('toDto', () => {
    it('should convert domain entity to DTO with all fields', () => {
      const guide = new Guide(
        'guide-1',
        'cat-1',
        'Chocolate Chip Cookies',
        'Classic recipe',
        'user-123',
        true,
        false
      )

      const dto = GuideMapper.toDto(guide)

      expect(dto.id).toBe('guide-1')
      expect(dto.categoryId).toBe('cat-1')
      expect(dto.title).toBe('Chocolate Chip Cookies')
      expect(dto.description).toBe('Classic recipe')
      expect(dto.createdByUserId).toBe('user-123')
      expect(dto.isPublic).toBe(true)
      expect(dto.isHighlighted).toBe(false)
    })

    it('should convert null description to null in DTO', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Title')

      const dto = GuideMapper.toDto(guide)

      expect(dto.description).toBeNull()
    })

    it('should include createdByUserId when present', () => {
      const guide = new Guide(
        'guide-1',
        'cat-1',
        'Title',
        undefined,
        'user-456',
        false,
        false
      )

      const dto = GuideMapper.toDto(guide)

      expect(dto.createdByUserId).toBe('user-456')
    })

    it('should be undefined for createdByUserId when not provided', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Title')

      const dto = GuideMapper.toDto(guide)

      expect(dto.createdByUserId).toBeUndefined()
    })

    it('should include ISO formatted timestamps', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Title')

      const dto = GuideMapper.toDto(guide)

      expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should preserve stepIds', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Title')
      guide.addStep('step-1')
      guide.addStep('step-2')

      const dto = GuideMapper.toDto(guide)

      expect(dto.stepIds).toEqual(['step-1', 'step-2'])
    })
  })

  describe('toCreateRequest', () => {
    it('should create request with all fields', () => {
      const request = GuideMapper.toCreateRequest(
        'cat-1',
        'New Recipe',
        'A tasty recipe',
        true
      )

      expect(request.categoryId).toBe('cat-1')
      expect(request.title).toBe('New Recipe')
      expect(request.description).toBe('A tasty recipe')
      expect(request.isPublic).toBe(true)
    })

    it('should convert undefined description to null', () => {
      const request = GuideMapper.toCreateRequest(
        'cat-1',
        'New Recipe',
        undefined,
        false
      )

      expect(request.description).toBeNull()
    })

    it('should default isPublic to false', () => {
      const request = GuideMapper.toCreateRequest('cat-1', 'New Recipe')

      expect(request.isPublic).toBe(false)
    })

    it('should allow isPublic true', () => {
      const request = GuideMapper.toCreateRequest(
        'cat-1',
        'New Recipe',
        'Description',
        true
      )

      expect(request.isPublic).toBe(true)
    })
  })

  describe('toUpdateRequest', () => {
    it('should convert guide to update request with visibility and highlight fields', () => {
      const guide = new Guide(
        'guide-1',
        'cat-1',
        'Updated Title',
        'Updated description',
        'user-123',
        true,
        false
      )

      const request = GuideMapper.toUpdateRequest(guide)

      expect(request.title).toBe('Updated Title')
      expect(request.description).toBe('Updated description')
      expect(request.isPublic).toBe(true)
      expect(request.isHighlighted).toBe(false)
    })

    it('should convert null description to null in update request', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Title')

      const request = GuideMapper.toUpdateRequest(guide)

      expect(request.description).toBeNull()
    })

    it('should include all mutable fields', () => {
      const guide = new Guide('guide-1', 'cat-1', 'Title')
      guide.makePublic()
      guide.highlight()

      const request = GuideMapper.toUpdateRequest(guide)

      expect(request).toHaveProperty('title')
      expect(request).toHaveProperty('description')
      expect(request).toHaveProperty('isPublic')
      expect(request).toHaveProperty('isHighlighted')
    })
  })
})
