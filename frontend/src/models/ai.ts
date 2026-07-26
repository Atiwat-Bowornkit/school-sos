import type { AiSource, IncidentCategory, IncidentPriority } from './incident'

export interface AnalyzeIncidentBody {
  description: string
  selectedCategory: IncidentCategory
  location: string
  followUpAnswer?: string
  followUpAlreadyAsked: boolean
}

export interface IncidentAnalysis {
  title: string
  summary: string
  suggestedCategory: IncidentCategory
  suggestedPriority: IncidentPriority
  priorityReason: string
}

export interface IncidentAnalysisResult {
  needsFollowUp: boolean
  followUpQuestion: string | null
  analysis: IncidentAnalysis | null
  source: AiSource
}

export interface AnalyzeIncidentResponse {
  data: IncidentAnalysisResult
}
