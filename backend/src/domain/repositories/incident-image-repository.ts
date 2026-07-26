import type { IncidentImage } from '../entities/incident-image'

export interface IncidentImageRepository {
  findByIncidentId(incidentId: string): Promise<IncidentImage[]>
  create(image: IncidentImage): Promise<void>
  deleteByIncidentId(incidentId: string): Promise<void>
}
