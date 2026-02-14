import { apiClient } from './api-client.js'
import type { Guide, CreateGuideRequest, UpdateGuideRequest } from '@models/guide.js'
import type { GuideWithStepsResponse } from './generation-service.js'

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
    return apiClient.patch<Guide>(`/guides/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/guides/${id}`)
  }

  async getByType(guideType: string): Promise<Guide[]> {
    return apiClient.get<Guide[]>(`/guides?guideType=${guideType}`)
  }

  async copyToLanguage(guideId: string, targetLanguage: string): Promise<GuideWithStepsResponse> {
    return apiClient.post<GuideWithStepsResponse>(`/guides/${guideId}/copy`, { targetLanguage })
  }

  async translateToLanguage(guideId: string, targetLanguage: string): Promise<GuideWithStepsResponse> {
    return apiClient.post<GuideWithStepsResponse>(`/guides/${guideId}/translate`, { targetLanguage })
  }
}

export const guidesService = new GuidesService()
