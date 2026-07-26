import type {
  AddProgressInput,
  ChangeIncidentStatusInput,
  CreateIncidentInput,
  Incident,
  IncidentFilters,
  IncidentPriority,
  IncidentStatus,
  ResolveIncidentInput,
  UpdateIncidentInput,
} from '../domain/entities/incident'
import type { IncidentImage } from '../domain/entities/incident-image'
import type { TimelineEvent, TimelineEventType } from '../domain/entities/incident-timeline'
import { NotFoundError, ValidationError } from '../domain/errors'
import type { IncidentRepository } from '../domain/repositories/incident-repository'
import type { IncidentImageRepository } from '../domain/repositories/incident-image-repository'
import type { TimelineRepository } from '../domain/repositories/timeline-repository'

const MAX_IMAGE_BYTES = 1024 * 1024
const MAX_IMAGE_COUNT = 5
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const transitions: Record<IncidentStatus, IncidentStatus[]> = {
  NEW: ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['NEW', 'IN_PROGRESS'],
  IN_PROGRESS: ['ACKNOWLEDGED', 'RESOLVED'],
  RESOLVED: [],
}

export interface IncidentDetail {
  incident: Incident
  timeline: TimelineEvent[]
  images: { id: string; sortOrder: number }[]
}

export class IncidentService {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly imageRepository: IncidentImageRepository,
  ) {}

  async listIncidents(filters?: IncidentFilters): Promise<Incident[]> {
    return this.incidentRepository.findAll(filters)
  }

  async getIncident(id: string): Promise<IncidentDetail> {
    const incident = await this.findIncident(id)
    const timeline = await this.timelineRepository.findByIncidentId(id)
    const images = await this.imageRepository.findByIncidentId(id)
    return { incident, timeline, images: images.map(img => ({ id: img.id, sortOrder: img.sortOrder })) }
  }

  async createIncident(input: CreateIncidentInput): Promise<IncidentDetail> {
    this.validateCreate(input)
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    // Process images
    const decodedImages = this.processImages(input.imagesDataUrl)
    const incident: Incident = {
      id,
      incidentCode: this.createIncidentCode(),
      rawDescription: input.rawDescription.trim(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      category: input.category,
      location: input.location.trim(),
      reporterName: input.reporterName?.trim() || undefined,
      confirmedPriority: input.confirmedPriority,
      priorityReason: input.priorityReason.trim(),
      status: 'NEW',
      imageCount: decodedImages.length,
      createdAt: now,
      updatedAt: now,
    }

    await this.incidentRepository.create(incident)

    // Store images in the incident_images table
    for (let i = 0; i < decodedImages.length; i++) {
      const img = decodedImages[i]!
      const imageEntity: IncidentImage = {
        id: crypto.randomUUID(),
        incidentId: id,
        imageData: `data:${img.mimeType};base64,${img.base64}`,
        imageMimeType: img.mimeType,
        sortOrder: i,
        createdAt: now,
      }
      await this.imageRepository.create(imageEntity)
    }

    await this.record(
      incident.id,
      'INCIDENT_CREATED',
      'Incident ถูกสร้าง',
      `สร้าง ${incident.incidentCode}: ${incident.title}`,
      incident.reporterName ?? 'ผู้แจ้งเหตุ',
    )
    return this.getIncident(incident.id)
  }

  async updateIncident(id: string, input: UpdateIncidentInput): Promise<IncidentDetail> {
    let incident = await this.findIncident(id)
    const actor = input.actorName?.trim() || 'เจ้าหน้าที่'

    if (input.assigneeName !== undefined) {
      const assigneeName = input.assigneeName.trim()
      if (!assigneeName) throw new ValidationError('กรุณาระบุผู้รับผิดชอบ')
      if (incident.assigneeName !== assigneeName) {
        const updatedAt = new Date().toISOString()
        incident = await this.incidentRepository.updateAssignment(id, assigneeName, updatedAt)
          ?? this.notFound()
        await this.record(id, 'ASSIGNEE_UPDATED', 'อัปเดตผู้รับผิดชอบ', `กำหนดผู้รับผิดชอบเป็น ${assigneeName}`, actor)
      }
      if (incident.status === 'NEW') {
        const updatedAt = new Date().toISOString()
        incident = await this.incidentRepository.updateStatus(id, 'ACKNOWLEDGED', updatedAt)
          ?? this.notFound()
        await this.record(id, 'STATUS_CHANGED', 'เปลี่ยนสถานะ', 'เปลี่ยนจาก NEW เป็น ACKNOWLEDGED', actor)
      }
    }

    if (input.confirmedPriority !== undefined && incident.confirmedPriority !== input.confirmedPriority) {
      const previous = incident.confirmedPriority
      const updatedAt = new Date().toISOString()
      incident = await this.incidentRepository.updatePriority(id, input.confirmedPriority, updatedAt)
        ?? this.notFound()
      await this.record(
        id,
        'PRIORITY_UPDATED',
        'อัปเดต Priority',
        `เปลี่ยนจาก ${previous} เป็น ${input.confirmedPriority}`,
        actor,
      )
    }
    return this.getIncident(id)
  }

  async changeStatus(id: string, input: ChangeIncidentStatusInput): Promise<IncidentDetail> {
    const incident = await this.findIncident(id)
    if (incident.status === input.status)
      throw new ValidationError('สถานะใหม่ต้องไม่ซ้ำกับสถานะปัจจุบัน')
    if (!transitions[incident.status].includes(input.status)) {
      throw new ValidationError(`ไม่สามารถเปลี่ยนสถานะจาก ${incident.status} ไป ${input.status} ได้`)
    }
    if (input.status === 'ACKNOWLEDGED' && !incident.assigneeName)
      throw new ValidationError('กรุณาระบุผู้รับผิดชอบก่อนรับเรื่อง')
    if (input.status === 'IN_PROGRESS' && !incident.assigneeName)
      throw new ValidationError('กรุณาระบุผู้รับผิดชอบก่อนเริ่มดำเนินการ')
    if (input.status === 'RESOLVED')
      throw new ValidationError('กรุณาปิดเหตุผ่านแบบฟอร์มปิดเหตุ')

    await this.incidentRepository.updateStatus(id, input.status, new Date().toISOString())
    const note = input.note?.trim()
    await this.record(
      id,
      'STATUS_CHANGED',
      'เปลี่ยนสถานะ',
      `เปลี่ยนจาก ${incident.status} เป็น ${input.status}${note ? ` — ${note}` : ''}`,
      input.actorName?.trim() || 'เจ้าหน้าที่',
    )
    return this.getIncident(id)
  }

  async addProgress(id: string, input: AddProgressInput): Promise<IncidentDetail> {
    const incident = await this.findIncident(id)
    if (incident.status !== 'IN_PROGRESS')
      throw new ValidationError('บันทึกความคืบหน้าได้เมื่อสถานะเป็น IN_PROGRESS เท่านั้น')
    const description = input.description.trim()
    if (!description) throw new ValidationError('กรุณากรอกรายละเอียดความคืบหน้า')
    await this.record(
      id,
      'PROGRESS_RECORDED',
      'บันทึกการดำเนินการ',
      description,
      input.actorName?.trim() || incident.assigneeName || 'เจ้าหน้าที่',
    )
    return this.getIncident(id)
  }

  async resolveIncident(id: string, input: ResolveIncidentInput): Promise<IncidentDetail> {
    const incident = await this.findIncident(id)
    if (incident.status !== 'IN_PROGRESS')
      throw new ValidationError('ปิดเหตุได้เมื่อสถานะเป็น IN_PROGRESS เท่านั้น')
    if (!incident.assigneeName)
      throw new ValidationError('กรุณาระบุผู้รับผิดชอบก่อนปิดเหตุ')
    const actionTaken = input.actionTaken.trim()
    const resolutionResult = input.resolutionResult.trim()
    if (!actionTaken) throw new ValidationError('กรุณากรอกสิ่งที่ดำเนินการ')
    if (!resolutionResult) throw new ValidationError('กรุณากรอกผลลัพธ์')

    const resolvedAt = new Date().toISOString()
    const closureSummary = `[${incident.incidentCode}] ${incident.title}

สิ่งที่ดำเนินการ: ${actionTaken}
ผลลัพธ์: ${resolutionResult}
${input.resolutionNote ? `หมายเหตุ: ${input.resolutionNote.trim()}` : ''}`

    await this.incidentRepository.addResolution(id, {
      actionTaken,
      resolutionResult,
      resolutionNote: input.resolutionNote?.trim() || undefined,
      closureSummary,
      resolvedAt,
      updatedAt: resolvedAt,
    })
    const actor = input.actorName?.trim() || incident.assigneeName
    await this.record(id, 'INCIDENT_RESOLVED', 'ปิดเหตุเป็น RESOLVED', `ผลลัพธ์: ${resolutionResult}`, actor)
    return this.getIncident(id)
  }

  /**
   * Find an incident by its UUID id or incident code (e.g. SOS-2026-ABC123).
   * Primarily used for public lookup by incident code.
   */
  async findByIdOrCode(codeOrId: string): Promise<IncidentDetail> {
    // Try UUID lookup first
    let incident = await this.incidentRepository.findById(codeOrId)
    if (incident) {
      const timeline = await this.timelineRepository.findByIncidentId(incident.id)
      const images = await this.imageRepository.findByIncidentId(incident.id)
      return { incident, timeline, images: images.map(img => ({ id: img.id, sortOrder: img.sortOrder })) }
    }
    // Fallback to incident code lookup
    incident = await this.incidentRepository.findByCode(codeOrId)
    if (!incident) throw new NotFoundError('Incident')
    const timeline = await this.timelineRepository.findByIncidentId(incident.id)
    const images = await this.imageRepository.findByIncidentId(incident.id)
    return { incident, timeline, images: images.map(img => ({ id: img.id, sortOrder: img.sortOrder })) }
  }

  async getIncidentImage(id: string): Promise<{ data: string; mimeType: string }> {
    const incident = await this.findIncident(id)
    const images = await this.imageRepository.findByIncidentId(id)
    if (images.length === 0) throw new NotFoundError('Incident image')
    return { data: images[0]!.imageData, mimeType: images[0]!.imageMimeType }
  }

  async getIncidentImageByIndex(id: string, index: number): Promise<{ data: string; mimeType: string }> {
    const incident = await this.findIncident(id)
    const images = await this.imageRepository.findByIncidentId(id)
    const image = images[index]
    if (!image) throw new NotFoundError('Incident image')
    return { data: image!.imageData, mimeType: image!.imageMimeType }
  }

  private async findIncident(id: string): Promise<Incident> {
    const incident = await this.incidentRepository.findById(id)
    if (!incident) throw new NotFoundError('Incident')
    return incident
  }

  private notFound(): never {
    throw new NotFoundError('Incident')
  }

  private validateCreate(input: CreateIncidentInput): void {
    if (input.rawDescription.trim().length < 10)
      throw new ValidationError('กรุณากรอกรายละเอียดเหตุการณ์อย่างน้อย 10 ตัวอักษร')
    if (!input.title.trim()) throw new ValidationError('กรุณาระบุชื่อ Incident')
    if (!input.summary.trim()) throw new ValidationError('กรุณาระบุ Summary')
    if (input.location.trim().length < 3)
      throw new ValidationError('กรุณาระบุสถานที่อย่างน้อย 3 ตัวอักษร')
    if (!input.priorityReason.trim()) throw new ValidationError('กรุณาระบุเหตุผลของ Priority')
  }

  private processImages(imagesDataUrl?: string[]): { mimeType: string; base64: string }[] {
    if (!imagesDataUrl || imagesDataUrl.length === 0) return []
    if (imagesDataUrl.length > MAX_IMAGE_COUNT)
      throw new ValidationError(`สามารถแนบรูปได้สูงสุด ${MAX_IMAGE_COUNT} รูป`)

    return imagesDataUrl.map(url => this.decodeImage(url))
  }

  private decodeImage(dataUrl: string): { data: Uint8Array; mimeType: string; base64: string } {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl)
    if (!match?.[1] || !match[2]) throw new ValidationError('ไม่รองรับประเภทไฟล์นี้')
    if (!ALLOWED_IMAGE_TYPES.has(match[1])) throw new ValidationError('ไม่รองรับประเภทไฟล์นี้')
    let bytes: Uint8Array
    try {
      const binary = atob(match[2].replace(/\s/g, ''))
      bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
    }
    catch {
      throw new ValidationError('ข้อมูลรูปภาพไม่ถูกต้อง')
    }
    if (bytes.byteLength > MAX_IMAGE_BYTES)
      throw new ValidationError('รูปภาพมีขนาดเกิน 1 MB')
    if (!this.hasValidImageSignature(bytes, match[1]))
      throw new ValidationError('ข้อมูลรูปภาพไม่ตรงกับประเภทไฟล์')

    return { data: bytes, mimeType: match[1], base64: match[2].replace(/\s/g, '') }
  }

  private hasValidImageSignature(bytes: Uint8Array, mimeType: string): boolean {
    if (mimeType === 'image/jpeg')
      return bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
    if (mimeType === 'image/png') {
      const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
      return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value)
    }
    if (mimeType === 'image/webp') {
      return bytes.length >= 12
        && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
        && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    }
    return false
  }

  private createIncidentCode(): string {
    const year = new Date().getUTCFullYear()
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
    return `SOS-${year}-${suffix}`
  }

  private async record(
    incidentId: string,
    eventType: TimelineEventType,
    title: string,
    description: string,
    actorName: string,
  ): Promise<void> {
    await this.timelineRepository.create({
      incidentId,
      eventType,
      title,
      description,
      actorName,
    })
  }
}
