import { request } from './request'
import type {
  AddProgressBody,
  ChangeStatusBody,
  CreateIncidentBody,
  IncidentDetailResponse,
  IncidentFilters,
  IncidentListResponse,
  ResolveIncidentBody,
  UpdateIncidentBody,
} from '@/models'

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787').replace(/\/$/, '')
const BASE = `${BACKEND_URL}/api/v1/incidents`

function queryString(filters?: IncidentFilters): string {
  if (!filters)
    return ''
  const params = new URLSearchParams()
  if (filters.status)
    params.set('status', filters.status)
  if (filters.priority)
    params.set('priority', filters.priority)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const incidentApi = {
  list: (filters?: IncidentFilters) => request<IncidentListResponse>(`${BASE}${queryString(filters)}`),
  get: (id: string) => request<IncidentDetailResponse>(`${BASE}/${id}`),
  create: (body: CreateIncidentBody) => request<IncidentDetailResponse>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  update: (id: string, body: UpdateIncidentBody) => request<IncidentDetailResponse>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  changeStatus: (id: string, body: ChangeStatusBody) => request<IncidentDetailResponse>(`${BASE}/${id}/status`, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  addProgress: (id: string, body: AddProgressBody) => request<IncidentDetailResponse>(`${BASE}/${id}/progress`, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  resolve: (id: string, body: ResolveIncidentBody) => request<IncidentDetailResponse>(`${BASE}/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  imageUrl: (path?: string) => path ? `${BACKEND_URL}${path}` : undefined,
}
