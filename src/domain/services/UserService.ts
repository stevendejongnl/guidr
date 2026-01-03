import uuid from 'react-native-uuid'
import { User } from '../entities/User'
import { IUserRepository } from '../repositories/IUserRepository'

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async registerUser(email: string, password: string, authToken: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email.toLowerCase(), authToken)
    if (existingUser) {
      throw new Error('Email already registered')
    }

    const id = uuid.v4() as string
    const user = new User(id, email, password)
    await this.userRepository.save(user, authToken)
    return user
  }

  async getUserById(id: string, authToken: string): Promise<User | null> {
    return await this.userRepository.findById(id, authToken)
  }

  async getUserByEmail(email: string, authToken: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email.toLowerCase(), authToken)
  }

  async getAllUsers(authToken: string): Promise<User[]> {
    return await this.userRepository.findAll(authToken)
  }

  async deleteUser(id: string, authToken: string): Promise<void> {
    await this.userRepository.delete(id, authToken)
  }
}
