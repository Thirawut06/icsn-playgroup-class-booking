-- Add SELECT policy for everyone (parents and anon) to read system settings
-- This is critical for the Parent UI to know which days are operating days, cutoff hours, etc.

-- Allow authenticated parents to read
CREATE POLICY "Allow anyone to read system_settings" 
ON "public"."system_settings"
FOR SELECT
USING (true);
