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

export type AiSource = 'deepseek' | 'fallback'

export interface Incident {
  id: string
  incidentCode: string
  rawDescription: string
  title: string
  summary: string
  category: IncidentCategory
  location: string
  reporterName?: string
  suggestedPriority: IncidentPriority
  confirmedPriority: IncidentPriority
  priorityReason: string
  status: IncidentStatus
  assigneeName?: string
  followUpQuestion?: string
  followUpAnswer?: string
  imageKey?: string
  imageMimeType?: string
  actionTaken?: string
  resolutionResult?: string
  resolutionNote?: string
  closureSummary?: string
  aiAnalysisSource: AiSource
  aiClosureSource?: AiSource
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
  suggestedPriority: IncidentPriority
  confirmedPriority: IncidentPriority
  priorityReason: string
  followUpQuestion?: string
  followUpAnswer?: string
  imageDataUrl?: string
  aiAnalysisSource: AiSource
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

export interface IncidentResolution {
  actionTaken: string
  resolutionResult: string
  resolutionNote?: string
  closureSummary: string
  aiClosureSource: AiSource
  resolvedAt: string
  updatedAt: string
}
