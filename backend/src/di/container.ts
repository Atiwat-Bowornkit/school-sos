import type { IncidentImageRepository } from '../domain/repositories/incident-image-repository'
import type { IncidentRepository } from '../domain/repositories/incident-repository'
import type { TimelineRepository } from '../domain/repositories/timeline-repository'
import type { IncidentAiAssistant } from '../domain/services/incident-ai-assistant'
import { AiHandler } from '../handlers/ai-handler'
import { IncidentHandler } from '../handlers/incident-handler'
import { IncidentService } from '../services/incident-service'

export interface Repositories {
  incidentRepository: IncidentRepository
  timelineRepository: TimelineRepository
  imageRepository: IncidentImageRepository
  aiAssistant: IncidentAiAssistant
}

export interface Container {
  incidentHandler: IncidentHandler
  aiHandler: AiHandler
}

export function createContainer(repos: Repositories): Container {
  const incidentService = new IncidentService(
    repos.incidentRepository,
    repos.timelineRepository,
    repos.imageRepository,
    repos.aiAssistant
  )
  return {
    incidentHandler: new IncidentHandler(incidentService),
    aiHandler: new AiHandler(incidentService),
  }
}
