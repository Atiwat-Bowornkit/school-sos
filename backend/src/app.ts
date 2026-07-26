import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { openAPIRouteHandler } from 'hono-openapi'
import type { Container } from './di/container'
import { AppError } from './domain/errors'
import { createApiRouter } from './routers'
import { createAuthRouter } from './routers/auth-router'
import { requireAuth } from './middleware/auth'
import type { AppEnv, Bindings } from './types'

// Runtime-agnostic app factory. Each entrypoint (server.ts, lambda.ts)
// supplies its own container factory so the same routes/handlers run on
// Cloudflare Workers (D1 + KV) and AWS Lambda alike.
export function createApp(containerFactory: (env: Partial<Bindings>) => Container) {
  const app = new Hono<AppEnv>()

  app.use('*', logger())
  app.use('*', cors())
  app.use('*', async (c, next) => {
    const container = containerFactory(c.env ?? {})
    c.set('container', container)
    await next()
  })

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok' }))

  // Auth routes — /login and /register are public
  const authRouter = createAuthRouter()
  // Protect /me endpoint
  authRouter.use('/me', async (c, next) => {
    const authService = c.get('container').authService
    return requireAuth(authService)(c, next)
  })
  app.route('/api/v1/auth', authRouter)

  // Protect mutation endpoints on incidents
  app.use('/api/v1/incidents/*', async (c, next) => {
    const method = c.req.method
    if (['PATCH', 'POST', 'PUT', 'DELETE'].includes(method)) {
      const authService = c.get('container').authService
      return requireAuth(authService)(c, next)
    }
    await next()
  })

  // Incident routes (some protected by middleware above)
  app.route('/api/v1/incidents', createApiRouter())

  // API docs
  app.get(
    '/openapi.json',
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: 'School SOS API',
          version: '1.0.0',
          description: 'Incident reporting and coordination API for School SOS',
        },
        tags: [
          { name: 'Incidents', description: 'Incident workflow and timeline' },
          { name: 'Auth', description: 'Authentication' },
        ],
      },
    })
  )
  app.get('/docs', Scalar({ url: '/openapi.json', pageTitle: 'School SOS API Docs' }))

  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404))

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 400)
    }
    console.error('Unhandled error:', err instanceof Error ? err.message : 'Unknown error')
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'ระบบไม่สามารถดำเนินการได้' } }, 500)
  })

  return app
}
