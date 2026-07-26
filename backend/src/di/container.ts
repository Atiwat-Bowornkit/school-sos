import type { IncidentRepository } from '../domain/repositories/incident-repository'
import type { TimelineRepository } from '../domain/repositories/timeline-repository'
import { IncidentService } from '../services/incident-service'
import { IncidentHandler } from '../handlers/incident-handler'

export interface Repositories {
  incidentRepository: IncidentRepository
  timelineRepository: TimelineRepository
}

export interface Container {
  incidentHandler: IncidentHandler
}

export function createContainer(repos: Repositories): Container {
  const incidentService = new IncidentService(
    repos.incidentRepository,
    repos.timelineRepository,
  )
  return {
    incidentHandler: new IncidentHandler(incidentService),
  }
}
