import z from 'zod'
import {
  INCIDENT_CATEGORIES,
  INCIDENT_PRIORITIES,
} from '../../domain/entities/incident'
import type {
  AnalyzeIncidentInput,
  ClosureSummaryInput,
  ClosureSummaryResult,
  IncidentAiAssistant,
  IncidentAnalysisResult,
} from '../../domain/services/incident-ai-assistant'

const deepSeekResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string().min(1),
    }),
  })).min(1),
})

const analysisResultSchema = z.object({
  needsFollowUp: z.boolean(),
  followUpQuestion: z.string().nullable(),
  analysis: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    suggestedCategory: z.enum(INCIDENT_CATEGORIES),
    suggestedPriority: z.enum(INCIDENT_PRIORITIES),
    priorityReason: z.string().min(1),
  }).nullable(),
}).superRefine((value, ctx) => {
  if (value.needsFollowUp && !value.followUpQuestion) {
    ctx.addIssue({ code: 'custom', message: 'followUpQuestion is required' })
  }
  if (!value.needsFollowUp && !value.analysis) {
    ctx.addIssue({ code: 'custom', message: 'analysis is required' })
  }
})

const closureResultSchema = z.object({
  summary: z.string().min(1),
})

export interface DeepSeekIncidentAiOptions {
  apiKey?: string
  baseUrl?: string
  model?: string
  timeoutMs?: number
}

export class DeepSeekIncidentAi implements IncidentAiAssistant {
  private readonly baseUrl: string
  private readonly model: string
  private readonly timeoutMs: number

  constructor(private readonly options: DeepSeekIncidentAiOptions) {
    this.baseUrl = (options.baseUrl ?? 'https://api.deepseek.com').replace(/\/$/, '')
    this.model = options.model ?? 'deepseek-v4-flash'
    this.timeoutMs = options.timeoutMs ?? 12_000
  }

  async analyzeIncident(input: AnalyzeIncidentInput): Promise<IncidentAnalysisResult> {
    const system = `คุณเป็นผู้ช่วยคัดกรองเหตุภายในโรงเรียน ไม่ใช่ผู้ตัดสินใจสุดท้าย
ตอบเป็น JSON เท่านั้น ห้ามสร้างข้อมูลที่ผู้ใช้ไม่ได้ให้ และใช้ภาษาไทยกระชับ
category ต้องเป็นหนึ่งใน: ${INCIDENT_CATEGORIES.join(', ')}
priority ต้องเป็นหนึ่งใน: ${INCIDENT_PRIORITIES.join(', ')}
ตรวจเหตุ สถานที่ ความเสี่ยง และผู้ได้รับผลกระทบ ถ้าขาดข้อมูลสำคัญให้ถามเพียงหนึ่งคำถาม
ถ้า followUpAlreadyAsked เป็น true ห้ามถามเพิ่มและต้องคืน analysis
รูปแบบ JSON:
{"needsFollowUp":false,"followUpQuestion":null,"analysis":{"title":"","summary":"","suggestedCategory":"BUILDING","suggestedPriority":"HIGH","priorityReason":""}}
AI เป็นเพียงผู้เสนอแนะและมนุษย์เป็นผู้ยืนยัน ห้ามให้คำแนะนำฉุกเฉินหรือการแพทย์เกินขอบเขตระบบ`

    const content = await this.completeJson(system, JSON.stringify({ incidentData: input }), 900)
    const parsed = analysisResultSchema.parse(JSON.parse(content))
    if (input.followUpAlreadyAsked && parsed.needsFollowUp)
      throw new Error('DeepSeek attempted a second follow-up question')

    return { ...parsed, source: 'deepseek' }
  }

  async generateClosureSummary(input: ClosureSummaryInput): Promise<ClosureSummaryResult> {
    const system = `คุณเป็นผู้ช่วยเขียนรายงานปิดเหตุภายในโรงเรียน
ตอบเป็น JSON เท่านั้นในรูปแบบ {"summary":""} และใช้ภาษาไทยแบบเป็นทางการ กระชับ
สรุปเหตุ สถานที่ Priority ผู้รับผิดชอบ การดำเนินการ ผลลัพธ์ และลำดับเวลาโดยย่อ
ห้ามเพิ่มข้อมูลที่ไม่มีใน incidentData และห้ามแสดง reasoning`
    const content = await this.completeJson(system, JSON.stringify({ incidentData: input }), 1_100)
    return { ...closureResultSchema.parse(JSON.parse(content)), source: 'deepseek' }
  }

  private async completeJson(system: string, user: string, maxTokens: number): Promise<string> {
    if (!this.options.apiKey) throw new Error('DEEPSEEK_API_KEY is not configured')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          thinking: { type: 'disabled' },
          response_format: { type: 'json_object' },
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`DeepSeek returned HTTP ${response.status}`)
      const body = deepSeekResponseSchema.parse(await response.json())
      const content = body.choices[0]?.message.content
      if (!content) throw new Error('DeepSeek returned empty content')
      return content
    }
    finally {
      clearTimeout(timer)
    }
  }
}
