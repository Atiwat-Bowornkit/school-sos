// Cloudflare Workers entrypoint (referenced by wrangler.jsonc "main").
// Wires D1, KV, and DeepSeek implementations into the runtime-agnostic app.
import { createApp } from './app'
import { createContainer } from './di/container'
import { DeepSeekIncidentAi } from './infrastructure/ai/deepseek-incident-ai'
import { ResilientIncidentAi } from './infrastructure/ai/resilient-incident-ai'
import { TemplateIncidentAi } from './infrastructure/ai/template-incident-ai'
import { D1IncidentRepository } from './infrastructure/d1/d1-incident-repository'
import { D1TimelineRepository } from './infrastructure/d1/d1-timeline-repository'
import { KVIncidentImageRepository } from './infrastructure/kv/kv-incident-image-repository'
import type { Bindings } from './types'

const app = createApp((env) => {
  const bindings = env as Bindings
  const templateAi = new TemplateIncidentAi()
  const aiAssistant = new ResilientIncidentAi(
    new DeepSeekIncidentAi({
      apiKey: bindings.DEEPSEEK_API_KEY,
      baseUrl: bindings.DEEPSEEK_BASE_URL,
      model: bindings.DEEPSEEK_MODEL,
    }),
    templateAi
  )
  return createContainer({
    incidentRepository: new D1IncidentRepository(bindings.DB),
    timelineRepository: new D1TimelineRepository(bindings.DB),
    imageRepository: new KVIncidentImageRepository(bindings.KV),
    aiAssistant,
  })
})

export default app
