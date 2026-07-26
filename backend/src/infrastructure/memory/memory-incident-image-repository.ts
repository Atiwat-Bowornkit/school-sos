import type { IncidentImage } from '../../domain/entities/incident-image'
import type { IncidentImageRepository } from '../../domain/repositories/incident-image-repository'

export class MemoryIncidentImageRepository implements IncidentImageRepository {
  private images = new Map<string, IncidentImage[]>()

  async findByIncidentId(incidentId: string): Promise<IncidentImage[]> {
    return [...(this.images.get(incidentId) ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async create(image: IncidentImage): Promise<void> {
    const list = this.images.get(image.incidentId) ?? []
    list.push(image)
    this.images.set(image.incidentId, list)
  }

  async deleteByIncidentId(incidentId: string): Promise<void> {
    this.images.delete(incidentId)
  }
}
