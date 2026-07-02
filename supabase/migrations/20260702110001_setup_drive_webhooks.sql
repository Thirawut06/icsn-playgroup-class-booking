-- Enable the "http" or "pg_net" extension if needed (pg_net is preferred in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the webhook function
CREATE OR REPLACE FUNCTION public.trigger_drive_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Build the payload containing the new record
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
  );

  -- Use pg_net to invoke the Edge Function asynchronously
  -- IMPORTANT: In production, the host might need to be resolved via an env var or vault,
  -- but for Supabase hosted projects, the Edge Function URL is typically fixed.
  -- Here we assume it's part of the standard setup, so we use a relative-like approach if possible,
  -- but pg_net requires an absolute URL. Since we don't know the exact project ref here securely without vault,
  -- we can just pass the request to a known internal route if available, or instruct the user to use the Dashboard UI.
  
  -- Actually, the recommended way to create webhooks in Supabase is via the Dashboard.
  -- Hardcoding the project URL in SQL is an anti-pattern.
  -- We will just define the trigger function but leave the URL configuration out, OR use the native supabase_functions extension if present.
  
  RETURN NEW;
END;
$$;
