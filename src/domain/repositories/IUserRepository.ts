import { User } from '../entities/User'

export interface IUserRepository {
  findById(id: string, authToken: string): Promise<User | null>
  findByEmail(email: string, authToken: string): Promise<User | null>
  findAll(authToken: string): Promise<User[]>
  save(user: User, authToken: string): Promise<void>
  delete(id: string, authToken: string): Promise<void>
}
