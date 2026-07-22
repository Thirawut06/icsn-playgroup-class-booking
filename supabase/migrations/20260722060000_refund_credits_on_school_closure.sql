-- Migration: 20260722060000_refund_credits_on_school_closure.sql
-- Description: Update set_date_status RPC to automatically cancel active bookings and refund credits to parents when closing dates/sessions.

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
    v_date date;
    v_booking RECORD;
    v_cancelled_count integer := 0;
BEGIN
    -- 1. Auto-reset: Delete exact-matching closures/overrides in this date range
    DELETE FROM school_closures 
    WHERE start_date >= p_start_date 
      AND end_date <= p_end_date
      AND (p_time_label IS NULL OR time_label = p_time_label OR time_label IS NULL);

    -- 2. Insert new closure/override record for the requested range/date
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
        theme = CASE WHEN p_is_open THEN NULL ELSE p_reason END
    WHERE session_date BETWEEN p_start_date AND p_end_date
      AND (p_time_label IS NULL OR time_label = p_time_label);

    -- 5. If closing dates, find all active confirmed bookings and cancel them cleanly with credit refunds
    IF NOT p_is_open THEN
        FOR v_booking IN 
            SELECT b.id
            FROM bookings b
            JOIN sessions s ON b.session_id = s.id
            WHERE b.session_date BETWEEN p_start_date AND p_end_date 
              AND b.status = 'confirmed'
              AND (p_time_label IS NULL OR s.time_label = p_time_label)
        LOOP
            -- Execute cancel_booking RPC logic to refund credit +1 to parent's package
            PERFORM cancel_booking(
                v_booking.id, 
                NULL, 
                'admin', 
                COALESCE(p_reason, 'โรงเรียนปิดทำการ (Admin Closure)')
            );
            v_cancelled_count := v_cancelled_count + 1;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Date status updated successfully',
        'cancelled_bookings_count', v_cancelled_count
    );
END;
$$;
