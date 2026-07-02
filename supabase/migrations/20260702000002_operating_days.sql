-- Migration: 20260702000002_operating_days
-- Purpose: Support Operating Days and Force Open overrides

-- 1. Add is_force_open to school_closures
ALTER TABLE public.school_closures ADD COLUMN IF NOT EXISTS is_force_open boolean DEFAULT false;

-- 2. Insert default operating_days into system_settings if not exists
INSERT INTO public.system_settings (key, value)
VALUES ('operating_days', '[0,1,2,3,4,5,6]')
ON CONFLICT (key) DO NOTHING;

-- 3. Modify get_or_create_sessions_for_date to handle operating_days and is_force_open
CREATE OR REPLACE FUNCTION public.get_or_create_sessions_for_date(p_date date)
 RETURNS SETOF sessions
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_locked_labels text[];
    v_has_templates boolean;
    v_full_day_closure_reason text;
    v_is_force_open boolean;
    v_final_reason text;
    v_operating_days_str text;
    v_is_operating_day boolean;
    v_is_active_session boolean;
    template RECORD;
BEGIN
    -- Check if date falls in a full-day closure or force open
    SELECT reason, is_force_open INTO v_full_day_closure_reason, v_is_force_open
    FROM school_closures 
    WHERE p_date BETWEEN start_date AND end_date AND time_label IS NULL
    ORDER BY is_force_open DESC -- prioritize force open if overlaps exist
    LIMIT 1;

    -- Fetch operating days
    SELECT value INTO v_operating_days_str FROM system_settings WHERE key = 'operating_days';
    IF v_operating_days_str IS NULL THEN
        v_operating_days_str := '[0,1,2,3,4,5,6]';
    END IF;

    -- Check if day of week is an operating day
    SELECT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(v_operating_days_str::jsonb) AS dow
        WHERE dow::int = EXTRACT(DOW FROM p_date)::int
    ) INTO v_is_operating_day;

    -- Delete empty sessions for this date (where no one has booked)
    DELETE FROM sessions 
    WHERE session_date = p_date AND (booked_count IS NULL OR booked_count = 0);

    -- Get array of time_labels for locked sessions (where someone has booked)
    SELECT array_agg(time_label) INTO v_locked_labels 
    FROM sessions 
    WHERE session_date = p_date AND booked_count > 0;

    -- Check if there are active templates
    SELECT EXISTS (SELECT 1 FROM session_templates WHERE is_active = true) INTO v_has_templates;
    
    IF v_has_templates THEN
        FOR template IN SELECT * FROM session_templates WHERE is_active = true ORDER BY time_label ASC
        LOOP
            -- Only insert if it doesn't already exist in locked sessions
            IF v_locked_labels IS NULL OR NOT (template.time_label = ANY(v_locked_labels)) THEN
                
                -- Determine session-specific status
                v_final_reason := v_full_day_closure_reason;
                v_is_active_session := true;

                -- Priority 1: Check for session-specific closure (time_label matches)
                IF v_final_reason IS NULL THEN
                    SELECT reason INTO v_final_reason
                    FROM school_closures
                    WHERE p_date BETWEEN start_date AND end_date AND time_label = template.time_label
                    LIMIT 1;
                END IF;

                -- Logic for active state
                IF v_is_force_open = true THEN
                    v_is_active_session := true;
                    v_final_reason := NULL; -- clear reason since it's force opened
                ELSIF v_final_reason IS NOT NULL THEN
                    v_is_active_session := false;
                ELSIF v_is_operating_day = false THEN
                    v_is_active_session := false;
                    v_final_reason := 'นอกเวลาทำการ';
                ELSE
                    v_is_active_session := true;
                END IF;

                -- Final check with template's own active state
                IF NOT template.is_active THEN
                    v_is_active_session := false;
                END IF;

                INSERT INTO sessions (session_date, time_label, total_capacity, is_active, theme)
                VALUES (p_date, template.time_label, template.capacity, v_is_active_session, v_final_reason)
                ON CONFLICT ON CONSTRAINT sessions_date_time_key DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label ASC;
END;
$function$;

-- 4. Replace bulk_close_days with unified set_date_status
DROP FUNCTION IF EXISTS public.bulk_close_days(date, date, text);
DROP FUNCTION IF EXISTS public.bulk_close_days(date, date, text, text);

CREATE OR REPLACE FUNCTION public.set_date_status(
    p_start_date date, 
    p_end_date date, 
    p_is_open boolean,
    p_reason text DEFAULT NULL, 
    p_time_label text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_booking RECORD;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can manage date status';
    END IF;

    -- 1. Insert closure/override record
    INSERT INTO school_closures (start_date, end_date, reason, time_label, is_force_open, created_by)
    VALUES (p_start_date, p_end_date, COALESCE(p_reason, CASE WHEN p_is_open THEN 'เปิดพิเศษ' ELSE 'ปิดทำการ' END), p_time_label, p_is_open, auth.uid());

    -- 2. Update existing sessions in that range to match the new status
    UPDATE sessions 
    SET is_active = p_is_open, theme = CASE WHEN p_is_open THEN NULL ELSE p_reason END
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND (p_time_label IS NULL OR time_label = p_time_label);

    -- 3. If closing, find all confirmed bookings and cancel them
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
$function$;
