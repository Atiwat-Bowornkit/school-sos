import type {
  Incident,
  IncidentCategory,
  IncidentFilters,
  IncidentPriority,
  IncidentStatus,
} from '../../domain/entities/incident'
import type { IncidentRepository, IncidentResolution } from '../../domain/repositories/incident-repository'

interface IncidentRow {
  id: string
  incident_code: string
  raw_description: string
  title: string
  summary: string
  category: IncidentCategory
  location: string
  reporter_name: string | null
  confirmed_priority: IncidentPriority
  priority_reason: string
  status: IncidentStatus
  assignee_name: string | null
  image_count: number | null
  action_taken: string | null
  resolution_result: string | null
  resolution_note: string | null
  closure_summary: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

const SELECT_COLUMNS = `
  id, incident_code, raw_description, title, summary, category, location, reporter_name,
  confirmed_priority, priority_reason, status, assignee_name,
  image_count, action_taken,
  resolution_result, resolution_note, closure_summary,
  created_at, updated_at, resolved_at
`

function toIncident(row: IncidentRow): Incident {
  return {
    id: row.id,
    incidentCode: row.incident_code,
    rawDescription: row.raw_description,
    title: row.title,
    summary: row.summary,
    category: row.category,
    location: row.location,
    reporterName: row.reporter_name ?? undefined,
    confirmedPriority: row.confirmed_priority,
    priorityReason: row.priority_reason,
    status: row.status,
    assigneeName: row.assignee_name ?? undefined,
    imageCount: row.image_count ?? 0,
    actionTaken: row.action_taken ?? undefined,
    resolutionResult: row.resolution_result ?? undefined,
    resolutionNote: row.resolution_note ?? undefined,
    closureSummary: row.closure_summary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at ?? undefined,
  }
}

export class D1IncidentRepository implements IncidentRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(filters: IncidentFilters = {}): Promise<Incident[]> {
    const clauses: string[] = []
    const values: string[] = []
    if (filters.status) {
      clauses.push('status = ?')
      values.push(filters.status)
    }
    if (filters.priority) {
      clauses.push('confirmed_priority = ?')
      values.push(filters.priority)
    }
    if (filters.category) {
      clauses.push('category = ?')
      values.push(filters.category)
    }
    if (filters.search) {
      clauses.push('(incident_code LIKE ? OR title LIKE ?)')
      const q = `%${filters.search}%`
      values.push(q, q)
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
    const sql = `
      SELECT ${SELECT_COLUMNS} FROM incidents
      ${where}
      ORDER BY CASE confirmed_priority
        WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4
      END, created_at DESC
    `
    const statement = this.db.prepare(sql)
    const { results } = values.length > 0
      ? await statement.bind(...values).all<IncidentRow>()
      : await statement.all<IncidentRow>()
    return results.map(toIncident)
  }

  async findById(id: string): Promise<Incident | null> {
    const row = await this.db
      .prepare(`SELECT ${SELECT_COLUMNS} FROM incidents WHERE id = ?`)
      .bind(id)
      .first<IncidentRow>()
    return row ? toIncident(row) : null
  }

  async findByCode(code: string): Promise<Incident | null> {
    const row = await this.db
      .prepare(`SELECT ${SELECT_COLUMNS} FROM incidents WHERE incident_code = ?`)
      .bind(code)
      .first<IncidentRow>()
    return row ? toIncident(row) : null
  }

  async create(incident: Incident): Promise<Incident> {
    await this.db.prepare(`
      INSERT INTO incidents (
        id, incident_code, raw_description, title, summary, category, location, reporter_name,
        confirmed_priority, priority_reason, status, assignee_name,
        image_count, action_taken,
        resolution_result, resolution_note, closure_summary,
        created_at, updated_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      incident.id,
      incident.incidentCode,
      incident.rawDescription,
      incident.title,
      incident.summary,
      incident.category,
      incident.location,
      incident.reporterName ?? null,
      incident.confirmedPriority,
      incident.priorityReason,
      incident.status,
      incident.assigneeName ?? null,
      incident.imageCount,
      incident.actionTaken ?? null,
      incident.resolutionResult ?? null,
      incident.resolutionNote ?? null,
      incident.closureSummary ?? null,
      incident.createdAt,
      incident.updatedAt,
      incident.resolvedAt ?? null
    ).run()
    return incident
  }

  async updateAssignment(id: string, assigneeName: string, updatedAt: string): Promise<Incident | null> {
    await this.db.prepare('UPDATE incidents SET assignee_name = ?, updated_at = ? WHERE id = ?')
      .bind(assigneeName, updatedAt, id)
      .run()
    return this.findById(id)
  }

  async updatePriority(id: string, priority: IncidentPriority, updatedAt: string): Promise<Incident | null> {
    await this.db.prepare('UPDATE incidents SET confirmed_priority = ?, updated_at = ? WHERE id = ?')
      .bind(priority, updatedAt, id)
      .run()
    return this.findById(id)
  }

  async updateStatus(id: string, status: IncidentStatus, updatedAt: string): Promise<Incident | null> {
    await this.db.prepare('UPDATE incidents SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, updatedAt, id)
      .run()
    return this.findById(id)
  }

  async addResolution(id: string, resolution: IncidentResolution): Promise<Incident | null> {
    await this.db.prepare(`
      UPDATE incidents
      SET action_taken = ?, resolution_result = ?, resolution_note = ?, closure_summary = ?,
          status = 'RESOLVED', resolved_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      resolution.actionTaken,
      resolution.resolutionResult,
      resolution.resolutionNote ?? null,
      resolution.closureSummary,
      resolution.resolvedAt,
      resolution.updatedAt,
      id
    ).run()
    return this.findById(id)
  }
}
