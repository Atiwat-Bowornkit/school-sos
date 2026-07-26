import type {
  ClosureSummaryInput,
  ClosureSummaryResult,
  AnalyzeIncidentInput,
  IncidentAiAssistant,
  IncidentAnalysisResult,
} from '../../domain/services/incident-ai-assistant'

function deriveTitle(description: string): string {
  const clean = description.trim().replace(/\s+/g, ' ')
  return clean.length <= 60 ? clean : `${clean.slice(0, 57)}...`
}

export class TemplateIncidentAi implements IncidentAiAssistant {
  async analyzeIncident(input: AnalyzeIncidentInput): Promise<IncidentAnalysisResult> {
    return {
      needsFollowUp: false,
      followUpQuestion: null,
      analysis: {
        title: deriveTitle(input.description),
        summary: input.description.trim(),
        suggestedCategory: input.selectedCategory,
        suggestedPriority: 'UNASSIGNED',
        priorityReason: 'ระบบ AI ไม่พร้อมใช้งาน กรุณาให้ผู้รับผิดชอบประเมิน Priority',
      },
      source: 'fallback',
    }
  }

  async generateClosureSummary(input: ClosureSummaryInput): Promise<ClosureSummaryResult> {
    const note = input.resolutionNote ? ` หมายเหตุ: ${input.resolutionNote}` : ''
    return {
      summary: `Incident ${input.incidentCode} เรื่อง ${input.title} เกิดขึ้นที่ ${input.location} `
        + `โดยมอบหมายให้ ${input.assigneeName} ดำเนินการ การดำเนินการ: ${input.actionTaken} `
        + `ผลลัพธ์: ${input.resolutionResult} สถานะปัจจุบัน: แก้ไขแล้ว${note}`,
      source: 'fallback',
    }
  }
}
