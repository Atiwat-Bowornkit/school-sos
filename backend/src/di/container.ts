import type { IncidentImageRepository } from '../domain/repositories/incident-image-repository'
import type { IncidentRepository } from '../domain/repositories/incident-repository'
import type { TimelineRepository } from '../domain/repositories/timeline-repository'
import type { UserRepository } from '../domain/repositories/user-repository'
import { IncidentService } from '../services/incident-service'
import { AuthService } from '../services/auth-service'
import { IncidentHandler } from '../handlers/incident-handler'
import { AuthHandler } from '../handlers/auth-handler'

export interface Repositories {
  incidentRepository: IncidentRepository
  timelineRepository: TimelineRepository
  incidentImageRepository: IncidentImageRepository
  userRepository: UserRepository
  jwtSecret?: string
  registrationKey?: string
}

export interface Container {
  incidentHandler: IncidentHandler
  authHandler: AuthHandler
  authService: AuthService
}

export function createContainer(repos: Repositories): Container {
  const incidentService = new IncidentService(
    repos.incidentRepository,
    repos.timelineRepository,
    repos.incidentImageRepository,
  )
  const authService = new AuthService(
    repos.userRepository,
    repos.jwtSecret ?? 'dev-secret-change-in-production',
    repos.registrationKey ?? 'dev-key',
  )
  return {
    incidentHandler: new IncidentHandler(incidentService),
    authHandler: new AuthHandler(authService),
    authService,
  }
}
