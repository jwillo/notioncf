interface Env {
  DB: D1Database;
}

interface SearchResult {
  id: string;
  type: 'page' | 'database';
  title: string;
  snippet: string;
  icon: string | null;
  updatedAt: string;
}

// GET /api/search?q=query
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return Response.json({ results: [] });
  }

  const searchPattern = `%${query}%`;

  // Search pages (title and block content)
  const pagesResult = await context.env.DB.prepare(`
    SELECT DISTINCT 
      p.id,
      'page' as type,
      p.title,
      p.icon,
      p.updated_at,
      COALESCE(
        (SELECT substr(json_extract(b.content, '$.text'), 1, 100) 
         FROM blocks b 
         WHERE b.page_id = p.id 
         AND (json_extract(b.content, '$.text') LIKE ? OR json_extract(b.content, '$.html') LIKE ?)
         LIMIT 1),
        ''
      ) as snippet
    FROM pages p
    LEFT JOIN blocks b ON b.page_id = p.id
    WHERE p.is_deleted = 0
    AND (
      p.title LIKE ?
      OR json_extract(b.content, '$.text') LIKE ?
      OR json_extract(b.content, '$.html') LIKE ?
    )
    ORDER BY p.updated_at DESC
    LIMIT 20
  `).bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern).all();

  // Search databases
  const databasesResult = await context.env.DB.prepare(`
    SELECT 
      id,
      'database' as type,
      title,
      NULL as icon,
      updated_at,
      '' as snippet
    FROM databases
    WHERE title LIKE ?
    ORDER BY updated_at DESC
    LIMIT 10
  `).bind(searchPattern).all();

  const results: SearchResult[] = [
    ...pagesResult.results.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      type: 'page' as const,
      title: r.title as string,
      snippet: r.snippet as string,
      icon: r.icon as string | null,
      updatedAt: r.updated_at as string,
    })),
    ...databasesResult.results.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      type: 'database' as const,
      title: r.title as string,
      snippet: '',
      icon: null,
      updatedAt: r.updated_at as string,
    })),
  ];

  // Sort by updated_at
  results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return Response.json({ results: results.slice(0, 20) });
};
