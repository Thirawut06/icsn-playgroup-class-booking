-- Create a secure table for secrets
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Secure the table
REVOKE ALL ON public.app_secrets FROM PUBLIC;
REVOKE ALL ON public.app_secrets FROM anon;
REVOKE ALL ON public.app_secrets FROM authenticated;

-- Secure webhook trigger function with x-webhook-secret
CREATE OR REPLACE FUNCTION public.invoke_sync_sheets()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  project_url text;
  webhook_secret text;
BEGIN
  project_url := 'https://psusuyesaxuhiondxqie.supabase.co/functions/v1/sync-sheets-snapshot';

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

-- Re-attach the trigger to tables
DROP TRIGGER IF EXISTS on_parents_change ON public.parents;
CREATE TRIGGER on_parents_change
  AFTER INSERT OR UPDATE OR DELETE ON public.parents
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.invoke_sync_sheets();

DROP TRIGGER IF EXISTS on_booking_change_snapshot ON public.bookings;
CREATE TRIGGER on_booking_change_snapshot
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.invoke_sync_sheets();

DROP TRIGGER IF EXISTS on_child_change_snapshot ON public.children;
CREATE TRIGGER on_child_change_snapshot
  AFTER INSERT OR UPDATE OR DELETE ON public.children
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.invoke_sync_sheets();

DROP TRIGGER IF EXISTS on_package_change_snapshot ON public.packages;
CREATE TRIGGER on_package_change_snapshot
  AFTER INSERT OR UPDATE OR DELETE ON public.packages
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.invoke_sync_sheets();

DROP TRIGGER IF EXISTS on_credit_tx_change_snapshot ON public.credit_transactions;
CREATE TRIGGER on_credit_tx_change_snapshot
  AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.invoke_sync_sheets();
