import { apiClient } from './api-client.js'
import type { Guide } from '@models/guide.js'

export interface UserDto {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  name: string | null
  interests: string[] | null
  isAdmin: boolean
}

export interface GuideWithUser extends Guide {
  userEmail: string | null
  userName: string | null
}

export class AdminService {
  async getAllUsers(): Promise<UserDto[]> {
    return apiClient.get<UserDto[]>('/auth/users')
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
