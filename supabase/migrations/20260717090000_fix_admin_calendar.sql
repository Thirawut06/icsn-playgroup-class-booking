-- migration file to fix admin calendar override functions

CREATE OR REPLACE FUNCTION "public"."delete_school_closure"("p_closure_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_start date;
    v_end date;
    v_time_label text;
    v_operating_days_str text;
    v_date date;
    v_day int;
    v_is_operating_day boolean;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can manage holidays';
    END IF;

    -- 1. Read closure info
    SELECT start_date, end_date, time_label INTO v_start, v_end, v_time_label 
    FROM school_closures WHERE id = p_closure_id;

    IF v_start IS NULL THEN
        RAISE EXCEPTION 'Closure not found';
    END IF;

    -- 2. Delete it
    DELETE FROM school_closures WHERE id = p_closure_id;

    -- 3. Re-evaluate sessions dynamically based on system_settings and remaining closures
    SELECT value INTO v_operating_days_str FROM system_settings WHERE key = 'operating_days';
    IF v_operating_days_str IS NULL THEN
        v_operating_days_str := '[0,1,2,3,4,5,6]';
    END IF;

    FOR v_date IN SELECT generate_series(v_start, v_end, '1 day'::interval) LOOP
        v_day := EXTRACT(DOW FROM v_date)::int;
        SELECT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements_text(v_operating_days_str::jsonb) AS dow
            WHERE dow::int = v_day
        ) INTO v_is_operating_day;

        UPDATE sessions s
        SET 
            is_active = CASE 
                WHEN (
                    SELECT is_force_open 
                    FROM school_closures c 
                    WHERE v_date BETWEEN c.start_date AND c.end_date 
                    AND (c.time_label IS NULL OR c.time_label = s.time_label)
                    ORDER BY is_force_open DESC LIMIT 1
                ) = true THEN true
                WHEN (
                    SELECT is_force_open 
                    FROM school_closures c 
                    WHERE v_date BETWEEN c.start_date AND c.end_date 
                    AND (c.time_label IS NULL OR c.time_label = s.time_label)
                    ORDER BY is_force_open DESC LIMIT 1
                ) = false THEN false
                ELSE v_is_operating_day
            END,
            
            theme = CASE 
                WHEN (
                    SELECT is_force_open 
                    FROM school_closures c 
                    WHERE v_date BETWEEN c.start_date AND c.end_date 
                    AND (c.time_label IS NULL OR c.time_label = s.time_label)
                    ORDER BY is_force_open DESC LIMIT 1
                ) = true THEN NULL
                WHEN (
                    SELECT is_force_open 
                    FROM school_closures c 
                    WHERE v_date BETWEEN c.start_date AND c.end_date 
                    AND (c.time_label IS NULL OR c.time_label = s.time_label)
                    ORDER BY is_force_open DESC LIMIT 1
                ) = false THEN (
                    SELECT reason FROM school_closures c 
                    WHERE v_date BETWEEN c.start_date AND c.end_date 
                    AND (c.time_label IS NULL OR c.time_label = s.time_label)
                    AND c.is_force_open = false
                    LIMIT 1
                )
                WHEN NOT v_is_operating_day THEN 'นอกเวลาทำการ'
                ELSE NULL
            END
        WHERE s.session_date = v_date
        AND (v_time_label IS NULL OR s.time_label = v_time_label);
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$;


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

    -- 1. Insert closure/override record
    INSERT INTO school_closures (start_date, end_date, reason, time_label, is_force_open, created_by)
    VALUES (p_start_date, p_end_date, COALESCE(p_reason, CASE WHEN p_is_open THEN 'เปิดพิเศษ' ELSE 'ปิดทำการ' END), p_time_label, p_is_open, auth.uid());

    -- 2. If it's a force-open, create missing sessions using the get_or_create logic
    IF p_is_open THEN
        FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval) LOOP
            PERFORM get_or_create_sessions_for_date(v_date);
        END LOOP;
    END IF;

    -- 3. Update existing sessions in that range to match the new status
    UPDATE sessions 
    SET is_active = p_is_open, theme = CASE WHEN p_is_open THEN NULL ELSE p_reason END
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND (p_time_label IS NULL OR time_label = p_time_label);

    -- 4. If closing, find all confirmed bookings and cancel them
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
