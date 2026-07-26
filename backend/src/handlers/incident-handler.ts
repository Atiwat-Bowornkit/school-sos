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
  const { imageKey: _imageKey, imageMimeType: _imageMimeType, ...dto } = incident
  return {
    ...dto,
    imageUrl: imageKeyUrl(incident),
  }
}

function imageKeyUrl(incident: Incident): string | undefined {
  return incident.imageKey ? `/api/v1/incidents/${incident.id}/image` : undefined
}

function toDetailDto(detail: IncidentDetail) {
  return {
    incident: toIncidentDto(detail.incident),
    timeline: detail.timeline,
  }
}

export class IncidentHandler {
  constructor(private readonly incidentService: IncidentService) {}

  list = async (c: Context) => {
    const filters: IncidentFilters = {
      status: c.req.query('status') as IncidentFilters['status'],
      priority: c.req.query('priority') as IncidentFilters['priority'],
    }
    const incidents = await this.incidentService.listIncidents(filters)
    return c.json({ data: incidents.map(toIncidentDto) })
  }

  get = async (c: Context) => {
    const detail = await this.incidentService.getIncident(this.param(c, 'id'))
    return c.json({ data: toDetailDto(detail) })
  }

  create = async (c: Context) => {
    const body = await this.parseJson<CreateIncidentInput>(c)
    const detail = await this.incidentService.createIncident(body)
    return c.json({ data: toDetailDto(detail) }, 201)
  }

  update = async (c: Context) => {
    const body = await this.parseJson<UpdateIncidentInput>(c)
    const detail = await this.incidentService.updateIncident(this.param(c, 'id'), body)
    return c.json({ data: toDetailDto(detail) })
  }

  changeStatus = async (c: Context) => {
    const body = await this.parseJson<ChangeIncidentStatusInput>(c)
    const detail = await this.incidentService.changeStatus(this.param(c, 'id'), body)
    return c.json({ data: toDetailDto(detail) })
  }

  addProgress = async (c: Context) => {
    const body = await this.parseJson<AddProgressInput>(c)
    const detail = await this.incidentService.addProgress(this.param(c, 'id'), body)
    return c.json({ data: toDetailDto(detail) })
  }

  resolve = async (c: Context) => {
    const body = await this.parseJson<ResolveIncidentInput>(c)
    const detail = await this.incidentService.resolveIncident(this.param(c, 'id'), body)
    return c.json({ data: toDetailDto(detail) })
  }

  image = async (c: Context) => {
    const image = await this.incidentService.getIncidentImage(this.param(c, 'id'))
    return new Response(new Uint8Array(image.data), {
      status: 200,
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': image.data.byteLength.toString(),
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
