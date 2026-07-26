// Incident entity — AI-free version per Scope v2
export const INCIDENT_STATUSES = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'] as const
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]

export const INCIDENT_PRIORITIES = ['UNASSIGNED', 'LOW', 'MEDIUM', 'HIGH'] as const
export type IncidentPriority = (typeof INCIDENT_PRIORITIES)[number]

export const INCIDENT_CATEGORIES = [
  'BUILDING',
  'GENERAL_SAFETY',
  'UTILITY',
  'HEALTH_ACCIDENT',
  'EQUIPMENT_TECHNOLOGY',
  'CLEANLINESS_HYGIENE',
  'OTHER',
] as const
export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number]

export interface Incident {
  id: string
  incidentCode: string
  rawDescription: string
  title: string
  summary: string
  category: IncidentCategory
  location: string
  reporterName?: string
  confirmedPriority: IncidentPriority
  priorityReason: string
  status: IncidentStatus
  assigneeName?: string
  imageData?: string // base64 encoded, stored in D1
  imageMimeType?: string
  actionTaken?: string
  resolutionResult?: string
  resolutionNote?: string
  closureSummary?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface IncidentFilters {
  status?: IncidentStatus
  priority?: IncidentPriority
}

export interface CreateIncidentInput {
  rawDescription: string
  title: string
  summary: string
  category: IncidentCategory
  location: string
  reporterName?: string
  confirmedPriority: IncidentPriority
  priorityReason: string
  imageDataUrl?: string
}

export interface UpdateIncidentInput {
  assigneeName?: string
  confirmedPriority?: IncidentPriority
  actorName?: string
}

export interface ChangeIncidentStatusInput {
  status: IncidentStatus
  actorName?: string
  note?: string
}

export interface AddProgressInput {
  description: string
  actorName?: string
}

export interface ResolveIncidentInput {
  actionTaken: string
  resolutionResult: string
  resolutionNote?: string
  actorName?: string
}
