/**
 * API Route: /api/upload
 *
 * POST — Upload an image to Supabase Storage.
 *
 * Security layers:
 * 1. Rate limited (3 req/min per IP)
 * 2. File type validation (images only)
 * 3. File size validation (max 5MB)
 * 4. Server-side upload via admin client (service_role)
 *
 * The frontend no longer uploads directly to Supabase Storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../src/lib/supabaseAdmin';
import { rateLimitResponse, RATE_LIMITS } from '../../../src/lib/rateLimit';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  // 1. Rate limit check
  const limited = rateLimitResponse(request, RATE_LIMITS.UPLOAD);
  if (limited) return limited;

  try {
    // 2. Parse the multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Invalid form data. Send a multipart/form-data request with a "file" field.' },
        { status: 400 }
      );
    }

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Include a "file" field in the form data.' },
        { status: 400 }
      );
    }

    // 3. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 5MB` },
        { status: 400 }
      );
    }

    // 5. Generate a safe filename (random + original extension)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? ext : 'jpg';
    const fileName = `${crypto.randomUUID()}.${safeExt}`;
    const filePath = `public/${fileName}`;

    // 6. Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. Upload via admin client (bypasses storage RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('business-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[POST /api/upload] Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // 8. Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('business-images')
      .getPublicUrl(filePath);

    return NextResponse.json(
      { url: urlData.publicUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/upload] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
