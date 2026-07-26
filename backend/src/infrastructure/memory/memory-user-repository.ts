import type { User } from '../../domain/entities/user'
import type { UserRepository } from '../../domain/repositories/user-repository'

export class MemoryUserRepository implements UserRepository {
  private byId = new Map<string, User>()
  private byUsername = new Map<string, User>()

  async findByUsername(username: string): Promise<User | null> {
    return this.byUsername.get(username) ?? null
  }

  async findById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null
  }

  async create(user: User): Promise<void> {
    this.byId.set(user.id, user)
    this.byUsername.set(user.username, user)
  }
}
