/**
 * Server-only Supabase admin client.
 *
 * Uses the SERVICE_ROLE key which bypasses RLS entirely.
 * This file MUST only be imported from:
 *   - API routes (app/api/...)
 *   - Server Components
 *   - Server Actions
 *
 * NEVER import this from 'use client' components or hooks.
 */

import { createClient } from '@supabase/supabase-js';

// Guard: blow up immediately if this somehow runs in the browser
if (typeof window !== 'undefined') {
  throw new Error(
    'supabaseAdmin.ts was imported on the client side! ' +
    'This file contains the SERVICE_ROLE key and must only run on the server.'
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Check your .env.local file.'
  );
}

/**
 * Admin Supabase client — bypasses RLS.
 * Only use inside server-side code (API routes, server components).
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
