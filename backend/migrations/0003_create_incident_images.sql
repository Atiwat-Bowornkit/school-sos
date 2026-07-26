-- Migration number: 0003 — Multi-image support
-- Add image_count column to incidents
ALTER TABLE incidents ADD COLUMN image_count INTEGER NOT NULL DEFAULT 0;

-- Create incident_images table for up to 5 images per incident
CREATE TABLE IF NOT EXISTS incident_images (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    image_data TEXT NOT NULL,
    image_mime_type TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_incident_images_incident_id ON incident_images (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_images_sort_order ON incident_images (incident_id, sort_order);

-- Migrate existing single images from incidents table to incident_images
INSERT OR IGNORE INTO incident_images (id, incident_id, image_data, image_mime_type, sort_order, created_at)
SELECT
    hex(randomblob(16)) as id,
    id as incident_id,
    image_data,
    image_mime_type,
    0 as sort_order,
    created_at
FROM incidents
WHERE image_data IS NOT NULL;

-- Update image_count for incidents that had images
UPDATE incidents SET image_count = 1 WHERE image_data IS NOT NULL;
