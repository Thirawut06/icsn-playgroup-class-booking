DROP POLICY IF EXISTS "Admin can modify sessions" ON "public"."sessions";

CREATE POLICY "Admin can modify sessions" 
ON "public"."sessions" 
TO authenticated 
USING (
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
)
WITH CHECK (
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
);