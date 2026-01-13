interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const databaseId = params.id as string;

  try {
    const body = await request.json() as {
      name?: string;
      type?: string;
      config?: Record<string, unknown>;
    };

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Get max position
    const maxPos = await env.DB.prepare(
      `SELECT MAX(position) as max FROM database_columns WHERE database_id = ?`
    ).bind(databaseId).first<{ max: number | null }>();

    const position = (maxPos?.max ?? -1) + 1;

    await env.DB.prepare(
      `INSERT INTO database_columns (id, database_id, name, type, position, config)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      databaseId,
      body.name || 'New Column',
      body.type || 'text',
      position,
      JSON.stringify(body.config || {})
    ).run();

    // Update database updated_at
    await env.DB.prepare(
      `UPDATE databases SET updated_at = ? WHERE id = ?`
    ).bind(now, databaseId).run();

    return Response.json({
      id,
      databaseId,
      name: body.name || 'New Column',
      type: body.type || 'text',
      position,
      config: body.config || {},
    });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to create column' } },
      { status: 500 }
    );
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const databaseId = params.id as string;

  try {
    const body = await request.json() as {
      columns: Array<{
        id: string;
        name?: string;
        type?: string;
        position?: number;
        config?: Record<string, unknown>;
      }>;
    };

    const now = new Date().toISOString();

    const statements = body.columns.map((col) =>
      env.DB.prepare(
        `UPDATE database_columns 
         SET name = COALESCE(?, name),
             type = COALESCE(?, type),
             position = COALESCE(?, position),
             config = COALESCE(?, config)
         WHERE id = ? AND database_id = ?`
      ).bind(
        col.name ?? null,
        col.type ?? null,
        col.position ?? null,
        col.config ? JSON.stringify(col.config) : null,
        col.id,
        databaseId
      )
    );

    statements.push(
      env.DB.prepare(`UPDATE databases SET updated_at = ? WHERE id = ?`).bind(now, databaseId)
    );

    await env.DB.batch(statements);

    return Response.json({ success: true, updatedAt: now });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to update columns' } },
      { status: 500 }
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const databaseId = params.id as string;

  try {
    const body = await request.json() as { columnId: string };
    const now = new Date().toISOString();

    await env.DB.batch([
      env.DB.prepare(`DELETE FROM database_columns WHERE id = ? AND database_id = ?`)
        .bind(body.columnId, databaseId),
      env.DB.prepare(`UPDATE databases SET updated_at = ? WHERE id = ?`)
        .bind(now, databaseId),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to delete column' } },
      { status: 500 }
    );
  }
};
