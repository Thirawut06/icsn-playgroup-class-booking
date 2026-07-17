-- 1. Harden system_settings
DROP POLICY IF EXISTS "Allow authenticated full access system_settings" ON "public"."system_settings";

CREATE POLICY "Admin can modify system_settings" 
ON "public"."system_settings" 
TO authenticated 
USING (
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
)
WITH CHECK (
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
);

-- 2. Harden session_templates
DROP POLICY IF EXISTS "Enable all access for authenticated admins" ON "public"."session_templates";
DROP POLICY IF EXISTS "Enable delete access for all users" ON "public"."session_templates";
DROP POLICY IF EXISTS "Enable insert access for all users" ON "public"."session_templates";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."session_templates";

CREATE POLICY "Admin can modify session_templates" 
ON "public"."session_templates" 
TO authenticated 
USING (
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
)
WITH CHECK (
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
);
