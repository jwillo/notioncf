-- Page Versions (history/versioning)
CREATE TABLE page_versions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  blocks_snapshot TEXT NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  version_number INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_page_versions_page ON page_versions(page_id, created_at DESC);
CREATE INDEX idx_page_versions_number ON page_versions(page_id, version_number DESC);
