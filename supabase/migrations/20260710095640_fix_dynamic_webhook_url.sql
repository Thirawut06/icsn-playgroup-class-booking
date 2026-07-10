-- Fix: Replace hardcoded Production URL + current_setting (requires ALTER DATABASE permission)
-- with a lookup from the app_secrets table (already exists, no permission issues).
-- Fix: Remove insecure fallback secret — abort if not configured.

CREATE OR REPLACE FUNCTION public.invoke_sync_sheets()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  project_url text;
  webhook_secret text;
BEGIN
  -- Read base URL from the app_secrets table (set per-environment).
  -- This avoids the need for ALTER DATABASE permission.
  SELECT value INTO project_url FROM public.app_secrets WHERE key = 'edge_function_base_url';

  -- If the base URL is not set in this environment (e.g. Staging), abort gracefully.
  -- This prevents Staging from accidentally syncing to the Production Google Sheet.
  IF project_url IS NULL OR project_url = '' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  project_url := project_url || '/sync-sheets-snapshot';

  -- Read the webhook secret for auth. If missing, abort — do NOT use a fallback.
  SELECT value INTO webhook_secret FROM public.app_secrets WHERE key = 'webhook_secret';
  
  IF webhook_secret IS NULL OR webhook_secret = '' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT net.http_post(
    url := project_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
