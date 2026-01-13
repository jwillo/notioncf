interface Env {
  DB: D1Database;
}

interface PageRow {
  id: string;
  title: string;
  parent_id: string | null;
  icon: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  deleted_at: string | null;
}

interface PageTree {
  id: string;
  title: string;
  parentId: string | null;
  icon: string | null;
  children: PageTree[];
}

function buildTree(pages: PageRow[]): PageTree[] {
  const map = new Map<string, PageTree>();
  const roots: PageTree[] = [];

  for (const page of pages) {
    map.set(page.id, {
      id: page.id,
      title: page.title,
      parentId: page.parent_id,
      icon: page.icon,
      children: [],
    });
  }

  for (const page of pages) {
    const node = map.get(page.id)!;
    if (page.parent_id && map.has(page.parent_id)) {
      map.get(page.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const result = await context.env.DB.prepare(
    'SELECT * FROM pages WHERE is_deleted = 0 ORDER BY created_at'
  ).all<PageRow>();

  return Response.json({ pages: buildTree(result.results || []) });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{
    title?: string;
    parentId?: string | null;
    icon?: string | null;
  }>();

  const id = crypto.randomUUID();
  const user = context.data.user as { id: string };
  const title = body.title || 'Untitled';
  const parentId = body.parentId || null;
  const icon = body.icon || null;

  await context.env.DB.prepare(`
    INSERT INTO pages (id, title, parent_id, icon, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, title, parentId, icon, user.id).run();

  return Response.json(
    { id, title, parentId, icon, createdBy: user.id },
    { status: 201 }
  );
};
