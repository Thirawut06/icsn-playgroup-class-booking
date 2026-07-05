-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_sync_to_sheets()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  project_url text;
BEGIN
  -- Determine URL (Fallback to production if not set in environment)
  project_url := current_setting('app.settings.edge_function_url', true);
  IF project_url IS NULL OR project_url = '' THEN
    project_url := 'https://psusuyesaxuhiondxqie.supabase.co/functions/v1/sync-to-sheets';
  END IF;

  SELECT net.http_post(
    url := project_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on relevant tables
DROP TRIGGER IF EXISTS on_booking_change ON public.bookings;
CREATE TRIGGER on_booking_change
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_sync_to_sheets();

DROP TRIGGER IF EXISTS on_child_change ON public.children;
CREATE TRIGGER on_child_change
  AFTER INSERT OR UPDATE OR DELETE ON public.children
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_sync_to_sheets();

DROP TRIGGER IF EXISTS on_package_change ON public.packages;
CREATE TRIGGER on_package_change
  AFTER INSERT OR UPDATE OR DELETE ON public.packages
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_sync_to_sheets();

DROP TRIGGER IF EXISTS on_credit_tx_change ON public.credit_transactions;
CREATE TRIGGER on_credit_tx_change
  AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_sync_to_sheets();
