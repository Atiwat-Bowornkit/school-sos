import type { Context } from 'hono'
import type { AuthService } from '../services/auth-service'
import { ValidationError } from '../domain/errors'

export class AuthHandler {
  constructor(private readonly authService: AuthService) {}

  login = async (c: Context) => {
    const { username, password } = await c.req.json<{ username?: string; password?: string }>()
    if (!username || !password) {
      throw new ValidationError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
    }
    const result = await this.authService.login(username, password)
    return c.json({ data: result })
  }

  register = async (c: Context) => {
    const body = await c.req.json<{
      username?: string
      password?: string
      displayName?: string
      registrationKey?: string
    }>()
    const result = await this.authService.register(
      body.username ?? '',
      body.password ?? '',
      body.displayName ?? '',
      body.registrationKey ?? '',
    )
    return c.json({ data: result }, 201)
  }

  me = async (c: Context) => {
    const user = c.get('user')
    return c.json({
      data: {
        id: user.sub,
        username: user.username,
        role: user.role,
      },
    })
  }
}
