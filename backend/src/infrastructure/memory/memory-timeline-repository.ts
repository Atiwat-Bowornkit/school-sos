import type {
  CreateTimelineEventInput,
  TimelineEvent,
} from '../../domain/entities/incident-timeline'
import type { TimelineRepository } from '../../domain/repositories/timeline-repository'

export class MemoryTimelineRepository implements TimelineRepository {
  private readonly events: TimelineEvent[] = []

  async findByIncidentId(incidentId: string): Promise<TimelineEvent[]> {
    return this.events
      .filter(event => event.incidentId === incidentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async create(input: CreateTimelineEventInput): Promise<TimelineEvent> {
    const event: TimelineEvent = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    this.events.push(event)
    return event
  }
}
