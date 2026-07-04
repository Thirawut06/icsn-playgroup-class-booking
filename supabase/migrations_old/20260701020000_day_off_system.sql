-- Migration: 20260701_day_off_system
-- Purpose: Robust Day Off (Single Session & Full Day) support

-- 1. Modify get_or_create_sessions_for_date
CREATE OR REPLACE FUNCTION public.get_or_create_sessions_for_date(p_date date)
 RETURNS SETOF sessions
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_locked_labels text[];
    v_has_templates boolean;
    v_closure_reason text;
BEGIN
    -- Check if date falls in a closure
    SELECT reason INTO v_closure_reason 
    FROM school_closures 
    WHERE p_date BETWEEN start_date AND end_date
    LIMIT 1;

    -- Delete empty sessions for this date (where no one has booked)
    -- BUG FIX: Do NOT delete sessions that are explicitly marked inactive (Day off) or have a theme (Reason)
    DELETE FROM sessions 
    WHERE session_date = p_date 
      AND (booked_count IS NULL OR booked_count = 0)
      AND is_active = true 
      AND (theme IS NULL OR theme = '');

    -- Get array of time_labels for locked sessions (where someone has booked or is explicitly closed)
    SELECT array_agg(time_label) INTO v_locked_labels 
    FROM sessions 
    WHERE session_date = p_date AND (booked_count > 0 OR is_active = false);

    IF v_closure_reason IS NOT NULL THEN
        -- If closed and no locked sessions, insert one closed session so UI can show it
        IF v_locked_labels IS NULL THEN
            INSERT INTO sessions (session_date, time_label, total_capacity, is_active, theme)
            VALUES (p_date, 'Closed', 0, false, v_closure_reason);
        END IF;
        
        RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label;
        RETURN;
    END IF;

    -- Check if we have templates
    SELECT EXISTS (SELECT 1 FROM session_templates WHERE is_active = true) INTO v_has_templates;

    IF NOT v_has_templates THEN
        RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label;
        RETURN;
    END IF;

    -- Insert missing active templates
    INSERT INTO sessions (session_date, time_label, total_capacity, is_active)
    SELECT p_date, t.time_label, t.capacity, true
    FROM session_templates t
    WHERE t.is_active = true
      AND NOT EXISTS (
          SELECT 1 FROM sessions s 
          WHERE s.session_date = p_date AND s.time_label = t.time_label
      );

    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label;
END;
$function$;

-- 2. Create RPC for closing a single session (Day off รายครั้ง)
CREATE OR REPLACE FUNCTION public.admin_close_session(p_session_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_booking RECORD;
    v_package_id UUID;
    v_refund_count INT := 0;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can close a session';
    END IF;

    -- 1. Set session to inactive and set the theme to the reason
    UPDATE sessions 
    SET is_active = false, theme = p_reason
    WHERE id = p_session_id;

    -- 2. Find all confirmed bookings in this session, cancel & refund them
    FOR v_booking IN 
        SELECT id, parent_id 
        FROM bookings 
        WHERE session_id = p_session_id 
        AND status = 'confirmed'
    LOOP
        -- Cancel booking
        UPDATE bookings SET status = 'cancelled' WHERE id = v_booking.id;

        -- Find active package to refund
        SELECT id INTO v_package_id
        FROM packages
        WHERE parent_id = v_booking.parent_id
        ORDER BY created_at DESC LIMIT 1;

        IF v_package_id IS NOT NULL THEN
            UPDATE packages SET credits_remaining = credits_remaining + 1 WHERE id = v_package_id;
            
            INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
            VALUES (v_booking.parent_id, v_package_id, 1, 'refund', 'Session closed: ' || p_reason);
            
            v_refund_count := v_refund_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'refunded_count', v_refund_count);
END;
$function$;

-- 3. Modify bulk_close_days for robust full-day closures
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

    -- 2. Update existing sessions in that range to inactive
    UPDATE sessions 
    SET is_active = false, theme = p_reason
    WHERE session_date BETWEEN p_start_date AND p_end_date;

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
