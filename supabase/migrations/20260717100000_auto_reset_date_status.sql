-- migration file to add auto-reset logic to set_date_status to prevent duplicate overlapping overrides

CREATE OR REPLACE FUNCTION "public"."set_date_status"("p_start_date" "date", "p_end_date" "date", "p_is_open" boolean, "p_reason" "text" DEFAULT NULL::"text", "p_time_label" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_booking RECORD;
    v_date date;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can manage date status';
    END IF;

    -- 1. Auto-reset: Delete any existing closures that fall entirely within this new range
    -- This prevents overlapping records (e.g. setting "Closed" on a day that was previously "Force Open")
    DELETE FROM school_closures 
    WHERE start_date >= p_start_date 
      AND end_date <= p_end_date
      AND (p_time_label IS NULL OR time_label = p_time_label OR time_label IS NULL);

    -- 2. Insert new closure/override record
    INSERT INTO school_closures (start_date, end_date, reason, time_label, is_force_open, created_by)
    VALUES (p_start_date, p_end_date, COALESCE(p_reason, CASE WHEN p_is_open THEN 'เปิดพิเศษ' ELSE 'ปิดทำการ' END), p_time_label, p_is_open, auth.uid());

    -- 3. If it's a force-open, create missing sessions using the get_or_create logic
    IF p_is_open THEN
        FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval) LOOP
            PERFORM get_or_create_sessions_for_date(v_date);
        END LOOP;
    END IF;

    -- 4. Update existing sessions in that range to match the new status
    UPDATE sessions 
    SET is_active = p_is_open, theme = CASE WHEN p_is_open THEN NULL ELSE p_reason END
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND (p_time_label IS NULL OR time_label = p_time_label);

    -- 5. If closing, find all confirmed bookings and cancel them
    IF NOT p_is_open THEN
        FOR v_booking IN 
            SELECT b.id
            FROM bookings b
            JOIN sessions s ON b.session_id = s.id
            WHERE b.session_date BETWEEN p_start_date AND p_end_date 
            AND b.status = 'confirmed'
            AND (p_time_label IS NULL OR s.time_label = p_time_label)
        LOOP
            -- Cancel booking
            UPDATE bookings SET status = 'cancelled' WHERE id = v_booking.id;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;
