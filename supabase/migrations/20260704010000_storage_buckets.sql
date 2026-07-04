-- Migration: Create Storage Buckets and Policies for slips, profiles, and signatures
-- Note: Supabase db pull/push does not handle storage buckets as they are data, not schema.
-- This migration ensures environments have the required storage infrastructure out of the box.

-- 1. Create Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('slips', 'slips', true),
  ('profiles', 'profiles', true),
  ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS Policies for "slips"
CREATE POLICY "Public Access for slips" ON storage.objects FOR SELECT USING (bucket_id = 'slips');
CREATE POLICY "Auth Upload for slips" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'slips');
CREATE POLICY "Auth Update for slips" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'slips');
CREATE POLICY "Auth Delete for slips" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'slips');

-- 3. Setup RLS Policies for "profiles"
CREATE POLICY "Public Access for profiles" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');
CREATE POLICY "Auth Upload for profiles" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profiles');
CREATE POLICY "Auth Update for profiles" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profiles');
CREATE POLICY "Auth Delete for profiles" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profiles');

-- 4. Setup RLS Policies for "signatures"
-- Note: signatures might not need public read if we use signed URLs (like in SupabaseSignatureAdapter.ts), 
-- but for consistency and local ease, we'll keep it standard unless strictly needed.
CREATE POLICY "Public Access for signatures" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
CREATE POLICY "Auth Upload for signatures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures');
CREATE POLICY "Auth Update for signatures" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'signatures');
CREATE POLICY "Auth Delete for signatures" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'signatures');
