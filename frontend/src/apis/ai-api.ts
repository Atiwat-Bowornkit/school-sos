import { BACKEND_URL } from './incident-api'
import { request } from './request'
import type { AnalyzeIncidentBody, AnalyzeIncidentResponse } from '@/models'

const BASE = `${BACKEND_URL}/api/v1/ai`

export const aiApi = {
  analyzeIncident: (body: AnalyzeIncidentBody) => request<AnalyzeIncidentResponse>(
    `${BASE}/incidents/analyze`,
    { method: 'POST', body: JSON.stringify(body) },
    15_000,
  ),
}
