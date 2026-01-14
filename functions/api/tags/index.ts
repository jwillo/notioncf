interface Env {
  DB: D1Database;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  page_count?: number;
}

// GET /api/tags - List all tags with page counts
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const result = await context.env.DB.prepare(`
    SELECT t.*, COUNT(pt.page_id) as page_count
    FROM tags t
    LEFT JOIN page_tags pt ON t.id = pt.tag_id
    GROUP BY t.id
    ORDER BY t.name ASC
  `).all<Tag>();

  const tags = result.results.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    pageCount: t.page_count || 0,
    createdAt: t.created_at,
  }));

  return Response.json({ tags });
};

// POST /api/tags - Create a new tag
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{ name: string; color?: string }>();

  if (!body.name?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Tag name is required' } },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const color = body.color || '#6b7280';

  try {
    await context.env.DB.prepare(`
      INSERT INTO tags (id, name, color)
      VALUES (?, ?, ?)
    `).bind(id, body.name.trim(), color).run();

    return Response.json({
      id,
      name: body.name.trim(),
      color,
      pageCount: 0,
    });
  } catch (err) {
    // Likely duplicate name
    return Response.json(
      { error: { code: 'DUPLICATE', message: 'Tag already exists' } },
      { status: 409 }
    );
  }
};
