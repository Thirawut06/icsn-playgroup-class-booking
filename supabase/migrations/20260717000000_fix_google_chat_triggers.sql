-- 1. Insert the Edge Function Base URL into app_secrets
-- This is required for the Database Webhooks to know where to send the event.
INSERT INTO public.app_secrets (key, value)
VALUES ('edge_function_base_url', 'https://psusuyesaxuhiondxqie.supabase.co/functions/v1')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Ensure pg_net is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 3. Re-create triggers just to be safe
DROP TRIGGER IF EXISTS on_child_insert_notify ON public.children;
CREATE TRIGGER on_child_insert_notify
  AFTER INSERT ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_chat_notify();

DROP TRIGGER IF EXISTS on_slip_insert_notify ON public.slip_uploads;
CREATE TRIGGER on_slip_insert_notify
  AFTER INSERT ON public.slip_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_chat_notify();

DROP TRIGGER IF EXISTS on_booking_upsert_notify ON public.bookings;
CREATE TRIGGER on_booking_upsert_notify
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_chat_notify();

DROP TRIGGER IF EXISTS on_parent_update_notify ON public.parents;
CREATE TRIGGER on_parent_update_notify
  AFTER UPDATE ON public.parents
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_chat_notify();
