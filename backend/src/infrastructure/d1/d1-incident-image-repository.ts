import type { IncidentImage } from '../../domain/entities/incident-image'
import type { IncidentImageRepository } from '../../domain/repositories/incident-image-repository'

interface IncidentImageRow {
  id: string
  incident_id: string
  image_data: string
  image_mime_type: string
  sort_order: number
  created_at: string
}

export class D1IncidentImageRepository implements IncidentImageRepository {
  constructor(private readonly db: D1Database) {}

  async findByIncidentId(incidentId: string): Promise<IncidentImage[]> {
    const { results } = await this.db
      .prepare(
        'SELECT id, incident_id, image_data, image_mime_type, sort_order, created_at FROM incident_images WHERE incident_id = ? ORDER BY sort_order ASC'
      )
      .bind(incidentId)
      .all<IncidentImageRow>()
    return results.map(row => ({
      id: row.id,
      incidentId: row.incident_id,
      imageData: row.image_data,
      imageMimeType: row.image_mime_type,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    }))
  }

  async create(image: IncidentImage): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO incident_images (id, incident_id, image_data, image_mime_type, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(image.id, image.incidentId, image.imageData, image.imageMimeType, image.sortOrder, image.createdAt)
      .run()
  }

  async deleteByIncidentId(incidentId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM incident_images WHERE incident_id = ?')
      .bind(incidentId)
      .run()
  }
}
