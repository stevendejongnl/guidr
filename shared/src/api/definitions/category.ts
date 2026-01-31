/**
 * Category API type definitions and validators
 * Platform-agnostic types used across mobile, web, and API server
 */

import typia from 'typia'

/**
 * Category DTO (API response)
 */
export interface CategoryDto {
  id: string
  name: string
  parentId: string | null
  createdAt: string  // ISO 8601
  updatedAt: string
}

/**
 * Category create request
 */
export interface CategoryCreateRequest {
  name: string
  parentId: string | null
}

/**
 * Category update request (partial)
 */
export interface CategoryUpdateRequest {
  name?: string
  parentId?: string | null
}

/**
 * Typia validators (compile-time generated)
 */
export const validateCategoryDto = typia.createAssert<CategoryDto>()
export const validateCategoryList = typia.createAssert<CategoryDto[]>()
export const validateCategoryCreateRequest = typia.createAssert<CategoryCreateRequest>()
export const validateCategoryUpdateRequest = typia.createAssert<CategoryUpdateRequest>()

/**
 * Typia validation utilities
 */
export const validateCategoryDtoChecked = typia.createValidate<CategoryDto>()
export const validateCategoryListChecked = typia.createValidate<CategoryDto[]>()

/**
 * Type guards
 */
export const isCategoryDto = typia.createIs<CategoryDto>()
