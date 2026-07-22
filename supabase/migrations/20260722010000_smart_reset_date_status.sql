-- Migration: 20260722010000_smart_reset_date_status.sql
-- Description: Update set_date_status RPC to perform Smart Reset when re-opening days.
-- If opening a normal operating day (Mon-Fri), it clears the closure record without inserting "เปิดพิเศษ",
-- preventing unnecessary announcement banners on the user UI.

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
    -- Verify Admin permission
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can manage date status';
    END IF;

    -- 1. Fetch operating days configuration from system_settings
    SELECT value INTO v_operating_days_str FROM system_settings WHERE key = 'operating_days';
    IF v_operating_days_str IS NULL THEN
        v_operating_days_str := '[1,2,3,4,5]'; -- Default Mon-Fri
    END IF;

    -- 2. Auto-reset: Delete any existing closures/overrides in this date range
    DELETE FROM school_closures 
    WHERE start_date >= p_start_date 
      AND end_date <= p_end_date
      AND (p_time_label IS NULL OR time_label = p_time_label OR time_label IS NULL);

    -- 3. Handle Open vs Closed logic
    IF p_is_open THEN
        -- Loop over dates in the range to determine if force open is required for non-operating days
        FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date LOOP
            -- Check if current day of week is a standard operating day
            SELECT EXISTS (
                SELECT 1 
                FROM jsonb_array_elements_text(v_operating_days_str::jsonb) AS dow
                WHERE dow::int = EXTRACT(DOW FROM v_date)::int
            ) INTO v_is_operating_day;

            -- Only insert "เปิดพิเศษ" (force open) if opening a day that is NOT a normal operating day (e.g. Saturday)
            IF NOT v_is_operating_day THEN
                INSERT INTO school_closures (start_date, end_date, reason, time_label, is_force_open, created_by)
                VALUES (v_date, v_date, COALESCE(p_reason, 'เปิดพิเศษ'), p_time_label, true, auth.uid());
            END IF;

            -- Initialize/update sessions for that date
            PERFORM get_or_create_sessions_for_date(v_date);
        END LOOP;
    ELSE
        -- Closing the date range: Insert single closure record
        INSERT INTO school_closures (start_date, end_date, reason, time_label, is_force_open, created_by)
        VALUES (p_start_date, p_end_date, COALESCE(p_reason, 'ปิดทำการ'), p_time_label, false, auth.uid());
    END IF;

    -- 4. Update existing sessions status
    UPDATE sessions 
    SET is_active = p_is_open, theme = CASE WHEN p_is_open THEN NULL ELSE p_reason END
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND (p_time_label IS NULL OR time_label = p_time_label);

    -- 5. If closing, cancel any existing confirmed bookings in this date range
    IF NOT p_is_open THEN
        FOR v_booking IN 
            SELECT b.id
            FROM bookings b
            JOIN sessions s ON b.session_id = s.id
            WHERE b.session_date BETWEEN p_start_date AND p_end_date 
            AND b.status = 'confirmed'
            AND (p_time_label IS NULL OR s.time_label = p_time_label)
        LOOP
            UPDATE bookings SET status = 'cancelled' WHERE id = v_booking.id;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;
