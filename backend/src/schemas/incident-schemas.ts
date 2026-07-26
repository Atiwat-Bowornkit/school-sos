import z from 'zod'
import {
  INCIDENT_CATEGORIES,
  INCIDENT_PRIORITIES,
  INCIDENT_STATUSES,
} from '../domain/entities/incident'
import { TIMELINE_EVENT_TYPES } from '../domain/entities/incident-timeline'

export const incidentStatusSchema = z.enum(INCIDENT_STATUSES)
export const incidentPrioritySchema = z.enum(INCIDENT_PRIORITIES)
export const incidentCategorySchema = z.enum(INCIDENT_CATEGORIES)

export const incidentSchema = z.object({
  id: z.uuid(),
  incidentCode: z.string(),
  rawDescription: z.string(),
  title: z.string(),
  summary: z.string(),
  category: incidentCategorySchema,
  location: z.string(),
  reporterName: z.string().optional(),
  confirmedPriority: incidentPrioritySchema,
  priorityReason: z.string(),
  status: incidentStatusSchema,
  assigneeName: z.string().optional(),
  imageData: z.string().optional(),
  imageMimeType: z.string().optional(),
  actionTaken: z.string().optional(),
  resolutionResult: z.string().optional(),
  resolutionNote: z.string().optional(),
  closureSummary: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().optional(),
})

export const timelineEventSchema = z.object({
  id: z.uuid(),
  incidentId: z.uuid(),
  eventType: z.enum(TIMELINE_EVENT_TYPES),
  title: z.string(),
  description: z.string().optional(),
  actorName: z.string(),
  createdAt: z.iso.datetime(),
})

export const listIncidentQuerySchema = z.object({
  status: incidentStatusSchema.optional(),
  priority: incidentPrioritySchema.optional(),
})

export const createIncidentSchema = z.object({
  rawDescription: z.string().trim().min(10, 'กรุณากรอกรายละเอียดเหตุการณ์อย่างน้อย 10 ตัวอักษร'),
  title: z.string().trim().min(1, 'กรุณาระบุชื่อ Incident'),
  summary: z.string().trim().min(1, 'กรุณาระบุ Summary'),
  category: incidentCategorySchema,
  location: z.string().trim().min(3, 'กรุณาระบุสถานที่อย่างน้อย 3 ตัวอักษร'),
  reporterName: z.string().trim().optional(),
  confirmedPriority: incidentPrioritySchema,
  priorityReason: z.string().trim().min(1, 'กรุณาระบุเหตุผลของ Priority'),
  imageDataUrl: z.string().max(1_500_000, 'รูปภาพมีขนาดใหญ่เกินไป').optional(),
})

export const updateIncidentSchema = z.object({
  assigneeName: z.string().trim().min(1, 'กรุณาระบุผู้รับผิดชอบ').optional(),
  confirmedPriority: incidentPrioritySchema.optional(),
  actorName: z.string().trim().optional(),
}).refine(
  value => value.assigneeName !== undefined || value.confirmedPriority !== undefined,
  { message: 'กรุณาระบุข้อมูลที่ต้องการอัปเดต' }
)

export const changeStatusSchema = z.object({
  status: incidentStatusSchema,
  actorName: z.string().trim().optional(),
  note: z.string().trim().optional(),
})

export const addProgressSchema = z.object({
  description: z.string().trim().min(1, 'กรุณากรอกรายละเอียดความคืบหน้า'),
  actorName: z.string().trim().optional(),
})

export const resolveIncidentSchema = z.object({
  actionTaken: z.string().trim().min(1, 'กรุณากรอกสิ่งที่ดำเนินการ'),
  resolutionResult: z.string().trim().min(1, 'กรุณากรอกผลลัพธ์'),
  resolutionNote: z.string().trim().optional(),
  actorName: z.string().trim().optional(),
})

export const idParamSchema = z.object({
  id: z.uuid('Incident ID ไม่ถูกต้อง'),
})

export const incidentResponseSchema = z.object({ data: incidentSchema })
export const incidentListResponseSchema = z.object({ data: z.array(incidentSchema) })
export const incidentDetailResponseSchema = z.object({
  data: z.object({
    incident: incidentSchema,
    timeline: z.array(timelineEventSchema),
  }),
})

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})
