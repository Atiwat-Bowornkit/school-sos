import type { User } from '../../domain/entities/user'
import type { UserRepository } from '../../domain/repositories/user-repository'

export class D1UserRepository implements UserRepository {
  constructor(private readonly db: D1Database) {}

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.db
      .prepare('SELECT id, username, display_name, password_hash, password_salt, role, created_at FROM users WHERE username = ?')
      .bind(username)
      .first<{
        id: string
        username: string
        display_name: string
        password_hash: string
        password_salt: string
        role: string
        created_at: string
      }>()
    if (!row) return null
    return this.toEntity(row)
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db
      .prepare('SELECT id, username, display_name, password_hash, password_salt, role, created_at FROM users WHERE id = ?')
      .bind(id)
      .first<{
        id: string
        username: string
        display_name: string
        password_hash: string
        password_salt: string
        role: string
        created_at: string
      }>()
    if (!row) return null
    return this.toEntity(row)
  }

  async create(user: User): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO users (id, username, display_name, password_hash, password_salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(user.id, user.username, user.displayName, user.passwordHash, user.passwordSalt, user.role, user.createdAt)
      .run()
  }

  private toEntity(row: {
    id: string
    username: string
    display_name: string
    password_hash: string
    password_salt: string
    role: string
    created_at: string
  }): User {
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      role: row.role as User['role'],
      createdAt: row.created_at,
    }
  }
}
