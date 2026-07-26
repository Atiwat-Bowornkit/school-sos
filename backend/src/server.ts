// Cloudflare Workers entrypoint (referenced by wrangler.jsonc "main").
// Wires D1 implementations into the runtime-agnostic app.
import { createApp } from './app'
import { createContainer } from './di/container'
import { D1IncidentRepository } from './infrastructure/d1/d1-incident-repository'
import { D1TimelineRepository } from './infrastructure/d1/d1-timeline-repository'
import type { Bindings } from './types'

const app = createApp((env) => {
  const bindings = env as Bindings
  return createContainer({
    incidentRepository: new D1IncidentRepository(bindings.DB),
    timelineRepository: new D1TimelineRepository(bindings.DB),
  })
})

export default app
