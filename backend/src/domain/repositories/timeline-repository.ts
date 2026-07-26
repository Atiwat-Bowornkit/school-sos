import type { CreateTimelineEventInput, TimelineEvent } from '../entities/incident-timeline'

export interface TimelineRepository {
  findByIncidentId(incidentId: string): Promise<TimelineEvent[]>
  create(input: CreateTimelineEventInput): Promise<TimelineEvent>
}
