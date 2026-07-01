-- Migration: 20260701040000_fix_holiday_closures
-- Purpose: Fix holiday cancellation by adding bulk_reopen_days and skipping weekends

-- 1. Create bulk_reopen_days RPC
CREATE OR REPLACE FUNCTION public.bulk_reopen_days(p_start_date date, p_end_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can bulk reopen days';
    END IF;

    -- Update sessions in that range to active, BUT skip weekends (0 = Sunday, 6 = Saturday)
    UPDATE sessions 
    SET is_active = true, theme = NULL
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND EXTRACT(DOW FROM session_date) NOT IN (0, 6);
END;
$function$;

-- 2. Modify bulk_close_days to skip weekends when setting sessions to inactive
CREATE OR REPLACE FUNCTION public.bulk_close_days(p_start_date date, p_end_date date, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_booking RECORD;
    v_package_id UUID;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can bulk close days';
    END IF;

    -- 1. Insert closure record
    INSERT INTO school_closures (start_date, end_date, reason, created_by)
    VALUES (p_start_date, p_end_date, p_reason, auth.uid());

    -- 2. Update existing sessions in that range to inactive, BUT skip weekends
    UPDATE sessions 
    SET is_active = false, theme = p_reason
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND EXTRACT(DOW FROM session_date) NOT IN (0, 6);

    -- 3. Find all confirmed bookings in this date range and cancel & refund them
    FOR v_booking IN 
        SELECT id, parent_id 
        FROM bookings 
        WHERE session_date BETWEEN p_start_date AND p_end_date 
        AND status = 'confirmed'
    LOOP
        -- Cancel booking
        UPDATE bookings SET status = 'cancelled' WHERE id = v_booking.id;

        -- Find the package to refund to
        SELECT id INTO v_package_id
        FROM packages
        WHERE parent_id = v_booking.parent_id
        ORDER BY created_at DESC LIMIT 1;

        IF v_package_id IS NOT NULL THEN
            UPDATE packages SET credits_remaining = credits_remaining + 1 WHERE id = v_package_id;
            
            INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
            VALUES (v_booking.parent_id, v_package_id, 1, 'refund', 'School closed: ' || p_reason);
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$function$;

-- 3. Cleanup existing broken sessions in July 2026
-- This fixes the state where the admin already canceled the holiday but sessions remained closed
DO $$
BEGIN
    UPDATE sessions
    SET is_active = true, theme = NULL
    WHERE session_date BETWEEN '2026-07-01' AND '2026-07-31'
    AND theme = 'ปิดเทอมแล้ว'
    AND is_active = false
    AND EXTRACT(DOW FROM session_date) NOT IN (0, 6);
END $$;

