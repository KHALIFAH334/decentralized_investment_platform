-- ============================================================
-- Anchor Capital — Row Level Security (RLS) Setup
-- ============================================================
--
-- SECURITY MODEL:
--   SELECT  → Public (anyone can browse the marketplace)
--   INSERT  → service_role ONLY (must go through API routes)
--   UPDATE  → service_role ONLY (must go through API routes)
--   DELETE  → service_role ONLY (must go through API routes)
--
-- The frontend anon key can ONLY read data.
-- All writes are funneled through server-side API routes
-- which use the service_role key after validating inputs,
-- checking ownership, and applying rate limits.
-- ============================================================

-- 1. Create the businesses table
create table public.businesses (
  id text primary key, -- The PDA address from Solana
  owner text not null, -- The wallet address of the creator
  name text not null,
  description text,
  category text,
  image_url text,
  website_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table public.businesses enable row level security;

-- 3. DROP old permissive policies (if they exist)
--    Run these to clean up the wide-open policies from before.
drop policy if exists "Public read access" on public.businesses;
drop policy if exists "Allow inserts" on public.businesses;
drop policy if exists "Allow updates" on public.businesses;

-- 4. SELECT: Allow public read access (marketplace is public)
create policy "businesses_select_public"
  on public.businesses
  for select
  to public
  using (true);

-- 5. INSERT: Only the service_role can insert rows.
--    The anon key cannot insert. All inserts must go through
--    the server-side API routes (/api/businesses POST).
create policy "businesses_insert_service_role"
  on public.businesses
  for insert
  to service_role
  with check (true);

-- 6. UPDATE: Only the service_role can update rows.
--    Ownership verification is handled in the API route
--    before the update query is executed.
create policy "businesses_update_service_role"
  on public.businesses
  for update
  to service_role
  using (true);

-- 7. DELETE: Only the service_role can delete rows.
--    Ownership verification is handled in the API route
--    before the delete query is executed.
create policy "businesses_delete_service_role"
  on public.businesses
  for delete
  to service_role
  using (true);


-- ============================================================
-- STORAGE BUCKET: business-images
-- ============================================================

-- 8. Create storage bucket (idempotent — will no-op if exists)
insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do nothing;

-- 9. DROP old permissive storage policies
drop policy if exists "Public image read access" on storage.objects;
drop policy if exists "Public image upload" on storage.objects;

-- 10. Storage SELECT: Anyone can view/download images (public bucket)
create policy "storage_select_public"
  on storage.objects for select
  to public
  using ( bucket_id = 'business-images' );

-- 11. Storage INSERT: Only the service_role can upload images.
--     All uploads must go through the server-side API route (/api/upload POST).
create policy "storage_insert_service_role"
  on storage.objects for insert
  to service_role
  with check ( bucket_id = 'business-images' );

-- 12. Storage UPDATE: Only the service_role can overwrite images.
create policy "storage_update_service_role"
  on storage.objects for update
  to service_role
  using ( bucket_id = 'business-images' );

-- 13. Storage DELETE: Only the service_role can delete images.
create policy "storage_delete_service_role"
  on storage.objects for delete
  to service_role
  using ( bucket_id = 'business-images' );
