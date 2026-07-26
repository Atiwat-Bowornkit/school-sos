// AWS Lambda entrypoint (bundled by `npm run build:lambda`).
// Lambda has no D1 bindings, so in-memory repositories are wired in here.
import { handle } from 'hono/aws-lambda'
import { createApp } from './app'
import { createContainer } from './di/container'
import { MemoryIncidentRepository } from './infrastructure/memory/memory-incident-repository'
import { MemoryTimelineRepository } from './infrastructure/memory/memory-timeline-repository'

const container = createContainer({
  incidentRepository: new MemoryIncidentRepository(),
  timelineRepository: new MemoryTimelineRepository(),
})

const app = createApp(() => container)

export const handler = handle(app)
