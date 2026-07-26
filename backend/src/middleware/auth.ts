import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import type { AuthService, JwtPayload } from '../services/auth-service'

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload
  }
}

/**
 * Middleware to require a valid JWT token.
 * Token can be provided via:
 *   - Authorization: Bearer <token>
 *   - Cookie: auth_token=<token>
 */
export function requireAuth(authService: AuthService) {
  return async (c: Context, next: Next) => {
    const token = extractToken(c)
    if (!token) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' } },
        401,
      )
    }
    try {
      const payload = await authService.getUserFromToken(token)
      c.set('user', payload)
      await next()
    }
    catch {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token ไม่ถูกต้องหรือหมดอายุ' } },
        401,
      )
    }
  }
}

/**
 * Middleware to require a specific role.
 * Must be used after requireAuth.
 */
export function requireRole(role: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    if (!user || user.role !== role) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'ไม่มีสิทธิ์ในการดำเนินการนี้' } },
        403,
      )
    }
    await next()
  }
}

function extractToken(c: Context): string | null {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookie = getCookie(c, 'auth_token')
  if (cookie) return cookie
  return null
}
