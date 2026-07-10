-- นำโค้ดนี้ไปรันใน SQL Editor ของ Supabase Dashboard (หน้า Production)
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.invoke_sync_sheets()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://psusuyesaxuhiondxqie.supabase.co/functions/v1/sync-sheets-snapshot',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ลบ Triggers เก่า (ถ้ามี)
DROP TRIGGER IF EXISTS on_parents_change ON public.parents;
DROP TRIGGER IF EXISTS on_children_change ON public.children;
DROP TRIGGER IF EXISTS on_credit_tx_change ON public.credit_transactions;
DROP TRIGGER IF EXISTS on_bookings_change ON public.bookings;
DROP TRIGGER IF EXISTS on_slip_change ON public.slip_uploads;

-- สร้าง Triggers เพื่อเรียก Edge Function เมื่อข้อมูลเปลี่ยน
CREATE TRIGGER on_parents_change AFTER INSERT OR UPDATE OR DELETE ON public.parents FOR EACH STATEMENT EXECUTE FUNCTION public.invoke_sync_sheets();
CREATE TRIGGER on_children_change AFTER INSERT OR UPDATE OR DELETE ON public.children FOR EACH STATEMENT EXECUTE FUNCTION public.invoke_sync_sheets();
CREATE TRIGGER on_credit_tx_change AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions FOR EACH STATEMENT EXECUTE FUNCTION public.invoke_sync_sheets();
CREATE TRIGGER on_bookings_change AFTER INSERT OR UPDATE OR DELETE ON public.bookings FOR EACH STATEMENT EXECUTE FUNCTION public.invoke_sync_sheets();
CREATE TRIGGER on_slip_change AFTER INSERT OR UPDATE OR DELETE ON public.slip_uploads FOR EACH STATEMENT EXECUTE FUNCTION public.invoke_sync_sheets();
