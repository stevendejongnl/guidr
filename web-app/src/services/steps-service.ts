import { apiClient } from './api-client.js'
import { analyticsService } from './analytics-service.js'
import type { Step, CreateStepRequest, UpdateStepRequest } from '@models/step.js'

export class StepsService {
  async getByGuideId(guideId: string): Promise<Step[]> {
    return apiClient.get<Step[]>(`/steps?guide_id=${guideId}`)
  }

  async create(data: CreateStepRequest): Promise<Step> {
    const step = await apiClient.post<Step>('/steps', data)
    analyticsService.trackEvent('Step', 'create')
    return step
  }

  async update(id: string, data: UpdateStepRequest): Promise<Step> {
    const step = await apiClient.patch<Step>(`/steps/${id}`, data)
    analyticsService.trackEvent('Step', 'update')
    return step
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/steps/${id}`)
    analyticsService.trackEvent('Step', 'delete')
  }
}

export const stepsService = new StepsService()
