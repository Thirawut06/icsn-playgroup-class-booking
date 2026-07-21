-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Auth Upload for slips" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for slips" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete for slips" ON storage.objects;

DROP POLICY IF EXISTS "Auth Upload for profiles" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for profiles" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete for profiles" ON storage.objects;

DROP POLICY IF EXISTS "Auth Upload for signatures" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for signatures" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete for signatures" ON storage.objects;

-- Create hardened policies for SLIPS (prefix with parent_id or admin)
CREATE POLICY "Auth Upload for slips" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'slips' AND (
    (string_to_array(name, '_'))[1] = auth.uid()::text 
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);

CREATE POLICY "Auth Update for slips" ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'slips' AND (
    (string_to_array(name, '_'))[1] = auth.uid()::text 
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);

CREATE POLICY "Auth Delete for slips" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'slips' AND (
    (string_to_array(name, '_'))[1] = auth.uid()::text 
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);

-- Create hardened policies for PROFILES
CREATE POLICY "Auth Upload for profiles" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'profiles' AND (
    (string_to_array(name, '_'))[1] = auth.uid()::text 
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);

CREATE POLICY "Auth Update for profiles" ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'profiles' AND (
    (string_to_array(name, '_'))[1] = auth.uid()::text 
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);

CREATE POLICY "Auth Delete for profiles" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'profiles' AND (
    (string_to_array(name, '_'))[1] = auth.uid()::text 
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);

-- Signatures are only uploaded by admins during check-in
CREATE POLICY "Auth Upload for signatures" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'signatures' AND (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);

CREATE POLICY "Auth Update for signatures" ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'signatures' AND (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);

CREATE POLICY "Auth Delete for signatures" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'signatures' AND (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
);
