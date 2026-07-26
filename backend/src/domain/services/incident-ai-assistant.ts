import type { AiSource, IncidentCategory, IncidentPriority } from '../entities/incident'
import type { TimelineEvent } from '../entities/incident-timeline'

export interface AnalyzeIncidentInput {
  description: string
  selectedCategory: IncidentCategory
  location: string
  followUpAnswer?: string
  followUpAlreadyAsked: boolean
}

export interface IncidentAnalysisResult {
  needsFollowUp: boolean
  followUpQuestion: string | null
  analysis: {
    title: string
    summary: string
    suggestedCategory: IncidentCategory
    suggestedPriority: IncidentPriority
    priorityReason: string
  } | null
  source: AiSource
}

export interface ClosureSummaryInput {
  incidentCode: string
  title: string
  summary: string
  location: string
  confirmedPriority: IncidentPriority
  assigneeName: string
  actionTaken: string
  resolutionResult: string
  resolutionNote?: string
  timeline: TimelineEvent[]
}

export interface ClosureSummaryResult {
  summary: string
  source: AiSource
}

export interface IncidentAiAssistant {
  analyzeIncident(input: AnalyzeIncidentInput): Promise<IncidentAnalysisResult>
  generateClosureSummary(input: ClosureSummaryInput): Promise<ClosureSummaryResult>
}
