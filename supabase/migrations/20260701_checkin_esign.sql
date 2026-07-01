-- E-Sign Check-in: Add signature tracking to bookings
-- Adds signature_url and checkin_at to existing bookings table.
-- Creates the 'signatures' storage bucket (admin-only access).

-- 1. Add check-in signature columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS signature_url TEXT,
  ADD COLUMN IF NOT EXISTS checkin_at TIMESTAMPTZ;

-- 2. Create Supabase Storage bucket for signatures (admin-only, PDPA compliant)
-- NOTE: Storage bucket creation via SQL is done through the storage extension.
-- Run this in the Supabase Dashboard SQL editor or via CLI.
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS: Only authenticated admins can read/write signatures
CREATE POLICY "Admin can upload signatures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'signatures'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can read signatures"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'signatures'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can delete signatures"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'signatures'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 4. RPC to update booking with signature (called after upload)
CREATE OR REPLACE FUNCTION public.admin_save_checkin_signature(
  p_booking_id UUID,
  p_signature_url TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  UPDATE public.bookings
  SET
    signature_url = p_signature_url,
    checkin_at    = NOW()
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
END;
$$;
