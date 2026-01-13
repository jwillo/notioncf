interface Env {
  DB: D1Database;
}

interface DatabaseRow {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const databases = await env.DB.prepare(
      `SELECT id, title, created_by, created_at, updated_at
       FROM databases
       ORDER BY created_at DESC`
    ).all<DatabaseRow>();

    return Response.json({ databases: databases.results });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to fetch databases' } },
      { status: 500 }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request, data } = context;
  const user = (data as { user?: { id: string } }).user;

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as { title?: string };
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO databases (id, title, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(id, body.title || 'Untitled Database', user.id, now, now).run();

    // Create default "Name" column
    const colId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO database_columns (id, database_id, name, type, position, config)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(colId, id, 'Name', 'text', 0, '{}').run();

    return Response.json({
      id,
      title: body.title || 'Untitled Database',
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to create database' } },
      { status: 500 }
    );
  }
};
