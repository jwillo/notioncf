interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;

  const pageResult = await context.env.DB.prepare(
    'SELECT * FROM pages WHERE id = ? AND is_deleted = 0'
  ).bind(id).first();

  if (!pageResult) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Page not found' } },
      { status: 404 }
    );
  }

  const blocksResult = await context.env.DB.prepare(
    'SELECT * FROM blocks WHERE page_id = ? ORDER BY position'
  ).bind(id).all();

  return Response.json({
    page: {
      id: pageResult.id,
      title: pageResult.title,
      parentId: pageResult.parent_id,
      icon: pageResult.icon,
      createdBy: pageResult.created_by,
      createdAt: pageResult.created_at,
      updatedAt: pageResult.updated_at,
    },
    blocks: (blocksResult.results || []).map((b: Record<string, unknown>) => ({
      id: b.id,
      pageId: b.page_id,
      type: b.type,
      content: JSON.parse(b.content as string || '{}'),
      position: b.position,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    })),
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;
  const body = await context.request.json<{
    title?: string;
    parentId?: string | null;
    icon?: string | null;
  }>();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    values.push(body.title);
  }
  if (body.parentId !== undefined) {
    updates.push('parent_id = ?');
    values.push(body.parentId);
  }
  if (body.icon !== undefined) {
    updates.push('icon = ?');
    values.push(body.icon);
  }

  if (updates.length === 0) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
      { status: 400 }
    );
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await context.env.DB.prepare(
    `UPDATE pages SET ${updates.join(', ')} WHERE id = ? AND is_deleted = 0`
  ).bind(...values).run();

  return Response.json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;

  await context.env.DB.prepare(`
    UPDATE pages 
    SET is_deleted = 1, deleted_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(id).run();

  return Response.json({ success: true });
};
