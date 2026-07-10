-- Update Google Chat Trigger to gracefully exit if edge_function_base_url is not set
-- This prevents Local and Staging environments from accidentally hitting the Production webhook.

CREATE OR REPLACE FUNCTION public.trigger_google_chat_notify()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  project_url text;
  payload jsonb;
  record_json jsonb;
  old_record_json jsonb;
BEGIN
  project_url := current_setting('app.settings.edge_function_base_url', true);
  
  -- If the base URL is not set in the environment (e.g. Local or Staging without config),
  -- abort the trigger gracefully so it doesn't default to Production.
  IF project_url IS NULL OR project_url = '' THEN
    RETURN NEW;
  END IF;

  project_url := project_url || '/google-chat-notify';

  IF TG_OP = 'DELETE' THEN
    record_json := null;
    old_record_json := row_to_json(OLD)::jsonb;
  ELSIF TG_OP = 'UPDATE' THEN
    record_json := row_to_json(NEW)::jsonb;
    old_record_json := row_to_json(OLD)::jsonb;
  ELSE
    record_json := row_to_json(NEW)::jsonb;
    old_record_json := null;
  END IF;

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
