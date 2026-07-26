import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { createIncidentRouter } from './incident-router'

export function createApiRouter() {
  const api = new Hono<AppEnv>()

  api.route('/incidents', createIncidentRouter())

  return api
}
