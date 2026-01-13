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

interface ColumnRow {
  id: string;
  database_id: string;
  name: string;
  type: string;
  position: number;
  config: string;
}

interface DataRow {
  id: string;
  database_id: string;
  data: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = params.id as string;

  try {
    const database = await env.DB.prepare(
      `SELECT id, title, created_by, created_at, updated_at
       FROM databases WHERE id = ?`
    ).bind(id).first<DatabaseRow>();

    if (!database) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Database not found' } },
        { status: 404 }
      );
    }

    const columns = await env.DB.prepare(
      `SELECT id, database_id, name, type, position, config
       FROM database_columns WHERE database_id = ?
       ORDER BY position ASC`
    ).bind(id).all<ColumnRow>();

    const rows = await env.DB.prepare(
      `SELECT id, database_id, data, created_by, created_at, updated_at
       FROM database_rows WHERE database_id = ?
       ORDER BY created_at ASC`
    ).bind(id).all<DataRow>();

    return Response.json({
      database: {
        id: database.id,
        title: database.title,
        createdBy: database.created_by,
        createdAt: database.created_at,
        updatedAt: database.updated_at,
      },
      columns: columns.results.map((col) => ({
        id: col.id,
        databaseId: col.database_id,
        name: col.name,
        type: col.type,
        position: col.position,
        config: JSON.parse(col.config || '{}'),
      })),
      rows: rows.results.map((row) => ({
        id: row.id,
        databaseId: row.database_id,
        data: JSON.parse(row.data || '{}'),
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to fetch database' } },
      { status: 500 }
    );
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const id = params.id as string;

  try {
    const body = await request.json() as { title?: string };
    const now = new Date().toISOString();

    await env.DB.prepare(
      `UPDATE databases SET title = ?, updated_at = ? WHERE id = ?`
    ).bind(body.title, now, id).run();

    return Response.json({ success: true, updatedAt: now });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to update database' } },
      { status: 500 }
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = params.id as string;

  try {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM database_rows WHERE database_id = ?`).bind(id),
      env.DB.prepare(`DELETE FROM database_columns WHERE database_id = ?`).bind(id),
      env.DB.prepare(`DELETE FROM databases WHERE id = ?`).bind(id),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to delete database' } },
      { status: 500 }
    );
  }
};
