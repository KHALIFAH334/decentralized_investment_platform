/**
 * API Route: /api/businesses
 *
 * POST — Create a new business listing (with validation, rate limiting, sanitization)
 * GET  — Fetch all businesses (rate limited)
 *
 * All writes use the server-side admin Supabase client (service_role key).
 * The anon key in the frontend can only SELECT thanks to RLS policies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../src/lib/supabaseAdmin';
import { rateLimitResponse, RATE_LIMITS } from '../../../src/lib/rateLimit';
import {
  validateBusinessPayload,
  sanitizeBusinessPayload,
} from '../../../src/lib/validation';

import { verifyWalletSignature } from '../../../src/lib/verifySignature';

/**
 * GET /api/businesses
 * Returns all businesses from Supabase.
 * Rate limited: 30 req/min per IP.
 */
export async function GET(request: NextRequest) {
  // Rate limit check
  const limited = await rateLimitResponse(request, RATE_LIMITS.READ);
  if (limited) return limited;

  try {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/businesses] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch businesses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[GET /api/businesses] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/businesses
 * Create a new business listing.
 *
 * Security layers:
 * 1. Rate limited (5 req/min per IP)
 * 2. Input validation (all fields checked)
 * 3. Signature verification (cryptographic proof)
 * 4. Input sanitization (HTML stripped)
 * 5. Parameterized query (Supabase SDK)
 * 6. Server-side only (service_role key)
 */
export async function POST(request: NextRequest) {
  // 1. Rate limit check
  const limited = await rateLimitResponse(request, RATE_LIMITS.WRITE);
  if (limited) return limited;

  try {
    // 2. Parse body
    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Extract signature fields
    const { signature, message, ...payload } = body;

    if (!signature || !message || typeof signature !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid signature parameters' },
        { status: 401 }
      );
    }

    // 3. Validate inputs
    const validationError = validateBusinessPayload(payload);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // 4. Verify cryptographic signature
    // The signer must be the owner of the business profile
    if (!verifyWalletSignature(message, signature, payload.owner as string)) {
      return NextResponse.json(
        { error: 'Invalid wallet signature' },
        { status: 401 }
      );
    }

    // Ensure the message matches the expected format to prevent replay attacks
    const expectedMessage = `Create business: ${payload.id}`;
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: 'Signature message mismatch' },
        { status: 401 }
      );
    }

    // 5. Sanitize all string fields
    const sanitized = sanitizeBusinessPayload(payload);

    // 5. Insert via admin client (parameterized by Supabase SDK)
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .insert([sanitized])
      .select()
      .single();

    if (error) {
      console.error('[POST /api/businesses] Supabase error:', error);

      // Handle duplicate key (business already exists)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A business with this ID already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create business listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/businesses] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
