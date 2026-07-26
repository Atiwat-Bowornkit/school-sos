// AWS Lambda entrypoint (bundled by `npm run build:lambda`).
// Lambda has no D1/KV bindings, so in-memory repositories are wired in here.
// Replace with DynamoDB/RDS/ElastiCache implementations for production use.
import { handle } from 'hono/aws-lambda'
import { createApp } from './app'
import { createContainer } from './di/container'
import { TemplateIncidentAi } from './infrastructure/ai/template-incident-ai'
import { MemoryIncidentImageRepository } from './infrastructure/memory/memory-incident-image-repository'
import { MemoryIncidentRepository } from './infrastructure/memory/memory-incident-repository'
import { MemoryTimelineRepository } from './infrastructure/memory/memory-timeline-repository'

const container = createContainer({
  incidentRepository: new MemoryIncidentRepository(),
  timelineRepository: new MemoryTimelineRepository(),
  imageRepository: new MemoryIncidentImageRepository(),
  aiAssistant: new TemplateIncidentAi(),
})

const app = createApp(() => container)

export const handler = handle(app)
