import type {
  Incident,
  IncidentFilters,
  IncidentPriority,
  IncidentResolution,
  IncidentStatus,
} from '../entities/incident'

export interface IncidentRepository {
  findAll(filters?: IncidentFilters): Promise<Incident[]>
  findById(id: string): Promise<Incident | null>
  create(incident: Incident): Promise<Incident>
  updateAssignment(id: string, assigneeName: string, updatedAt: string): Promise<Incident | null>
  updatePriority(id: string, priority: IncidentPriority, updatedAt: string): Promise<Incident | null>
  updateStatus(id: string, status: IncidentStatus, updatedAt: string): Promise<Incident | null>
  addResolution(id: string, resolution: IncidentResolution): Promise<Incident | null>
}
