import { sign, verify } from 'hono/jwt'
import type { User } from '../domain/entities/user'
import { ValidationError, UnauthorizedError } from '../domain/errors'
import type { UserRepository } from '../domain/repositories/user-repository'

const JWT_ALGORITHM = 'HS256'
const TOKEN_EXPIRY_SECONDS = 86400 // 24 hours
const PBKDF2_ITERATIONS = 100_000
const HASH_LENGTH = 256

export interface AuthResult {
  token: string
  user: {
    id: string
    username: string
    displayName: string
    role: string
  }
}

export interface JwtPayload {
  sub: string
  username: string
  role: string
  exp: number
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtSecret: string,
    private readonly registrationKey: string,
  ) {}

  async login(username: string, password: string): Promise<AuthResult> {
    if (!username.trim()) throw new ValidationError('กรุณาระบุชื่อผู้ใช้')
    if (!password) throw new ValidationError('กรุณาระบุรหัสผ่าน')

    const user = await this.userRepository.findByUsername(username.trim())
    if (!user) throw new UnauthorizedError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')

    const isValid = await this.verifyPassword(password, user.passwordHash, user.passwordSalt)
    if (!isValid) throw new UnauthorizedError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')

    const token = await this.generateToken(user)
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    }
  }

  async register(
    username: string,
    password: string,
    displayName: string,
    providedKey: string,
  ): Promise<AuthResult> {
    if (providedKey !== this.registrationKey) {
      throw new ValidationError('รหัสลงทะเบียนไม่ถูกต้อง')
    }

    if (!username.trim()) throw new ValidationError('กรุณาระบุชื่อผู้ใช้')
    if (username.trim().length < 3) throw new ValidationError('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร')
    if (!password || password.length < 6) throw new ValidationError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    if (!displayName.trim()) throw new ValidationError('กรุณาระบุชื่อที่ต้องการแสดง')

    const existing = await this.userRepository.findByUsername(username.trim())
    if (existing) throw new ValidationError('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว')

    const { hash, salt } = await this.hashPassword(password)
    const now = new Date().toISOString()
    const user: User = {
      id: crypto.randomUUID(),
      username: username.trim(),
      displayName: displayName.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      role: 'responder',
      createdAt: now,
    }

    await this.userRepository.create(user)

    const token = await this.generateToken(user)
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    }
  }

  async getUserFromToken(token: string): Promise<JwtPayload> {
    try {
      return await verify(token, this.jwtSecret, JWT_ALGORITHM) as unknown as JwtPayload
    }
    catch {
      throw new UnauthorizedError('Token ไม่ถูกต้องหรือหมดอายุ')
    }
  }

  private async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
    }
    return sign(payload, this.jwtSecret, JWT_ALGORITHM)
  }

  private async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const useSalt = salt || crypto.randomUUID()
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password.normalize('NFKC')),
      'PBKDF2',
      false,
      ['deriveBits'],
    )
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(useSalt),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      HASH_LENGTH,
    )
    const hash = Array.from(new Uint8Array(bits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return { hash, salt: useSalt }
  }

  private async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const result = await this.hashPassword(password, salt)
    return result.hash === hash
  }
}
