import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import {
  analyzeIncidentResponseSchema,
  analyzeIncidentSchema,
} from '../schemas/ai-schemas'
import { errorResponseSchema } from '../schemas/incident-schemas'
import type { AppEnv } from '../types'

const jsonContent = (schema: Parameters<typeof resolver>[0]) => ({
  'application/json': { schema: resolver(schema) },
})

export function createAiRouter() {
  const router = new Hono<AppEnv>()

  router.post(
    '/incidents/analyze',
    describeRoute({
      tags: ['AI'],
      summary: 'Analyze incident text with DeepSeek or template fallback',
      responses: {
        200: { description: 'Analysis result', content: jsonContent(analyzeIncidentResponseSchema) },
        400: { description: 'Invalid input', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('json', analyzeIncidentSchema),
    c => c.get('container').aiHandler.analyze(c)
  )

  return router
}
