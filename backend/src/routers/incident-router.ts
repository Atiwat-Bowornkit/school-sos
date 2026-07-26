import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import {
  addProgressSchema,
  changeStatusSchema,
  createIncidentSchema,
  errorResponseSchema,
  idParamSchema,
  incidentDetailResponseSchema,
  incidentListResponseSchema,
  listIncidentQuerySchema,
  resolveIncidentSchema,
  updateIncidentSchema,
} from '../schemas/incident-schemas'
import type { AppEnv } from '../types'

const jsonContent = (schema: Parameters<typeof resolver>[0]) => ({
  'application/json': { schema: resolver(schema) },
})

export function createIncidentRouter() {
  const router = new Hono<AppEnv>()

  router.get(
    '/',
    describeRoute({
      tags: ['Incidents'],
      summary: 'List incidents',
      responses: {
        200: { description: 'Incidents ordered by priority and recency', content: jsonContent(incidentListResponseSchema) },
        400: { description: 'Invalid filters', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('query', listIncidentQuerySchema),
    c => c.get('container').incidentHandler.list(c)
  )

  router.post(
    '/',
    describeRoute({
      tags: ['Incidents'],
      summary: 'Create an incident',
      responses: {
        201: { description: 'Incident created', content: jsonContent(incidentDetailResponseSchema) },
        400: { description: 'Invalid input', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('json', createIncidentSchema),
    c => c.get('container').incidentHandler.create(c)
  )

  router.get(
    '/:id',
    describeRoute({
      tags: ['Incidents'],
      summary: 'Get incident detail and timeline',
      responses: {
        200: { description: 'Incident detail', content: jsonContent(incidentDetailResponseSchema) },
        404: { description: 'Incident not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    c => c.get('container').incidentHandler.get(c)
  )

  router.patch(
    '/:id',
    describeRoute({
      tags: ['Incidents'],
      summary: 'Update assignment or confirmed priority',
      responses: {
        200: { description: 'Incident updated', content: jsonContent(incidentDetailResponseSchema) },
        400: { description: 'Invalid input', content: jsonContent(errorResponseSchema) },
        404: { description: 'Incident not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    validator('json', updateIncidentSchema),
    c => c.get('container').incidentHandler.update(c)
  )

  router.post(
    '/:id/status',
    describeRoute({
      tags: ['Incidents'],
      summary: 'Change incident status',
      responses: {
        200: { description: 'Status changed', content: jsonContent(incidentDetailResponseSchema) },
        400: { description: 'Invalid transition', content: jsonContent(errorResponseSchema) },
        404: { description: 'Incident not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    validator('json', changeStatusSchema),
    c => c.get('container').incidentHandler.changeStatus(c)
  )

  router.post(
    '/:id/progress',
    describeRoute({
      tags: ['Incidents'],
      summary: 'Record incident progress',
      responses: {
        200: { description: 'Progress recorded', content: jsonContent(incidentDetailResponseSchema) },
        400: { description: 'Invalid input', content: jsonContent(errorResponseSchema) },
        404: { description: 'Incident not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    validator('json', addProgressSchema),
    c => c.get('container').incidentHandler.addProgress(c)
  )

  router.post(
    '/:id/resolve',
    describeRoute({
      tags: ['Incidents'],
      summary: 'Resolve an incident and generate closure summary',
      responses: {
        200: { description: 'Incident resolved', content: jsonContent(incidentDetailResponseSchema) },
        400: { description: 'Incident cannot be resolved', content: jsonContent(errorResponseSchema) },
        404: { description: 'Incident not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    validator('json', resolveIncidentSchema),
    c => c.get('container').incidentHandler.resolve(c)
  )

  router.get(
    '/:id/image',
    describeRoute({
      tags: ['Incidents'],
      summary: 'Get the incident image',
      responses: {
        200: { description: 'Incident image' },
        404: { description: 'Image not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    c => c.get('container').incidentHandler.image(c)
  )

  return router
}
