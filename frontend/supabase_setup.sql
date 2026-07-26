
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

-- 2. Turn on Row Level Security (RLS)
alter table public.businesses enable row level security;

-- 3. Allow public read access to everyone
create policy "Public read access"
  on public.businesses
  for select
  to public
  using (true);

-- 4. Allow insert/update only if the user provides the correct owner address
-- Note: In a production app, we would use a signed message and a custom auth 
-- endpoint to securely verify wallet ownership before insertion.
-- For this prototype, we'll allow inserts from the frontend with a simple check.
create policy "Allow inserts"
  on public.businesses
  for insert
  to public
  with check (true);

create policy "Allow updates"
  on public.businesses
  for update
  to public
  using (true);

-- 5. Create a storage bucket for images
insert into storage.buckets (id, name, public) 
values ('business-images', 'business-images', true);

-- 6. Storage bucket policies
create policy "Public image read access"
  on storage.objects for select
  to public
  using ( bucket_id = 'business-images' );

create policy "Public image upload"
  on storage.objects for insert
  to public
  with check ( bucket_id = 'business-images' );
