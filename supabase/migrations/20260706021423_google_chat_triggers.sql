-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function that calls the Edge Function
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
  IF project_url IS NULL OR project_url = '' THEN
    project_url := 'https://psusuyesaxuhiondxqie.supabase.co/functions/v1/google-chat-notify';
  ELSE
    project_url := project_url || '/google-chat-notify';
  END IF;

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

-- Trigger on children (New Child / New Registration)
DROP TRIGGER IF EXISTS on_child_insert_notify ON public.children;
CREATE TRIGGER on_child_insert_notify
  AFTER INSERT ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_chat_notify();

-- Trigger on slip_uploads (Slip Uploaded)
DROP TRIGGER IF EXISTS on_slip_insert_notify ON public.slip_uploads;
CREATE TRIGGER on_slip_insert_notify
  AFTER INSERT ON public.slip_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_chat_notify();

-- Trigger on bookings (New Booking / Cancellation)
DROP TRIGGER IF EXISTS on_booking_upsert_notify ON public.bookings;
CREATE TRIGGER on_booking_upsert_notify
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_chat_notify();
