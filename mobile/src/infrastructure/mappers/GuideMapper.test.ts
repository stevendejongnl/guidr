import { GuideMapper } from './GuideMapper'
import { Guide } from '@domain/entities/Guide'
import type { GuideDto } from '../api/dtos/GuideDto'

describe('GuideMapper', () => {
  const mockGuideDto: GuideDto = {
    id: 'guide-1',
    guideType: 'cooking',
    title: 'Chocolate Chip Cookies',
    description: 'Classic recipe',
    metadata: { ingredients: ['flour', 'sugar'] },
    stepIds: ['step-1', 'step-2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdByUserId: 'user-123',
    isPublic: true,
    isHighlighted: false,
    language: 'en',
  }

  const mockGuideDtoWithoutOwner: GuideDto = {
    id: 'guide-2',
    guideType: 'workout',
    title: 'Brownies',
    description: null,
    metadata: null,
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
      expect(guide.guideType).toBe('cooking')
      expect(guide.title).toBe('Chocolate Chip Cookies')
      expect(guide.description).toBe('Classic recipe')
      expect(guide.metadata).toEqual({ ingredients: ['flour', 'sugar'] })
      expect(guide.stepIds).toEqual(['step-1', 'step-2'])
      expect(guide.createdByUserId).toBe('user-123')
      expect(guide.isPublic).toBe(true)
      expect(guide.isHighlighted).toBe(false)
    })

    it('should handle DTO without createdByUserId (backward compatibility)', () => {
      const guide = GuideMapper.toDomain(mockGuideDtoWithoutOwner)

      expect(guide).toBeInstanceOf(Guide)
      expect(guide.id).toBe('guide-2')
      expect(guide.guideType).toBe('workout')
      expect(guide.createdByUserId).toBeUndefined()
      expect(guide.metadata).toBeUndefined()
      expect(guide.isPublic).toBe(false)
      expect(guide.isHighlighted).toBe(true)
    })

    it('should handle null description', () => {
      const dtoWithNullDescription = { ...mockGuideDto, description: null }

      const guide = GuideMapper.toDomain(dtoWithNullDescription)

      expect(guide.description).toBeUndefined()
    })

    it('should handle null metadata', () => {
      const dtoWithNullMetadata = { ...mockGuideDto, metadata: null }

      const guide = GuideMapper.toDomain(dtoWithNullMetadata)

      expect(guide.metadata).toBeUndefined()
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

    it('should map language from DTO', () => {
      const dtoWithLanguage = { ...mockGuideDto, language: 'nl' }

      const guide = GuideMapper.toDomain(dtoWithLanguage)

      expect(guide.language).toBe('nl')
    })

    it('should default language to en when missing', () => {
      const { language: _, ...dtoWithoutLanguage } = mockGuideDto

      const guide = GuideMapper.toDomain(dtoWithoutLanguage as typeof mockGuideDto)

      expect(guide.language).toBe('en')
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
        'cooking',
        'Chocolate Chip Cookies',
        'Classic recipe',
        'user-123',
        true,
        false,
        { ingredients: ['flour', 'sugar'] }
      )

      const dto = GuideMapper.toDto(guide)

      expect(dto.id).toBe('guide-1')
      expect(dto.guideType).toBe('cooking')
      expect(dto.title).toBe('Chocolate Chip Cookies')
      expect(dto.description).toBe('Classic recipe')
      expect(dto.metadata).toEqual({ ingredients: ['flour', 'sugar'] })
      expect(dto.createdByUserId).toBe('user-123')
      expect(dto.isPublic).toBe(true)
      expect(dto.isHighlighted).toBe(false)
    })

    it('should convert null description to null in DTO', () => {
      const guide = new Guide('guide-1', 'cooking', 'Title')

      const dto = GuideMapper.toDto(guide)

      expect(dto.description).toBeNull()
    })

    it('should convert undefined metadata to null in DTO', () => {
      const guide = new Guide('guide-1', 'cooking', 'Title')

      const dto = GuideMapper.toDto(guide)

      expect(dto.metadata).toBeNull()
    })

    it('should include createdByUserId when present', () => {
      const guide = new Guide(
        'guide-1',
        'cooking',
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
      const guide = new Guide('guide-1', 'cooking', 'Title')

      const dto = GuideMapper.toDto(guide)

      expect(dto.createdByUserId).toBeUndefined()
    })

    it('should include ISO formatted timestamps', () => {
      const guide = new Guide('guide-1', 'cooking', 'Title')

      const dto = GuideMapper.toDto(guide)

      expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should preserve stepIds', () => {
      const guide = new Guide('guide-1', 'cooking', 'Title')
      guide.addStep('step-1')
      guide.addStep('step-2')

      const dto = GuideMapper.toDto(guide)

      expect(dto.stepIds).toEqual(['step-1', 'step-2'])
    })

    it('should include language in DTO', () => {
      const guide = new Guide(
        'guide-1',
        'cooking',
        'Title',
        undefined,
        undefined,
        false,
        false,
        undefined,
        'nl'
      )

      const dto = GuideMapper.toDto(guide)

      expect(dto.language).toBe('nl')
    })

    it('should default language to en in DTO', () => {
      const guide = new Guide('guide-1', 'cooking', 'Title')

      const dto = GuideMapper.toDto(guide)

      expect(dto.language).toBe('en')
    })
  })

  describe('toCreateRequest', () => {
    it('should create request with all fields', () => {
      const request = GuideMapper.toCreateRequest(
        'cooking',
        'New Recipe',
        'A tasty recipe',
        true,
        { ingredients: ['flour'] }
      )

      expect(request.guideType).toBe('cooking')
      expect(request.title).toBe('New Recipe')
      expect(request.description).toBe('A tasty recipe')
      expect(request.metadata).toEqual({ ingredients: ['flour'] })
      expect(request.isPublic).toBe(true)
    })

    it('should convert undefined description to null', () => {
      const request = GuideMapper.toCreateRequest(
        'cooking',
        'New Recipe',
        undefined,
        false
      )

      expect(request.description).toBeNull()
    })

    it('should convert undefined metadata to null', () => {
      const request = GuideMapper.toCreateRequest(
        'cooking',
        'New Recipe'
      )

      expect(request.metadata).toBeNull()
    })

    it('should default isPublic to false', () => {
      const request = GuideMapper.toCreateRequest('cooking', 'New Recipe')

      expect(request.isPublic).toBe(false)
    })

    it('should allow isPublic true', () => {
      const request = GuideMapper.toCreateRequest(
        'cooking',
        'New Recipe',
        'Description',
        true
      )

      expect(request.isPublic).toBe(true)
    })

    it('should include language in create request', () => {
      const request = GuideMapper.toCreateRequest(
        'cooking',
        'New Recipe',
        undefined,
        false,
        undefined,
        'nl'
      )

      expect(request.language).toBe('nl')
    })

    it('should default language to en in create request', () => {
      const request = GuideMapper.toCreateRequest('cooking', 'New Recipe')

      expect(request.language).toBe('en')
    })
  })

  describe('toUpdateRequest', () => {
    it('should convert guide to update request with all mutable fields', () => {
      const guide = new Guide(
        'guide-1',
        'cooking',
        'Updated Title',
        'Updated description',
        'user-123',
        true,
        false,
        { ingredients: ['butter'] }
      )

      const request = GuideMapper.toUpdateRequest(guide)

      expect(request.title).toBe('Updated Title')
      expect(request.description).toBe('Updated description')
      expect(request.metadata).toEqual({ ingredients: ['butter'] })
      expect(request.isPublic).toBe(true)
      expect(request.isHighlighted).toBe(false)
    })

    it('should convert null description to null in update request', () => {
      const guide = new Guide('guide-1', 'cooking', 'Title')

      const request = GuideMapper.toUpdateRequest(guide)

      expect(request.description).toBeNull()
    })

    it('should convert undefined metadata to null in update request', () => {
      const guide = new Guide('guide-1', 'cooking', 'Title')

      const request = GuideMapper.toUpdateRequest(guide)

      expect(request.metadata).toBeNull()
    })

    it('should include all mutable fields', () => {
      const guide = new Guide('guide-1', 'cooking', 'Title')
      guide.makePublic()
      guide.highlight()

      const request = GuideMapper.toUpdateRequest(guide)

      expect(request).toHaveProperty('title')
      expect(request).toHaveProperty('description')
      expect(request).toHaveProperty('metadata')
      expect(request).toHaveProperty('isPublic')
      expect(request).toHaveProperty('isHighlighted')
      expect(request).toHaveProperty('language')
    })

    it('should include language in update request', () => {
      const guide = new Guide(
        'guide-1',
        'cooking',
        'Title',
        undefined,
        undefined,
        false,
        false,
        undefined,
        'fr'
      )

      const request = GuideMapper.toUpdateRequest(guide)

      expect(request.language).toBe('fr')
    })
  })
})
