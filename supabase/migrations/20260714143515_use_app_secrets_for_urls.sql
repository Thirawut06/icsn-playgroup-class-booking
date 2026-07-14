-- Update Google Chat Trigger to use app_secrets
CREATE OR REPLACE FUNCTION public.trigger_google_chat_notify()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  project_url text;
  payload jsonb;
  record_json jsonb;
  old_record_json jsonb;
BEGIN
  -- Read from app_secrets instead of current_setting to avoid permission issues
  SELECT value INTO project_url FROM public.app_secrets WHERE key = 'edge_function_base_url';
  
  -- If the base URL is not set in the environment (e.g. Local or Staging without config),
  -- abort the trigger gracefully so it doesn't default to Production.
  IF project_url IS NULL OR project_url = '' THEN
    RETURN NEW;
  END IF;

  project_url := project_url || '/google-chat-notify';

  -- Convert records to JSONB, handling NULLs (e.g., for INSERT where old_record is NULL)
  record_json := to_jsonb(NEW);
  IF TG_OP = 'DELETE' THEN
    record_json := null;
  END IF;

  old_record_json := to_jsonb(OLD);
  IF TG_OP = 'INSERT' THEN
    old_record_json := null;
  END IF;

  -- Construct payload matching edge function expectation
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', record_json,
    'old_record', old_record_json
  );

  SELECT net.http_post(
    url := project_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update Sheets Sync Trigger to use app_secrets
CREATE OR REPLACE FUNCTION public.invoke_sync_sheets()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  project_url text;
  webhook_secret text;
BEGIN
  -- Read from app_secrets instead of current_setting to avoid permission issues
  SELECT value INTO project_url FROM public.app_secrets WHERE key = 'edge_function_base_url';
  
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
