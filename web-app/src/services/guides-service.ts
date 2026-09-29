import { apiClient } from './api-client.js'
import { analyticsService } from './analytics-service.js'
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
    const guide = await apiClient.post<Guide>('/guides', data)
    analyticsService.trackEvent('Guide', 'create', data.guideType)
    return guide
  }

  async update(id: string, data: UpdateGuideRequest): Promise<Guide> {
    const guide = await apiClient.patch<Guide>(`/guides/${id}`, data)
    analyticsService.trackEvent('Guide', 'update')
    return guide
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/guides/${id}`)
    analyticsService.trackEvent('Guide', 'delete')
  }

  async getByType(guideType: string): Promise<Guide[]> {
    return apiClient.get<Guide[]>(`/guides?guideType=${guideType}`)
  }

  async copyToLanguage(guideId: string, targetLanguage: string): Promise<GuideWithStepsResponse> {
    const result = await apiClient.post<GuideWithStepsResponse>(`/guides/${guideId}/copy`, { targetLanguage })
    analyticsService.trackEvent('Guide', 'copy', targetLanguage)
    return result
  }

  async translateToLanguage(guideId: string, targetLanguage: string): Promise<GuideWithStepsResponse> {
    const result = await apiClient.post<GuideWithStepsResponse>(`/guides/${guideId}/translate`, { targetLanguage })
    analyticsService.trackEvent('Guide', 'translate', targetLanguage)
    return result
  }
}

export const guidesService = new GuidesService()
