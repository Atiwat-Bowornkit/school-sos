import type { User } from '../entities/user'

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(user: User): Promise<void>
}
