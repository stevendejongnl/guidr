import { apiClient } from './api-client.js'

export interface GenerateGuideRequest {
  prompt: string
  guideType?: string
}

export interface GenerateGuideFromUrlRequest {
  url: string
  guideType?: string
}

export interface GeneratedStep {
  order: number
  title: string
  description: string | null
  duration: number | null // minutes
}

export interface GeneratedGuide {
  guideType: string
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  steps: GeneratedStep[]
}

export interface StepInput {
  order: number
  title: string
  description?: string | null
  duration?: number | null // seconds
}

export interface CreateGuideWithStepsRequest {
  guideType: string
  title: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  isPublic: boolean
  steps: StepInput[]
}

export interface GuideWithStepsResponse {
  guide: {
    id: string
    guideType: string
    title: string
    description: string | null
    metadata: Record<string, unknown> | null
    stepIds: string[]
    createdByUserId: string | null
    isPublic: boolean
    isHighlighted: boolean
    createdAt: string
    updatedAt: string
  }
  steps: {
    id: string
    guideId: string
    order: number
    title: string
    description: string | null
    duration: number | null
    createdAt: string
    updatedAt: string
  }[]
}

export class GenerationService {
  async generateFromPrompt(request: GenerateGuideRequest): Promise<GeneratedGuide> {
    return apiClient.post<GeneratedGuide>('/guides/generate', request)
  }

  async generateFromUrl(request: GenerateGuideFromUrlRequest): Promise<GeneratedGuide> {
    return apiClient.post<GeneratedGuide>('/guides/generate-from-url', request)
  }

  async createWithSteps(request: CreateGuideWithStepsRequest): Promise<GuideWithStepsResponse> {
    return apiClient.post<GuideWithStepsResponse>('/guides/with-steps', request)
  }
}

export const generationService = new GenerationService()
