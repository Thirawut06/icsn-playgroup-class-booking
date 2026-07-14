-- Secure webhook trigger function with x-webhook-secret
-- Upgraded to use dynamic project URL to prevent Staging from interfering with Production Google Sheets
CREATE OR REPLACE FUNCTION public.invoke_sync_sheets()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  project_url text;
  webhook_secret text;
BEGIN
  project_url := current_setting('app.settings.edge_function_base_url', true);
  
  -- If the base URL is not set (e.g. Local or Staging), abort gracefully
  IF project_url IS NULL OR project_url = '' THEN
    RETURN NEW;
  END IF;

  project_url := project_url || '/sync-sheets-snapshot';

  -- Fetch secret from the secure table
  SELECT value INTO webhook_secret FROM public.app_secrets WHERE key = 'webhook_secret';
  
  IF webhook_secret IS NULL OR webhook_secret = '' THEN
    webhook_secret := 'default_insecure_secret'; 
  END IF;

  SELECT net.http_post(
    url := project_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
