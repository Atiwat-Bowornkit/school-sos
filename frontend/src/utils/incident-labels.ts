import type {
  Incident,
  IncidentCategory,
  IncidentFilters,
  IncidentPriority,
  IncidentStatus,
} from '@/models'

export const statusLabels: Record<IncidentStatus, string> = {
  NEW: 'เหตุใหม่',
  ACKNOWLEDGED: 'รับเรื่องแล้ว',
  IN_PROGRESS: 'กำลังดำเนินการ',
  RESOLVED: 'แก้ไขแล้ว',
}

export const statusColors: Record<IncidentStatus, string> = {
  NEW: 'primary',
  ACKNOWLEDGED: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
}

export const priorityLabels: Record<IncidentPriority, string> = {
  UNASSIGNED: 'ยังไม่ประเมิน',
  LOW: 'ต่ำ',
  MEDIUM: 'ปานกลาง',
  HIGH: 'สูง',
}

export const priorityColors: Record<IncidentPriority, string> = {
  UNASSIGNED: 'secondary',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error',
}

export const categoryLabels: Record<IncidentCategory, string> = {
  BUILDING: 'อาคารและสถานที่',
  GENERAL_SAFETY: 'ความปลอดภัยทั่วไป',
  UTILITY: 'ไฟฟ้าและสาธารณูปโภค',
  HEALTH_ACCIDENT: 'สุขภาพและอุบัติเหตุ',
  EQUIPMENT_TECHNOLOGY: 'อุปกรณ์หรือเทคโนโลยี',
  CLEANLINESS_HYGIENE: 'ความสะอาดและสุขอนามัย',
  OTHER: 'อื่น ๆ',
}

export function filterIncidents(items: Incident[], filters: IncidentFilters): Incident[] {
  return items
    .filter(item => !filters.status || item.status === filters.status)
    .filter(item => !filters.priority || item.confirmedPriority === filters.priority)
    .filter(item => !filters.category || item.category === filters.category)
    .filter(item => {
      if (!filters.search) return true
      const q = filters.search.toLowerCase()
      return (
        item.incidentCode.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q)
      )
    })
}
