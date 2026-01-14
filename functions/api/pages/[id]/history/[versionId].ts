interface Env {
  DB: D1Database;
}

interface PageVersion {
  id: string;
  page_id: string;
  title: string;
  blocks_snapshot: string;
  created_by: string;
  created_at: string;
  version_number: number;
}

// GET /api/pages/:id/history/:versionId - Get a specific version
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const pageId = context.params.id as string;
  const versionId = context.params.versionId as string;

  const version = await context.env.DB.prepare(`
    SELECT pv.*, u.name as author_name, u.email as author_email
    FROM page_versions pv
    LEFT JOIN users u ON pv.created_by = u.id
    WHERE pv.id = ? AND pv.page_id = ?
  `).bind(versionId, pageId).first<PageVersion & { author_name: string; author_email: string }>();

  if (!version) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Version not found' } },
      { status: 404 }
    );
  }

  return Response.json({
    id: version.id,
    pageId: version.page_id,
    title: version.title,
    blocks: JSON.parse(version.blocks_snapshot),
    versionNumber: version.version_number,
    createdAt: version.created_at,
    createdBy: {
      id: version.created_by,
      name: version.author_name,
      email: version.author_email,
    },
  });
};

// POST /api/pages/:id/history/:versionId/restore - Restore a version
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const pageId = context.params.id as string;
  const versionId = context.params.versionId as string;
  const user = context.data.user as { id: string };

  // Get the version to restore
  const version = await context.env.DB.prepare(`
    SELECT * FROM page_versions WHERE id = ? AND page_id = ?
  `).bind(versionId, pageId).first<PageVersion>();

  if (!version) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Version not found' } },
      { status: 404 }
    );
  }

  const blocks = JSON.parse(version.blocks_snapshot);

  // Get current version number for new snapshot
  const versionResult = await context.env.DB.prepare(
    'SELECT MAX(version_number) as max_version FROM page_versions WHERE page_id = ?'
  ).bind(pageId).first<{ max_version: number | null }>();
  
  const nextVersion = (versionResult?.max_version || 0) + 1;

  // Create a new version snapshot (restore creates a new version)
  const newVersionId = crypto.randomUUID();
  await context.env.DB.prepare(`
    INSERT INTO page_versions (id, page_id, title, blocks_snapshot, created_by, version_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    newVersionId,
    pageId,
    version.title,
    version.blocks_snapshot,
    user.id,
    nextVersion
  ).run();

  // Delete existing blocks and restore from version
  await context.env.DB.prepare('DELETE FROM blocks WHERE page_id = ?').bind(pageId).run();

  for (const block of blocks) {
    await context.env.DB.prepare(`
      INSERT INTO blocks (id, page_id, type, content, position)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      block.id,
      pageId,
      block.type,
      JSON.stringify(block.content),
      block.position
    ).run();
  }

  // Update page timestamp
  await context.env.DB.prepare(
    "UPDATE pages SET updated_at = datetime('now') WHERE id = ?"
  ).bind(pageId).run();

  return Response.json({ 
    success: true, 
    restoredVersion: version.version_number,
    newVersion: nextVersion,
    updatedAt: new Date().toISOString() 
  });
};
