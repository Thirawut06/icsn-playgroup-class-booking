-- Enable pg_net for async webhooks
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trigger_sync_files_to_drive()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
  );

  SELECT net.http_post(
    url := 'https://psusuyesaxuhiondxqie.supabase.co/functions/v1/sync-files-to-drive',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_fmVFvVAAys6RtMCsH0ztDA_xWxNAjxh"}'::jsonb,
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_slip_upload_sync_drive ON public.slip_uploads;
CREATE TRIGGER on_slip_upload_sync_drive
AFTER INSERT OR UPDATE ON public.slip_uploads
FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_files_to_drive();

DROP TRIGGER IF EXISTS on_children_sync_drive ON public.children;
CREATE TRIGGER on_children_sync_drive
AFTER INSERT OR UPDATE ON public.children
FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_files_to_drive();
