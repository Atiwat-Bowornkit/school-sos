import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  categoryLabels,
  filterIncidents,
  priorityLabels,
  statusLabels,
} from './incident-labels'
import { validateReportBase } from './report-validation'
import type { Incident } from '@/models'
import { useReportStore } from '@/stores/use-report-store'
import { aiApi } from '@/apis/ai-api'
import { incidentApi } from '@/apis/incident-api'

const incident: Incident = {
  id: '00000000-0000-4000-8000-000000000001',
  incidentCode: 'SOS-2026-ABC123',
  rawDescription: 'มีน้ำรั่วบริเวณบันไดและมีนักเรียนเดินผ่าน',
  title: 'น้ำรั่วบริเวณบันได',
  summary: 'พื้นเปียกและเสี่ยงลื่นล้ม',
  category: 'BUILDING',
  location: 'อาคารเรียน 1',
  suggestedPriority: 'HIGH',
  confirmedPriority: 'HIGH',
  priorityReason: 'เสี่ยงต่อความปลอดภัย',
  status: 'NEW',
  aiAnalysisSource: 'fallback',
  createdAt: '2026-07-26T00:00:00.000Z',
  updatedAt: '2026-07-26T00:00:00.000Z',
}

describe('School SOS frontend rules', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setActivePinia(createPinia())
  })

  it('maps every status, priority, and category used by the UI', () => {
    expect(statusLabels.RESOLVED).toBe('แก้ไขแล้ว')
    expect(priorityLabels.HIGH).toBe('สูง')
    expect(categoryLabels.BUILDING).toBe('อาคารและสถานที่')
  })

  it('filters incidents without changing the source list', () => {
    const resolved = { ...incident, id: '00000000-0000-4000-8000-000000000002', status: 'RESOLVED' as const }
    const source = [incident, resolved]
    expect(filterIncidents(source, { status: 'NEW', priority: 'HIGH' })).toEqual([incident])
    expect(source).toHaveLength(2)
  })

  it('validates required report fields', () => {
    expect(validateReportBase({ description: 'สั้น', category: '', location: '' })).toEqual({
      description: 'กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร',
      category: 'กรุณาเลือกหมวดเหตุ',
      location: 'กรุณาระบุสถานที่อย่างน้อย 3 ตัวอักษร',
    })
  })

  it('applies fallback analysis as editable report fields', () => {
    const store = useReportStore()
    store.applyAnalysis({
      needsFollowUp: false,
      followUpQuestion: null,
      source: 'fallback',
      analysis: {
        title: incident.title,
        summary: incident.summary,
        suggestedCategory: 'BUILDING',
        suggestedPriority: 'UNASSIGNED',
        priorityReason: 'กรุณาประเมิน Priority',
      },
    })
    expect(store.form.title).toBe(incident.title)
    expect(store.form.confirmedPriority).toBe('UNASSIGNED')
  })

  it('keeps the original follow-up question when the second analysis replaces the AI result', async () => {
    vi.spyOn(aiApi, 'analyzeIncident')
      .mockResolvedValueOnce({
        data: {
          needsFollowUp: true,
          followUpQuestion: 'มีนักเรียนใช้ทางเดินอยู่หรือไม่',
          analysis: null,
          source: 'deepseek',
        },
      })
      .mockResolvedValueOnce({
        data: {
          needsFollowUp: false,
          followUpQuestion: null,
          analysis: {
            title: incident.title,
            summary: incident.summary,
            suggestedCategory: 'BUILDING',
            suggestedPriority: 'HIGH',
            priorityReason: incident.priorityReason,
          },
          source: 'deepseek',
        },
      })
    const create = vi.spyOn(incidentApi, 'create').mockResolvedValue({
      data: { incident, timeline: [] },
    })
    const store = useReportStore()
    store.form.description = incident.rawDescription
    store.form.category = 'BUILDING'
    store.form.location = incident.location

    await store.analyze()
    store.followUpAnswer = 'ยังมีนักเรียนใช้ทางเดินอยู่'
    await store.analyze()
    await store.submit()

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      followUpQuestion: 'มีนักเรียนใช้ทางเดินอยู่หรือไม่',
      followUpAnswer: 'ยังมีนักเรียนใช้ทางเดินอยู่',
    }))
  })
})
