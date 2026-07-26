import type { Context } from 'hono'
import type {
  AddProgressInput,
  ChangeIncidentStatusInput,
  CreateIncidentInput,
  Incident,
  IncidentFilters,
  ResolveIncidentInput,
  UpdateIncidentInput,
} from '../domain/entities/incident'
import { ValidationError } from '../domain/errors'
import type { IncidentDetail, IncidentService } from '../services/incident-service'

function toIncidentDto(incident: Incident) {
  const imageUrls: string[] = []
  for (let i = 0; i < incident.imageCount; i++) {
    imageUrls.push(`/api/v1/incidents/${incident.id}/image/${i}`)
  }
  return {
    id: incident.id,
    incidentCode: incident.incidentCode,
    rawDescription: incident.rawDescription,
    title: incident.title,
    summary: incident.summary,
    category: incident.category,
    location: incident.location,
    reporterName: incident.reporterName,
    confirmedPriority: incident.confirmedPriority,
    priorityReason: incident.priorityReason,
    status: incident.status,
    assigneeName: incident.assigneeName,
    imageCount: incident.imageCount,
    imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined,
    actionTaken: incident.actionTaken,
    resolutionResult: incident.resolutionResult,
    resolutionNote: incident.resolutionNote,
    closureSummary: incident.closureSummary,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
    resolvedAt: incident.resolvedAt,
  }
}

interface ImageDto {
  id: string
  sortOrder: number
  url: string
}

function toDetailDto(detail: IncidentDetail, incidentId: string) {
  return {
    incident: toIncidentDto(detail.incident),
    timeline: detail.timeline,
    images: detail.images.map(img => ({
      id: img.id,
      sortOrder: img.sortOrder,
      url: `/api/v1/incidents/${incidentId}/image/${img.sortOrder}`,
    })),
  }
}

export class IncidentHandler {
  constructor(private readonly incidentService: IncidentService) {}

  list = async (c: Context) => {
    const filters: IncidentFilters = {
      status: c.req.query('status') as IncidentFilters['status'],
      priority: c.req.query('priority') as IncidentFilters['priority'],
      category: c.req.query('category') as IncidentFilters['category'],
      search: c.req.query('search'),
    }
    const incidents = await this.incidentService.listIncidents(filters)
    return c.json({ data: incidents.map(toIncidentDto) })
  }

  get = async (c: Context) => {
    const id = this.param(c, 'id')
    const detail = await this.incidentService.getIncident(id)
    return c.json({ data: toDetailDto(detail, id) })
  }

  lookupByCode = async (c: Context) => {
    const code = c.req.param('code')
    if (!code) throw new ValidationError('Incident code is required')
    const detail = await this.incidentService.findByIdOrCode(code)
    return c.json({ data: toDetailDto(detail, detail.incident.id) })
  }

  create = async (c: Context) => {
    const body = await this.parseJson<CreateIncidentInput>(c)
    const detail = await this.incidentService.createIncident(body)
    return c.json({ data: toDetailDto(detail, detail.incident.id) }, 201)
  }

  update = async (c: Context) => {
    const body = await this.parseJson<UpdateIncidentInput>(c)
    const id = this.param(c, 'id')
    const detail = await this.incidentService.updateIncident(id, body)
    return c.json({ data: toDetailDto(detail, id) })
  }

  changeStatus = async (c: Context) => {
    const body = await this.parseJson<ChangeIncidentStatusInput>(c)
    const id = this.param(c, 'id')
    const detail = await this.incidentService.changeStatus(id, body)
    return c.json({ data: toDetailDto(detail, id) })
  }

  addProgress = async (c: Context) => {
    const body = await this.parseJson<AddProgressInput>(c)
    const id = this.param(c, 'id')
    const detail = await this.incidentService.addProgress(id, body)
    return c.json({ data: toDetailDto(detail, id) })
  }

  resolve = async (c: Context) => {
    const body = await this.parseJson<ResolveIncidentInput>(c)
    const id = this.param(c, 'id')
    const detail = await this.incidentService.resolveIncident(id, body)
    return c.json({ data: toDetailDto(detail, id) })
  }

  image = async (c: Context) => {
    const id = this.param(c, 'id')
    const image = await this.incidentService.getIncidentImage(id)
    return this.serveImage(image.data)
  }

  imageByIndex = async (c: Context) => {
    const id = this.param(c, 'id')
    const index = parseInt(String(c.req.param('index') ?? ''), 10)
    if (isNaN(index) || index < 0) throw new ValidationError('Invalid image index')
    const image = await this.incidentService.getIncidentImageByIndex(id, index)
    return this.serveImage(image.data)
  }

  private serveImage(dataUrl: string): Response {
    const base64Match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
    if (!base64Match) return new Response('Not found', { status: 404 })
    const mimeType = base64Match[1] ?? ''
    const b64 = base64Match[2] ?? ''
    if (!mimeType || !b64) return new Response('Not found', { status: 404 })
    const binaryStr = atob(b64)
    const bytes = Uint8Array.from(binaryStr, ch => ch.charCodeAt(0))
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  private param(c: Context, name: string): string {
    const value = c.req.param(name)
    if (!value) throw new ValidationError(`${name} param is required`)
    return value
  }

  private async parseJson<T>(c: Context): Promise<T> {
    try {
      return await c.req.json<T>()
    }
    catch {
      throw new ValidationError('Invalid JSON body')
    }
  }
}
