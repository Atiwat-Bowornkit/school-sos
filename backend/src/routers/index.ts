import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { createAiRouter } from './ai-router'
import { createIncidentRouter } from './incident-router'

export function createApiRouter() {
  const api = new Hono<AppEnv>()

  api.route('/incidents', createIncidentRouter())
  api.route('/ai', createAiRouter())

  return api
}
