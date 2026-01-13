interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  FILES: R2Bucket;
}

interface UserData {
  id: string;
  email: string;
  name: string;
}

async function upsertUser(db: D1Database, user: UserData): Promise<void> {
  await db.prepare(`
    INSERT INTO users (id, email, name, created_at, last_seen_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      last_seen_at = datetime('now'),
      name = excluded.name
  `).bind(user.id, user.email, user.name).run();
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const jwt = context.request.headers.get('CF-Access-JWT-Assertion');
  
  if (!jwt) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing Access token' } },
      { status: 401 }
    );
  }

  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    const user: UserData = {
      id: payload.sub,
      email: payload.email,
      name: payload.email?.split('@')[0] || 'User',
    };

    context.data.user = user;
    await upsertUser(context.env.DB, user);

    return context.next();
  } catch {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid Access token' } },
      { status: 401 }
    );
  }
};
