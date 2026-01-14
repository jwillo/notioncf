interface Env {
  DB: D1Database;
}

// DELETE /api/tags/:id - Delete a tag
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const tagId = context.params.id as string;

  await context.env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(tagId).run();

  return Response.json({ success: true });
};

// PUT /api/tags/:id - Update a tag
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const tagId = context.params.id as string;
  const body = await context.request.json<{ name?: string; color?: string }>();

  const updates: string[] = [];
  const values: string[] = [];

  if (body.name) {
    updates.push('name = ?');
    values.push(body.name.trim());
  }
  if (body.color) {
    updates.push('color = ?');
    values.push(body.color);
  }

  if (updates.length === 0) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'No updates provided' } },
      { status: 400 }
    );
  }

  values.push(tagId);

  await context.env.DB.prepare(`
    UPDATE tags SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();

  return Response.json({ success: true });
};

// GET /api/tags/:id/pages - Get pages with this tag
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const tagId = context.params.id as string;

  const result = await context.env.DB.prepare(`
    SELECT p.id, p.title, p.icon, p.updated_at
    FROM pages p
    INNER JOIN page_tags pt ON p.id = pt.page_id
    WHERE pt.tag_id = ? AND p.is_deleted = 0
    ORDER BY p.updated_at DESC
  `).bind(tagId).all();

  const pages = result.results.map((p: Record<string, unknown>) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    updatedAt: p.updated_at,
  }));

  return Response.json({ pages });
};
