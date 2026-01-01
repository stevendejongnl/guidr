import uuid from 'react-native-uuid'
import { User } from '../entities/User'
import { IUserRepository } from '../repositories/IUserRepository'

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async registerUser(email: string, password: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email.toLowerCase())
    if (existingUser) {
      throw new Error('Email already registered')
    }

    const id = uuid.v4() as string
    const user = new User(id, email, password)
    await this.userRepository.save(user)
    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email.toLowerCase())
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll()
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id)
  }
}
