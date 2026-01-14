interface Env {
  FILES: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const formData = await context.request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
      { status: 400 }
    );
  }

  // Validate file type (images only)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Only image files are allowed' } },
      { status: 400 }
    );
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'File size must be less than 10MB' } },
      { status: 400 }
    );
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'png';
  const key = `images/${crypto.randomUUID()}.${ext}`;

  // Upload to R2
  await context.env.FILES.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Return the URL (using the R2 public URL pattern)
  // For Cloudflare Pages, we'll serve via our own endpoint
  const url = `/api/files/${key}`;

  return Response.json({
    url,
    key,
    filename: file.name,
    size: file.size,
    type: file.type,
  });
};
