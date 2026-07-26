import type {
  Incident,
  IncidentFilters,
  IncidentPriority,
  IncidentResolution,
  IncidentStatus,
} from '../../domain/entities/incident'
import type { IncidentRepository } from '../../domain/repositories/incident-repository'

const priorityRank: Record<IncidentPriority, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  UNASSIGNED: 4,
}

export class MemoryIncidentRepository implements IncidentRepository {
  private readonly incidents = new Map<string, Incident>()

  async findAll(filters: IncidentFilters = {}): Promise<Incident[]> {
    return [...this.incidents.values()]
      .filter(incident => !filters.status || incident.status === filters.status)
      .filter(incident => !filters.priority || incident.confirmedPriority === filters.priority)
      .sort((a, b) => priorityRank[a.confirmedPriority] - priorityRank[b.confirmedPriority]
        || b.createdAt.localeCompare(a.createdAt))
  }

  async findById(id: string): Promise<Incident | null> {
    return this.incidents.get(id) ?? null
  }

  async create(incident: Incident): Promise<Incident> {
    this.incidents.set(incident.id, { ...incident })
    return incident
  }

  async updateAssignment(id: string, assigneeName: string, updatedAt: string): Promise<Incident | null> {
    return this.update(id, { assigneeName, updatedAt })
  }

  async updatePriority(id: string, confirmedPriority: IncidentPriority, updatedAt: string): Promise<Incident | null> {
    return this.update(id, { confirmedPriority, updatedAt })
  }

  async updateStatus(id: string, status: IncidentStatus, updatedAt: string): Promise<Incident | null> {
    return this.update(id, { status, updatedAt })
  }

  async addResolution(id: string, resolution: IncidentResolution): Promise<Incident | null> {
    return this.update(id, { ...resolution, status: 'RESOLVED' })
  }

  private update(id: string, changes: Partial<Incident>): Incident | null {
    const existing = this.incidents.get(id)
    if (!existing) return null
    const updated = { ...existing, ...changes }
    this.incidents.set(id, updated)
    return updated
  }
}
