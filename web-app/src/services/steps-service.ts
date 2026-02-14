import { apiClient } from './api-client.js'
import type { Step, CreateStepRequest, UpdateStepRequest } from '@models/step.js'

export class StepsService {
  async getByGuideId(guideId: string): Promise<Step[]> {
    return apiClient.get<Step[]>(`/steps?guide_id=${guideId}`)
  }

  async create(data: CreateStepRequest): Promise<Step> {
    return apiClient.post<Step>('/steps', data)
  }

  async update(id: string, data: UpdateStepRequest): Promise<Step> {
    return apiClient.patch<Step>(`/steps/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/steps/${id}`)
  }
}

export const stepsService = new StepsService()
