// Cloudflare Workers entrypoint (referenced by wrangler.jsonc "main").
// Wires D1 implementations into the runtime-agnostic app.
import { createApp } from './app'
import { createContainer } from './di/container'
import { D1IncidentImageRepository } from './infrastructure/d1/d1-incident-image-repository'
import { D1IncidentRepository } from './infrastructure/d1/d1-incident-repository'
import { D1TimelineRepository } from './infrastructure/d1/d1-timeline-repository'
import { D1UserRepository } from './infrastructure/d1/d1-user-repository'
import type { Bindings } from './types'

const app = createApp((env) => {
  const bindings = env as Bindings
  return createContainer({
    incidentRepository: new D1IncidentRepository(bindings.DB),
    timelineRepository: new D1TimelineRepository(bindings.DB),
    incidentImageRepository: new D1IncidentImageRepository(bindings.DB),
    userRepository: new D1UserRepository(bindings.DB),
    jwtSecret: bindings.JWT_SECRET,
    registrationKey: bindings.REGISTRATION_KEY,
  })
})

export default app
