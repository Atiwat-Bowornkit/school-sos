import type {
  AnalyzeIncidentInput,
  ClosureSummaryInput,
  ClosureSummaryResult,
  IncidentAiAssistant,
  IncidentAnalysisResult,
} from '../../domain/services/incident-ai-assistant'

export class ResilientIncidentAi implements IncidentAiAssistant {
  constructor(
    private readonly primary: IncidentAiAssistant,
    private readonly fallback: IncidentAiAssistant
  ) {}

  async analyzeIncident(input: AnalyzeIncidentInput): Promise<IncidentAnalysisResult> {
    try {
      return await this.primary.analyzeIncident(input)
    }
    catch {
      return this.fallback.analyzeIncident(input)
    }
  }

  async generateClosureSummary(input: ClosureSummaryInput): Promise<ClosureSummaryResult> {
    try {
      return await this.primary.generateClosureSummary(input)
    }
    catch {
      return this.fallback.generateClosureSummary(input)
    }
  }
}
