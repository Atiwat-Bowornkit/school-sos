export const TIMELINE_EVENT_TYPES = [
  'INCIDENT_CREATED',
  'ASSIGNEE_UPDATED',
  'PRIORITY_UPDATED',
  'STATUS_CHANGED',
  'PROGRESS_RECORDED',
  'INCIDENT_RESOLVED',
] as const

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number]

export interface TimelineEvent {
  id: string
  incidentId: string
  eventType: TimelineEventType
  title: string
  description?: string
  actorName: string
  createdAt: string
}

export type CreateTimelineEventInput = Omit<TimelineEvent, 'id' | 'createdAt'>
