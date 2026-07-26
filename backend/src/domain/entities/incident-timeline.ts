export const TIMELINE_EVENT_TYPES = [
  'INCIDENT_CREATED',
  'AI_ANALYZED',
  'ASSIGNEE_UPDATED',
  'PRIORITY_UPDATED',
  'STATUS_CHANGED',
  'PROGRESS_RECORDED',
  'INCIDENT_RESOLVED',
  'CLOSURE_SUMMARY_GENERATED',
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
