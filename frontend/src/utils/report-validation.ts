import type { IncidentCategory } from '@/models'

export interface ReportBaseFields {
  description: string
  category: IncidentCategory | ''
  location: string
}

export function validateReportBase(fields: ReportBaseFields): Record<string, string> {
  const errors: Record<string, string> = {}
  if (fields.description.trim().length < 10)
    errors.description = 'กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร'
  if (!fields.category)
    errors.category = 'กรุณาเลือกหมวดเหตุ'
  if (fields.location.trim().length < 3)
    errors.location = 'กรุณาระบุสถานที่อย่างน้อย 3 ตัวอักษร'
  return errors
}
