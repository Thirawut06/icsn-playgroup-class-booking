-- Migration: 20260722040000_closure_exception_precedence.sql
-- Description: Robust & safe set_date_status RPC supporting single-day overrides and Smart Reset.

CREATE OR REPLACE FUNCTION "public"."set_date_status"(
    "p_start_date" "date", 
    "p_end_date" "date", 
    "p_is_open" boolean, 
    "p_reason" "text" DEFAULT NULL::"text", 
    "p_time_label" "text" DEFAULT NULL::"text"
) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_booking RECORD;
    v_date date;
    v_operating_days_str text;
    v_is_operating_day boolean;
BEGIN
    -- Verify Admin permission (Check app_metadata, user_metadata, and service role safely)
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin'
       AND COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'admin'
       AND COALESCE((auth.jwt() ->> 'role'), '') != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can manage date status';
    END IF;

    -- 1. Auto-reset: Delete exact-range closures/overrides in this date range
    DELETE FROM school_closures 
    WHERE start_date >= p_start_date 
      AND end_date <= p_end_date
      AND (p_time_label IS NULL OR time_label = p_time_label OR time_label IS NULL);

    -- 2. Insert new closure/override record for the requested range/date
    -- If opening a range or date, insert force_open record so it explicitly overrides any broader closures
    INSERT INTO school_closures (start_date, end_date, reason, time_label, is_force_open, created_by)
    VALUES (
        p_start_date, 
        p_end_date, 
        COALESCE(p_reason, CASE WHEN p_is_open THEN 'เปิดพิเศษ' ELSE 'ปิดทำการ' END), 
        p_time_label, 
        p_is_open, 
        auth.uid()
    );

    -- 3. Initialize/update sessions for each date in the range
    FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date LOOP
        PERFORM get_or_create_sessions_for_date(v_date);
    END LOOP;

    -- 4. Update existing sessions active status
    UPDATE sessions
    SET is_active = p_is_open,
        theme = CASE WHEN p_is_open THEN NULL ELSE p_reason END,
        updated_at = NOW()
    WHERE session_date BETWEEN p_start_date AND p_end_date
      AND (p_time_label IS NULL OR time_label = p_time_label);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Date status updated successfully'
    );
END;
$$;
