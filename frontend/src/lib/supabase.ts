/**
 * PUBLIC (anon) Supabase client — READ-ONLY by design.
 *
 * This client uses the NEXT_PUBLIC_SUPABASE_ANON_KEY which is safe
 * to ship in the browser bundle. Combined with the RLS policies,
 * this client can only perform SELECT queries.
 *
 * ALL WRITE OPERATIONS (insert, update, delete, storage upload)
 * must go through the API routes (/api/businesses, /api/upload)
 * which use the server-side admin client (supabaseAdmin.ts).
 *
 * DO NOT use this client for .insert(), .update(), .delete(), or
 * .storage.upload() — those calls will be rejected by RLS.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
