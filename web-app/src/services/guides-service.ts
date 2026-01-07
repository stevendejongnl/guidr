import { apiClient } from './api-client.js'
import type { Guide, CreateGuideRequest, UpdateGuideRequest } from '@models/guide.js'

export class GuidesService {
  async getAll(): Promise<Guide[]> {
    return apiClient.get<Guide[]>('/guides')
  }

  async getById(id: string): Promise<Guide> {
    return apiClient.get<Guide>(`/guides/${id}`)
  }

  async create(data: CreateGuideRequest): Promise<Guide> {
    return apiClient.post<Guide>('/guides', data)
  }

  async update(id: string, data: UpdateGuideRequest): Promise<Guide> {
    return apiClient.put<Guide>(`/guides/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/guides/${id}`)
  }

  async getByCategory(categoryId: string): Promise<Guide[]> {
    return apiClient.get<Guide[]>(`/guides?category_id=${categoryId}`)
  }
}

export const guidesService = new GuidesService()
