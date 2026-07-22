-- Migration: 20260722020000_add_day_of_week_to_session_templates.sql
-- Description: Add day_of_week column to session_templates and update get_or_create_sessions_for_date RPC to filter templates by day of week.

-- 1. Add day_of_week integer array column to session_templates
ALTER TABLE public.session_templates 
ADD COLUMN IF NOT EXISTS day_of_week integer[] DEFAULT NULL;

-- 2. Update get_or_create_sessions_for_date RPC
CREATE OR REPLACE FUNCTION "public"."get_or_create_sessions_for_date"("p_date" "date") RETURNS SETOF "public"."sessions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
            -- Check if this template applies to the day of week of p_date
            IF template.day_of_week IS NULL 
               OR array_length(template.day_of_week, 1) IS NULL 
               OR array_length(template.day_of_week, 1) = 0 
               OR (EXTRACT(DOW FROM p_date)::int = ANY(template.day_of_week)) THEN

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

            END IF;
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label ASC;
END;
$$;
