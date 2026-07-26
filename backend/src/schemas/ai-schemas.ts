import z from 'zod'
import { incidentCategorySchema, incidentPrioritySchema, aiSourceSchema } from './incident-schemas'

export const analyzeIncidentSchema = z.object({
  description: z.string().trim().min(10, 'กรุณากรอกรายละเอียดเหตุการณ์อย่างน้อย 10 ตัวอักษร'),
  selectedCategory: incidentCategorySchema,
  location: z.string().trim().min(3, 'กรุณาระบุสถานที่อย่างน้อย 3 ตัวอักษร'),
  followUpAnswer: z.string().trim().optional(),
  followUpAlreadyAsked: z.boolean(),
})

export const incidentAnalysisResultSchema = z.object({
  needsFollowUp: z.boolean(),
  followUpQuestion: z.string().nullable(),
  analysis: z.object({
    title: z.string(),
    summary: z.string(),
    suggestedCategory: incidentCategorySchema,
    suggestedPriority: incidentPrioritySchema,
    priorityReason: z.string(),
  }).nullable(),
  source: aiSourceSchema,
})

export const analyzeIncidentResponseSchema = z.object({
  data: incidentAnalysisResultSchema,
})
