interface Env {
  FILES: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const path = (context.params.path as string[]).join('/');

  const object = await context.env.FILES.get(path);

  if (!object) {
    return new Response('File not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

  return new Response(object.body, { headers });
};
