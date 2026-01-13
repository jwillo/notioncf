interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, params, request, data } = context;
  const databaseId = params.id as string;
  const user = (data as { user?: { id: string } }).user;

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as { data?: Record<string, unknown> };
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO database_rows (id, database_id, data, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, databaseId, JSON.stringify(body.data || {}), user.id, now, now).run();

    // Update database updated_at
    await env.DB.prepare(
      `UPDATE databases SET updated_at = ? WHERE id = ?`
    ).bind(now, databaseId).run();

    return Response.json({
      id,
      databaseId,
      data: body.data || {},
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to create row' } },
      { status: 500 }
    );
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const databaseId = params.id as string;

  try {
    const body = await request.json() as {
      rowId: string;
      data: Record<string, unknown>;
    };

    const now = new Date().toISOString();

    await env.DB.batch([
      env.DB.prepare(
        `UPDATE database_rows SET data = ?, updated_at = ? WHERE id = ? AND database_id = ?`
      ).bind(JSON.stringify(body.data), now, body.rowId, databaseId),
      env.DB.prepare(`UPDATE databases SET updated_at = ? WHERE id = ?`).bind(now, databaseId),
    ]);

    return Response.json({ success: true, updatedAt: now });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to update row' } },
      { status: 500 }
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const databaseId = params.id as string;

  try {
    const body = await request.json() as { rowId: string };
    const now = new Date().toISOString();

    await env.DB.batch([
      env.DB.prepare(`DELETE FROM database_rows WHERE id = ? AND database_id = ?`)
        .bind(body.rowId, databaseId),
      env.DB.prepare(`UPDATE databases SET updated_at = ? WHERE id = ?`)
        .bind(now, databaseId),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to delete row' } },
      { status: 500 }
    );
  }
};
