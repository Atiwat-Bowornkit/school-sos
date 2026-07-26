-- Migration number: 0001
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    incident_code TEXT NOT NULL UNIQUE,
    raw_description TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    reporter_name TEXT,
    suggested_priority TEXT NOT NULL,
    confirmed_priority TEXT NOT NULL,
    priority_reason TEXT NOT NULL,
    status TEXT NOT NULL,
    assignee_name TEXT,
    follow_up_question TEXT,
    follow_up_answer TEXT,
    image_key TEXT,
    image_mime_type TEXT,
    action_taken TEXT,
    resolution_result TEXT,
    resolution_note TEXT,
    closure_summary TEXT,
    ai_analysis_source TEXT NOT NULL DEFAULT 'fallback',
    ai_closure_source TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    resolved_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_incidents_code ON incidents (incident_code);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents (confirmed_priority);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at);

CREATE TABLE IF NOT EXISTS incident_timeline (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    actor_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_timeline_incident_id ON incident_timeline (incident_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON incident_timeline (created_at);
