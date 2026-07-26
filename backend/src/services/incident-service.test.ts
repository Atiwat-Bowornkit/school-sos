import { describe, expect, it } from 'vitest'
import type {
  ClosureSummaryInput,
  IncidentAiAssistant,
  AnalyzeIncidentInput,
} from '../domain/services/incident-ai-assistant'
import type { CreateIncidentInput } from '../domain/entities/incident'
import { ResilientIncidentAi } from '../infrastructure/ai/resilient-incident-ai'
import { TemplateIncidentAi } from '../infrastructure/ai/template-incident-ai'
import { MemoryIncidentImageRepository } from '../infrastructure/memory/memory-incident-image-repository'
import { MemoryIncidentRepository } from '../infrastructure/memory/memory-incident-repository'
import { MemoryTimelineRepository } from '../infrastructure/memory/memory-timeline-repository'
import { IncidentService } from './incident-service'

class ThrowingAi implements IncidentAiAssistant {
  async analyzeIncident(_input: AnalyzeIncidentInput): Promise<never> {
    throw new Error('AI unavailable')
  }

  async generateClosureSummary(_input: ClosureSummaryInput): Promise<never> {
    throw new Error('AI unavailable')
  }
}

function createService(ai: IncidentAiAssistant = new TemplateIncidentAi()) {
  return new IncidentService(
    new MemoryIncidentRepository(),
    new MemoryTimelineRepository(),
    new MemoryIncidentImageRepository(),
    ai
  )
}

const baseIncidentInput: CreateIncidentInput = {
  rawDescription: 'มีน้ำรั่วไหลลงมาตรงบันไดและยังมีนักเรียนเดินผ่าน',
  title: 'น้ำรั่วบริเวณบันไดอาคารเรียน 1',
  summary: 'พื้นบันไดเปียกและเสี่ยงต่อการลื่นล้ม',
  category: 'BUILDING',
  location: 'บันไดอาคารเรียน 1 ระหว่างชั้น 1 และชั้น 2',
  suggestedPriority: 'HIGH',
  confirmedPriority: 'HIGH',
  priorityReason: 'เป็นเส้นทางสัญจรและเสี่ยงต่ออุบัติเหตุ',
  aiAnalysisSource: 'fallback',
}

async function createIncident(service: IncidentService) {
  return service.createIncident(baseIncidentInput)
}

describe('IncidentService', () => {
  it('creates the base timeline and auto-acknowledges on assignment', async () => {
    const service = createService()
    const created = await createIncident(service)

    const updated = await service.updateIncident(created.incident.id, {
      assigneeName: 'นายสมชาย',
      actorName: 'ครูเวร',
    })

    expect(updated.incident.status).toBe('ACKNOWLEDGED')
    expect(updated.timeline.map(event => event.eventType)).toEqual([
      'INCIDENT_CREATED',
      'AI_ANALYZED',
      'ASSIGNEE_UPDATED',
      'STATUS_CHANGED',
    ])
  })

  it('rejects invalid status transitions and invalid resolve', async () => {
    const service = createService()
    const created = await createIncident(service)

    await expect(service.changeStatus(created.incident.id, { status: 'IN_PROGRESS' }))
      .rejects.toThrow('ไม่สามารถเปลี่ยนสถานะ')
    await expect(service.resolveIncident(created.incident.id, {
      actionTaken: 'เช็ดพื้น',
      resolutionResult: 'พื้นแห้ง',
    })).rejects.toThrow('IN_PROGRESS')
  })

  it('resolves through fallback and records closure timeline', async () => {
    const ai = new ResilientIncidentAi(new ThrowingAi(), new TemplateIncidentAi())
    const service = createService(ai)
    const created = await createIncident(service)
    await service.updateIncident(created.incident.id, { assigneeName: 'ฝ่ายอาคาร' })
    await service.changeStatus(created.incident.id, { status: 'IN_PROGRESS' })
    const resolved = await service.resolveIncident(created.incident.id, {
      actionTaken: 'ปิดวาล์วและเช็ดพื้น',
      resolutionResult: 'หยุดน้ำรั่วและเปิดทางเดินได้',
    })

    expect(resolved.incident.status).toBe('RESOLVED')
    expect(resolved.incident.aiClosureSource).toBe('fallback')
    expect(resolved.timeline.at(-1)?.eventType).toBe('CLOSURE_SUMMARY_GENERATED')
  })

  it('returns an editable fallback analysis when primary AI fails', async () => {
    const service = createService(new ResilientIncidentAi(new ThrowingAi(), new TemplateIncidentAi()))
    const result = await service.analyzeIncident({
      description: 'มีน้ำรั่วตรงบันไดอาคารเรียน',
      selectedCategory: 'BUILDING',
      location: 'อาคารเรียน 1',
      followUpAlreadyAsked: false,
    })

    expect(result.source).toBe('fallback')
    expect(result.analysis?.suggestedPriority).toBe('UNASSIGNED')
  })

  it('rejects image bytes that do not match the declared MIME type', async () => {
    const service = createService()

    await expect(service.createIncident({
      ...baseIncidentInput,
      imageDataUrl: 'data:image/png;base64,SGVsbG8=',
    })).rejects.toThrow('ไม่ตรงกับประเภทไฟล์')
  })
})
