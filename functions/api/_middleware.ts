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
  // Check for Cloudflare Access JWT first
  const jwt = context.request.headers.get('CF-Access-JWT-Assertion');
  
  let user: UserData;

  if (jwt) {
    // Use Cloudflare Access identity
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      user = {
        id: payload.sub,
        email: payload.email,
        name: payload.email?.split('@')[0] || 'User',
      };
    } catch {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid Access token' } },
        { status: 401 }
      );
    }
  } else {
    // Development mode: use a default user
    // In production, you should enable Cloudflare Access or another auth provider
    user = {
      id: 'dev-user-001',
      email: 'dev@localhost',
      name: 'Developer',
    };
  }

  context.data.user = user;
  await upsertUser(context.env.DB, user);

  return context.next();
};
