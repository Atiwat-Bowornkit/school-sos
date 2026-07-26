import type {
  CreateTimelineEventInput,
  TimelineEvent,
  TimelineEventType,
} from '../../domain/entities/incident-timeline'
import type { TimelineRepository } from '../../domain/repositories/timeline-repository'

interface TimelineRow {
  id: string
  incident_id: string
  event_type: TimelineEventType
  title: string
  description: string | null
  actor_name: string
  created_at: string
}

function toTimelineEvent(row: TimelineRow): TimelineEvent {
  return {
    id: row.id,
    incidentId: row.incident_id,
    eventType: row.event_type,
    title: row.title,
    description: row.description ?? undefined,
    actorName: row.actor_name,
    createdAt: row.created_at,
  }
}

export class D1TimelineRepository implements TimelineRepository {
  constructor(private readonly db: D1Database) {}

  async findByIncidentId(incidentId: string): Promise<TimelineEvent[]> {
    const { results } = await this.db.prepare(`
      SELECT id, incident_id, event_type, title, description, actor_name, created_at
      FROM incident_timeline
      WHERE incident_id = ?
      ORDER BY created_at ASC
    `).bind(incidentId).all<TimelineRow>()
    return results.map(toTimelineEvent)
  }

  async create(input: CreateTimelineEventInput): Promise<TimelineEvent> {
    const event: TimelineEvent = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await this.db.prepare(`
      INSERT INTO incident_timeline
        (id, incident_id, event_type, title, description, actor_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id,
      event.incidentId,
      event.eventType,
      event.title,
      event.description ?? null,
      event.actorName,
      event.createdAt
    ).run()
    return event
  }
}
