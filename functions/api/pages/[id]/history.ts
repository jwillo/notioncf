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

// GET /api/pages/:id/history - List all versions
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const pageId = context.params.id as string;

  const result = await context.env.DB.prepare(`
    SELECT pv.*, u.name as author_name, u.email as author_email
    FROM page_versions pv
    LEFT JOIN users u ON pv.created_by = u.id
    WHERE pv.page_id = ?
    ORDER BY pv.version_number DESC
    LIMIT 50
  `).bind(pageId).all<PageVersion & { author_name: string; author_email: string }>();

  const versions = result.results.map((v) => ({
    id: v.id,
    pageId: v.page_id,
    title: v.title,
    versionNumber: v.version_number,
    createdAt: v.created_at,
    createdBy: {
      id: v.created_by,
      name: v.author_name,
      email: v.author_email,
    },
  }));

  return Response.json({ versions });
};
