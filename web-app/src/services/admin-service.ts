import { apiClient } from './api-client.js'
import type { Guide } from '@models/guide.js'

export interface UserDto {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  name: string | null
  interests: string[] | null
  preferredLanguages: string[] | null
  isAdmin: boolean
  isBeta: boolean
}

export interface AdminUpdateUserRequest {
  role?: string
  isBeta?: boolean
  name?: string
  interests?: string[]
  preferredLanguages?: string[]
}

export interface GuideWithUser extends Guide {
  userEmail: string | null
  userName: string | null
}

export class AdminService {
  async getAllUsers(): Promise<UserDto[]> {
    return apiClient.get<UserDto[]>('/auth/users')
  }

  async updateUser(userId: string, data: AdminUpdateUserRequest): Promise<UserDto> {
    return apiClient.patch<UserDto>(`/auth/users/${userId}`, data)
  }

  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete<void>(`/auth/users/${userId}`)
  }

  async getAllGuidesWithUsers(): Promise<GuideWithUser[]> {
    const [guides, users] = await Promise.all([
      apiClient.get<Guide[]>('/guides'),
      this.getAllUsers(),
    ])

    const userMap = new Map(users.map(u => [u.id, u]))

    return guides.map(guide => {
      const user = guide.createdByUserId
        ? userMap.get(guide.createdByUserId)
        : undefined
      return {
        ...guide,
        userEmail: user?.email ?? null,
        userName: user?.name ?? null,
      }
    })
  }
}

export const adminService = new AdminService()
