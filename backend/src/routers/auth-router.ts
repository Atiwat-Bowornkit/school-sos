import { Hono } from 'hono'
import type { AppEnv } from '../types'

export function createAuthRouter() {
  const router = new Hono<AppEnv>()

  router.post('/login', (c) => c.get('container').authHandler.login(c))
  router.post('/register', (c) => c.get('container').authHandler.register(c))
  router.get('/me', (c) => c.get('container').authHandler.me(c))

  return router
}
