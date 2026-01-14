interface Env {
  DB: D1Database;
}

interface BlockInput {
  id: string;
  type: string;
  content: Record<string, unknown>;
  position: number;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const pageId = context.params.id as string;
  const body = await context.request.json<{ blocks: BlockInput[] }>();
  const user = context.data.user as { id: string };

  if (!body.blocks || !Array.isArray(body.blocks)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'blocks array required' } },
      { status: 400 }
    );
  }

  // Get current page title for version snapshot
  const pageResult = await context.env.DB.prepare(
    'SELECT title FROM pages WHERE id = ?'
  ).bind(pageId).first<{ title: string }>();

  // Get current version number
  const versionResult = await context.env.DB.prepare(
    'SELECT MAX(version_number) as max_version FROM page_versions WHERE page_id = ?'
  ).bind(pageId).first<{ max_version: number | null }>();
  
  const nextVersion = (versionResult?.max_version || 0) + 1;

  // Create version snapshot before updating
  const versionId = crypto.randomUUID();
  await context.env.DB.prepare(`
    INSERT INTO page_versions (id, page_id, title, blocks_snapshot, created_by, version_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    versionId,
    pageId,
    pageResult?.title || 'Untitled',
    JSON.stringify(body.blocks),
    user.id,
    nextVersion
  ).run();

  // Delete existing blocks and insert new ones (simple replace strategy for MVP)
  await context.env.DB.prepare('DELETE FROM blocks WHERE page_id = ?').bind(pageId).run();

  for (const block of body.blocks) {
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

  return Response.json({ success: true, updatedAt: new Date().toISOString() });
};
