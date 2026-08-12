/**
 * API Route: /api/businesses/[id]
 *
 * GET    — Fetch a single business by ID
 * PATCH  — Update a business (with OWNERSHIP VERIFICATION)
 * DELETE — Delete a business (with OWNERSHIP VERIFICATION)
 *
 * Ownership check: Before any mutation, we fetch the existing record
 * and verify that the `owner` field matches the wallet address in the
 * request. This prevents users from modifying other people's listings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import { rateLimitResponse, RATE_LIMITS } from '../../../../src/lib/rateLimit';
import {
  sanitizeString,
  isValidSolanaAddress,
  isValidUrl,
  isValidCategory,
} from '../../../../src/lib/validation';

/**
 * GET /api/businesses/[id]
 * Fetch a single business listing by its PDA address.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimitResponse(request, RATE_LIMITS.READ);
  if (limited) return limited;

  const { id } = await params;

  if (!isValidSolanaAddress(id)) {
    return NextResponse.json(
      { error: 'Invalid business ID format' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }
      console.error(`[GET /api/businesses/${id}] Supabase error:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch business' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`[GET /api/businesses/${id}] Unexpected error:`, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/businesses/[id]
 * Update a business listing.
 *
 * OWNERSHIP CHECK: The caller must provide their `wallet` address
 * in the request body. We verify it matches the `owner` of the
 * existing record before allowing the update.
 *
 * Expected body:
 * {
 *   wallet: string,          // Caller's wallet (for ownership verification)
 *   name?: string,
 *   description?: string,
 *   category?: string,
 *   image_url?: string,
 *   website_url?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimitResponse(request, RATE_LIMITS.WRITE);
  if (limited) return limited;

  const { id } = await params;

  if (!isValidSolanaAddress(id)) {
    return NextResponse.json(
      { error: 'Invalid business ID format' },
      { status: 400 }
    );
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const wallet = body.wallet;
    if (!wallet || !isValidSolanaAddress(wallet)) {
      return NextResponse.json(
        { error: 'Missing or invalid wallet address for ownership verification' },
        { status: 400 }
      );
    }

    // OWNERSHIP CHECK: Fetch the existing record and verify owner
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('owner')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (existing.owner !== wallet) {
      return NextResponse.json(
        { error: 'Forbidden: you do not own this business listing' },
        { status: 403 }
      );
    }

    // Build sanitized update object (only include provided fields)
    const updates: Record<string, string> = {};

    if (body.name !== undefined) {
      const name = sanitizeString(body.name);
      if (name.length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      if (name.length > 200) {
        return NextResponse.json({ error: 'Name must be under 200 characters' }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.description !== undefined) {
      const desc = sanitizeString(body.description);
      if (desc.length > 5000) {
        return NextResponse.json({ error: 'Description must be under 5000 characters' }, { status: 400 });
      }
      updates.description = desc;
    }

    if (body.category !== undefined) {
      if (!isValidCategory(body.category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updates.category = sanitizeString(body.category);
    }

    if (body.image_url !== undefined) {
      updates.image_url = sanitizeString(body.image_url);
    }

    if (body.website_url !== undefined) {
      if (!isValidUrl(body.website_url)) {
        return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
      }
      updates.website_url = sanitizeString(body.website_url);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform the update (parameterized by Supabase SDK)
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[PATCH /api/businesses/${id}] Supabase error:`, error);
      return NextResponse.json(
        { error: 'Failed to update business' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`[PATCH /api/businesses/${id}] Unexpected error:`, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/businesses/[id]
 * Delete a business listing.
 *
 * OWNERSHIP CHECK: Same as PATCH — verify wallet matches owner.
 *
 * Expected body:
 * {
 *   wallet: string  // Caller's wallet for ownership verification
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimitResponse(request, RATE_LIMITS.WRITE);
  if (limited) return limited;

  const { id } = await params;

  if (!isValidSolanaAddress(id)) {
    return NextResponse.json(
      { error: 'Invalid business ID format' },
      { status: 400 }
    );
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const wallet = body.wallet;
    if (!wallet || !isValidSolanaAddress(wallet)) {
      return NextResponse.json(
        { error: 'Missing or invalid wallet address for ownership verification' },
        { status: 400 }
      );
    }

    // OWNERSHIP CHECK
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('owner')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (existing.owner !== wallet) {
      return NextResponse.json(
        { error: 'Forbidden: you do not own this business listing' },
        { status: 403 }
      );
    }

    // Delete (parameterized by Supabase SDK)
    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[DELETE /api/businesses/${id}] Supabase error:`, error);
      return NextResponse.json(
        { error: 'Failed to delete business' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(`[DELETE /api/businesses/${id}] Unexpected error:`, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
