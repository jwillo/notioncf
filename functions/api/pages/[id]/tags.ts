interface Env {
  DB: D1Database;
}

// GET /api/pages/:id/tags - Get tags for a page
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const pageId = context.params.id as string;

  const result = await context.env.DB.prepare(`
    SELECT t.id, t.name, t.color
    FROM tags t
    INNER JOIN page_tags pt ON t.id = pt.tag_id
    WHERE pt.page_id = ?
    ORDER BY t.name ASC
  `).bind(pageId).all();

  return Response.json({ tags: result.results });
};

// POST /api/pages/:id/tags - Add a tag to a page
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const pageId = context.params.id as string;
  const body = await context.request.json<{ tagId: string }>();

  if (!body.tagId) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'tagId is required' } },
      { status: 400 }
    );
  }

  try {
    await context.env.DB.prepare(`
      INSERT INTO page_tags (page_id, tag_id)
      VALUES (?, ?)
    `).bind(pageId, body.tagId).run();

    return Response.json({ success: true });
  } catch {
    // Already tagged
    return Response.json({ success: true });
  }
};

// DELETE /api/pages/:id/tags - Remove a tag from a page
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const pageId = context.params.id as string;
  const body = await context.request.json<{ tagId: string }>();

  if (!body.tagId) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'tagId is required' } },
      { status: 400 }
    );
  }

  await context.env.DB.prepare(`
    DELETE FROM page_tags WHERE page_id = ? AND tag_id = ?
  `).bind(pageId, body.tagId).run();

  return Response.json({ success: true });
};
