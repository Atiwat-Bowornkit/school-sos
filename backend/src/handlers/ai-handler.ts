import type { Context } from 'hono'
import type { AnalyzeIncidentInput } from '../domain/services/incident-ai-assistant'
import { ValidationError } from '../domain/errors'
import type { IncidentService } from '../services/incident-service'

export class AiHandler {
  constructor(private readonly incidentService: IncidentService) {}

  analyze = async (c: Context) => {
    let body: AnalyzeIncidentInput
    try {
      body = await c.req.json<AnalyzeIncidentInput>()
    }
    catch {
      throw new ValidationError('Invalid JSON body')
    }
    const result = await this.incidentService.analyzeIncident(body)
    return c.json({ data: result })
  }
}
