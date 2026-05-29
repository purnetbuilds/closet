-- Closet — Supabase Storage setup
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- The app uploads to two PUBLIC buckets whose names are case-sensitive and
-- must match the code exactly (see src/lib/supabase.ts):
--   • wardrobe  — clothing item photos
--   • profile   — the user reference photo
--
-- Symptom if missing/misnamed: Supabase returns "Bucket not found" on the
-- add-item CTA. (A capitalized "Wardrobe" bucket does NOT satisfy "wardrobe".)

-- 1. Create the buckets (public read). Idempotent: safe to re-run.
insert into storage.buckets (id, name, public)
values
  ('wardrobe', 'wardrobe', true),
  ('profile',  'profile',  true)
on conflict (id) do update set public = excluded.public;

-- 2. Allow the anon role to upload/overwrite (the app uses upsert) and read.
--    Public buckets already allow public reads, but writes need policies.
drop policy if exists "Closet: public read" on storage.objects;
drop policy if exists "Closet: anon insert" on storage.objects;
drop policy if exists "Closet: anon update" on storage.objects;

create policy "Closet: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('wardrobe', 'profile'));

create policy "Closet: anon insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id in ('wardrobe', 'profile'));

create policy "Closet: anon update"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id in ('wardrobe', 'profile'))
  with check (bucket_id in ('wardrobe', 'profile'));

-- 3. (Optional) If you previously created a mis-cased "Wardrobe" bucket, remove it:
-- delete from storage.buckets where id = 'Wardrobe';
